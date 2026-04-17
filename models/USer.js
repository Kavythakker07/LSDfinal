const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio:{type: String, default:"null" },
  xps:{type: String, default:"null" },
  thrones:{type: String, default:"null" },
  xyz:{   type: [String],
    default: [],},
  bountyPrice:{type: Number, default:50 },

  


});

module.exports = mongoose.model("User", UserSchema);
