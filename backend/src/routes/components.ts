import { Router } from 'express';

// Deprecated route. Kept to avoid 404s if referenced; responds 410 Gone and points to /api/parts
const router = Router();

router.use((req, res) => {
    res.status(410).json({ message: 'The /api/components endpoints are deprecated. Use /api/parts instead.' });
});

export default router;
