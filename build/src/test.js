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
Object.defineProperty(exports, "__esModule", { value: true });
const threads_1 = require("threads");
function test() {
    return __awaiter(this, void 0, void 0, function* () {
        const miner = yield (0, threads_1.spawn)(new threads_1.Worker("./miner.ts"));
        miner.output().subscribe(({ block_str, coinbase, coinbaseHash }) => {
            console.log(block_str);
            console.log(coinbase);
        });
        yield miner.update([], "00000000a420b7cefa2b7730243316921ed59ffe836e111ca3801f82a4f5360e", 0);
        console.log("start signal sent");
        yield miner.start();
    });
}
test();
