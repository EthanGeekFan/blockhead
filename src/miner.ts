import { Observable, Subject } from 'threads/observable';
import { expose } from 'threads/worker';
import { Block, ChainTip } from './models';
import { utils, getPublicKey } from "@noble/ed25519";
import { logger } from './utils';
import canonicalize from "canonicalize";

var subject = new Subject();

const target = "00000002af000000000000000000000000000000000000000000000000000000";
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
        // generate a new block
        const tip = await ChainTip.findOne({}).exec()
        if (!tip) {
            throw new Error('Chain tip not found');
        }
        currentState.prev_id = tip.blockid;
        const tipBlock = await Block.findOne({ objectId: currentState.prev_id }).exec();
        if (!tipBlock) {
            throw new Error('Chain tip block not found');
        }
        currentState.height = tipBlock.height + 1;
        await nextBlock();
        // mine the block
        let nonce = currentState.nonce;
        currentState.nonce += localMaxIterations;
        const targetBlockPieces = canonicalize(currentState.block)!.split("null");
        for (; nonce < localMaxIterations; nonce++) {
            // put nonce into block
            const block_str = targetBlockPieces[0] + nonce2str(nonce) + targetBlockPieces[1];
            const block_hash = hash(block_str);
            if (block_hash < target) {
                logger.info(`Found block with nonce ${nonce}`);
                subject.next(block_str);
                start = false;
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
    const coinbaseHash = hash(canonicalize(coinbase));
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
    logger.info("Generated new block: " + JSON.stringify(currentState));
}


const miner = {
    start: () => {
        start = true;
    },
    stop: () => {
        start = false;
    },
    update: async (pool: string[], tip_id: string, tip_height: number) => {
        mempool = pool;
        if (currentState.updating !== null) {
            await currentState.updating;
        }
        currentState.prev_id = tip_id;
        currentState.height = tip_height + 1;
        start = true;
    }
}