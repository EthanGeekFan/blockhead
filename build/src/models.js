"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainTip = exports.UTXOSet = exports.Block = exports.Transaction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const outpointSchema = new mongoose_1.default.Schema({
    txid: {
        type: String,
        required: true
    },
    index: {
        type: Number,
        required: true
    }
}, { _id: false });
const inputSchema = new mongoose_1.default.Schema({
    outpoint: {
        type: outpointSchema,
        required: true
    },
    sig: {
        type: String,
        required: true
    }
}, { _id: false });
const outputSchema = new mongoose_1.default.Schema({
    pubkey: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true
    }
}, { _id: false });
const transactionSchema = new mongoose_1.default.Schema({
    objectId: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    type: {
        type: String,
        required: true
    },
    height: Number,
    inputs: {
        type: [inputSchema],
    },
    outputs: {
        type: [outputSchema],
        required: true
    },
}, { versionKey: false });
transactionSchema.pre("save", function (next) {
    if (this.isNew && this.inputs.length === 0) {
        this.inputs = undefined;
    }
    next();
});
const Transaction = mongoose_1.default.model("Transaction", transactionSchema);
exports.Transaction = Transaction;
const blockSchema = new mongoose_1.default.Schema({
    objectId: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    height: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    txids: {
        type: [String],
        required: true
    },
    nonce: {
        type: String,
        required: true
    },
    previd: {
        type: String,
    },
    created: {
        type: Number,
        required: true
    },
    T: {
        type: String,
        required: true
    },
    miner: {
        type: String,
    },
    note: {
        type: String,
    }
}, { versionKey: false });
blockSchema.pre("save", function (next) {
    if (this.isNew) {
        if (this.note === "") {
            this.note = undefined;
        }
        if (this.miner === "") {
            this.miner = undefined;
        }
        if (this.previd === "") {
            this.previd = null;
        }
    }
    next();
});
const Block = mongoose_1.default.model("Block", blockSchema);
exports.Block = Block;
const utxoSchema = new mongoose_1.default.Schema({
    txid: {
        type: String,
        required: true
    },
    index: {
        type: Number,
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    pubkey: {
        type: String,
        required: true
    }
}, { _id: false, versionKey: false });
const utxoSetSchema = new mongoose_1.default.Schema({
    blockid: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    utxos: [utxoSchema],
}, { versionKey: false });
const UTXOSet = mongoose_1.default.model("UTXOSet", utxoSetSchema);
exports.UTXOSet = UTXOSet;
const chainTipSchema = new mongoose_1.default.Schema({
    height: {
        type: Number,
        required: true
    },
    blockid: {
        type: String,
        required: true,
        index: true,
        unique: true,
    }
}, { versionKey: false });
const ChainTip = mongoose_1.default.model("ChainTip", chainTipSchema);
exports.ChainTip = ChainTip;
