const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    validate: [opts => opts.length === 4, 'Must have exactly 4 options'],
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
    createdAt: { type: Date, default: Date.now }, // Required for manual TTL

  
});

const mcqBankSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
    unique: true, // one document per course
  },
  questions: [questionSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('McqBank', mcqBankSchema);
