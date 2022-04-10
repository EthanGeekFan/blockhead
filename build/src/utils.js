"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hash = exports.validatePeer = exports.writePeers = exports.readPeers = exports.logger = void 0;
const winston_1 = require("winston");
const crypto_1 = require("crypto");
const fs = require("fs");
const logger = (0, winston_1.createLogger)({
    level: "silly",
    format: winston_1.format.combine(winston_1.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss"
    }), winston_1.format.json()),
    transports: [
        new winston_1.transports.File({ filename: "logs/errors.log", level: "error" }),
        new winston_1.transports.File({ filename: "logs/combined.log" }),
        new winston_1.transports.Console(),
    ],
});
exports.logger = logger;
function readPeers() {
    try {
        const peers = JSON.parse(fs.readFileSync("./build/src/peers.json").toString());
        return peers;
    }
    catch (e) {
        console.log('JSON parse error on peers.json');
        console.log(e);
        return [];
    }
}
exports.readPeers = readPeers;
function writePeers(peers) {
    fs.writeFileSync("./build/src/peers.json", JSON.stringify(peers, null, 4));
}
exports.writePeers = writePeers;
function validatePeer(peer) {
    return peer.host != "" && peer.port != null;
}
exports.validatePeer = validatePeer;
function hash(data) {
    return (0, crypto_1.createHash)("sha256").update(data).digest("hex");
}
exports.hash = hash;
