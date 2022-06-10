import { Observable, Subject } from 'threads/observable';
import { expose } from 'threads/worker';
import { utils, getPublicKey } from "@noble/ed25519";
import { logger, hash } from './utils';
import canonicalize from "canonicalize";

var subject = new Subject();

var success = false;
var first = true;

const target = "0f000002af000000000000000000000000000000000000000000000000000000";
const nonceChunkSize = 0x10000000000000000000000000000000000000000000000;
const localMaxIterations = 100000;

let currentState = {
    publicKey: "",
    privateKey: "",
    height: 1, // default to 1
    prev_id: "", // default to genesis block
    block: {},
    coinbase: {},
    coinbaseHash: "",
    nonce: 0,
    updating: null,
};

var mempool: string[] = [];

let start = false;

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

function nonce2str(nonce: number): string {
    let str = nonce.toString(16);
    str = Array(64 - str.length).fill('0').join('') + str;
    return str;
}

async function mine() {
    while (true) {
        while (!start) {
            await sleep(500);
        }
        if (first) {
            first = false;
            await nextBlock();
        }
        // generate a new block
        if (success) {
            await nextBlock();
            success = false;
        }
        // mine the block
        let nonce = currentState.nonce;
        currentState.nonce += localMaxIterations;
        const targetBlockPieces = canonicalize(currentState.block)!.split("null");
        for (; nonce < localMaxIterations; nonce++) {
            // put nonce into block
            const block_str = targetBlockPieces[0] + nonce2str(nonce) + targetBlockPieces[1];
            const block_hash = hash(block_str);
            if (block_hash < target) {
                subject.next({block_str, coinbase: canonicalize(currentState.coinbase)!, coinbaseHash: currentState.coinbaseHash});
                start = false;
                success = true;
                break;
            }
        }
    }
}

async function nextBlock() {
    if (currentState.updating !== null) {
        await currentState.updating;
    }
    // Generate a new keypair
    let privateKey = utils.randomPrivateKey();
    let publicKey = await getPublicKey(privateKey);
    
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
    }
    const coinbaseHash = hash(canonicalize(coinbase)!.toString());
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
    }
    currentState.block = newBlock;
}

mine();

const miner = {
    start: () => {
        start = true;
    },
    stop: () => {
        start = false;
    },
    update: async (pool: string[], tip_id: string | undefined, tip_height: number | undefined) => {
        start = false;
        mempool = pool;
        if (currentState.updating !== null) {
            await currentState.updating;
        }
        if (tip_id !== undefined) {
            currentState.prev_id = tip_id!;
        }
        if (tip_height !== undefined) {
            currentState.height = tip_height! + 1;
        }
        success = true;
        start = true;
    },
    output() {
        return Observable.from(subject);
    }
}

expose(miner);