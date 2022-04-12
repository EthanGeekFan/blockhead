"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionPropValidator = exports.hash = exports.validatePeer = exports.writePeers = exports.readPeers = exports.logger = void 0;
const winston_1 = require("winston");
const crypto_1 = require("crypto");
const fs = require("fs");
const ajv_1 = __importDefault(require("ajv"));
const ajv = new ajv_1.default();
// import addFormats from "ajv-formats";
// addFormats(ajv);
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
ajv.addFormat("hex", /^[0-9a-f]+$/);
// ajv.addFormat("hex", {
//     type: "string",
//     validate: (data: string) => {
//         return /^[0-9a-f]+$/.test(data);
//     }
// });
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
    // additionalProperties: false,
};
const transactionPropValidator = ajv.compile(transactionObjectSchema);
exports.transactionPropValidator = transactionPropValidator;
