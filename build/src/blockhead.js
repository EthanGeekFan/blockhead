"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blockhead = void 0;
const constants_1 = require("./constants");
const canonicalize_1 = __importDefault(require("canonicalize"));
const utils_1 = require("./utils");
const _ = require("lodash");
const semver = require("semver");
const models_1 = require("./models");
const connections_1 = require("./connections");
const transaction_1 = require("./transaction");
const block_1 = require("./block");
const object_dispatch_1 = require("./object_dispatch");
const mempool_1 = require("./mempool");
const TIMEOUT_MS = 1000;
const deliminater = '\n';
class Blockhead {
    constructor(socket, options = {}) {
        this.buffer = "";
        this.handshake = false;
        this.socket = socket;
        this.timeout = null;
        this.remoteAddress = options["host"] || "";
        this.remotePort = options["port"] || 0;
        (0, connections_1.addClient)(this);
        // Now that a TCP connection has been established, the server can send data to
        // the client by writing to its socket.
        this.socket.on("connect", () => {
            this.sendMessage(constants_1.MESSAGES.HELLO);
            this.sendMessage(constants_1.MESSAGES.GETPEERS);
            this.sendMessage(constants_1.MESSAGES.GETCHAINTIP);
            this.sendMessage(constants_1.MESSAGES.GETMEMPOOL);
            utils_1.logger.verbose(`Sent HELLO, GETPEERS, GETCHAINTIP message to the server.`);
        });
        // The server can also receive data from the client by reading from its socket.
        socket.on('data', (chunk) => __awaiter(this, void 0, void 0, function* () {
            utils_1.logger.verbose(`Data received from ${this.remoteAddress}:${this.remotePort}: ${chunk.toString()}.`);
            const deliminatedChunk = chunk.toString().split(deliminater);
            while (deliminatedChunk.length > 1) {
                if (this.timeout) {
                    clearTimeout(this.timeout);
                }
                this.buffer += deliminatedChunk.shift();
                try {
                    const message = JSON.parse(this.buffer);
                    utils_1.logger.info(`Message received from ${this.remoteAddress}:${this.remotePort}: ${(0, canonicalize_1.default)(message)}.`);
                    if (!this.handshake) {
                        if (message.type === constants_1.MESSAGES.HELLO.type) {
                            if (!semver.satisfies(message.version, "0.8.x")) {
                                this.sendMessage(constants_1.MESSAGES.ERROR(constants_1.ERRORS.INVVERSION));
                                socket.end();
                                return;
                            }
                            this.handshake = true;
                            this.buffer = "";
                            continue;
                        }
                        else {
                            this.sendMessage(constants_1.MESSAGES.ERROR(constants_1.ERRORS.NOHELLO));
                            socket.end();
                            return;
                        }
                    }
                    // Handle messages
                    utils_1.logger.verbose(`Handling message: ${(0, canonicalize_1.default)(message)}.`);
                    switch (message.type) {
                        case constants_1.MESSAGES.HELLO.type:
                            {
                                if (!semver.satisfies(message.version, "0.8.x")) {
                                    this.sendMessage(constants_1.MESSAGES.ERROR(constants_1.ERRORS.INVVERSION));
                                    break;
                                }
                                break;
                            }
                        case constants_1.MESSAGES.PEERS().type:
                            {
                                // read peers database
                                let peersDB = (0, utils_1.readPeers)();
                                const trustedPeers = require("./trustedPeers.json");
                                message.peers.map((peer) => {
                                    const split = peer.lastIndexOf(":");
                                    const host = peer.substring(0, split);
                                    const port = parseInt(peer.substring(split + 1));
                                    peersDB.push({ host, port });
                                    peersDB = _.uniqBy(peersDB, (p) => `${p.host}:${p.port}`);
                                    peersDB = _.filter(peersDB, (p) => (0, utils_1.validatePeer)(p));
                                    (0, utils_1.writePeers)(peersDB);
                                });
                                break;
                            }
                        case constants_1.MESSAGES.GETPEERS.type:
                            {
                                this.sendMessage(constants_1.MESSAGES.PEERS((0, utils_1.readPeers)()));
                                break;
                            }
                        case constants_1.MESSAGES.GETOBJECT().type:
                            {
                                if (!message.objectid) {
                                    this.sendMessage(constants_1.MESSAGES.ERROR(constants_1.ERRORS.INVSTRUCT));
                                    break;
                                }
                                const objectId = message.objectid;
                                models_1.Transaction
                                    .findOne({ objectId: objectId })
                                    .select({ _id: 0, objectId: 0, height: 0 })
                                    .lean()
                                    .exec()
                                    .then((transaction) => {
                                    if (transaction) {
                                        utils_1.logger.info(`Transaction found: ${(0, canonicalize_1.default)(transaction)}.`);
                                        this.sendMessage(constants_1.MESSAGES.OBJECT(transaction));
                                    }
                                    else {
                                        utils_1.logger.info(`Transaction with objectId ${objectId} not found.`);
                                    }
                                });
                                models_1.Block
                                    .findOne({ objectId: objectId })
                                    .select({ _id: 0, objectId: 0, height: 0 })
                                    .lean()
                                    .exec()
                                    .then((block) => {
                                    if (block) {
                                        utils_1.logger.info(`Block found: ${(0, canonicalize_1.default)(block)}.`);
                                        this.sendMessage(constants_1.MESSAGES.OBJECT(block));
                                    }
                                    else {
                                        utils_1.logger.info(`Block with objectId ${objectId} not found.`);
                                    }
                                });
                                break;
                            }
                            ;
                        case constants_1.MESSAGES.IHAVEOBJECT().type:
                            {
                                if (!message.objectid) {
                                    this.sendMessage(constants_1.MESSAGES.ERROR(constants_1.ERRORS.INVSTRUCT));
                                    break;
                                }
                                const tx = yield models_1.Transaction.findOne({ objectId: message.objectid }).exec();
                                const block = yield models_1.Block.findOne({ objectId: message.objectid }).exec();
                                if (!block && !tx) {
                                    this.sendMessage(constants_1.MESSAGES.GETOBJECT(message.objectid));
                                }
                                break;
                            }
                        case constants_1.MESSAGES.OBJECT().type:
                            {
                                if (!message.object) {
                                    this.sendMessage(constants_1.MESSAGES.ERROR(constants_1.ERRORS.INVSTRUCT));
                                    break;
                                }
                                const obj = message.object;
                                const objectId = (0, utils_1.hash)((0, canonicalize_1.default)(obj).toString());
                                if (obj.type === "transaction") {
                                    if (!(0, utils_1.transactionPropValidator)(obj)) {
                                        utils_1.logger.error(utils_1.transactionPropValidator.errors);
                                        this.sendMessage(constants_1.MESSAGES.ERROR(`Invalid parameter at: ${utils_1.transactionPropValidator.errors[0].instancePath}` || constants_1.ERRORS.INVSTRUCT));
                                        break;
                                    }
                                    utils_1.logger.info(`Received transaction id: ${objectId}.`);
                                    if ((0, object_dispatch_1.reportTx)(objectId, obj)) {
                                        utils_1.logger.info(`Transaction captured by dispatcher: id=${objectId}.`);
                                        break;
                                    }
                                    models_1.Transaction.findOne({ objectId: objectId }).exec().then((transaction) => __awaiter(this, void 0, void 0, function* () {
                                        if (!transaction) {
                                            try {
                                                yield (0, transaction_1.transactionValidator)(obj);
                                            }
                                            catch (e) {
                                                utils_1.logger.error(`Transaction validation failed: ${e.message}.`);
                                                this.sendMessage(constants_1.MESSAGES.ERROR(e.message));
                                                return;
                                            }
                                            // Broadcast to all peers
                                            (0, connections_1.getClients)().map((client) => {
                                                client.sendMessage(constants_1.MESSAGES.IHAVEOBJECT(objectId));
                                            });
                                        }
                                        else {
                                            utils_1.logger.verbose("Transaction found: " + (0, canonicalize_1.default)(transaction));
                                        }
                                    }));
                                }
                                else if (obj.type === "block") {
                                    if (!(0, utils_1.blockPropValidator)(obj)) {
                                        utils_1.logger.error(utils_1.blockPropValidator.errors);
                                        this.sendMessage(constants_1.MESSAGES.ERROR(`Invalid parameter at: ${utils_1.blockPropValidator.errors[0].instancePath}` || constants_1.ERRORS.INVSTRUCT));
                                        break;
                                    }
                                    utils_1.logger.info(`Received block id: ${objectId}.`);
                                    if ((0, object_dispatch_1.reportBlock)(objectId, obj)) {
                                        utils_1.logger.info(`Block captured by dispatcher: id=${objectId}.`);
                                        break;
                                    }
                                    models_1.Block.findOne({ objectId: objectId }).exec().then((block) => __awaiter(this, void 0, void 0, function* () {
                                        if (!block) {
                                            try {
                                                yield (0, block_1.blockValidator)(obj, this);
                                            }
                                            catch (e) {
                                                utils_1.logger.error(`Block validation failed: ${e.message}.`);
                                                this.sendMessage(constants_1.MESSAGES.ERROR(e.message));
                                                return;
                                            }
                                            // Broadcast to all peers
                                            (0, connections_1.getClients)().map((client) => {
                                                client.sendMessage(constants_1.MESSAGES.IHAVEOBJECT(objectId));
                                            });
                                        }
                                        else {
                                            utils_1.logger.verbose("Block found: " + (0, canonicalize_1.default)(block));
                                        }
                                    }));
                                }
                                else {
                                    this.sendMessage(constants_1.MESSAGES.ERROR(constants_1.ERRORS.INVOBJECT));
                                }
                                break;
                            }
                        case constants_1.MESSAGES.GETMEMPOOL.type:
                            this.sendMessage(constants_1.MESSAGES.MEMPOOL((0, mempool_1.getMempool)()));
                            break;
                        case constants_1.MESSAGES.MEMPOOL().type:
                            if (!message.txids || !Array.isArray(message.txids)) {
                                this.sendMessage(constants_1.MESSAGES.ERROR(constants_1.ERRORS.INVSTRUCT));
                                break;
                            }
                            message.txids.forEach((txid) => {
                                this.sendMessage(constants_1.MESSAGES.GETOBJECT(txid));
                            });
                            break;
                        case constants_1.MESSAGES.GETCHAINTIP.type:
                            models_1.ChainTip.findOne({}).exec().then((tip) => {
                                if (tip) {
                                    this.sendMessage(constants_1.MESSAGES.CHAINTIP(tip.blockid));
                                }
                                else {
                                    this.sendMessage(constants_1.MESSAGES.ERROR(constants_1.ERRORS.EINTERNAL));
                                }
                            });
                            break;
                        case constants_1.MESSAGES.CHAINTIP().type:
                            if (!message.blockid) {
                                this.sendMessage(constants_1.MESSAGES.ERROR(constants_1.ERRORS.INVSTRUCT));
                                break;
                            }
                            models_1.Block.findOne({ objectId: message.blockid }).exec().then((block) => {
                                if (!block) {
                                    this.sendMessage(constants_1.MESSAGES.GETOBJECT(message.blockid));
                                }
                            });
                            break;
                        default:
                            this.sendMessage(constants_1.MESSAGES.ERROR(constants_1.ERRORS.INVTYPE));
                            break;
                    }
                }
                catch (error) {
                    utils_1.logger.error("error: " + error);
                    this.sendMessage(constants_1.MESSAGES.ERROR(constants_1.ERRORS.INVJSON));
                    if (!this.handshake) {
                        socket.end();
                    }
                }
                finally {
                    this.buffer = "";
                }
            }
            this.buffer += deliminatedChunk[0];
            if (this.buffer.length > 0) {
                this.timeout = setTimeout(() => {
                    this.sendMessage(constants_1.MESSAGES.ERROR(constants_1.ERRORS.TIMEOUT));
                    socket.end();
                }, TIMEOUT_MS);
            }
        }));
        // When the client requests to end the TCP connection with the server, the server
        // ends the connection.
        socket.on('end', () => {
            utils_1.logger.info('Closing connection with the client');
            (0, connections_1.removeClient)(this);
        });
        // Don't forget to catch error, for your own sake.
        socket.on('error', (err) => {
            utils_1.logger.error(err);
            (0, connections_1.removeClient)(this);
        });
    }
    sendMessage(message) {
        this.socket.write(((0, canonicalize_1.default)(message) || "{}") + "\n");
        utils_1.logger.verbose(`Sent ${(0, canonicalize_1.default)(message)} to ${this.remoteAddress}:${this.remotePort}.`);
    }
}
exports.Blockhead = Blockhead;
