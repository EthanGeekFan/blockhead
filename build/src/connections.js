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
exports.removeClient = exports.getClients = exports.addClient = void 0;
const lodash_1 = __importDefault(require("lodash"));
const client_1 = require("./client");
const utils_1 = require("./utils");
let clients = [];
function addClient(client) {
    clients.push(client);
    utils_1.logger.info(`Added new client: ${client.socket.remoteAddress}.`);
}
exports.addClient = addClient;
function getClients() {
    return clients;
}
exports.getClients = getClients;
function removeClient(client) {
    const index = clients.indexOf(client);
    if (index > -1) {
        clients.splice(index, 1);
    }
    if (clients.length === 0) {
        utils_1.logger.info('No more clients.');
        let peers = (0, utils_1.readPeers)();
        const trustedPeers = require('./trustedPeers.json');
        peers = lodash_1.default.shuffle(peers).slice(0, 100).concat(trustedPeers);
        peers.map((peer) => __awaiter(this, void 0, void 0, function* () {
            if ((0, utils_1.validatePeer)(peer)) {
                addClient((0, client_1.createClient)(peer));
            }
        }));
    }
}
exports.removeClient = removeClient;
