import { Peer } from "./utils";
import _ = require("lodash");

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
    MESSAGES
};