// utils/liveSessionCleaner.js
const LiveSession = require('../models/liveSessionsTime');

const cleanupExpiredLiveSessions = async () => {
  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago

    const result = await LiveSession.deleteMany({
      scheduledTime: { $lte: cutoff },
    });

    if (result.deletedCount > 0) {
      console.log(`🗑️ Removed ${result.deletedCount} expired live sessions.`);
    }
  } catch (err) {
    console.error("❌ Error cleaning up live sessions:", err);
  }
};

// Run every 5 minutes
setInterval(cleanupExpiredLiveSessions, 5 * 60 * 1000);

module.exports = cleanupExpiredLiveSessions;
