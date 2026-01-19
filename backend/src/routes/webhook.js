import express from 'express';
const router = express.Router();

// Webhook endpoint - will be implemented in next step
router.post('/', (req, res) => {
  console.log('Webhook received:', req.body);
  res.status(200).json({ status: 'received' });
});

export default router;
