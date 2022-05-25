"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportBlock = exports.requestBlock = exports.reportTx = exports.requestTx = void 0;
const constants_1 = require("./constants");
const events_1 = __importDefault(require("events"));
const dispatchQueue = [];
const REQ_TIMEOUT = 60000; // ms
class ObjectDispatch extends events_1.default {
    constructor() {
        super();
    }
}
const dispatcher = new ObjectDispatch();
function requestTx(txid, sender) {
    sender.sendMessage(constants_1.MESSAGES.GETOBJECT(txid));
    return new Promise((resolve, reject) => {
        dispatchQueue.push(txid);
        const listener = (tx) => {
            dispatcher.removeListener(txid, listener);
            resolve(tx);
        };
        dispatcher.on(txid, listener);
        setTimeout(() => {
            dispatcher.removeListener(txid, listener);
            reject(new Error(`Timeout waiting for tx ${txid}`));
        }, REQ_TIMEOUT);
    });
}
exports.requestTx = requestTx;
function requestBlock(blockid, sender) {
    // if (blockid === "0000000170ca89f3c6d0a4a6bf336f7bc3de0d3d68732c3ee671e4a200ecb6f1") {
    //     logger.info("=== ENTERED HARDCODE AREA ===");
    //     logger.info(`Found: ${getClients().find((head) => head.remoteAddress === "149.28.220.241")}`);
    //     const hc = getClients().find((head) => {
    //         logger.info(head.remoteAddress);
    //         return head.remoteAddress === "149.28.220.241";
    //     });
    //     if (hc) {
    //         hc.sendMessage(MESSAGES.GETOBJECT(blockid));
    //         logger.info(`Sent: ${JSON.stringify(MESSAGES.GETOBJECT(blockid))} to ${hc.remoteAddress}`);
    //     }
    //     logger.info("=== EXITED HARDCODE AREA ===");
    // } else {
    sender.sendMessage(constants_1.MESSAGES.GETOBJECT(blockid));
    // }
    return new Promise((resolve, reject) => {
        dispatchQueue.push(blockid);
        const listener = (block) => {
            dispatcher.removeListener(blockid, listener);
            resolve(block);
        };
        dispatcher.on(blockid, listener);
        setTimeout(() => {
            dispatcher.removeListener(blockid, listener);
            reject(new Error(`Timeout waiting for block ${blockid}`));
        }, REQ_TIMEOUT);
    });
}
exports.requestBlock = requestBlock;
function reportTx(txid, tx) {
    if (dispatchQueue.includes(txid)) {
        dispatchQueue.splice(dispatchQueue.indexOf(txid), 1);
        dispatcher.emit(txid, tx);
        return true;
    }
    return false;
}
exports.reportTx = reportTx;
function reportBlock(blockid, block) {
    if (dispatchQueue.includes(blockid)) {
        dispatchQueue.splice(dispatchQueue.indexOf(blockid), 1);
        dispatcher.emit(blockid, block);
        return true;
    }
    return false;
}
exports.reportBlock = reportBlock;
