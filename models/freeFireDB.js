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
      player9: { type: String, default: null },
      player10: { type: String, default: null },
      player11: { type: String, default: null },
      player12: { type: String, default: null },
      player13: { type: String, default: null },
      player14: { type: String, default: null },
      player15: { type: String, default: null },
      player16: { type: String, default: null },
      player17: { type: String, default: null },
      player18: { type: String, default: null },
      player19: { type: String, default: null },
      player20: { type: String, default: null },
      player21: { type: String, default: null },
      player22: { type: String, default: null },
      player23: { type: String, default: null },
      player24: { type: String, default: null },
      player25: { type: String, default: null },
      player26: { type: String, default: null },
      player27: { type: String, default: null },
      player28: { type: String, default: null },
      player29: { type: String, default: null },
      player30: { type: String, default: null },
      player31: { type: String, default: null },
      player32: { type: String, default: null },
      player33: { type: String, default: null },
      player34: { type: String, default: null },
      player35: { type: String, default: null },
      player36: { type: String, default: null },
      player37: { type: String, default: null },
      player38: { type: String, default: null },
      player39: { type: String, default: null },
      player40: { type: String, default: null },
      player41: { type: String, default: null },
      player42: { type: String, default: null },
      player43: { type: String, default: null },
      player44: { type: String, default: null },
      player45: { type: String, default: null },
      player46: { type: String, default: null },
      player47: { type: String, default: null },
      player48: { type: String, default: null },
      player49: { type: String, default: null },
      player50: { type: String, default: null },

  },


  matchID: { type: String, default:null }, // Game mode
  matchPass: { type: String, default:null }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("ffMatchesDB", MatchSchema);
