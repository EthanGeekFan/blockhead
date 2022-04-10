import { createClient } from "./client";
import canonicalize from 'canonicalize';
import { server } from "./server";
import { readPeers, Peer, validatePeer } from "./utils";
import _ = require('lodash');
import { initDatabase } from "./database";
import { addClient } from "./connections";

async function start() {
    await initDatabase();
    let peers = readPeers();
    const trustedPeers = require('./trustedPeers.json');
    
    peers = _.shuffle(peers).slice(0, 10).concat(trustedPeers);
    
    peers.map(async (peer: Peer) => {
        if (validatePeer(peer)) {
            const client = createClient(peer);
            addClient(client);
        }
    });
    
    if (server) {
        console.log("yyds");
    }
    
    console.log(canonicalize(peers));
}

start();
