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
const observable_1 = require("threads/observable");
const worker_1 = require("threads/worker");
const ed25519_1 = require("@noble/ed25519");
const utils_1 = require("./utils");
const canonicalize_1 = __importDefault(require("canonicalize"));
var subject = new observable_1.Subject();
var success = false;
var first = true;
const target = "0f000002af000000000000000000000000000000000000000000000000000000";
const nonceChunkSize = 0x10000000000000000000000000000000000000000000000;
const localMaxIterations = 100000;
let currentState = {
    publicKey: "",
    privateKey: "",
    height: 1,
    prev_id: "",
    block: {},
    coinbase: {},
    coinbaseHash: "",
    nonce: 0,
    updating: null,
};
var mempool = [];
let start = false;
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    });
}
function nonce2str(nonce) {
    let str = nonce.toString(16);
    str = Array(64 - str.length).fill('0').join('') + str;
    return str;
}
function mine() {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            while (!start) {
                yield sleep(500);
            }
            if (first) {
                first = false;
                yield nextBlock();
            }
            // generate a new block
            if (success) {
                yield nextBlock();
                success = false;
            }
            // mine the block
            let nonce = currentState.nonce;
            currentState.nonce += localMaxIterations;
            const targetBlockPieces = (0, canonicalize_1.default)(currentState.block).split("null");
            for (; nonce < localMaxIterations; nonce++) {
                // put nonce into block
                const block_str = targetBlockPieces[0] + nonce2str(nonce) + targetBlockPieces[1];
                const block_hash = (0, utils_1.hash)(block_str);
                if (block_hash < target) {
                    subject.next({ block_str, coinbase: (0, canonicalize_1.default)(currentState.coinbase), coinbaseHash: currentState.coinbaseHash });
                    start = false;
                    success = true;
                    break;
                }
            }
        }
    });
}
function nextBlock() {
    return __awaiter(this, void 0, void 0, function* () {
        if (currentState.updating !== null) {
            yield currentState.updating;
        }
        // Generate a new keypair
        let privateKey = ed25519_1.utils.randomPrivateKey();
        let publicKey = yield (0, ed25519_1.getPublicKey)(privateKey);
        currentState.publicKey = Buffer.from(publicKey).toString('hex');
        currentState.privateKey = Buffer.from(privateKey).toString('hex');
        // Generate a new coinbase transaction
        const coinbase = {
            height: currentState.height,
            outputs: [
                {
                    pubkey: currentState.publicKey,
                    value: 5e13,
                }
            ],
            type: "transaction",
        };
        const coinbaseHash = (0, utils_1.hash)((0, canonicalize_1.default)(coinbase).toString());
        currentState.coinbase = coinbase;
        currentState.coinbaseHash = coinbaseHash;
        // Generate a new block
        const newBlock = {
            type: "block",
            txids: [coinbaseHash, ...mempool],
            previd: currentState.prev_id,
            created: (Date.now() / 1000) | 0,
            T: target,
            miner: "HardCoin",
            note: "yyang29/loraxie/alanzal",
            nonce: "null",
        };
        currentState.block = newBlock;
    });
}
mine();
const miner = {
    start: () => {
        start = true;
    },
    stop: () => {
        start = false;
    },
    update: (pool, tip_id, tip_height) => __awaiter(void 0, void 0, void 0, function* () {
        start = false;
        mempool = pool;
        if (currentState.updating !== null) {
            yield currentState.updating;
        }
        if (tip_id !== undefined) {
            currentState.prev_id = tip_id;
        }
        if (tip_height !== undefined) {
            currentState.height = tip_height + 1;
        }
        success = true;
        start = true;
    }),
    output() {
        return observable_1.Observable.from(subject);
    }
};
(0, worker_1.expose)(miner);
