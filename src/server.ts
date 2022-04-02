// Include Nodejs' net module.
import Net = require('net');
import canonicalize from 'canonicalize';
import { MESSAGES } from './constants';
import { sendMessage } from './utils';

// The port on which the server is listening.
const port = 18018;

// Message delimiter.
const delimiter = '\n';

// Use net.createServer() in your code. This is just for illustration purpose.
// Create a new TCP server.
const server: Net.Server = new Net.Server();
// The server listens to a socket for a client to make a connection request.
// Think of a socket as an end point.
server.listen(port, function() {
    console.log(`Server listening for connection requests on socket localhost:${port}.`);
});

// When a client requests a connection with the server, the server creates a new
// socket dedicated to that client.
server.on('connection', function(socket) {
    console.log('A new connection has been established.');

    let buffer: string = "";
    let handshake: boolean = false;

    // Now that a TCP connection has been established, the server can send data to
    // the client by writing to its socket.
    sendMessage(socket, MESSAGES.HELLO);

    // The server can also receive data from the client by reading from its socket.
    socket.on('data', function (chunk) {
        console.log(`Data received from client: ${chunk.toString()}.`);
        const deliminatedChunk: string[] = chunk.toString().split(delimiter);
        while (deliminatedChunk.length > 1) {
            buffer += deliminatedChunk.pop();
            try {
                const message = JSON.parse(buffer);
                console.log(`Message received from client: ${canonicalize(message)}.`);
                // call message handler
                if (!handshake) {
                    if (canonicalize(message) === canonicalize(MESSAGES.HELLO)) {
                        handshake = true;
                    } else {
                        sendMessage(socket, MESSAGES.ERROR);
                        socket.end();
                        return;
                    }
                }
            } catch (error) {
                sendMessage(socket, MESSAGES.ERROR);
            } finally {
                buffer = "";
            }
        }
        buffer += deliminatedChunk[0];
    });

    // When the client requests to end the TCP connection with the server, the server
    // ends the connection.
    socket.on('end', function() {
        console.log('Closing connection with the client');
    });

    // Don't forget to catch error, for your own sake.
    socket.on('error', function(err) {
        console.error(`Error: ${err}`);
    });
});

export { server };
