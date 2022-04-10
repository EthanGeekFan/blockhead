"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeClient = exports.getClients = exports.addClient = void 0;
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
}
exports.removeClient = removeClient;
