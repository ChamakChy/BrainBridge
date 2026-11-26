const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String, required: true, minlength: 6, select: false },
  institution: { type: String, required: true, trim: true },
  department:  { type: String, required: true, enum: ['CSE','EEE','ME','CE','BBA','MATH','PHYSICS','CHEM','ENG','OTHER'] },
  studentId:   { type: String, trim: true, default: '' },
  bio:         { type: String, maxlength: 300, default: '' },
  avatar:      { type: String, default: '' },

  // ── Role System ───────────────────────────────────────────────────────────
  role: {
    type: String,
    enum: ['student', 'moderator', 'admin'],
    default: 'student',
  },

  // ── Moderator fields ──────────────────────────────────────────────────────
  moderatorOf: [{           // Which departments/institutions this moderator manages
    type: String,
  }],
  assignedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedAt:  { type: Date, default: null },

  // ── Coin Economy ──────────────────────────────────────────────────────────
  coins:            { type: Number, default: 50, min: 0 },
  totalCoinsEarned: { type: Number, default: 0 },
  totalCoinsSpent:  { type: Number, default: 0 },

  // ── Reputation ────────────────────────────────────────────────────────────
  reputationScore:       { type: Number, default: 0 },
  totalRatingsReceived:  { type: Number, default: 0 },
  ratingSum:             { type: Number, default: 0 },
  averageRating:         { type: Number, default: 0, min: 0, max: 5 },

  // ── Stats ─────────────────────────────────────────────────────────────────
  doubtsPosted:       { type: Number, default: 0 },
  doubtsHelped:       { type: Number, default: 0 },
  sessionsCompleted:  { type: Number, default: 0 },

  // ── Moderation fields ─────────────────────────────────────────────────────
  isBanned:      { type: Boolean, default: false },
  bannedReason:  { type: String, default: '' },
  bannedAt:      { type: Date, default: null },
  bannedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  warnings:      [{ message: String, issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, issuedAt: { type: Date, default: Date.now } }],

  // ── Account ───────────────────────────────────────────────────────────────
  isActive:  { type: Boolean, default: true },
  lastSeen:  { type: Date, default: Date.now },
}, { timestamps: true });

UserSchema.index({ email: 1 });
UserSchema.index({ institution: 1, department: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ coins: -1 });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.pre('save', function(next) {
  if (this.totalRatingsReceived > 0)
    this.averageRating = Math.round((this.ratingSum / this.totalRatingsReceived) * 10) / 10;
  next();
});

// ── Presence (Fix 2: Heartbeat Filter) ──────────────────────────────────────
// A user counts as "Online" only if lastSeen was within the last 60 seconds.
const ONLINE_THRESHOLD_MS = 60 * 1000;
UserSchema.methods.isOnline = function() {
  return !!this.lastSeen && (Date.now() - new Date(this.lastSeen).getTime()) < ONLINE_THRESHOLD_MS;
};

UserSchema.methods.comparePassword = function(p) { return bcrypt.compare(p, this.password); };
UserSchema.methods.generateJWT = function() {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRE || '7d' });
};
UserSchema.methods.toPublicJSON = function() {
  return {
    _id: this._id, name: this.name, email: this.email,
    institution: this.institution, department: this.department,
    bio: this.bio, avatar: this.avatar, role: this.role,
    isOnline: this.isOnline(),
    coins: this.coins, totalCoinsEarned: this.totalCoinsEarned,
    averageRating: this.averageRating, totalRatingsReceived: this.totalRatingsReceived,
    reputationScore: this.reputationScore,
    doubtsPosted: this.doubtsPosted, doubtsHelped: this.doubtsHelped,
    sessionsCompleted: this.sessionsCompleted,
    isBanned: this.isBanned, bannedReason: this.bannedReason,
    warnings: this.warnings, moderatorOf: this.moderatorOf,
    createdAt: this.createdAt, lastSeen: this.lastSeen,
  };
};

module.exports = mongoose.model('User', UserSchema);
