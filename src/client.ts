// Include Nodejs' net module.
import Net = require('net');
import { MESSAGES } from './constants';
import { sendMessage } from './utils';

function createClient(options: Net.SocketConnectOpts): Net.Socket {
    const client = new Net.Socket();
    client.connect(options, function () {
        console.log(`TCP connection established with the server with options: ${options}.`);
        sendMessage(client, MESSAGES.HELLO);
    });

    // The client can also receive data from the server by reading from its socket.
    client.on('data', function(chunk) {
        console.log(`Data received from the server: ${chunk.toString()}.`);
        // Request an end to the connection after the data has been received.
        client.end();
    });

    client.on('end', function() {
        console.log('Requested an end to the TCP connection');
    });
    return client;
}

export {
    createClient
};
