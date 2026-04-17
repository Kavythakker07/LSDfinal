const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  title: { type: String, required: true },
  scheduledTime: { type: Date, required: true },
  zoomLink: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('LiveSession', liveSessionSchema);
