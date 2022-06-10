import { TransactionInterface, UTXOSetInterface } from "./utils";
import { hash } from "./utils";
import canonicalize from "canonicalize";
import _ = require("lodash");
import { Block, ChainTip, Transaction, UTXOSet } from "./models";
import { validateTxWithUTXOSet } from "./transaction";
import { miner } from ".";


var pool: string[];

var mempoolState: UTXOSetInterface;

function initMempool(): void {
    // get current chain tip
    ChainTip.findOne({}).exec().then((chainTip) => {
        if (!chainTip) {
            throw new Error("Chain tip not found!!!");
        }
        UTXOSet.findOne({ blockid: chainTip.blockid }).exec().then((utxoset) => {
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

async function switchChainTip(blockid: string) {
    // reverse back to nearest common ancestor
    let oldBlock = await Block.findOne({ objectId: mempoolState.blockid }).exec();
    if (!oldBlock) {
        throw new Error("Block not found");
    }
    let newBlock = await Block.findOne({ objectId: blockid }).exec();
    if (!newBlock) {
        throw new Error("Block not found");
    }
    while (newBlock.height > oldBlock.height) {
        newBlock = await Block.findOne({ objectId: newBlock.previd }).exec();
        if (!newBlock) {
            throw new Error("New block not found");
        }
    }
    while (oldBlock.objectId !== newBlock.objectId) {
        pool = _.concat(oldBlock.txids, pool);
        oldBlock = await Block.findOne({ objectId: oldBlock.previd }).exec();
        if (!oldBlock) {
            throw new Error("Old block not found");
        }
        newBlock = await Block.findOne({ objectId: newBlock.previd }).exec();
        if (!newBlock) {
            throw new Error("New block not found");
        }
    }
    const tipUTXOSet = await UTXOSet.findOne({ blockid: blockid }).exec();
    if (!tipUTXOSet) {
        throw new Error("UTXO set not found");
    }
    const dynamicUtxos = tipUTXOSet;
    const txPool = await id2tx(pool);
    const garbage: string[] = [];
    for (let i = 0; i < txPool.length; i++) {
        try {
            await validateTxWithUTXOSet(txPool[i], dynamicUtxos, false);
        } catch (error) {
            garbage.push(pool[i]);
        }
    }
    _.remove(pool, (item) => garbage.includes(item));
    mempoolState = {
        utxos: dynamicUtxos.utxos,
        blockid: blockid,
    };
}

async function id2tx(ids: string[] | string): Promise<TransactionInterface[]> {
    if (typeof ids === "string") {
        ids = [ids];
    }
    const txs = ids.map((id) => Transaction.findOne({ objectId: id }).select({ _id: 0, objectId: 0, height: 0 }).exec());
    return await Promise.all(txs);
}

function getMempool() {
    return pool;
}

function getMempoolState(): UTXOSetInterface {
    return mempoolState;
}

function addTransactionToMempool(id: string): void {
    pool.push(id);
    miner.update(pool);
}

function addRawTransactionToMempool(rawTransaction: TransactionInterface): void {
    addTransactionToMempool(hash(canonicalize(rawTransaction)!));
}

function removeTransaction(id: string): void {
    _.remove(pool, (item) => item === id);
}

export {
    initMempool,
    switchChainTip,
    getMempool,
    getMempoolState,
    addTransactionToMempool,
    addRawTransactionToMempool,
}
