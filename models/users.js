// models/users.js
const { types } = require("@babel/core");
const mongoose = require("mongoose");

const userProfile = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber:{type:String,default:null },
  password: { type: String, required: true },
  bio: { type: String, default: "" },
  rank: { type: String, default: "Rookie" },
  // credits: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  // certificate: {
  //   type: [String],
  //   default: [],
  // },
avatar: { type: String, default: "" }, // This can be a URL or base64
schedule: [ 
  {
    time: String,
    task: String,
    date: String,
    done: { type: Boolean, default: false }  // ✅
  }
],
  courses: {
    type: [String],
    default: [],
  },
  currentVersion:{
    type: String, default: ""
  }




}, { timestamps: true });

module.exports = mongoose.model("users", userProfile);
