import { BlockInterface, hash, logger, TransactionInterface } from "./utils";
import canonicalize from "canonicalize";
import { UTXOSet, Transaction, Block } from "./models";
import { requestBlock, requestTx } from "./object_dispatch";
import { Blockhead } from "./blockhead";
import { validateTxWithUTXOSet } from "./transaction";

const COINBASE_REWARD = 50e12; // 50 bu = 50 * 10^12 pica bu

async function resolveTx(txid: string, sender: Blockhead): Promise<TransactionInterface> {
  const tx = await Transaction.findOne({ objectId: txid }).select({ _id: 0, objectId: 0 }).lean().exec();
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
    // ensure previous block exists
    if (block.previd) {
        const savedPrevBlock = Block.findOne({ objectId: block.previd }).select({ _id: 0, objectId: 0 }).lean().exec();
        let prevBlock: BlockInterface;
        if (!savedPrevBlock) {
            logger.info(`Requesting previous block ${block.previd}`);
            prevBlock = await requestBlock(block.previd, sender);
            if (!prevBlock) {
                throw new Error("Cannot find previous block: id=" + block.previd);
            }
            // ensure previous block is valid
            await blockValidator(prevBlock, sender);
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
    return;
}

export {
    blockValidator,
};
