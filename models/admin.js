// models/users.js
const mongoose = require("mongoose");

const adminProfile = new mongoose.Schema({
  adminUsername: { type: String, default: "DPDS" },
  phoneNumber:{type:String,default:null},
    email: { type: String, required: true },
    courseCreator:{type: [String],
    default: [],},


  password: { type: String, required: true },
    bio: { type: String, default: "" },

avatar: { type: String, default: "" }, // This can be a URL or base64
schedule: [
  {
    time: String,
    task: String,
    date: String,
    done: { type: Boolean, default: false }  // ✅
  }
],
currentVersion:{
    type: String, default: ""
  }

}, { timestamps: true });

module.exports = mongoose.model("admin", adminProfile);
