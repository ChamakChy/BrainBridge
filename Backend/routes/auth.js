const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');
const { protect } = require('../middleware/auth');

router.post('/register', [
  body('name').trim().isLength({ min:2, max:60 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min:6 }),
  body('institution').trim().notEmpty(),
  body('department').isIn(['CSE','EEE','ME','CE','BBA','MATH','PHYSICS','CHEM','ENG','OTHER']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { name, email, password, institution, department, studentId, bio } = req.body;
    if (await User.findOne({ email })) return res.status(409).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, institution, department, studentId: studentId||'', bio: bio||'', coins: 50 });
    await CoinTransaction.create({ user: user._id, type: 'signup_bonus', amount: 50, balanceBefore: 0, balanceAfter: 50, description: 'Welcome bonus!' });
    const token = user.generateJWT();
    res.status(201).json({ success: true, message: 'Account created! You received 50 starter coins 🎉', token, user: user.toPublicJSON() });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (user.isBanned) return res.status(403).json({ success: false, message: `Account banned: ${user.bannedReason}` });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });
    res.json({ success: true, token: user.generateJWT(), user: user.toPublicJSON() });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user: user.toPublicJSON() });
});

router.put('/profile', protect, [
  body('institution').optional().trim().notEmpty().withMessage('Institution cannot be empty'),
  body('department').optional().isIn(['CSE','EEE','ME','CE','BBA','MATH','PHYSICS','CHEM','ENG','OTHER']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const fields = ['name','bio','avatar','studentId','institution','department'];
    const updates = {};
    fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated.', user: user.toPublicJSON() });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

// First admin setup (no auth — protected by secret key)
router.post('/create-first-admin', async (req, res) => {
  try {
    const { setupKey, email } = req.body;
    if (setupKey !== process.env.ADMIN_SETUP_KEY)
      return res.status(403).json({ success: false, message: 'Invalid setup key' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'Register first, then use this endpoint' });
    user.role = 'admin';
    await user.save();
    res.json({ success: true, message: `"${user.name}" is now Admin! Login to access /admin panel.` });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
