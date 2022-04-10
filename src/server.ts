// Include Nodejs' net module.
import Net = require('net');
import { MESSAGES } from './constants';
import { Blockhead } from './blockhead';

// The port on which the server is listening.
const port = 18018;

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
server.on('connection', function (socket) {
    console.log(`A client has connected with socket: ${socket.remoteAddress}:${socket.remotePort}.`);
    const head = new Blockhead(socket);
    head.sendMessage(MESSAGES.HELLO);
    head.sendMessage(MESSAGES.GETPEERS);
});

export { server };
