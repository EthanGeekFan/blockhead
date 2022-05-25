import canonicalize from 'canonicalize';
import { createHash } from 'crypto';
import * as fs from 'fs';

function hash(str: string): string {
  return createHash('sha256')
    .update(str)
    .digest('hex');
}

function hashObject(obj: any): string {
    if (typeof obj === 'string') {
        obj = JSON.parse(obj);
    }
    return hash(canonicalize(obj)!);
}

function hashFile(file: string): string[] {
  return fs.readFileSync(file, 'utf8').split('\n').map(hashObject);
}

function main() {
    const args = process.argv.slice(2);
    if (args.length === 1) {
        console.log(hashObject(args[0]));
    } else if (args.length === 2 && args[0] === '-f') {
        hashFile(args[1]).forEach((line, index) => console.log(`${index + 1}: ${line}`));
    } else {
        console.log('Usage: ');
        console.log('  node hasher.js -f <file>');
        console.log('  node hasher.js <content>');
        process.exit(1);
    }
    process.exit(0);
}

main();