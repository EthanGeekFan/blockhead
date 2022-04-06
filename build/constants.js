"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGES = void 0;
const MESSAGES = {
    HELLO: {
        "type": "hello",
        "version": "0.8.0",
        "agent": "Marabu-Core Client 0.8"
    },
    ERROR: {
        "type": "error",
        "error": "Unsupported message type received"
    },
    GETPEERS: {
        "type": "getpeers"
    },
    PEERS: (peers = []) => {
        return {
            "type": "peers",
            "peers": peers
        };
    }
};
exports.MESSAGES = MESSAGES;
