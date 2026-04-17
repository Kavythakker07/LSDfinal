const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema(
  {
  ID: { type: String, required: true },
   
    mode: { type: String, required: true }, // Game mode
    gameName: { type: String, required: true }, // Game Name
    match_type: { type: String, required: true }, // Match Type
    date: { type: String, required: true }, // Date
    time: { type: String, required: true }, // Time
    map: { type: String, required: true }, // Map
    prize_pool: { type: String, required: true }, // Prize Pool
    per_kill: { type: String, required: true }, // Per Kill reward
    join_using: { type: String, required: true }, // Join Using method



    players: {
      player1: { type: String, default: null },
      player2: { type: String, default: null },
      player3: { type: String, default: null },
      player4: { type: String, default: null },
      player5: { type: String, default: null },
      player6: { type: String, default: null },
      player7: { type: String, default: null },
      player8: { type: String, default: null },

  },
  
  matchID: { type: String, default:null }, // Game mode
  matchPass: { type: String, default:null }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("BgmiMatchesSoloOrSquadTdm", MatchSchema);
