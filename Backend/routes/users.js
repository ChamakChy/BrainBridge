const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/leaderboard', protect, async (req, res) => {
  try {
    const { department, institution, by = 'coins', limit = 20 } = req.query;
    const filter = { institution: institution || req.user.institution, isActive: true, isBanned: false };
    if (department && department !== 'All') filter.department = department;
    const sort = by === 'rating' ? '-averageRating' : by === 'sessions' ? '-sessionsCompleted' : '-totalCoinsEarned';
    const users = await User.find(filter).select('name department averageRating totalCoinsEarned sessionsCompleted doubtsHelped').sort(sort).limit(Number(limit));
    res.json({ success: true, leaderboard: users });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
