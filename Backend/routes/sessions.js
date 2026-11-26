const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const Doubt = require('../models/Doubt');
const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');
const { protect } = require('../middleware/auth');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|docx?|pptx?|xlsx?|txt|zip/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

// Fix 1 — Auto-Fallback: if the 3-minute confirmation window has expired without
// both parties marking ready, cancel the match, reopen the doubt, zero penalty.
async function expireIfNeeded(session) {
  if (session.status === 'pending_confirmation' && session.confirmationDeadline && new Date() > session.confirmationDeadline) {
    session.status = 'cancelled';
    await session.save();
    await Doubt.findByIdAndUpdate(session.doubt, {
      status: 'open', selectedHelper: null, session: null,
      $set: { 'applicants.$[].status': 'pending' },
    });
    return true;
  }
  return false;
}

// Periodic sweep, invoked from server.js every 30s so stale matches don't linger
// even if nobody happens to re-fetch that session.
async function sweepExpiredSessions(io) {
  const stale = await Session.find({ status: 'pending_confirmation', confirmationDeadline: { $lt: new Date() } });
  for (const session of stale) {
    await expireIfNeeded(session);
    io?.to(`user_${session.student}`).emit('session_cancelled', { sessionId: session._id, reason: 'confirmation_timeout' });
    io?.to(`user_${session.helper}`).emit('session_cancelled', { sessionId: session._id, reason: 'confirmation_timeout' });
  }
}

