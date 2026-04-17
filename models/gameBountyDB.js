const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema(
  {
  ID: { type: String, required: true },
   
    gameName: { type: String, required: true }, // Game Name
    date: { type: String, required: true }, // Date
    time: { type: String, required: true }, // Time
    prize_pool: { type: String, required: true }, // Prize Pool
    join_using: { type: String, required: true }, // Join Using method



    players: {
      boogeyman: { type: String, default: null },
      johnWick: { type: String, default: null },
    
  },


  matchID: { type: String, default:null }, // Game mode
  matchPass: { type: String, default:null }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("BgmiMatchesDB", MatchSchema);
