import Net = require('net');
import { MESSAGES } from '../src/constants';

const test_config = {
    host: "45.77.6.79",
    port: 18018
}

const client = new Net.Socket();

client.connect(test_config, async function () {
    console.log(`Tester connected to server: ${JSON.stringify(test_config)}`);

    const mes_1 = JSON.stringify(MESSAGES.HELLO) + "\n"
    client.write(mes_1);
    console.log("Sent: " + mes_1);

    const mes_2 = JSON.stringify(MESSAGES.GETPEERS) + "\n"
    client.write(mes_2);
    console.log("Sent: " + mes_2);

    const mes_3 = "{\"type\":\"ge";
    client.write(mes_3);
    console.log("Sent: " + mes_3);

    await setTimeout(() => { }, 100);

    const mes_4 = "tpeers\"}\n";
    client.write(mes_4);
    console.log("Sent: " + mes_4);
});

client.on("data", (chunk) => {
    console.log("Server sent chunck: " + chunk.toString());
});


