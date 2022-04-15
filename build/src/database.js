"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const utils_1 = require("./utils");
function initDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        const dburi = "mongodb://localhost:12345/blockhead";
        const db = mongoose_1.default.connection;
        // Add listeners
        db.on('open', () => { utils_1.logger.info("Connected to MongoDB with URL: " + dburi); });
        db.on('error', (err) => { utils_1.logger.error("Error connecting to MongoDB: " + err); });
        yield mongoose_1.default.connect(dburi);
    });
}
exports.initDatabase = initDatabase;
