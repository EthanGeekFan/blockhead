import { Transaction } from "./models";
import { logger, TransactionInterface } from "./utils";
import _ = require("lodash");
import * as ed from "@noble/ed25519";
import canonicalize from 'canonicalize';

async function transactionValidator(tx: TransactionInterface) {
    // normal transaction
    if (tx.inputs) {
        let unsignedTx: TransactionInterface = JSON.parse(JSON.stringify(tx));
        unsignedTx = _.update(unsignedTx, "inputs", (input) => input.map((ipt: object) => _.update(ipt, "sig", (signature) => null)));
        let inputSum = 0;
        let inputValidators: Promise<void>[] = [];
        const inputValidator = async (input: { outpoint: any; sig: any; }) => {
            // validate outpoints
            const itx = await Transaction.findOne({ objectId: input.outpoint.txid }).exec();
            if (!itx) {
                throw new Error("Did not find previous transaction with id: " + input.outpoint.txid);
            }
            logger.info(`Found previous transaction: ${JSON.stringify(itx)}`);
            if (input.outpoint.index >= itx.outputs.length) {
                throw new Error(`Outpoint index out of bound: ${input.outpoint.index}/${itx.outputs.length - 1}`);
            }
            // validate signatures
            const pubkey = itx.outputs[input.outpoint.index].pubkey;
            const sig = input.sig;
            logger.verbose(`Checking signature for pubkey ${pubkey} and signature ${sig}`);
            const valid = await ed.verify(ed.Signature.fromHex(sig), canonicalize(unsignedTx)!, ed.Point.fromHex(pubkey));
            if (!valid) {
                throw new Error(`Corrupted signature: ${sig}`);
            }
            // add input value to sum
            inputSum += itx.outputs[input.outpoint.index].value;
        };
        tx.inputs.forEach((input) => {
            inputValidators.push(inputValidator(input));
        });
        await Promise.all(inputValidators);
        // validate sum
        if (inputSum < tx.outputs.reduce((acc, output) => acc + output.value, 0)) {
            throw new Error("Output value greater than input value");
        }
    } else {
        return;
    }
}

export {
    transactionValidator,
};