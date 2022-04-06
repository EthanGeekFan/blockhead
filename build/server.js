"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
// Include Nodejs' net module.
const Net = require("net");
const blockhead_1 = require("./blockhead");
// The port on which the server is listening.
const port = 18018;
// Message delimiter.
const delimiter = '\n';
// Use net.createServer() in your code. This is just for illustration purpose.
// Create a new TCP server.
const server = new Net.Server();
exports.server = server;
// The server listens to a socket for a client to make a connection request.
// Think of a socket as an end point.
server.listen(port, function () {
    console.log(`Server listening for connection requests on socket localhost:${port}.`);
});
// When a client requests a connection with the server, the server creates a new
// socket dedicated to that client.
server.on('connection', function (socket) {
    const head = new blockhead_1.Blockhead(socket);
});
