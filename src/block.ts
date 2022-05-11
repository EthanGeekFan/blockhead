import { BlockInterface, hash, logger, TransactionInterface } from "./utils";
import canonicalize from "canonicalize";
import { UTXOSet, Transaction, Block, ChainTip } from "./models";
import { requestBlock, requestTx } from "./object_dispatch";
import { Blockhead } from "./blockhead";
import { validateTxWithUTXOSet } from "./transaction";

const COINBASE_REWARD = 50e12; // 50 bu = 50 * 10^12 pica bu

async function resolveTx(txid: string, sender: Blockhead): Promise<TransactionInterface> {
  const tx = await Transaction.findOne({ objectId: txid }).select({ _id: 0, objectId: 0, height: 0 }).lean().exec();
  if (!tx) {
    return requestTx(txid, sender);
  }
  return tx;
}

async function blockValidator(block: BlockInterface, sender: Blockhead) {
    // proof of work
    const blockHash = hash(canonicalize(block)!.toString());
    if (blockHash >= block.T) {
        throw new Error(`Invalid proof of work: ${blockHash} >= ${block.T}`);
    }
    if (block.created * 1000>= Date.now()) {
        throw new Error(`Invalid block timestamp - should be created before now: ${block.created} >= ${(Date.now() / 1000) | 0}`);
    }
    // ensure previous block exists
    let prevBlock: BlockInterface;
    if (block.previd) {
        const savedPrevBlock = await Block.findOne({ objectId: block.previd }).select({ _id: 0, objectId: 0, height: 0 }).lean().exec();
        if (!savedPrevBlock) {
            logger.info(`Requesting previous block ${block.previd}`);
            prevBlock = await requestBlock(block.previd, sender);
            if (!prevBlock) {
                throw new Error("Cannot find previous block: id=" + block.previd);
            }
            if (block.created <= prevBlock.created) {
                throw new Error(`Invalid block timestamp - should be created after previous block: ${block.created} <= ${prevBlock.created}`);
            }
            // ensure previous block is valid
            await blockValidator(prevBlock, sender);
        } else {
            prevBlock = savedPrevBlock;
        }
    } else {
        // genesis block
        throw new Error("Genesis block is not allowed");
    }
    const resolveTxids = block.txids.map((txid) => {
        return resolveTx(txid, sender).catch((err) => {
            throw new Error(err.message);
        });
    });
    // wait for all tx to resolve
    const resolvedTxs = await Promise.all(resolveTxids);
    // Get UTXO at previous block
    const prevUTXO = await UTXOSet.findOne({ blockid: block.previd }).exec();
    if (!prevUTXO) {
        throw new Error("Previous UTXO not found");
    }
    // check if there are coinbase tx
    let coinbaseTx: TransactionInterface | undefined;
    if (
        resolvedTxs.length > 0 &&
        (!resolvedTxs[0].inputs || resolvedTxs[0].inputs.length === 0)
    ) {
        coinbaseTx = resolvedTxs.shift();
        logger.verbose(`Found coinbase transaction: ${JSON.stringify(coinbaseTx)}`);
    }
    let totalTxFee = 0;
    // validate transactions
    for (const tx of resolvedTxs) {
        totalTxFee += await validateTxWithUTXOSet(tx, prevUTXO);
    }
    // get height of previous block
    const blockHeight = (await Block.findOne({ objectId: block.previd }).select({ height: 1 }).exec()).height + 1;
    // check if total tx fee and height is correct
    if (coinbaseTx) {
        if (coinbaseTx.height === undefined || coinbaseTx.height !== blockHeight) {
            throw new Error(`Coinbase tx height invalid: ${coinbaseTx.height} !== ${blockHeight}`);
        }
        if (coinbaseTx.outputs.length !== 1) {
            throw new Error("Coinbase tx should have only one output");
        }
        if (coinbaseTx.outputs[0].value > totalTxFee + COINBASE_REWARD) {
            throw new Error("Coinbase tx output value is more than allowed");
        }
        prevUTXO.utxos.push({
            txid: hash(canonicalize(coinbaseTx)!.toString()),
            index: 0,
            value: coinbaseTx.outputs[0].value,
            pubkey: coinbaseTx.outputs[0].pubkey,
        });
        const coinbaseHash = hash(canonicalize(coinbaseTx)!.toString());
        const savedTx = await Transaction.findOne({ objectId: coinbaseHash }).exec();
        if (!savedTx) {
            const newTx = new Transaction({
                objectId: coinbaseHash,
                ...coinbaseTx,
            });
            newTx.save();
            logger.info(`Saved new coinbase transaction: ${JSON.stringify(newTx)}`);
        }
    }
    // valid block
    // save UTXO
    const utxo = new UTXOSet({
        blockid: blockHash,
        utxos: prevUTXO.utxos,
    });
    await utxo.save();
    // save block
    const newBlock = new Block({
        objectId: blockHash,
        height: blockHeight,
        ...block,
    });
    newBlock.save();
    // update chain tip if needed
    const chainTip = await ChainTip.findOne({}).exec();
    if (!chainTip) {
        throw new Error("Chain tip global state not found");
    }
    if (blockHeight > chainTip.height) {
        await ChainTip.updateOne({}, { height: blockHeight, blockid: blockHash }).exec();
    }
    logger.info(`Saved new block: ${JSON.stringify(canonicalize(block), null, 4)}.`);
    return;
}

export {
    blockValidator,
};
