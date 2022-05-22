"use strict";
const canonicalize = require('canonicalize');
const { hash } = require('../src/utils');
const { MESSAGES } = require('../src/constants');
function serialize_block(block) {
    console.log(`block: ${canonicalize(block)}`);
    console.log(`block hash: ${hash(canonicalize(block))}`);
    console.log(`message: ${canonicalize(MESSAGES.OBJECT(block))}`);
}
function link() {
    console.log(' | ');
    console.log('\\|/');
    console.log(' v ');
}
function divider() {
    console.log('------------------------------------------------------');
}
const TARGET = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
// block description
const tb_0 = {};
// B: non-increasing timestamp
const tb_b_1 = { "T": TARGET, "created": 1624219079, "miner": "lora", "nonce": "0000000000000000000000000000000000000000000000000000000000000000", "note": "", "previd": "00000000a420b7cefa2b7730243316921ed59ffe836e111ca3801f82a4f5360e", "txids": [], "type": "block" };
const tb_b_2 = { "T": TARGET, "created": 1624219080, "miner": "lora", "nonce": "0000000000000000000000000000000000000000000000000000000000000000", "note": "", "previd": hash(canonicalize(tb_b_1)), "txids": [], "type": "block" };
// C: a block in the year 2077
const tb_c_1 = { "T": TARGET, "created": 1624219080, "miner": "lora", "nonce": "0000000000000000000000000000000000000000000000000000000000000001", "note": "", "previd": "00000000a420b7cefa2b7730243316921ed59ffe836e111ca3801f82a4f5360e", "txids": [], "type": "block" };
const tb_c_2 = { "T": TARGET, "created": 3387930905, "miner": "lora", "nonce": "0000000000000000000000000000000000000000000000000000000000000000", "note": "", "previd": hash(canonicalize(tb_c_1)), "txids": [], "type": "block" };
//d
const tb_d_1 = { "type": "block", "txids": [], "nonce": "a26d92800cf58e88a5ecf37156c031a4147c2128beeaf1cca2785c93242a4c8b", "previd": "00000000a420b7cefa2b7730243316921ed59ffe836e111ca3801f82a4f5360e", "created": 1652241518, "T": "0000000000000000000000000000000000000000000000000000000000000000", "note": "test case d" };
const tb_d_2 = { "type": "block", "txids": [], "nonce": "a26d92800cf58e88a5ecf37156c031a4147c2128beeaf1cca2785c93242a4c8b", "previd": hash(canonicalize(tb_d_1)), "created": 1652241519, "T": TARGET, "note": "test case d" };
//e
const diff_genesis = { "type": "block", "txids": [], "nonce": "a26d92800cf58e88a5ecf37156c031a4147c2128beeaf1cca2785c93242a4c8b", "previd": null, "created": 1652241518, "T": TARGET, "note": "test case e" };
const diff_genesis_id = hash(canonicalize(diff_genesis));
const tb_e = { "type": "block", "txids": [], "nonce": "a26d92800cf58e88a5ecf37156c031a4147c2128beeaf1cca2785c93242a4c8b", "previd": diff_genesis_id, "created": 1652241519, "T": TARGET, "note": "test case e" };
//f
const tx_f = { "type": "transaction", "height": 128, "outputs": [{ "pubkey": "077a2683d776a71139fd4db4d00c16703ba0753fc8bdc4bd6fc56614e659cde3", "value": 50000000000 }] };
const txid_f = hash(canonicalize(tx_f));
const tb_f_1 = {
    "type": "block", "txids": [txid_f], "nonce": "a26d92800cf58e88a5ecf37156c031a4147c2128beeaf1cca2785c93242a4c8b", "previd": "00000000a420b7cefa2b7730243316921ed59ffe836e111ca3801f82a4f5360e", "created": 1652241518, "T": TARGET, "note": "test case f"
};
const tb_f_2 = {
    "type": "block", "txids": [], "nonce": "a26d92800cf58e88a5ecf37156c031a4147c2128beeaf1cca2785c93242a4c8b", "previd": hash(canonicalize(tb_f_1)), "created": 1652241519, "T": TARGET, "note": "test case f"
};
// test case summary
const testCases = {
    tb_0,
};
// for (const tb of testCases) {
//     const tb_str = canonicalize(testCases[tb]);
//     const tb_id = hash(canonicalize(testCases[tb]));
//     console.log(tb);
//     console.log(`tb_id: ${tb_id}`);
//     console.log(`tb: ${tb_str}`);
//     console.log(`message: ${MESSAGES.OBJECT(tb_str)}`);
//     console.log(`\n`);
// }
console.log("tx_f");
console.log(`message: ${canonicalize(MESSAGES.OBJECT(tx_f))}`);
console.log("tb_f_1");
serialize_block(tb_f_1);
link();
console.log("tb_f_2");
serialize_block(tb_f_2);
divider();
const cb1 = { "height": 1, "outputs": [{ "pubkey": "e3b1f3cd0b79e9ec9c4adcb38ac147c14bfb4184941af70ab6debefcb752445f", "value": 50000000000000 }], "type": "transaction" };
console.log(hash(canonicalize(cb1)));
