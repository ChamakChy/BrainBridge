const mongoose = require('mongoose');

const CoinTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['signup_bonus','doubt_post','doubt_cancel','session_earn','session_spend','rating_bonus','admin_grant','admin_deduct'],
    required: true,
  },
  amount:        { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter:  { type: Number, required: true },
  description:   { type: String, required: true, maxlength: 200 },
  relatedDoubt:   { type: mongoose.Schema.Types.ObjectId, ref: 'Doubt',   default: null },
  relatedSession: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
}, { timestamps: true });

CoinTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('CoinTransaction', CoinTransactionSchema);
