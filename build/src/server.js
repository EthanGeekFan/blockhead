"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
// Include Nodejs' net module.
const Net = require("net");
const constants_1 = require("./constants");
const blockhead_1 = require("./blockhead");
const connections_1 = require("./connections");
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
console.log("init server");
// When a client requests a connection with the server, the server creates a new
// socket dedicated to that client.
server.on('connection', function (socket) {
    console.log(`A client has connected with socket: ${socket.remoteAddress}:${socket.remotePort}.`);
    const head = new blockhead_1.Blockhead(socket);
    (0, connections_1.addClient)(head);
    head.sendMessage(constants_1.MESSAGES.HELLO);
    head.sendMessage(constants_1.MESSAGES.GETPEERS);
});
