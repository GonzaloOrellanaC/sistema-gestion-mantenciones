"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateThumbnail = generateThumbnail;
const sharp_1 = __importDefault(require("sharp"));
async function generateThumbnail(inputPath, outputPath, width = 300) {
    // use sharp to resize and optimize
    await (0, sharp_1.default)(inputPath).resize({ width }).jpeg({ quality: 75 }).toFile(outputPath);
}
exports.default = { generateThumbnail };
