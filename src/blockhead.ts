import { ERRORS, MESSAGES } from "./constants";
import Net = require("net");
import canonicalize from "canonicalize";
import { blockPropValidator, hash, logger, Peer, readPeers, transactionPropValidator, validatePeer, writePeers } from "./utils";
import _ = require("lodash");
import semver = require("semver");
import { Block, ChainTip, Transaction } from "./models";
import { addClient, getClients, removeClient } from "./connections";
import { transactionValidator } from "./transaction";
import { blockValidator } from "./block";
import { reportTx, reportBlock} from "./object_dispatch";
import { getMempool } from "./mempool";

const TIMEOUT_MS = 1000;

const deliminater = '\n';

class Blockhead {
    buffer: string;
    handshake: boolean;
    socket: Net.Socket;
    timeout: any;

    constructor(socket: Net.Socket) {
        this.buffer = "";
        this.handshake = false;
        this.socket = socket;
        this.timeout = null;
        addClient(this);

        // Now that a TCP connection has been established, the server can send data to
        // the client by writing to its socket.
        this.socket.on("connect", () => {
            this.sendMessage(MESSAGES.HELLO);
            this.sendMessage(MESSAGES.GETPEERS);
            this.sendMessage(MESSAGES.GETCHAINTIP);
            this.sendMessage(MESSAGES.GETMEMPOOL);
            logger.verbose(`Sent HELLO, GETPEERS, GETCHAINTIP message to the server.`);
        });

        // The server can also receive data from the client by reading from its socket.
        socket.on('data', (chunk) => {
            logger.verbose(`Data received from client: ${chunk.toString()}.`);
            const deliminatedChunk: string[] = chunk.toString().split(deliminater);
            while (deliminatedChunk.length > 1) {
                if (this.timeout) {
                    clearTimeout(this.timeout);
                }
                this.buffer += deliminatedChunk.shift();
                try {
                    const message = JSON.parse(this.buffer);
                    logger.info(`Message received from client: ${canonicalize(message)}.`);
                    if (!this.handshake) {
                        if (message.type === MESSAGES.HELLO.type) {
                            if (!semver.satisfies(message.version, "0.8.x")) {
                                this.sendMessage(MESSAGES.ERROR(ERRORS.INVVERSION));
                                socket.end();
                                return;
                            }
                            this.handshake = true;
                            this.buffer = "";
                            continue;
                        } else {
                            this.sendMessage(MESSAGES.ERROR(ERRORS.NOHELLO));
                            socket.end();
                            return;
                        }
                    }
                    // Handle messages
                    logger.verbose(`Handling message: ${canonicalize(message)}.`);
                    switch (message.type) {
                        case MESSAGES.HELLO.type:
                            {
                                if (!semver.satisfies(message.version, "0.8.x")) {
                                    this.sendMessage(MESSAGES.ERROR(ERRORS.INVVERSION));
                                    break;
                                }
                                break;
                            }
                        case MESSAGES.PEERS().type:
                            {
                                // read peers database
                                let peersDB = readPeers();
                                const trustedPeers = require("./trustedPeers.json");
                                message.peers.map((peer: string) => {
                                    const split = peer.lastIndexOf(":");
                                    const host = peer.substring(0, split);
                                    const port = parseInt(peer.substring(split + 1));
                                    peersDB.push({ host, port });
                                    peersDB = _.uniqBy(peersDB, (p) => `${p.host}:${p.port}`);
                                    peersDB = _.filter(peersDB, (p) => validatePeer(p));
                                    writePeers(peersDB);
                                });
                                break;
                            }
                        case MESSAGES.GETPEERS.type:
                            {
                                this.sendMessage(MESSAGES.PEERS(readPeers()));
                                break;
                            }
                        case MESSAGES.GETOBJECT().type:
                            {
                                if (!message.objectid) {
                                    this.sendMessage(MESSAGES.ERROR(ERRORS.INVSTRUCT));
                                    break;
                                }
                                const objectId = message.objectid;
                                Transaction
                                    .findOne({ objectId: objectId })
                                    .select({ _id: 0, objectId: 0, height: 0 })
                                    .lean()
                                    .exec()
                                    .then((transaction) => {
                                        if (transaction) {
                                            logger.info(`Transaction found: ${canonicalize(transaction)}.`);
                                            this.sendMessage(MESSAGES.OBJECT(transaction));
                                        } else {
                                            logger.info(`Transaction with objectId ${objectId} not found.`);
                                        }
                                    });
                                Block
                                    .findOne({ objectId: objectId })
                                    .select({ _id: 0, objectId: 0, height: 0 })
                                    .lean()
                                    .exec()
                                    .then((block) => {
                                        if (block) {
                                            logger.info(`Block found: ${canonicalize(block)}.`);
                                            this.sendMessage(MESSAGES.OBJECT(block));
                                        } else {
                                            logger.info(`Block with objectId ${objectId} not found.`);
                                        }
                                    });
                                break;
                            };
                        case MESSAGES.IHAVEOBJECT().type:
                            {
                                if (!message.objectid) {
                                    this.sendMessage(MESSAGES.ERROR(ERRORS.INVSTRUCT));
                                    break;
                                }
                                Transaction.findOne({ objectId: message.objectid }).exec().then((transaction) => {
                                    if (!transaction) {
                                        this.sendMessage(MESSAGES.GETOBJECT(message.objectid));
                                    }
                                });
                                Block.findOne({ objectId: message.objectid }).exec().then((block) => {
                                    if (!block) {
                                        this.sendMessage(MESSAGES.GETOBJECT(message.objectid));
                                    }
                                });
                                break;
                            }
                        case MESSAGES.OBJECT().type:
                            {
                                if (!message.object) {
                                    this.sendMessage(MESSAGES.ERROR(ERRORS.INVSTRUCT));
                                    break;
                                }
                                const obj = message.object;
                                const objectId = hash(canonicalize(obj)!.toString());
                                if (obj.type === "transaction") {
                                    if (!transactionPropValidator(obj)) {
                                        logger.error(transactionPropValidator.errors);
                                        this.sendMessage(MESSAGES.ERROR(`Invalid parameter at: ${transactionPropValidator.errors![0].instancePath}` || ERRORS.INVSTRUCT));
                                        break;
                                    }
                                    logger.info(`Received transaction id: ${objectId}.`);
                                    if (reportTx(objectId, obj)) {
                                        logger.info(`Transaction captured by dispatcher: id=${objectId}.`);
                                        break;
                                    }
                                    Transaction.findOne({ objectId: objectId }).exec().then(async (transaction) => {
                                        if (!transaction) {
                                            try {
                                                await transactionValidator(obj);
                                            } catch (e: any) {
                                                logger.error(`Transaction validation failed: ${e.message}.`);
                                                this.sendMessage(MESSAGES.ERROR(e.message));
                                                return;
                                            }
                                            // Broadcast to all peers
                                            getClients().map((client) => {
                                                client.sendMessage(MESSAGES.IHAVEOBJECT(objectId));
                                                logger.info(`Sent IHAVEOBJECT message to client: ${client}.`);
                                            });
                                        } else {
                                            logger.verbose("Transaction found: " + canonicalize(transaction));
                                        }
                                    });
                                } else if (obj.type === "block") {
                                    if (!blockPropValidator(obj)) {
                                        logger.error(blockPropValidator.errors);
                                        this.sendMessage(MESSAGES.ERROR(`Invalid parameter at: ${blockPropValidator.errors![0].instancePath}` || ERRORS.INVSTRUCT));
                                        break;
                                    }
                                    logger.info(`Received block id: ${objectId}.`);
                                    if (reportBlock(objectId, obj)) {
                                        logger.info(`Block captured by dispatcher: id=${objectId}.`);
                                        break;
                                    }
                                    Block.findOne({ objectId: objectId }).exec().then(async (block) => {
                                        if (!block) {
                                            try {
                                                await blockValidator(obj, this);
                                            } catch (e: any) {
                                                logger.error(`Block validation failed: ${e.message}.`);
                                                this.sendMessage(MESSAGES.ERROR(e.message));
                                                return;
                                            }
                                            // Broadcast to all peers
                                            getClients().map((client) => {
                                                client.sendMessage(MESSAGES.IHAVEOBJECT(objectId));
                                                logger.info(`Sent IHAVEOBJECT message to client: ${client}.`);
                                            });
                                        } else {
                                            logger.verbose("Block found: " + canonicalize(block));
                                        }
                                    });
                                } else {
                                    this.sendMessage(MESSAGES.ERROR(ERRORS.INVOBJECT));
                                }
                                break;
                            }
                        case MESSAGES.GETMEMPOOL.type:
                            this.sendMessage(MESSAGES.MEMPOOL(getMempool()));
                            break;
                        case MESSAGES.MEMPOOL().type:
                            if (!message.txids || !Array.isArray(message.txids)) {
                                this.sendMessage(MESSAGES.ERROR(ERRORS.INVSTRUCT));
                                break;
                            }
                            message.txids.forEach((txid: string) => {
                                this.sendMessage(MESSAGES.GETOBJECT(txid));
                            });
                            break;
                        case MESSAGES.GETCHAINTIP.type:
                            ChainTip.findOne({}).exec().then((tip) => {
                                if (tip) {
                                    this.sendMessage(MESSAGES.CHAINTIP(tip.blockid));
                                } else {
                                    this.sendMessage(MESSAGES.ERROR(ERRORS.EINTERNAL));
                                }
                            });
                            break;
                        case MESSAGES.CHAINTIP().type:
                            if (!message.blockid) {
                                this.sendMessage(MESSAGES.ERROR(ERRORS.INVSTRUCT));
                                break;
                            }
                            Block.findOne({ objectId: message.blockid }).exec().then((block) => {
                                if (!block) {
                                    this.sendMessage(MESSAGES.GETOBJECT(message.blockid));
                                }
                            });
                            break;
                        default:
                            this.sendMessage(MESSAGES.ERROR(ERRORS.INVTYPE));
                            break;
                    }
                } catch (error) {
                    logger.error("error: " + error);
                    this.sendMessage(MESSAGES.ERROR(ERRORS.INVJSON));
                    if (!this.handshake) {
                        socket.end();
                    }
                } finally {
                    this.buffer = "";
                }
            }
            this.buffer += deliminatedChunk[0];
            if (this.buffer.length > 0) {
                this.timeout = setTimeout(() => {
                    this.sendMessage(MESSAGES.ERROR(ERRORS.TIMEOUT));
                    socket.end();
                }, TIMEOUT_MS);
            }
        });

        // When the client requests to end the TCP connection with the server, the server
        // ends the connection.
        socket.on('end', () => {
            logger.info('Closing connection with the client');
            removeClient(this);
        });

        // Don't forget to catch error, for your own sake.
        socket.on('error', (err) => {
            logger.error(err);
        });
    }

    sendMessage(message: any) {
        this.socket.write((canonicalize(message) || "{}") + "\n");
    }
}

export { Blockhead };