"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockValidator = void 0;
const utils_1 = require("./utils");
const canonicalize_1 = __importDefault(require("canonicalize"));
const models_1 = require("./models");
const object_dispatch_1 = require("./object_dispatch");
const transaction_1 = require("./transaction");
const COINBASE_REWARD = 50e12; // 50 bu = 50 * 10^12 pica bu
function resolveTx(txid, sender) {
    return __awaiter(this, void 0, void 0, function* () {
        const tx = yield models_1.Transaction.findOne({ objectId: txid }).select({ _id: 0, objectId: 0 }).lean().exec();
        if (!tx) {
            return (0, object_dispatch_1.requestTx)(txid, sender);
        }
        return tx;
    });
}
function blockValidator(block, sender) {
    return __awaiter(this, void 0, void 0, function* () {
        // proof of work
        const blockHash = (0, utils_1.hash)((0, canonicalize_1.default)(block).toString());
        if (blockHash >= block.T) {
            throw new Error(`Invalid proof of work: ${blockHash} >= ${block.T}`);
        }
        // ensure previous block exists
        if (block.previd) {
            const savedPrevBlock = models_1.Block.findOne({ objectId: block.previd }).select({ _id: 0, objectId: 0 }).lean().exec();
            let prevBlock;
            if (!savedPrevBlock) {
                utils_1.logger.info(`Requesting previous block ${block.previd}`);
                prevBlock = yield (0, object_dispatch_1.requestBlock)(block.previd, sender);
                if (!prevBlock) {
                    throw new Error("Cannot find previous block: id=" + block.previd);
                }
                // ensure previous block is valid
                yield blockValidator(prevBlock, sender);
            }
        }
        else {
            // genesis block
            throw new Error("Genesis block is not allowed");
        }
        const resolveTxids = block.txids.map((txid) => {
            return resolveTx(txid, sender).catch((err) => {
                throw new Error(err.message);
            });
        });
        // wait for all tx to resolve
        const resolvedTxs = yield Promise.all(resolveTxids);
        // Get UTXO at previous block
        const prevUTXO = yield models_1.UTXOSet.findOne({ blockid: block.previd }).exec();
        if (!prevUTXO) {
            throw new Error("Previous UTXO not found");
        }
        // check if there are coinbase tx
        let coinbaseTx;
        if (resolvedTxs.length > 0 &&
            (!resolvedTxs[0].inputs || resolvedTxs[0].inputs.length === 0)) {
            coinbaseTx = resolvedTxs.shift();
            utils_1.logger.verbose(`Found coinbase transaction: ${JSON.stringify(coinbaseTx)}`);
        }
        let totalTxFee = 0;
        // validate transactions
        for (const tx of resolvedTxs) {
            totalTxFee += yield (0, transaction_1.validateTxWithUTXOSet)(tx, prevUTXO);
        }
        // check if total tx fee is correct
        if (coinbaseTx) {
            if (coinbaseTx.height === undefined) {
                throw new Error("Coinbase tx height is not set");
            }
            if (coinbaseTx.outputs.length !== 1) {
                throw new Error("Coinbase tx should have only one output");
            }
            if (coinbaseTx.outputs[0].value > totalTxFee + COINBASE_REWARD) {
                throw new Error("Coinbase tx output value is more than allowed");
            }
            prevUTXO.utxos.push({
                txid: (0, utils_1.hash)((0, canonicalize_1.default)(coinbaseTx).toString()),
                index: 0,
                value: coinbaseTx.outputs[0].value,
                pubkey: coinbaseTx.outputs[0].pubkey,
            });
            const coinbaseHash = (0, utils_1.hash)((0, canonicalize_1.default)(coinbaseTx).toString());
            const savedTx = yield models_1.Transaction.findOne({ objectId: coinbaseHash }).exec();
            if (!savedTx) {
                const newTx = new models_1.Transaction(Object.assign({ objectId: coinbaseHash }, coinbaseTx));
                newTx.save();
                utils_1.logger.info(`Saved new coinbase transaction: ${JSON.stringify(newTx)}`);
            }
        }
        // valid block
        // save UTXO
        const utxo = new models_1.UTXOSet({
            blockid: blockHash,
            utxos: prevUTXO.utxos,
        });
        yield utxo.save();
        return;
    });
}
exports.blockValidator = blockValidator;
