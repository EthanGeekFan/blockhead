"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.peerPropValidator = exports.blockPropValidator = exports.transactionPropValidator = exports.hash = exports.validatePeer = exports.writePeers = exports.readPeers = exports.logger = void 0;
const winston_1 = require("winston");
const crypto_1 = require("crypto");
const fs = require("fs");
const ajv_1 = __importDefault(require("ajv"));
const ajv = new ajv_1.default();
const ajv_formats_1 = __importDefault(require("ajv-formats"));
(0, ajv_formats_1.default)(ajv);
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
    return peerPropValidator(peer);
}
exports.validatePeer = validatePeer;
function hash(data) {
    return (0, crypto_1.createHash)("sha256").update(data).digest("hex");
}
exports.hash = hash;
ajv.addFormat("hex", /^[0-9a-f]+$/);
const transactionObjectSchema = {
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
exports.transactionPropValidator = transactionPropValidator;
;
const blockObjectSchema = {
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
            // const: "00000002af000000000000000000000000000000000000000000000000000000",
            // const: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
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
exports.blockPropValidator = blockPropValidator;
const peerObjectSchema = {
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
exports.peerPropValidator = peerPropValidator;
