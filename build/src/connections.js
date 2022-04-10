"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeClient = exports.getClients = exports.addClient = void 0;
let clients = [];
function addClient(client) {
    clients.push(client);
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
