const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  helper:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doubt:   { type: mongoose.Schema.Types.ObjectId, ref: 'Doubt', required: true },

  messages: [{
    sender:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 2000 },
    type:    { type: String, enum: ['text','image','file'], default: 'text' },
    sentAt:  { type: Date, default: Date.now },
    isRead:  { type: Boolean, default: false },
  }],

  startedAt: { type: Date, default: null },
  endsAt:    { type: Date, default: null },
  duration:  { type: Number, default: 0 },
  maxDurationMinutes: { type: Number, default: 60 },

  // ── Hybrid matching state machine ───────────────────────────────────────────
  // Requested -> Matched(scheduled) -> Pending_Confirmation -> Active -> Completed
  status: {
    type: String,
    enum: ['scheduled','pending_confirmation','active','completed','cancelled','expired'],
    default: 'pending_confirmation',
  },

  // Fix 2 — async scheduling for offline parties
  scheduledFor:     { type: Date, default: null },   // proposed future time slot
  scheduleAccepted: { type: Boolean, default: false },

  // Fix 1 — pending confirmation handshake (3-minute ready window)
  studentReady:        { type: Boolean, default: false },
  helperReady:         { type: Boolean, default: false },
  confirmationDeadline:{ type: Date, default: null },

  coinReward:       { type: Number, required: true },
  coinsTransferred: { type: Boolean, default: false },

  ratings: [{
    ratedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ratedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score:     { type: Number, min: 1, max: 5, required: true },
    comment:   { type: String, maxlength: 300, default: '' },
  }],
  studentRated: { type: Boolean, default: false },
  helperRated:  { type: Boolean, default: false },

  roomId: { type: String, unique: true },

  // ── Moderation ────────────────────────────────────────────────────────────
  isFlagged:    { type: Boolean, default: false },
  flagReason:   { type: String, default: '' },
  flaggedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

SessionSchema.pre('save', function(next) {
  if (!this.roomId) this.roomId = `session_${this._id}`;
  next();
});

SessionSchema.index({ student: 1 });
SessionSchema.index({ helper: 1 });
SessionSchema.index({ doubt: 1 });
SessionSchema.index({ status: 1 });

module.exports = mongoose.model('Session', SessionSchema);
