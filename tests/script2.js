const Net = require("net");
const { MESSAGES } = require('../build/src/constants');

const test_config = {
    host: "localhost",
    port: 18018
}

const client = new Net.Socket();

client.connect(test_config, async function () {
    console.log(`Tester connected to server: ${JSON.stringify(test_config)}`);



    const mes_1 = JSON.stringify(MESSAGES.HELLO) + "\n" + `{"object":{"inputs":[{"outpoint":{"index":0,"txid":"460180ad767919c3d4a81f98afba60ee0b48c39e92a637c1d370b8da9ce7e211"},"sig":"363f81df2610501ef1f27ae3a874b5db7e511cc5da232d7081eac2629c610ef1ee8538e55a1d60287ac0e9b396df055da4097d00497a4bf9829e473e23e7700d"}],"outputs":[{"pubkey":"13eec7c3d188367be8d489d0b06432c83a36bfa83d65cbb0effeac270a211795","value":10}],"type":"transaction"},"type":"object"}` + "\n";
    // const mes_1 = JSON.stringify(MESSAGES.HELLO) + "\n" + JSON.stringify(MESSAGES.GETPEERS) + "\n";
    client.write(mes_1);
    console.log("Sent: " + mes_1);

});

client.on("data", (chunk) => {
    console.log("Server sent chunck: " + chunk.toString());
});



