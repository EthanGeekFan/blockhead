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
