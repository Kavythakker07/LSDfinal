const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  course: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  date: { type: String, default: () => new Date().toISOString().split("T")[0] },
}, { timestamps: true });

module.exports = mongoose.model("announcements", announcementSchema);
