import { createClient } from "./client";
import { server } from "./server";
import canonicalize from 'canonicalize';

const json = {
    "name": "John Doe",
    "age": 30,
    "address": {
        "street": "Main Street",
        "city": "New York",
        "state": "NY",
        "zip": "10001"
    }
}

console.log(canonicalize(json));
