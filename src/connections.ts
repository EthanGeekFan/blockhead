import { Blockhead } from './blockhead';

let clients: Array<Blockhead> = [];

function addClient(client: Blockhead) {
    clients.push(client);
}

function getClients() {
    return clients;
}

function removeClient(client: Blockhead) {
    const index = clients.indexOf(client);
    if (index > -1) {
        clients.splice(index, 1);
    }
}

export {
    addClient,
    getClients,
    removeClient,
}