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
exports.addRawTransactionToMempool = exports.addTransactionToMempool = exports.getMempoolState = exports.getMempool = exports.switchChainTip = exports.initMempool = void 0;
const utils_1 = require("./utils");
const canonicalize_1 = __importDefault(require("canonicalize"));
const _ = require("lodash");
const models_1 = require("./models");
const transaction_1 = require("./transaction");
const _1 = require(".");
var pool;
var mempoolState;
function initMempool() {
    // get current chain tip
    models_1.ChainTip.findOne({}).exec().then((chainTip) => {
        if (!chainTip) {
            throw new Error("Chain tip not found!!!");
        }
        models_1.UTXOSet.findOne({ blockid: chainTip.blockid }).exec().then((utxoset) => {
            if (!utxoset) {
                throw new Error("UTXO set not found!!!");
            }
            mempoolState = {
                utxos: utxoset.utxos,
                blockid: chainTip.blockid,
            };
            pool = [];
        });
    });
}
exports.initMempool = initMempool;
function switchChainTip(blockid) {
    return __awaiter(this, void 0, void 0, function* () {
        // reverse back to nearest common ancestor
        let oldBlock = yield models_1.Block.findOne({ objectId: mempoolState.blockid }).exec();
        if (!oldBlock) {
            throw new Error("Block not found");
        }
        let newBlock = yield models_1.Block.findOne({ objectId: blockid }).exec();
        if (!newBlock) {
            throw new Error("Block not found");
        }
        while (newBlock.height > oldBlock.height) {
            newBlock = yield models_1.Block.findOne({ objectId: newBlock.previd }).exec();
            if (!newBlock) {
                throw new Error("New block not found");
            }
        }
        while (oldBlock.objectId !== newBlock.objectId) {
            pool = _.concat(oldBlock.txids, pool);
            oldBlock = yield models_1.Block.findOne({ objectId: oldBlock.previd }).exec();
            if (!oldBlock) {
                throw new Error("Old block not found");
            }
            newBlock = yield models_1.Block.findOne({ objectId: newBlock.previd }).exec();
            if (!newBlock) {
                throw new Error("New block not found");
            }
        }
        const tipUTXOSet = yield models_1.UTXOSet.findOne({ blockid: blockid }).exec();
        if (!tipUTXOSet) {
            throw new Error("UTXO set not found");
        }
        const dynamicUtxos = tipUTXOSet;
        const txPool = yield id2tx(pool);
        const garbage = [];
        for (let i = 0; i < txPool.length; i++) {
            try {
                yield (0, transaction_1.validateTxWithUTXOSet)(txPool[i], dynamicUtxos, false);
            }
            catch (error) {
                garbage.push(pool[i]);
            }
        }
        _.remove(pool, (item) => garbage.includes(item));
        mempoolState = {
            utxos: dynamicUtxos.utxos,
            blockid: blockid,
        };
    });
}
exports.switchChainTip = switchChainTip;
function id2tx(ids) {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof ids === "string") {
            ids = [ids];
        }
        const txs = ids.map((id) => models_1.Transaction.findOne({ objectId: id }).select({ _id: 0, objectId: 0, height: 0 }).exec());
        return yield Promise.all(txs);
    });
}
function getMempool() {
    return pool;
}
exports.getMempool = getMempool;
function getMempoolState() {
    return mempoolState;
}
exports.getMempoolState = getMempoolState;
function addTransactionToMempool(id) {
    pool.push(id);
    _1.miner.update(pool);
}
exports.addTransactionToMempool = addTransactionToMempool;
function addRawTransactionToMempool(rawTransaction) {
    addTransactionToMempool((0, utils_1.hash)((0, canonicalize_1.default)(rawTransaction)));
}
exports.addRawTransactionToMempool = addRawTransactionToMempool;
function removeTransaction(id) {
    _.remove(pool, (item) => item === id);
}
