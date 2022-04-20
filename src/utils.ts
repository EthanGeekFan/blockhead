import { transports, format, createLogger } from "winston"
import { createHash } from "crypto";
import fs = require("fs");
import _ = require("lodash");
import Ajv, { JSONSchemaType } from "ajv"
const ajv = new Ajv();
import addFormats from "ajv-formats";

addFormats(ajv);

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
    return peerPropValidator(peer);
}

function hash(data: string): string {
    return createHash("sha256").update(data).digest("hex");
}

interface TransactionInterface {
    type: string;
    height?: number;
    inputs?: {
        outpoint: {
            index: number;
            txid: string;
        };
        sig: string;
    }[];
    outputs: {
        pubkey: string;
        value: number;
    }[];
}

ajv.addFormat("hex", /^[0-9a-f]+$/);

const transactionObjectSchema: JSONSchemaType<TransactionInterface> = {
    type: "object",
    oneOf: [
        {
            properties: {
                type: {
                    const: "transaction",
                },
                inputs: {
                    type: "array",
                    minItems: 1,
                    items: {
                        type: "object",
                        properties: {
                            outpoint: {
                                type: "object",
                                properties: {
                                    index: {
                                        type: "integer",
                                        minimum: 0,
                                    },
                                    txid: {
                                        type: "string",
                                        format: "hex",
                                        minLength: 64,
                                        maxLength: 64,
                                    },
                                },
                                required: ["index", "txid"],
                                additionalProperties: false,
                            },
                            sig: {
                                type: "string",
                                format: "hex",
                                minLength: 128,
                                maxLength: 128,
                            },
                        },
                        required: ["outpoint", "sig"],
                        additionalProperties: false,
                    },
                },
                outputs: {
                    type: "array",
                    minItems: 1,
                    items: {
                        type: "object",
                        properties: {
                            pubkey: {
                                type: "string",
                                format: "hex",
                                minLength: 64,
                                maxLength: 64,
                            },
                            value: {
                                type: "integer",
                                minimum: 0,
                            },
                        },
                        required: ["pubkey", "value"],
                        additionalProperties: false,
                    },
                },
            },
            required: [
                "type",
                "inputs",
                "outputs",
            ],
        },
        {
            properties: {
                type: {
                    const: "transaction",
                },
                height: {
                    type: "integer",
                },
                outputs: {
                    type: "array",
                    minItems: 1,
                    items: {
                        type: "object",
                        properties: {
                            pubkey: {
                                type: "string",
                                format: "hex",
                                minLength: 64,
                                maxLength: 64,
                            },
                            value: {
                                type: "integer",
                                minimum: 0,
                            },
                        },
                        required: ["pubkey", "value"],
                        additionalProperties: false,
                    },
                },
            },
            required: [
                "type",
                "height",
                "outputs",
            ],
        }
    ],
    required: [
        "type",
        "outputs",
    ],
};

const transactionPropValidator = ajv.compile(transactionObjectSchema);

// TODO: Block validation
interface BlockInterface {
    type: string;
    txids: string[];
    nonce: string;
    previd: string | null;
    created: number;
    T: string;
    miner?: string;
    note?: string;
};

const blockObjectSchema: JSONSchemaType<BlockInterface> = {
    type: "object",
    properties: {
        type: {
            type: "string",
            const: "block",
        },
        txids: {
            type: "array",
            minItems: 0,
            items: {
                type: "string",
                format: "hex",
                minLength: 64,
                maxLength: 64,
            },
        },
        nonce: {
            type: "string",
            format: "hex",
            minLength: 64,
            maxLength: 64,
        },
        previd: {
            type: "string",
            format: "hex",
            minLength: 64,
            maxLength: 64,
            nullable: true,
        },
        created: {
            type: "integer",
            minimum: 0,
        },
        T: {
            type: "string",
            const: "00000002af000000000000000000000000000000000000000000000000000000",
            format: "hex",
            minLength: 64,
            maxLength: 64,
        },
        miner: {
            type: "string",
            nullable: true,
            maxLength: 128,
        },
        note: {
            type: "string",
            nullable: true,
            maxLength: 128,
        },
    },
    required: [
        "type",
        "txids",
        "nonce",
        "previd",
        "created",
        "T",
    ],
    additionalProperties: false,
};

const blockPropValidator = ajv.compile(blockObjectSchema);


const peerObjectSchema: JSONSchemaType<Peer> = {
    type: "object",
    properties: {
        host: {
            type: "string",
            format: "hostname",
        },
        port: {
            type: "integer",
            minimum: 1,
            maximum: 65535,
        },
    },
    required: [
        "host",
        "port",
    ],
    additionalProperties: false,
};

const peerPropValidator = ajv.compile(peerObjectSchema);

interface UTXOInterface {
    txid: string;
    index: number;
    value: number;
    pubkey: string;
}

interface UTXOSetInterface {
    utxos: UTXOInterface[];
    blockid: string;
}

export {
    logger,
    readPeers,
    writePeers,
    validatePeer,
    Peer,
    hash,
    TransactionInterface,
    transactionPropValidator,
    BlockInterface,
    blockPropValidator,
    peerPropValidator,
    UTXOInterface,
    UTXOSetInterface,
}