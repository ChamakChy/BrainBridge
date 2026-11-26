const mongoose = require('mongoose');

const DoubtSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, minlength: 10, maxlength: 150 },
  description: { type: String, required: true, trim: true, minlength: 20, maxlength: 2000 },
  tags:        [{ type: String, trim: true, lowercase: true }],
  attachmentUrl: { type: String, default: '' },

  postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: String, required: true },
  department:  { type: String, required: true },

  coinReward:  { type: Number, required: true, min: 5, max: 500 },

  status: { type: String, enum: ['open','in_progress','solved','closed','expired','removed'], default: 'open' },

  applicants: [{
    helper:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message:   { type: String, maxlength: 500, default: '' },
    appliedAt: { type: Date, default: Date.now },
    status:    { type: String, enum: ['pending','selected','rejected'], default: 'pending' },
  }],

  selectedHelper: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  session:        { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },

  // ── Moderation ────────────────────────────────────────────────────────────
  isReported:    { type: Boolean, default: false },
  reports: [{
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason:     { type: String },
    reportedAt: { type: Date, default: Date.now },
  }],
  removedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  removedReason: { type: String, default: '' },

  expiresAt: { type: Date, default: () => new Date(Date.now() + 48 * 60 * 60 * 1000) },
  views: { type: Number, default: 0 },
}, { timestamps: true });

DoubtSchema.index({ institution: 1, department: 1, status: 1 });
DoubtSchema.index({ postedBy: 1 });
DoubtSchema.index({ isReported: 1 });
DoubtSchema.virtual('applicantCount').get(function() { return this.applicants ? this.applicants.length : 0; });
DoubtSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Doubt', DoubtSchema);
