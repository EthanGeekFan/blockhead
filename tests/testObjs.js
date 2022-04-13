const can = require("canonicalize");

const tx_coinbase = {
    "object": {
        "height": 0,
        "outputs": [
            {
                "pubkey": "8dbcd2401c89c04d6e53c81c90aa0b551cc8fc47c0469217c8f5cfbae1e911f9",
                "value": 50000000000
            }
        ],
        "type": "transaction"
    },
    "type": "object"
}
console.log(can(tx_coinbase));

const tx_normal = {
    "object": {
        "inputs": [
            {
                "outpoint": {
                    "index": 0,
                    "txid": "1bb37b637d07100cd26fc063dfd4c39a7931cc88dae3417871219715a5e374af"
                },
                "sig": "1d0d7d774042607c69a87ac5f1cdf92bf474c25fafcc089fe667602bfefb0494726c519e92266957429ced875256e6915eb8cea2ea66366e739415efc47a6805"
            }
        ],
        "outputs": [
            {
                "pubkey": "8dbcd2401c89c04d6e53c81c90aa0b551cc8fc47c0469217c8f5cfbae1e911f9",
                "value": 10
            }
        ],
        "type": "transaction"
    },
    "type": "object"
}

console.log(can(tx_normal));

const tx_invalid_txid_length = {
    "object": {
        "inputs": [
            {
                "outpoint": {
                    "index": 0,
                    "txid": "yyds"
                },
                "sig": "1d0d7d774042607c69a87ac5f1cdf92bf474c25fafcc089fe667602bfefb0494726c519e92266957429ced875256e6915eb8cea2ea66366e739415efc47a6805"
            }
        ],
        "outputs": [
            {
                "pubkey": "8dbcd2401c89c04d6e53c81c90aa0b551cc8fc47c0469217c8f5cfbae1e911f9",
                "value": 10
            }
        ],
        "type": "transaction"
    },
    "type": "object"
}
console.log(can(tx_invalid_txid_length));

const tx_invalid_outpoint_index = {
    "object": {
        "inputs": [
            {
                "outpoint": {
                    "index": -10,
                    "txid": "1bb37b637d07100cd26fc063dfd4c39a7931cc88dae3417871219715a5e374af"
                },
                "sig": "1d0d7d774042607c69a87ac5f1cdf92bf474c25fafcc089fe667602bfefb0494726c519e92266957429ced875256e6915eb8cea2ea66366e739415efc47a6805"
            }
        ],
        "outputs": [
            {
                "pubkey": "8dbcd2401c89c04d6e53c81c90aa0b551cc8fc47c0469217c8f5cfbae1e911f9",
                "value": 10
            }
        ],
        "type": "transaction"
    },
    "type": "object"
}
console.log(can(tx_invalid_outpoint_index));

const tx_invalid_signature = {
    "object": {
        "inputs": [
            {
                "outpoint": {
                    "index": 0,
                    "txid": "1bb37b637d07100cd26fc063dfd4c39a7931cc88dae3417871219715a5e374af"
                },
                "sig": "yyds7d774042607c69a87ac5f1cdf92bf474c25fafcc089fe667602bfefb0494726c519e92266957429ced875256e6915eb8cea2ea66366e739415efc47a6805"
            }
        ],
        "outputs": [
            {
                "pubkey": "8dbcd2401c89c04d6e53c81c90aa0b551cc8fc47c0469217c8f5cfbae1e911f9",
                "value": 10
            }
        ],
        "type": "transaction"
    },
    "type": "object"
}

console.log(can(tx_invalid_signature));
