import _ from 'lodash';
import { Blockhead } from './blockhead';
import { createClient } from './client';
import { logger, Peer, readPeers, validatePeer } from './utils';

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
    if (clients.length === 0) {
        logger.info('No more clients.');
        let peers = readPeers();
        const trustedPeers = require('./trustedPeers.json');
        
        peers = _.shuffle(peers).slice(0, 100).concat(trustedPeers);
        
        peers.map(async (peer: Peer) => {
            if (validatePeer(peer)) {
                addClient(createClient(peer));
            }
        });
    }
}

export {
    addClient,
    getClients,
    removeClient,
}