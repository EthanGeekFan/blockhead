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

transactionSchema.pre("save", function (next) {
    if (this.isNew && this.inputs.length === 0) {
        this.inputs = undefined;                                                                                                                                   
      }
      next();
});

const Transaction = mongoose.model("Transaction", transactionSchema);

const blockSchema = new mongoose.Schema({
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

const Block = mongoose.model("Block", blockSchema);

const utxoSchema = new mongoose.Schema({
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

const utxoSetSchema = new mongoose.Schema({
    blockid: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    utxos: [utxoSchema],
}, { versionKey: false });

const UTXOSet = mongoose.model("UTXOSet", utxoSetSchema);

const chainTipSchema = new mongoose.Schema({
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

const ChainTip = mongoose.model("ChainTip", chainTipSchema);

export {
    Transaction,
    Block,
    UTXOSet,
    ChainTip,
};
