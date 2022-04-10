import mongoose from "mongoose";

const outpointSchema = new mongoose.Schema({
    txid: {
        type: String,
        required: true
    },
    index: {
        type: Number,
        required: true
    }
}, { _id: false });

const inputSchema = new mongoose.Schema({
    outpoint: {
        type: outpointSchema,
        required: true
    },
    sig: {
        type: String,
        required: true
    }
}, { _id: false });

const outputSchema = new mongoose.Schema({
    pubkey: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true
    }
}, { _id: false });

const transactionSchema = new mongoose.Schema({
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

const Transaction = mongoose.model("Transaction", transactionSchema);

export {
    Transaction,
}