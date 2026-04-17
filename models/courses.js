const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: "", // URL to image
    },
    description: {
      type: String,
      required: true,
    },
    instructor: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "General",
    },
    creditsRequired: {
      type: Number,
      default: 0, // how many credits to unlock
    },
    fees: {
      type: Number,
      default: 1000,
    },
   videos: [
  {
    title: String,
    filename: String,
    comments: [
  {
    user: String,
    text: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    replies: [
      {
        user: String,
        text: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ]
  }
]

  }
]
,
    duration: {
      type: String, // e.g., "1h 20min"
      default: "",
    },
    tags: [String],
    isLive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
