"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const canonicalize_1 = __importDefault(require("canonicalize"));
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
function hash(str) {
    return (0, crypto_1.createHash)('sha256')
        .update(str)
        .digest('hex');
}
function hashObject(obj) {
    if (typeof obj === 'string') {
        obj = JSON.parse(obj);
    }
    return hash((0, canonicalize_1.default)(obj));
}
function hashFile(file) {
    return fs.readFileSync(file, 'utf8').split('\n').map(hashObject);
}
function main() {
    const args = process.argv.slice(2);
    if (args.length === 1) {
        console.log(hashObject(args[0]));
    }
    else if (args.length === 2 && args[0] === '-f') {
        hashFile(args[1]).forEach((line, index) => console.log(`${index + 1}: ${line}`));
    }
    else {
        console.log('Usage: ');
        console.log('  node hasher.js -f <file>');
        console.log('  node hasher.js <content>');
        process.exit(1);
    }
    process.exit(0);
}
main();
