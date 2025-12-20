"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function connectDB() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/sistema_gestion';
    await mongoose_1.default.connect(uri, {
    // options can be added if needed
    });
    console.log('MongoDB connected');
}
exports.default = mongoose_1.default;
