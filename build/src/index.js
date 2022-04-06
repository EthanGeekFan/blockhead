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
const _ = require("lodash");
let peers = (0, utils_1.readPeers)();
const trustedPeers = require('./trustedPeers.json');
peers = _.shuffle(peers).slice(0, 10).concat(trustedPeers);
peers.map((peer) => __awaiter(void 0, void 0, void 0, function* () {
    if ((0, utils_1.validatePeer)(peer)) {
        const client = (0, client_1.createClient)(peer);
    }
}));
if (server_1.server) {
    console.log("yyds");
}
console.log((0, canonicalize_1.default)(peers));
