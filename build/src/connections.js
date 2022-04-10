"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClients = exports.addClient = void 0;
let clients = [];
function addClient(client) {
    clients.push(client);
}
exports.addClient = addClient;
function getClients() {
    return clients;
}
exports.getClients = getClients;
