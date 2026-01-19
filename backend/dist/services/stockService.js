"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMovements = exports.transferStock = exports.adjustStock = exports.consumePart = exports.reservePart = exports.getStock = void 0;
const inventoryService_1 = __importDefault(require("./inventoryService"));
// Thin wrapper for clarity and future extension. Export same functions as default from inventoryService.
exports.getStock = inventoryService_1.default.getStock;
exports.reservePart = inventoryService_1.default.reservePart;
exports.consumePart = inventoryService_1.default.consumePart;
exports.adjustStock = inventoryService_1.default.adjustStock;
exports.transferStock = inventoryService_1.default.transferStock;
exports.listMovements = inventoryService_1.default.listMovements;
exports.default = { getStock: exports.getStock, reservePart: exports.reservePart, consumePart: exports.consumePart, adjustStock: exports.adjustStock, transferStock: exports.transferStock, listMovements: exports.listMovements };
