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
const client_1 = require("./client");
const canonicalize_1 = __importDefault(require("canonicalize"));
const server_1 = require("./server");
const utils_1 = require("./utils");
const lodash_1 = __importDefault(require("lodash"));
const database_1 = require("./database");
const models_1 = require("./models");
const mempool_1 = require("./mempool");
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
function initGenesis() {
    return __awaiter(this, void 0, void 0, function* () {
        // check genesis block presence
        const genesisBlock = yield models_1.Block.findOne({ objectId: genesis.objectId }).exec();
        if (!genesisBlock) {
            // create genesis block
            const block = new models_1.Block(genesis);
            yield block.save();
        }
        // check genesis utxo presence
        const genesisUtxos = yield models_1.UTXOSet.findOne({ blockid: genesis.objectId }).exec();
        if (!genesisUtxos) {
            // create genesis utxos
            const utxos = [];
            const utxoSet = new models_1.UTXOSet({ blockid: genesis.objectId, utxos });
            yield utxoSet.save();
        }
        // check chain tip global state
        const chainTip = yield models_1.ChainTip.findOne({}).exec();
        if (!chainTip) {
            // create chain tip global state
            const chainTip = new models_1.ChainTip({ height: 0, blockid: genesis.objectId });
            yield chainTip.save();
        }
    });
}
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.initDatabase)();
        yield initGenesis();
        (0, mempool_1.initMempool)();
        let peers = (0, utils_1.readPeers)();
        const trustedPeers = require('./trustedPeers.json');
        peers = lodash_1.default.shuffle(peers).slice(0, 10).concat(trustedPeers);
        peers.map((peer) => __awaiter(this, void 0, void 0, function* () {
            if ((0, utils_1.validatePeer)(peer)) {
                (0, client_1.createClient)(peer);
            }
        }));
        if (server_1.server) {
            console.log("yyds");
        }
        console.log((0, canonicalize_1.default)(peers));
    });
}
start();
