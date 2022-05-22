import { Transaction } from "./models";
import { hash, logger, TransactionInterface, UTXOSetInterface } from "./utils";
import _ = require("lodash");
import * as ed from "@noble/ed25519";
import canonicalize from "canonicalize";
import { addRawTransactionToMempool, getMempoolState } from "./mempool";

async function transactionValidator(tx: TransactionInterface) {
  // normal transaction
  if (tx.inputs) {
    await validateTxWithUTXOSet(tx, getMempoolState());
    addRawTransactionToMempool(tx);
  } else {
    throw new Error("No inputs found in transaction: " + JSON.stringify(tx));
  }
}

async function validateTxWithUTXOSet(tx: TransactionInterface, utxoSet: UTXOSetInterface): Promise<number> {
    // normal transaction
    if (tx.inputs && tx.inputs.length > 0) {
        let unsignedTx: TransactionInterface = JSON.parse(JSON.stringify(tx));
        unsignedTx = _.update(unsignedTx, "inputs", (input) =>
        input.map((ipt: object) => _.update(ipt, "sig", (signature) => null))
        );
        let inputSum = 0;
        const inputValidator = async (input: { outpoint: any; sig: any }) => {
            // validate outpoints
            const utxoSubSet = _.remove(utxoSet.utxos, (utxo) => utxo.txid === input.outpoint.txid && utxo.index === input.outpoint.index); // find & remove to avoid double spend in single tx
            if (utxoSubSet.length === 0) {
                throw new Error("Did not find UTXO: " + JSON.stringify(input.outpoint));
            }
            const utxo = utxoSubSet[0];
            // validate signatures
            const pubkey = utxo.pubkey;
            const sig = input.sig;
            logger.verbose(
                `Checking signature for pubkey ${pubkey} and signature ${sig}`
            );
            const valid = await ed.verify(
                ed.Signature.fromHex(sig),
                new TextEncoder().encode(canonicalize(unsignedTx)!),
                ed.Point.fromHex(pubkey)
            );
            if (!valid) {
                throw new Error(`Corrupted signature: ${sig}`);
            }
            // add input value to sum
            inputSum += utxo.value;
        };
        const inputValidators = tx.inputs.map((input) => inputValidator(input));
        await Promise.all(inputValidators);
        // validate sum
        const txFee =
        inputSum - tx.outputs.reduce((acc, output) => acc + output.value, 0);
        if (txFee < 0) {
        throw new Error("Output value greater than input value");
        }
        const txHash = hash(canonicalize(tx)!.toString());
        utxoSet.utxos = _.concat(utxoSet.utxos, tx.outputs.map((output, index) => {
            return {
                txid: txHash,
                index: index,
                value: output.value,
                pubkey: output.pubkey
            }
        }));
        // save transactions
        const savedTx = await Transaction.findOne({ objectId: txHash }).exec();
        if (!savedTx) {
            const newTx = new Transaction({
                objectId: txHash,
                ...tx,
            });
            newTx.save();
            logger.info(`Saved new block transaction: ${JSON.stringify(newTx)}`);
        }
        return txFee;
    } else {
        throw new Error("No inputs found in transaction: " + JSON.stringify(tx));
    }
}

export { transactionValidator, validateTxWithUTXOSet };
