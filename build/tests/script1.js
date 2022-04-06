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
const Net = require("net");
const constants_1 = require("../src/constants");
const test_config = {
    host: "45.77.6.79",
    port: 18018
};
const client = new Net.Socket();
client.connect(test_config, function () {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Tester connected to server: ${JSON.stringify(test_config)}`);
        const mes_1 = JSON.stringify(constants_1.MESSAGES.HELLO) + "\n";
        client.write(mes_1);
        console.log("Sent: " + mes_1);
        const mes_2 = JSON.stringify(constants_1.MESSAGES.GETPEERS) + "\n";
        client.write(mes_2);
        console.log("Sent: " + mes_2);
        const mes_3 = "{\"type\":\"ge";
        client.write(mes_3);
        console.log("Sent: " + mes_3);
        yield setTimeout(() => { }, 100);
        const mes_4 = "tpeers\"}\n";
        client.write(mes_4);
        console.log("Sent: " + mes_4);
    });
});
client.on("data", (chunk) => {
    console.log("Server sent chunck: " + chunk.toString());
});
