// app.js or index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config({ path: "../.env" });
const session = require("express-session");
const path = require("path");

const app = express();
const LiveSession = require('./models/liveSessionsTime'); // adjust the path

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const baseUploadDir = process.env.RENDER === "true"
  ? "/mnt/data"
  : path.join(__dirname, "uploads");

// app.use("/uploads", express.static(baseUploadDir));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/player.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/player.html'));
});

const uploadsPath = path.join(__dirname, "uploads");
console.log("📂 Serving static files from:", uploadsPath, "on /uploads");
console.log("s",process.env.MONGO_URI)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ MongoDB connected successfully");
})
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1); // Stop the server if MongoDB doesn't connect
});

app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    secure: false
  }
}));

// Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// ✅ Start the cron job that cleans expired MCQs
require('./utils/mcqCleaner'); // 👈 CRON JOB - runs once on server start
require('./utils/liveSessionCleaner'); // 👈 Add this line
// Inside app.js or index.js
require('./utils/announcementCleaner'); // 👈 Loads the daily announcement cleanup cron job

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
