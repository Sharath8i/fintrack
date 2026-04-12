const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Transport', 'Shopping', 'Food']
  },
  threshold: {
    type: Number,
    required: true
  }
});

// Compound index so a user only has one active budget per category natively
budgetSchema.index({ mobile: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
