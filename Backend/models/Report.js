const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reportedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType:   { type: String, enum: ['doubt', 'session', 'user'], required: true },
  targetId:     { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetModel' },
  targetModel:  { type: String, enum: ['Doubt', 'Session', 'User'], required: true },

  reason: {
    type: String,
    enum: ['spam','inappropriate','harassment','cheating','fake','other'],
    required: true,
  },
  description: { type: String, maxlength: 500, default: '' },

  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending',
  },

  reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt:   { type: Date, default: null },
  resolution:   { type: String, default: '' },
  actionTaken:  { type: String, enum: ['none','warning','removed','banned',''], default: '' },
}, { timestamps: true });

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reportedBy: 1 });
ReportSchema.index({ targetType: 1 });

module.exports = mongoose.model('Report', ReportSchema);
