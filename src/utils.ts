import { transports, format, createLogger } from "winston"
import { createHash } from "crypto";
import fs = require("fs");

const logger = createLogger({
    level: "silly",
    format: format.combine(
        format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss"
        }),
        format.json(),
    ),
    transports: [
        new transports.File({ filename: "logs/errors.log", level: "error" }),
        new transports.File({ filename: "logs/combined.log" }),
        new transports.Console(),
    ],
})

interface Peer {
    host: string;
    port: number;
}

function readPeers(): Peer[] {
    try {
        const peers = JSON.parse(fs.readFileSync("./build/src/peers.json").toString());
        return peers;
    } catch (e) {
        console.log('JSON parse error on peers.json');
        console.log(e);
        return [];
    }
}

function writePeers(peers: Peer[]) {
    fs.writeFileSync("./build/src/peers.json", JSON.stringify(peers, null, 4));
}

function validatePeer(peer: Peer): boolean {
    return peer.host != "" && peer.port != null;
}

function hash(data: string): string {
    return createHash("sha256").update(data).digest("hex");
}

export {
    logger,
    readPeers,
    writePeers,
    validatePeer,
    Peer,
    hash,
}