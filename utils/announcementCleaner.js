// utils/announcementCleaner.js
const cron = require('node-cron');
const Announcement = require('../models/announcement');

const cleanupExpiredAnnouncements = async () => {
  console.log('🧹 Running Announcement cleanup job...');

  try {
    const now = new Date();

    // Remove announcements older than today (past midnight)
    const deleted = await Announcement.deleteMany({
      createdAt: { $lt: new Date(now.setHours(0, 0, 0, 0)) }
    });

    if (deleted.deletedCount > 0) {
      console.log(`✅ Deleted ${deleted.deletedCount} old announcements`);
    }
  } catch (err) {
    console.error('❌ Error during announcement cleanup:', err);
  }
};

// Run every day at 00:30 AM (after the day ends)
cron.schedule('30 0 * * *', cleanupExpiredAnnouncements);

module.exports = cleanupExpiredAnnouncements;
