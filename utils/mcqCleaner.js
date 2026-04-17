// utils/mcqCleaner.js
const cron = require('node-cron');
const McqBank = require('../models/McqBank');

cron.schedule('0 * * * *', async () => {
  console.log('🧹 Running MCQ cleanup job...');

  try {
    const allCourses = await McqBank.find();

    const now = new Date();

    for (const course of allCourses) {
      const filteredQuestions = course.questions.filter(q => {
        const ageInMs = now - new Date(q.createdAt);
        return ageInMs < 24 * 60 * 60 * 1000; // Keep if < 24 hours
      });

      if (filteredQuestions.length !== course.questions.length) {
        course.questions = filteredQuestions;
        await course.save();
        console.log(`✅ Cleaned expired questions from: ${course.courseName}`);
      }
    }
  } catch (err) {
    console.error('❌ Error during MCQ cleanup:', err);
  }
});
