import { createClient } from "./client";
import canonicalize from 'canonicalize';
import { server } from "./server";
import { readPeers, Peer, validatePeer } from "./utils";
import _ = require('lodash');

let peers = readPeers();
const trustedPeers = require('./trustedPeers.json');

peers = _.shuffle(peers).slice(0, 10).concat(trustedPeers);

peers.map(async (peer: Peer) => {
    if (validatePeer(peer)) {
        const client = createClient(peer);
    }
});

if (server) {
    console.log("yyds");
}

console.log(canonicalize(peers));
