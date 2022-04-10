"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
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
});
const inputSchema = new mongoose_1.default.Schema({
    outpoint: {
        type: outpointSchema,
        required: true
    },
    sig: {
        type: String,
        required: true
    }
});
const outputSchema = new mongoose_1.default.Schema({
    pubkey: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true
    }
});
const transactionSchema = new mongoose_1.default.Schema({
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
});
const Transaction = mongoose_1.default.model("Transaction", transactionSchema);
exports.Transaction = Transaction;
