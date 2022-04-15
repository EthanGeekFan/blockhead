import mongoose from "mongoose";
import { logger } from "./utils";


async function initDatabase() {
    const dburi = "mongodb://localhost:12345/blockhead";
    const db = mongoose.connection;
    
    // Add listeners
    db.on('open', () => { logger.info("Connected to MongoDB with URL: " + dburi); });
    db.on('error', (err) => { logger.error("Error connecting to MongoDB: " + err); });
    await mongoose.connect(dburi);
}

export { initDatabase };