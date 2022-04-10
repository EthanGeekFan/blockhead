import { Blockhead } from './blockhead';
import { logger } from './utils';

let clients: Array<Blockhead> = [];

function addClient(client: Blockhead) {
    clients.push(client);
    logger.info(`Added new client: ${client.socket.remoteAddress}.`);
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