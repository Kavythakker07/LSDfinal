// Faq.js (Mongoose Model)
const mongoose = require("mongoose");

const FaqSchema = new mongoose.Schema(
  {
  question: String,
  answer: String,   // optional
  createdAt: { type: Date, default: Date.now }
}
);

module.exports = mongoose.model("faq", FaqSchema);

