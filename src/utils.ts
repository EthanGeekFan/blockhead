import Net = require('net');
import canonicalize from 'canonicalize';

function sendMessage(socket: Net.Socket, message: any) {
    socket.write((canonicalize(message) || "{}") + "\n");
}

export {
    sendMessage
}