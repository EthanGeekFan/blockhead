"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERRORS = exports.MESSAGES = void 0;
const _ = require("lodash");
const ERRORS = {
    NOHELLO: "Expected HELLO message before conversation.",
    INVTYPE: "Invalid message type.",
    INVVERSION: "Invalid version.",
    INVJSON: "Invalid json message.",
    TIMEOUT: "Message not received in a reasonable time.",
    INVSTRUCT: "Invalid structure.",
};
exports.ERRORS = ERRORS;
const MESSAGES = {
    HELLO: {
        "type": "hello",
        "version": "0.8.0",
        "agent": "Marabu-Core Client 0.8"
    },
    ERROR: (message = ERRORS.INVTYPE) => {
        return {
            "type": "error",
            "error": message
        };
    },
    GETPEERS: {
        "type": "getpeers"
    },
    PEERS: (peers = []) => {
        return {
            "type": "peers",
            "peers": _.map(peers, (peer) => `${peer.host}:${peer.port}`)
        };
    },
    GETOBJECT: (objectId = "") => {
        return {
            "type": "getobject",
            "objectid": objectId
        };
    },
    IHAVEOBJECT: (objectId = "") => {
        return {
            "type": "ihaveobject",
            "objectid": objectId
        };
    },
    OBJECT: (object = {}) => {
        return {
            "type": "object",
            "object": object
        };
    },
    GETMEMPOOL: {
        "type": "getmempool"
    },
    MEMPOOL: (txids = {}) => {
        return {
            "type": "mempool",
            "txids": txids
        };
    },
    GETCHAINTIP: {
        "type": "getchaintip"
    },
    CHAINTIP: (blockid = "") => {
        return {
            "type": "chaintip",
            "blockid": blockid
        };
    }
};
exports.MESSAGES = MESSAGES;