router.get('/', protect, async (req, res) => {
  try {
    const { status, role } = req.query;
    const filter = {};
    if (role === 'helper') filter.helper = req.user._id;
    else if (role === 'student') filter.student = req.user._id;
    else filter.$or = [{ student: req.user._id }, { helper: req.user._id }];

    // Expire any stale pending_confirmation matches BEFORE the populated read below —
    // calling .save() on a document with populated refs (student/helper/doubt) is
    // unsafe, so this runs against plain, unpopulated documents only.
    const staleIds = await Session.find({ ...filter, status: 'pending_confirmation', confirmationDeadline: { $lt: new Date() } }).select('_id');
    for (const { _id } of staleIds) {
      const raw = await Session.findById(_id);
      if (raw) await expireIfNeeded(raw);
    }

    if (status) filter.status = status;
    const sessions = await Session.find(filter).populate('student','name department averageRating').populate('helper','name department averageRating').populate('doubt','title coinReward department').sort('-createdAt');
    res.json({ success: true, sessions });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    // Same reasoning as above — resolve expiry against a plain document first.
    const raw = await Session.findById(req.params.id);
    if (!raw) return res.status(404).json({ success: false, message: 'Session not found' });
    const isParticipant = [raw.student.toString(), raw.helper.toString()].includes(req.user._id.toString());
    if (!isParticipant && !['admin','moderator'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Access denied' });
    await expireIfNeeded(raw);

    const session = await Session.findById(req.params.id).populate('student','name department averageRating avatar').populate('helper','name department averageRating avatar').populate('doubt','title description coinReward department tags');
    res.json({ success: true, session });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

// Fix 2 — Helper accepts/declines a proposed async time slot.
router.post('/:id/accept-schedule', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    if (session.helper.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Only the helper can accept' });
    if (session.status !== 'scheduled') return res.status(400).json({ success: false, message: 'Session is not awaiting scheduling' });
    session.scheduleAccepted = true;
    session.status = 'pending_confirmation';
    session.confirmationDeadline = new Date(Date.now() + 3*60*1000);
    await session.save();
    req.app.get('io').to(`user_${session.student}`).emit('session_schedule_accepted', { sessionId: session._id });
    res.json({ success: true, session, message: 'Time slot accepted — confirm readiness to start.' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/:id/decline-schedule', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    if (session.helper.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Only the helper can decline' });
    if (session.status !== 'scheduled') return res.status(400).json({ success: false, message: 'Session is not awaiting scheduling' });
    session.status = 'cancelled';
    await session.save();
    await Doubt.findByIdAndUpdate(session.doubt, { status: 'open', selectedHelper: null, session: null, $set: { 'applicants.$[].status': 'pending' } });
    req.app.get('io').to(`user_${session.student}`).emit('session_cancelled', { sessionId: session._id, reason: 'schedule_declined' });
    res.json({ success: true, message: 'Proposed time declined.' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

// Fix 1 — Mutual Readiness: both parties tap "Ready" before the real 1-hour clock starts.
router.post('/:id/ready', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    const isStudent = session.student.toString() === req.user._id.toString();
    const isHelper = session.helper.toString() === req.user._id.toString();
    if (!isStudent && !isHelper) return res.status(403).json({ success: false, message: 'Not a participant' });
    if (session.status !== 'pending_confirmation') return res.status(400).json({ success: false, message: 'Session is not awaiting confirmation' });
    if (await expireIfNeeded(session)) return res.status(400).json({ success: false, message: 'Confirmation window expired — match was cancelled' });

    if (isStudent) session.studentReady = true;
    if (isHelper) session.helperReady = true;

    if (session.studentReady && session.helperReady) {
      session.status = 'active';
      session.startedAt = new Date();
      session.endsAt = new Date(Date.now() + session.maxDurationMinutes*60*1000);
      await session.save();
      req.app.get('io').to(session.roomId).emit('session_activated', { sessionId: session._id, startedAt: session.startedAt, endsAt: session.endsAt });
      return res.json({ success: true, session, message: 'Both ready — session started!' });
    }
    await session.save();
    const otherUserId = isStudent ? session.helper : session.student;
    req.app.get('io').to(`user_${otherUserId}`).emit('peer_ready', { sessionId: session._id });
    res.json({ success: true, session, message: 'Waiting for the other participant to confirm...' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

// File/image sharing inside an active session
router.post('/:id/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    const isParticipant = [session.student.toString(), session.helper.toString()].includes(req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Not a participant' });
    if (session.status !== 'active') return res.status(400).json({ success: false, message: 'Session is not active' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded, or file type not allowed' });
    const isImage = /\.(jpe?g|png|gif|webp)$/i.test(req.file.filename);
    res.json({ success: true, url: `/uploads/${req.file.filename}`, name: req.file.originalname, type: isImage ? 'image' : 'file' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/:id/complete', protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    if (session.status !== 'active') return res.status(400).json({ success: false, message: 'Session not active' });
    const isParticipant = [session.student.toString(), session.helper.toString()].includes(req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ success: false, message: 'Not a participant' });
    if (!session.coinsTransferred) {
      const helper = await User.findById(session.helper);
      const student = await User.findById(session.student);
      const bal = helper.coins;
      helper.coins += session.coinReward;
      helper.totalCoinsEarned += session.coinReward;
      helper.doubtsHelped += 1;
      helper.sessionsCompleted += 1;
      student.sessionsCompleted += 1;
      await helper.save(); await student.save();
      await CoinTransaction.create({ user: helper._id, type: 'session_earn', amount: session.coinReward, balanceBefore: bal, balanceAfter: helper.coins, description: 'Earned for helping', relatedSession: session._id });
      session.coinsTransferred = true;
    }
    session.status = 'completed';
    session.duration = Math.round((new Date() - session.startedAt) / 60000);
    await session.save();
    await Doubt.findByIdAndUpdate(session.doubt, { status: 'solved' });
    req.app.get('io').to(session.roomId).emit('session_completed', { sessionId: session._id });
    res.json({ success: true, message: 'Session completed! Coins transferred.' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

router.post('/:id/rate', protect, [
  body('score').isInt({ min:1, max:5 }),
  body('comment').optional().trim().isLength({ max:300 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Not found' });
    if (session.status !== 'completed') return res.status(400).json({ success: false, message: 'Can only rate completed sessions' });
    const isStudent = session.student.toString() === req.user._id.toString();
    const isHelper  = session.helper.toString()  === req.user._id.toString();
    if (!isStudent && !isHelper) return res.status(403).json({ success: false, message: 'Not a participant' });
    if (isStudent && session.studentRated) return res.status(400).json({ success: false, message: 'Already rated' });
    if (isHelper && session.helperRated)  return res.status(400).json({ success: false, message: 'Already rated' });
    const ratedUserId = isStudent ? session.helper : session.student;
    session.ratings.push({ ratedBy: req.user._id, ratedUser: ratedUserId, score: req.body.score, comment: req.body.comment||'' });
    if (isStudent) session.studentRated = true;
    if (isHelper)  session.helperRated  = true;
    await session.save();
    const ratedUser = await User.findById(ratedUserId);
    ratedUser.ratingSum += req.body.score;
    ratedUser.totalRatingsReceived += 1;
    ratedUser.reputationScore = Math.round((ratedUser.ratingSum / ratedUser.totalRatingsReceived) * 20);
    await ratedUser.save();
    const rater = await User.findById(req.user._id);
    const bal = rater.coins;
    rater.coins += 5; rater.totalCoinsEarned += 5;
    await rater.save();
    await CoinTransaction.create({ user: rater._id, type: 'rating_bonus', amount: 5, balanceBefore: bal, balanceAfter: rater.coins, description: 'Rating bonus', relatedSession: session._id });
    res.json({ success: true, message: 'Rating submitted! +5 coins bonus.' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
});

router.sweepExpiredSessions = sweepExpiredSessions;
module.exports = router;
