import { Blockhead } from "./blockhead";
import { MESSAGES } from "./constants";
import { BlockInterface, TransactionInterface } from "./utils";
import EventEmitter from "events";

const dispatchQueue: string[] = [];

const REQ_TIMEOUT = 3000; // ms

class ObjectDispatch extends EventEmitter {
    constructor() {
        super();
    }
}

const dispatcher = new ObjectDispatch();

function requestTx(txid: string, sender: Blockhead): Promise<TransactionInterface> {
    sender.sendMessage(MESSAGES.GETOBJECT(txid));
    return new Promise((resolve, reject) => {
        dispatchQueue.push(txid);
        const listener = (tx: TransactionInterface) => {
            dispatcher.removeListener(txid, listener);
            resolve(tx);
        }
        dispatcher.on(txid, listener);
        setTimeout(() => {
            dispatcher.removeListener(txid, listener);
            reject(new Error(`Timeout waiting for tx ${txid}`));
        }, REQ_TIMEOUT);
    });
}

function requestBlock(blockid: string, sender: Blockhead): Promise<BlockInterface> {
    sender.sendMessage(MESSAGES.GETOBJECT(blockid));
    return new Promise((resolve, reject) => {
        dispatchQueue.push(blockid);
        const listener = (block: BlockInterface) => {
            dispatcher.removeListener(blockid, listener);
            resolve(block);
        }
        dispatcher.on(blockid, listener);
        setTimeout(() => {
            dispatcher.removeListener(blockid, listener);
            reject(new Error(`Timeout waiting for block ${blockid}`));
        }, REQ_TIMEOUT);
    });
}

function reportTx(txid: string, tx: TransactionInterface): boolean {
    if (dispatchQueue.includes(txid)) {
        dispatchQueue.splice(dispatchQueue.indexOf(txid), 1);
        dispatcher.emit(txid, tx);
        return true;
    }
    return false;
}

function reportBlock(blockid: string, block: BlockInterface): boolean {
    if (dispatchQueue.includes(blockid)) {
        dispatchQueue.splice(dispatchQueue.indexOf(blockid), 1);
        dispatcher.emit(blockid, block);
        return true;
    }
    return false;
}

export {
    requestTx,
    reportTx,
    requestBlock,
    reportBlock,
}