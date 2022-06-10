"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = void 0;
// Include Nodejs' net module.
const Net = require("net");
const blockhead_1 = require("./blockhead");
const utils_1 = require("./utils");
function createClient(options, next = () => { }) {
    const client = new Net.Socket();
    const head = new blockhead_1.Blockhead(client, options);
    client.connect(options, function () {
        utils_1.logger.info(`TCP connection established with the server with options: ${JSON.stringify(options)}.`);
        next(head);
    });
    return head;
}
exports.createClient = createClient;
