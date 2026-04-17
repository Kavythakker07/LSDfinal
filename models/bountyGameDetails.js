const mongoose = require('mongoose');

const bountyGameDetailsSchema = new mongoose.Schema({
    gameName: { type: String, required: true },
    // matchNumber: { type: String, required: true },
    bountyChlName:{type: String, required: true},
    player1: { type: String, required: true },
    player2: { type: String, required: true },
    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Please fill a valid email address",
        ],
      },
      phoneNumber:{type:String,required:true},

    totalPlayers: { type: Number, default: 0 },
    chlAccepted:{type:String,default:"false",required:true},
    matchID: { type: String, default:null }, // Game mode
    matchPass: { type: String, default:null }, 


});

const bountyGameDetails = mongoose.model('bountyGameDetails', bountyGameDetailsSchema);
module.exports = bountyGameDetails;