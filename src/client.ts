// Include Nodejs' net module.
import Net = require('net');
import { Blockhead } from './blockhead';
import { logger } from './utils';

function createClient(options: Net.SocketConnectOpts, next: ((blockhead: Blockhead) => void) = () => {}): Blockhead {
    const client = new Net.Socket();

    const head = new Blockhead(client, options);
    
    client.connect(options, function () {
        logger.info(`TCP connection established with the server with options: ${JSON.stringify(options)}.`);
        next(head);
    });

    return head;
}

export {
    createClient
};
