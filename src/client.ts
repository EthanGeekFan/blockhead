// Include Nodejs' net module.
import Net = require('net');
import { Blockhead } from './blockhead';
import { logger } from './utils';

function createClient(options: Net.SocketConnectOpts): Blockhead {
    const client = new Net.Socket();
    client.connect(options, function () {
        logger.info(`TCP connection established with the server with options: ${JSON.stringify(options)}.`);
    });

    const head = new Blockhead(client);

    return head;
}

export {
    createClient
};
