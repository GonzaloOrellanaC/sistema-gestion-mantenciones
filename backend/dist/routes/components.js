"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// Deprecated route. Kept to avoid 404s if referenced; responds 410 Gone and points to /api/parts
const router = (0, express_1.Router)();
router.use((req, res) => {
    res.status(410).json({ message: 'The /api/components endpoints are deprecated. Use /api/parts instead.' });
});
exports.default = router;
