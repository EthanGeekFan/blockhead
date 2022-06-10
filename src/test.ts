import { spawn, Thread, Worker } from "threads";

async function test() {
    const miner = await spawn(new Worker("./miner.ts"));

    miner.output().subscribe(({ block_str, coinbase, coinbaseHash }) => {
        console.log(block_str);
        console.log(coinbase);
    });

    await miner.update([], "00000000a420b7cefa2b7730243316921ed59ffe836e111ca3801f82a4f5360e", 0);
    console.log("start signal sent");
    await miner.start();
}

test();