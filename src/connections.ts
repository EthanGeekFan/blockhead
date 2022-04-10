import { Blockhead } from './blockhead';

let clients: Array<Blockhead> = [];

function addClient(client: Blockhead) {
    clients.push(client);
}

function getClients() {
    return clients;
}

export {
    addClient,
    getClients,
}