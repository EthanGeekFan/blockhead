"use strict";
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
const delimiter = '\n';
class Blockhead {
    constructor(socket) {
        this.buffer = "";
        this.handshake = false;
        this.socket = socket;
        // Now that a TCP connection has been established, the server can send data to
        // the client by writing to its socket.
        this.socket.on("connect", () => {
            this.sendMessage(constants_1.MESSAGES.HELLO);
            this.sendMessage(constants_1.MESSAGES.GETPEERS);
            utils_1.logger.verbose(`Sent HELLO and GETPEERS message to the server.`);
        });
        // The server can also receive data from the client by reading from its socket.
        socket.on('data', (chunk) => {
            utils_1.logger.verbose(`Data received from client: ${chunk.toString().trim()}.`);
            const deliminatedChunk = chunk.toString().split(delimiter);
            while (deliminatedChunk.length > 1) {
                this.buffer += deliminatedChunk.shift();
                try {
                    const message = JSON.parse(this.buffer);
                    utils_1.logger.info(`Message received from client: ${(0, canonicalize_1.default)(message)}.`);
                    if (!this.handshake) {
                        if (message.type === constants_1.MESSAGES.HELLO.type) {
                            if (!semver.satisfies(message.version, "0.8.x")) {
                                this.sendMessage(constants_1.MESSAGES.ERROR(constants_1.ERRORS.INVVERSION));
                                socket.end();
                                return;
                            }
                            this.handshake = true;
                            return;
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
                            if (!semver.satisfies(message.version, "0.8.x")) {
                                this.sendMessage(constants_1.MESSAGES.ERROR(constants_1.ERRORS.INVVERSION));
                                return;
                            }
                            break;
                        case constants_1.MESSAGES.PEERS().type:
                            // read peers database
                            let peersDB = (0, utils_1.readPeers)();
                            message.peers.map((peer) => {
                                const split = peer.lastIndexOf(":");
                                const host = peer.substring(0, split);
                                const port = parseInt(peer.substring(split + 1));
                                peersDB.push({ host, port });
                                peersDB = _.uniqBy(peersDB, (p) => `${p.host}:${p.port}`);
                                // peersDB = _.filter(peersDB, validatePeer);
                                (0, utils_1.writePeers)(peersDB);
                            });
                            break;
                        case constants_1.MESSAGES.GETPEERS.type:
                            this.sendMessage(constants_1.MESSAGES.PEERS((0, utils_1.readPeers)()));
                            break;
                        case constants_1.MESSAGES.GETOBJECT().type:
                            break;
                        case constants_1.MESSAGES.IHAVEOBJECT().type:
                            break;
                        case constants_1.MESSAGES.OBJECT().type:
                            break;
                        case constants_1.MESSAGES.GETMEMPOOL.type:
                            break;
                        case constants_1.MESSAGES.MEMPOOL().type:
                            break;
                        case constants_1.MESSAGES.GETCHAINTIP.type:
                            break;
                        case constants_1.MESSAGES.CHAINTIP().type:
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
        });
        // When the client requests to end the TCP connection with the server, the server
        // ends the connection.
        socket.on('end', function () {
            utils_1.logger.info('Closing connection with the client');
        });
        // Don't forget to catch error, for your own sake.
        socket.on('error', function (err) {
            utils_1.logger.error(err);
        });
    }
    sendMessage(message) {
        this.socket.write(((0, canonicalize_1.default)(message) || "{}") + "\n");
    }
}
exports.Blockhead = Blockhead;
