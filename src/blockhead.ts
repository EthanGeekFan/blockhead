import { ERRORS, MESSAGES } from "./constants";
import Net = require("net");
import canonicalize from "canonicalize";
import fs = require("fs");
import { hash, logger, Peer, readPeers, validatePeer, writePeers } from "./utils";
import _ = require("lodash");
import semver = require("semver");
import { Transaction } from "./models";
import { getClients } from "./connections";

const TIMEOUT_MS = 1000;

const delimiter = '\n';

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

        // Now that a TCP connection has been established, the server can send data to
        // the client by writing to its socket.
        this.socket.on("connect", () => {
            this.sendMessage(MESSAGES.HELLO);
            this.sendMessage(MESSAGES.GETPEERS);
            logger.verbose(`Sent HELLO and GETPEERS message to the server.`);
        });

        // The server can also receive data from the client by reading from its socket.
        socket.on('data', (chunk) => {
            logger.verbose(`Data received from client: ${chunk.toString().trim()}.`);
            const deliminatedChunk: string[] = chunk.toString().split(delimiter);
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
                            return;
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
                                    return;
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
                                    peersDB = _.filter(peersDB, validatePeer);
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
                                const objectId = message.objectId;
                                Transaction
                                    .findById(objectId)
                                    .select({ _id: 0 })
                                    .then((transaction) => {
                                    if (transaction) {
                                        this.sendMessage(MESSAGES.OBJECT(transaction));
                                    }
                                    });
                                // TODO: Block search
                                break;
                            };
                        case MESSAGES.IHAVEOBJECT().type:
                            {
                                Transaction.findById(message.objectid).then((transaction) => {
                                    if (!transaction) {
                                        this.sendMessage(MESSAGES.GETOBJECT(message.objectid));
                                    }
                                });
                                // TODO: Block search
                                break;
                            }
                        case MESSAGES.OBJECT().type:
                            {
                                const obj = message.object;
                                const objectId = hash(canonicalize(obj)!.toString());
                                if (obj.type === "transaction") {
                                    logger.info(`Received transaction id: ${objectId}.`);
                                    Transaction.findById(objectId).then((transaction) => {
                                        if (!transaction) {
                                            const newTransaction = new Transaction({
                                                _id: objectId,
                                                type: obj.type,
                                                height: obj.height,
                                                inputs: obj.inputs,
                                                outputs: obj.outputs,
                                            });
                                            newTransaction.save();
                                            logger.info(`Saved new transaction: ${JSON.stringify(canonicalize(obj)), null, 4}.`);
                                            // Broadcast to all peers
                                            getClients().map((client) => {
                                                client.sendMessage(MESSAGES.IHAVEOBJECT(objectId));
                                            });
                                        }
                                    });
                                } else if (obj.type === "block") {
                                    // TODO: Block search
                                    logger.info(`Received block id: ${objectId}.`);
                                }
                                break;
                            }
                        case MESSAGES.GETMEMPOOL.type:
                            break;
                        case MESSAGES.MEMPOOL().type:
                            break;
                        case MESSAGES.GETCHAINTIP.type:
                            break;
                        case MESSAGES.CHAINTIP().type:
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
        socket.on('end', function() {
            logger.info('Closing connection with the client');
        });

        // Don't forget to catch error, for your own sake.
        socket.on('error', function(err) {
            logger.error(err);
        });
    }

    sendMessage(message: any) {
        this.socket.write((canonicalize(message) || "{}") + "\n");
    }
}

export { Blockhead };