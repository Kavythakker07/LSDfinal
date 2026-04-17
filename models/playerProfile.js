const mongoose = require("mongoose");

const playerProfileSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  level: {
    type: Number,
    default: 1,
  },
  credits: {
    type: Number,
    default: 0,
  },
  xp: {
    type: Number,
    default: 0,
  },
  stats: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  throne: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  throneNames: {
    type: [String],
    default: [],
  },
  kingStatus: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model("PlayerProfile", playerProfileSchema);
