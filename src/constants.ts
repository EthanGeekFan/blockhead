import { Peer } from "./utils";
import _ = require("lodash");

const ERRORS = {
    NOHELLO: "Expected HELLO message before conversation.",
    INVTYPE: "Invalid message type.",
    INVVERSION: "Invalid version.",
    INVJSON: "Invalid json message.",
}

const MESSAGES = {
    HELLO: {
        "type": "hello",
        "version": "0.8.0",
        "agent": "Marabu-Core Client 0.8"
    },
    ERROR: (message: string = ERRORS.INVTYPE) => {
        return {
            "type": "error",
            "error": message
        }
    },
    GETPEERS: {
        "type": "getpeers"
    },
    PEERS: (peers: Peer[] = []) => {
        return {
            "type": "peers",
            "peers": _.map(peers, (peer: Peer) => `${peer.host}:${peer.port}`)
        }
    },
    GETOBJECT: (objectId: string = "") => {
        return {
            "type": "getobject",
            "objectId": objectId
        }
    },
    IHAVEOBJECT: (objectId: string = "") => {
        return {
            "type": "ihaveobject",
            "objectId": objectId
        }
    },
    OBJECT: (object: any = {}) => {
        return {
            "type": "object",
            "object": object
        }
    },
    GETMEMPOOL: {
        "type": "getmempool"
    },
    MEMPOOL: (txids: any = {}) => {
        return {
            "type": "mempool",
            "txids": txids
        }
    },
    GETCHAINTIP: {
        "type": "getchaintip"
    },
    CHAINTIP: (blockid: string = "") => {
        return {
            "type": "chaintip",
            "blockid": blockid
        }
    }
}


export {
    MESSAGES,
    ERRORS,
};