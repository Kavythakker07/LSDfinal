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
      player51: { type: String, default: null },
      player52: { type: String, default: null },
      player53: { type: String, default: null },
      player54: { type: String, default: null },
      player55: { type: String, default: null },
      player56: { type: String, default: null },
      player57: { type: String, default: null },
      player58: { type: String, default: null },
      player59: { type: String, default: null },
      player60: { type: String, default: null },
      player61: { type: String, default: null },
      player62: { type: String, default: null },
      player63: { type: String, default: null },
      player64: { type: String, default: null },
      player65: { type: String, default: null },
      player66: { type: String, default: null },
      player67: { type: String, default: null },
      player68: { type: String, default: null },
      player69: { type: String, default: null },
      player70: { type: String, default: null },
      player71: { type: String, default: null },
      player72: { type: String, default: null },
      player73: { type: String, default: null },
      player74: { type: String, default: null },
      player75: { type: String, default: null },
      player76: { type: String, default: null },
      player77: { type: String, default: null },
      player78: { type: String, default: null },
      player79: { type: String, default: null },
      player80: { type: String, default: null },
      player81: { type: String, default: null },
      player82: { type: String, default: null },
      player83: { type: String, default: null },
      player84: { type: String, default: null },
      player85: { type: String, default: null },
      player86: { type: String, default: null },
      player87: { type: String, default: null },
      player88: { type: String, default: null },
      player89: { type: String, default: null },
      player90: { type: String, default: null },
      player91: { type: String, default: null },
      player92: { type: String, default: null },
      player93: { type: String, default: null },
      player94: { type: String, default: null },
      player95: { type: String, default: null },
      player96: { type: String, default: null },
      player97: { type: String, default: null },
      player98: { type: String, default: null },
      player99: { type: String, default: null },
      player100: { type: String, default: null }
  },


  matchID: { type: String, default:null }, // Game mode
  matchPass: { type: String, default:null }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("BgmiMatchesDB", MatchSchema);
