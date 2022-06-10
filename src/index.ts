import { createClient } from "./client";
import Net = require('net');
import canonicalize from 'canonicalize';
import { server } from "./server";
import { MESSAGES } from "./constants";
import { readPeers, Peer, validatePeer, logger } from "./utils";
import _ from 'lodash';
import { initDatabase } from "./database";
import { Block, ChainTip, Transaction, UTXOSet } from "./models";
import { initMempool } from "./mempool";
import { Blockhead } from "./blockhead";
import { spawn, Thread, Worker } from "threads";
import { getClients } from "./connections";

var heads: Blockhead[] = [];
var miner: any;

process.setMaxListeners(10000);

const genesis = {
    "T": "00000002af000000000000000000000000000000000000000000000000000000",
    "created": 1624219079,
    "miner": "dionyziz",
    "nonce": "0000000000000000000000000000000000000000000000000000002634878840",
    "note": "The Economist 2021-06-20: Crypto-miners are probably to blame for the graphics-chip shortage",
    "previd": null,
    "txids": [],
    "type": "block",
    "objectId": "00000000a420b7cefa2b7730243316921ed59ffe836e111ca3801f82a4f5360e",
    "height": 0,
};

async function initGenesis() {
    // check genesis block presence
    const genesisBlock = await Block.findOne({ objectId: genesis.objectId }).exec();
    if (!genesisBlock) {
        // create genesis block
        const block = new Block(genesis);
        await block.save();
    }
    // check genesis utxo presence
    const genesisUtxos = await UTXOSet.findOne({ blockid: genesis.objectId }).exec();
    if (!genesisUtxos) {
        // create genesis utxos
        const utxos: any[] = [];
        const utxoSet = new UTXOSet({ blockid: genesis.objectId, utxos });
        await utxoSet.save();
    }
    // check chain tip global state
    const chainTip = await ChainTip.findOne({}).exec();
    if (!chainTip) {
        // create chain tip global state
        const chainTip = new ChainTip({ height: 0, blockid: genesis.objectId });
        await chainTip.save();
    }
}

interface MinerResult {
    block_str: string;
    coinbase: any;
    coinbaseHash: string;
}

async function initMiner() {
    miner = await spawn(new Worker("./miner"));
    miner.output().subscribe(async ({ block_str, coinbase, coinbaseHash }: MinerResult) => {
        console.log(block_str);
        console.log(coinbase);
        const newCoinbase = new Transaction({
            objectId: coinbaseHash,
            ...coinbase,
        });
        await newCoinbase.save();
        getClients().forEach(client => {
            client.sendMessage(MESSAGES.OBJECT(JSON.parse(block_str)));
            client.sendMessage(MESSAGES.OBJECT(JSON.parse(coinbase)));
        });
        // send to myself
        const client = new Net.Socket();
        client.connect({ host: "localhost", port: 18018 }, () => {
            client.write(canonicalize(MESSAGES.OBJECT(JSON.parse(block_str)))! + "\n");
        });
        logger.info(`Found block: ${block_str}`);
    });
}

async function start() {
    await initDatabase();
    await initGenesis();
    initMempool();
    await initMiner();
    let peers = readPeers();
    const trustedPeers = require('./trustedPeers.json');
    
    peers = _.shuffle(peers).slice(0, 100).concat(trustedPeers);
    
    peers.map(async (peer: Peer) => {
        if (validatePeer(peer)) {
            heads.push(createClient(peer));
        }
    });
}

start();

export {
    heads,
    miner,
}
