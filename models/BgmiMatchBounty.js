const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema({
  
  realName: { type: String, required: true },
  InGameName: { type: String, required: true },
  gameName: { type: String, required: true },
  bountyChlName: { type: String, required: true },

  amount: { type: Number, required: true },
  date: { type: String, required: false },
  email: { type: String, required: true },

  chlAccepted:{type:String,default:"false",required:true}

 
}, { timestamps: true });

module.exports = mongoose.model("BgmiMatchesBounty", MatchSchema);

// const mongoose = require('mongoose');

// // Game Session Schema
// const gameSessionSchema = new mongoose.Schema({
//   gameName: {
//     type: String,
//     required: [true, 'Game name is required'],
//   },
//   mode: {
//     type: String,
//     required: [true, 'Mode is required'],
//   },
//   roomId: {
//     type: String,
//     required: [true, 'Room ID is required'],
//   },
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//   },
//   players: {
//     type: [String], // Array of player names
//     default: [],
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// }, {
//   timestamps: true,
//   versionKey: false,
// });

// // Export the GameSession model
// const GameSession = mongoose.model('GameSession', gameSessionSchema);
// module.exports = GameSession;
