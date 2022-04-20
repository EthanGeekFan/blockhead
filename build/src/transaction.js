"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.validateTxWithUTXOSet = exports.transactionValidator = void 0;
const models_1 = require("./models");
const utils_1 = require("./utils");
const _ = require("lodash");
const ed = __importStar(require("@noble/ed25519"));
const canonicalize_1 = __importDefault(require("canonicalize"));
function transactionValidator(tx) {
    return __awaiter(this, void 0, void 0, function* () {
        // normal transaction
        if (tx.inputs) {
            let unsignedTx = JSON.parse(JSON.stringify(tx));
            unsignedTx = _.update(unsignedTx, "inputs", (input) => input.map((ipt) => _.update(ipt, "sig", (signature) => null)));
            let inputSum = 0;
            let inputValidators = [];
            const inputValidator = (input) => __awaiter(this, void 0, void 0, function* () {
                // validate outpoints
                const itx = yield models_1.Transaction.findOne({
                    objectId: input.outpoint.txid,
                }).exec();
                if (!itx) {
                    throw new Error("Did not find previous transaction with id: " + input.outpoint.txid);
                }
                utils_1.logger.info(`Found previous transaction: ${JSON.stringify(itx)}`);
                if (input.outpoint.index >= itx.outputs.length) {
                    throw new Error(`Outpoint index out of bound: ${input.outpoint.index}/${itx.outputs.length - 1}`);
                }
                // validate signatures
                const pubkey = itx.outputs[input.outpoint.index].pubkey;
                const sig = input.sig;
                utils_1.logger.verbose(`Checking signature for pubkey ${pubkey} and signature ${sig}`);
                const valid = yield ed.verify(ed.Signature.fromHex(sig), new TextEncoder().encode((0, canonicalize_1.default)(unsignedTx)), ed.Point.fromHex(pubkey));
                if (!valid) {
                    throw new Error(`Corrupted signature: ${sig}`);
                }
                // add input value to sum
                inputSum += itx.outputs[input.outpoint.index].value;
            });
            tx.inputs.forEach((input) => {
                inputValidators.push(inputValidator(input));
            });
            yield Promise.all(inputValidators);
            // validate sum
            if (inputSum < tx.outputs.reduce((acc, output) => acc + output.value, 0)) {
                throw new Error("Output value greater than input value");
            }
        }
        else {
            return;
        }
    });
}
exports.transactionValidator = transactionValidator;
function validateTxWithUTXOSet(tx, utxoSet) {
    return __awaiter(this, void 0, void 0, function* () {
        // normal transaction
        if (tx.inputs && tx.inputs.length > 0) {
            let unsignedTx = JSON.parse(JSON.stringify(tx));
            unsignedTx = _.update(unsignedTx, "inputs", (input) => input.map((ipt) => _.update(ipt, "sig", (signature) => null)));
            let inputSum = 0;
            const inputValidator = (input) => __awaiter(this, void 0, void 0, function* () {
                // validate outpoints
                const utxoSubSet = _.remove(utxoSet.utxos, (utxo) => utxo.txid === input.outpoint.txid &&
                    utxo.index === input.outpoint.index); // find & remove to avoid double spend in single tx
                if (utxoSubSet.length === 0) {
                    throw new Error("Did not find UTXO: " + JSON.stringify(input.outpoint));
                }
                const utxo = utxoSubSet[0];
                // validate signatures
                const pubkey = utxo.pubkey;
                const sig = input.sig;
                utils_1.logger.verbose(`Checking signature for pubkey ${pubkey} and signature ${sig}`);
                const valid = yield ed.verify(ed.Signature.fromHex(sig), new TextEncoder().encode((0, canonicalize_1.default)(unsignedTx)), ed.Point.fromHex(pubkey));
                if (!valid) {
                    throw new Error(`Corrupted signature: ${sig}`);
                }
                // add input value to sum
                inputSum += utxo.value;
            });
            const inputValidators = tx.inputs.map((input) => inputValidator(input));
            yield Promise.all(inputValidators);
            // validate sum
            const txFee = inputSum - tx.outputs.reduce((acc, output) => acc + output.value, 0);
            if (txFee < 0) {
                throw new Error("Output value greater than input value");
            }
            const txHash = (0, utils_1.hash)((0, canonicalize_1.default)(tx).toString());
            utxoSet.utxos = _.concat(utxoSet.utxos, tx.outputs.map((output, index) => {
                return {
                    txid: txHash,
                    index: index,
                    value: output.value,
                    pubkey: output.pubkey
                };
            }));
            // save transactions
            const savedTx = yield models_1.Transaction.findOne({ objectId: txHash }).exec();
            if (!savedTx) {
                const newTx = new models_1.Transaction(Object.assign({ objectId: txHash }, tx));
                newTx.save();
                utils_1.logger.info(`Saved new block transaction: ${JSON.stringify(newTx)}`);
            }
            return txFee;
        }
        else {
            throw new Error("No inputs found in transaction: " + JSON.stringify(tx));
        }
    });
}
exports.validateTxWithUTXOSet = validateTxWithUTXOSet;
