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
});

const inputSchema = new mongoose.Schema({
    outpoint: {
        type: outpointSchema,
        required: true
    },
    sig: {
        type: String,
        required: true
    }
});

const outputSchema = new mongoose.Schema({
    pubkey: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true
    }
});

const transactionSchema = new mongoose.Schema({
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

const Transaction = mongoose.model("Transaction", transactionSchema);

export {
    Transaction,
}