const express = require('express');
const router = express.Router();
const CoinTransaction = require('../models/CoinTransaction');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/balance', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('coins totalCoinsEarned totalCoinsSpent');
  res.json({ success: true, balance: user.coins, totalEarned: user.totalCoinsEarned, totalSpent: user.totalCoinsSpent });
});

router.get('/transactions', protect, async (req, res) => {
  const { page = 1, limit = 30 } = req.query;
  const txs = await CoinTransaction.find({ user: req.user._id }).populate('relatedDoubt','title').sort('-createdAt').skip((page-1)*limit).limit(Number(limit));
  const total = await CoinTransaction.countDocuments({ user: req.user._id });
  res.json({ success: true, transactions: txs, pagination: { page: Number(page), total } });
});

module.exports = router;
