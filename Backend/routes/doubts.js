const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Doubt = require('../models/Doubt');
const User = require('../models/User');
const Session = require('../models/Session');
const CoinTransaction = require('../models/CoinTransaction');
const Report = require('../models/Report');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { department, status, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    const filter = { institution: req.user.institution, status: { $in: ['open','in_progress'] } };
    if (department && department !== 'All') filter.department = department;
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const doubts = await Doubt.find(filter).populate('postedBy','name department averageRating').sort(sort).skip((page-1)*limit).limit(Number(limit));
    const total = await Doubt.countDocuments(filter);
    res.json({ success: true, doubts, pagination: { page: Number(page), total, pages: Math.ceil(total/limit) } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/', protect, [
  body('title').trim().isLength({ min:10, max:150 }),
  body('description').trim().isLength({ min:20, max:2000 }),
  body('coinReward').isInt({ min:5, max:500 }),
  body('department').isIn(['CSE','EEE','ME','CE','BBA','MATH','PHYSICS','CHEM','ENG','OTHER']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { title, description, coinReward, department, tags } = req.body;
    const student = await User.findById(req.user._id);
    if (student.coins < coinReward) return res.status(400).json({ success: false, message: `Insufficient coins. You have ₵${student.coins}, need ₵${coinReward}` });
    const bal = student.coins;
    student.coins -= coinReward;
    student.totalCoinsSpent += coinReward;
    student.doubtsPosted += 1;
    await student.save();
    await CoinTransaction.create({ user: student._id, type: 'doubt_post', amount: -coinReward, balanceBefore: bal, balanceAfter: student.coins, description: `Posted: "${title.slice(0,60)}"` });
    const doubt = await Doubt.create({ title, description, coinReward, department, tags: tags||[], postedBy: student._id, institution: student.institution });
    await doubt.populate('postedBy','name department averageRating');
    req.app.get('io').to(`inst_${student.institution}`).emit('new_doubt', doubt);
    res.status(201).json({ success: true, doubt, message: 'Doubt posted!' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/my/posted', protect, async (req, res) => {
  try {
    const doubts = await Doubt.find({ postedBy: req.user._id }).populate('selectedHelper','name department averageRating').sort('-createdAt');
    res.json({ success: true, doubts });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id).populate('postedBy','name department averageRating').populate('selectedHelper','name department averageRating').populate('applicants.helper','name department averageRating doubtsHelped lastSeen');
    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found' });
    doubt.views += 1; await doubt.save();
    res.json({ success: true, doubt });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/:id/apply', protect, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Not found' });
    if (doubt.status !== 'open') return res.status(400).json({ success: false, message: 'Not open for applications' });
    if (doubt.postedBy.toString() === req.user._id.toString()) return res.status(400).json({ success: false, message: 'Cannot apply to own doubt' });
    if (doubt.applicants.some(a => a.helper.toString() === req.user._id.toString())) return res.status(400).json({ success: false, message: 'Already applied' });
    doubt.applicants.push({ helper: req.user._id, message: req.body.message||'' });
    await doubt.save();
    req.app.get('io').to(`user_${doubt.postedBy}`).emit('new_applicant', { doubtId: doubt._id, doubtTitle: doubt.title, helper: { _id: req.user._id, name: req.user.name, department: req.user.department } });
    res.json({ success: true, message: 'Application submitted!' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/:id/select/:helperId', protect, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Not found' });
    if (doubt.postedBy.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (doubt.status !== 'open') return res.status(400).json({ success: false, message: 'Not open' });
    const applicant = doubt.applicants.find(a => a.helper.toString() === req.params.helperId);
    if (!applicant) return res.status(400).json({ success: false, message: 'Helper did not apply' });

    const helperUser = await User.findById(req.params.helperId);
    if (!helperUser) return res.status(404).json({ success: false, message: 'Helper not found' });

    doubt.selectedHelper = req.params.helperId;
    doubt.status = 'in_progress';
    applicant.status = 'selected';
    doubt.applicants.forEach(a => { if (a.helper.toString() !== req.params.helperId) a.status = 'rejected'; });

    let session;
    // Fix 2 — Smart Routing: only attempt an instant match if BOTH parties are online.
    // Otherwise force the asynchronous scheduling flow instead of burning session time.
    if (helperUser.isOnline()) {
      // Fix 1 — Pending Confirmation Handshake: don't start the clock yet.
      session = await Session.create({
        student: doubt.postedBy, helper: req.params.helperId, doubt: doubt._id,
        coinReward: doubt.coinReward, status: 'pending_confirmation',
        confirmationDeadline: new Date(Date.now() + 3*60*1000),
      });
    } else {
      const { scheduledFor } = req.body;
      if (!scheduledFor || new Date(scheduledFor) <= new Date()) {
        return res.status(400).json({ success: false, message: 'Helper is offline — please propose a future time slot (scheduledFor).' });
      }
      session = await Session.create({
        student: doubt.postedBy, helper: req.params.helperId, doubt: doubt._id,
        coinReward: doubt.coinReward, status: 'scheduled', scheduledFor: new Date(scheduledFor),
      });
    }
    doubt.session = session._id;
    await doubt.save();

    if (session.status === 'pending_confirmation') {
      req.app.get('io').to(`user_${req.params.helperId}`).emit('selected_as_helper', { doubtId: doubt._id, doubtTitle: doubt.title, sessionId: session._id, roomId: session.roomId, status: session.status });
      res.json({ success: true, session, message: 'Match found! Both parties have 3 minutes to confirm readiness.' });
    } else {
      req.app.get('io').to(`user_${req.params.helperId}`).emit('session_scheduled', { doubtId: doubt._id, doubtTitle: doubt.title, sessionId: session._id, scheduledFor: session.scheduledFor });
      res.json({ success: true, session, message: `Helper is offline. A session has been proposed for ${session.scheduledFor.toLocaleString()}.` });
    }
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Not found' });
    if (doubt.postedBy.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (['in_progress','solved'].includes(doubt.status)) return res.status(400).json({ success: false, message: 'Cannot cancel in-progress doubt' });
    const user = await User.findById(req.user._id);
    const bal = user.coins;
    user.coins += doubt.coinReward;
    user.totalCoinsSpent = Math.max(0, user.totalCoinsSpent - doubt.coinReward);
    await user.save();
    await CoinTransaction.create({ user: user._id, type: 'doubt_cancel', amount: doubt.coinReward, balanceBefore: bal, balanceAfter: user.coins, description: `Refund: cancelled doubt`, relatedDoubt: doubt._id });
    doubt.status = 'closed'; await doubt.save();
    res.json({ success: true, message: `Doubt cancelled. ₵${doubt.coinReward} refunded.` });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

// Report a doubt
router.post('/:id/report', protect, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Not found' });
    const existing = await Report.findOne({ reportedBy: req.user._id, targetId: doubt._id, status: 'pending' });
    if (existing) return res.status(400).json({ success: false, message: 'Already reported' });
    await Report.create({ reportedBy: req.user._id, targetType: 'doubt', targetId: doubt._id, targetModel: 'Doubt', reason: req.body.reason || 'other', description: req.body.description || '' });
    doubt.isReported = true;
    doubt.reports.push({ reportedBy: req.user._id, reason: req.body.reason });
    await doubt.save();
    res.json({ success: true, message: 'Reported. Moderators will review it.' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
