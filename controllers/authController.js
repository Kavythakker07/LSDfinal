
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const user = require("../models/users");
const admin = require("../models/admin");
const courses = require("../models/courses");
const McqBank= require("../models/McqBank");
const faq= require("../models/faq");


const LiveSession = require("../models/liveSessionsTime");
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const path = require("path");
const Announcement = require('../models/announcement');

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const nodemailer = require('nodemailer');
const { log } = require("console");

const otpStore = new Map(); // key: email, value: { otp, username?, hashedPassword?, timestamp }

/**
 * Register User (send OTP and temporarily store hashed password + username)
 */


const registerUser = async (req, res) => {
  try {
    const { email, pass, username } = req.body;

    console.log("📥 Register request:", email, username);

    // ✅ VALIDATIONS
    if (!email || !pass || !username) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (username.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 4 characters.",
      });
    }

    if (pass.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    if (email.toLowerCase() === username.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "Email and username cannot be the same.",
      });
    }

    // ✅ CHECK EXISTING
    const existingUser = await user.findOne({ email });
    const existingUserName = await user.findOne({ username });

    if (existingUserName) {
      return res.status(409).json({
        success: false,
        message: "Username already registered.",
      });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    // ✅ CREATE OTP + HASH
    const hashedPassword = await bcrypt.hash(pass, 10);
    const otp = Math.floor(100000 + Math.random() * 900000);

    // ✅ STORE OTP
    otpStore.set(email, {
      otp,
      username,
      hashedPassword,
      timestamp: Date.now(),
    });

    console.log("🔐 OTP:", otp);

    // ✅ SEND EMAIL (RESEND)
    await resend.emails.send({
      from: 'LSD <noreply@lsdpro.in>', // 🔥 CHANGE THIS
      to: email,
      subject: 'Your OTP for LSD Registration',
      html: `
        <h2>Hello ${username}</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
        <br/>
        <p>Team LSD 🚀</p>
      `,
    });

    console.log("✅ Email sent:", email);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email.",
    });

  } catch (error) {
    console.error("❌ Error in registerUser:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Complete Registration after OTP Verification
 */
const verifyOTPAndRegister = async (req, res) => {
  try {
    const { mailID, OTP,phoneNumber ,mobileOTP,currentAppVersion} = req.body;

    const record = otpStore.get(mailID);
    if (!record) return res.status(400).json({ message: "No OTP request found." });

    const { otp,otp2, username, hashedPassword, timestamp } = record;

    if (Date.now() - timestamp > 5 * 60 * 1000) {
      otpStore.delete(mailID);
      return res.status(400).json({ message: "OTP expired. Try again." });
    }

    if (otp.toString() !== OTP.toString()) {
      return res.status(400).json({ message: "Invalid OTP Email." });
    }

    // if (otp2.toString() !== mobileOTP.toString()) {
    //   return res.status(400).json({ message: `Invalid OTP Mobile` });
    // }
    const adminPass=process.env.ADMIN_PASS
const isPasswordValid = bcrypt.compare(adminPass, hashedPassword);

if(!isPasswordValid){
  res.status(404).json({message:process.env.ADMIN_PASS+hashedPassword})
}
if(username==="DPDS"&&isPasswordValid){
console.log("as admin")
    const adminReg = new admin({adminUsername:username,email:mailID,password:hashedPassword,phoneNumber:phoneNumber,
      currentVersion:currentAppVersion
    });
    await adminReg.save();
    otpStore.delete(mailID);



const safeAdmin = {
  adminUsername: adminReg.adminUsername,
  email: adminReg.email,
  avatar: adminReg.avatar,
  phoneNumber:adminReg.phoneNumber,
currentVersion:adminReg.currentVersion

  
 
};


return res.status(200).json({
  message: "Registered successfully as Admin!",
  admin: safeAdmin,
});
  
}

    const newUser = new user({ username, email: mailID, password: hashedPassword ,phoneNumber:phoneNumber
      ,
      currentVersion:currentAppVersion
    });
    await newUser.save();
console.log("as user")

    otpStore.delete(mailID);
const safeUser = {
  username: newUser.username,
  email: newUser.email,
  phoneNumber:newUser.phoneNumber,
  avatar: newUser.avatar,
  rank: newUser.rank,
  credits: newUser.credits,
  certificate: newUser.certificate,
  createdAt: newUser.createdAt,
  currentVersion:newUser.currentVersion

};
console.log("sss",safeUser)
res.status(200).json({
  message: "Registered successfully!",
  user: safeUser,
});
  } catch (error) {
    console.error("❌ Error in verifyOTPAndRegister:", error);
    return res.status(500).json({ message: "error",error });
  }
};
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const data = otpStore.get(email);

    if (!data) {
      return res.status(400).json({ success: false, message: "No OTP found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    data.otp = otp;
    data.timestamp = Date.now();

    await resend.emails.send({
      from: "LSD <noreply@lsdpro.in>",
      to: email,
      subject: "Resent OTP",
      html: `<h2>Your new OTP: ${otp}</h2>`,
    });

    return res.json({ success: true, message: "OTP resent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
/**
 * Login User
 */


const loginUser = async (req, res) => {
  try {
    const { email, password, currentAppVersionActual } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required." });
    }

    const existingUser = await user.findOne({ email });
    const existingAdmin = await admin.findOne({ email });

    // ✅ USER LOGIN
    if (existingUser) {
      const isPasswordValid = await bcrypt.compare(password, existingUser.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password or email." });
      }

      existingUser.currentVersion = currentAppVersionActual;
      await existingUser.save();

      // 🔥 CREATE TOKEN
      const token = jwt.sign(
        { id: existingUser._id, email: existingUser.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "Login successful!",
        user: existingUser,
        token: token // 🔥 IMPORTANT
      });
    }

    // ✅ ADMIN LOGIN
    if (existingAdmin) {
      const isPasswordValid = await bcrypt.compare(password, existingAdmin.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password or email." });
      }

      existingAdmin.currentVersion = currentAppVersionActual;
      await existingAdmin.save();

      // 🔥 CREATE TOKEN
      const token = jwt.sign(
        { id: existingAdmin._id, email: existingAdmin.email },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      return res.status(200).json({
        message: "Login successful for admin!",
        admin: existingAdmin,
        token: token // 🔥 IMPORTANT
      });
    }

    return res.status(401).json({ message: "Email doesn't exist" });

  } catch (error) {
    console.error("❌ Error in loginUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * 1️⃣ Send Reset Password OTP
 */
const sendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("📥 Reset OTP request for:", email);
    const existingUser = await user.findOne({ email });

    if (!existingUser) return res.status(404).json({ message: "User not found." });

    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore.set(email, { otp, timestamp: Date.now() });
console.log("🔐 Reset OTP:", otp);
  await resend.emails.send({
      from: 'LSD <noreply@lsdpro.in>', // 🔥 CHANGE THIS
      to: email,
      subject: 'Your OTP for LSD Registration',
      html: `
        <h2>Hello ${existingUser.username}</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
        <br/>
        <p>Team LSD 🚀</p>
      `,
    });

    // await transporter.sendMail(mailOptions);
    console.log(`🔐 OTP for ${email}: ${otp}`);

    return res.status(200).json({ message: "OTP sent to your email." });
  } catch (err) {
    console.error("❌ sendResetOTP error:", err);
    return res.status(500).json({ message: "Something went wrong." });
  }
};

/**
 * 2️⃣ Verify Reset Password OTP
 */
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const stored = otpStore.get(email);

    if (!stored) {
      return res.status(400).json({ message: "No OTP found for this email." });
    }

    const isExpired = Date.now() - stored.timestamp > 5 * 60 * 1000; // 5 min

    if (isExpired) {
      otpStore.delete(email);
      return res.status(400).json({ message: "OTP expired. Please request again." });
    }

    if (stored.otp.toString() !== otp.toString()) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // OTP is valid
    otpStore.delete(email); // clear OTP after successful verification
    return res.status(200).json({ message: "OTP verified successfully", success: true });

  } catch (err) {
    console.error("❌ verifyResetOTP error:", err);
    return res.status(500).json({ message: "Something went wrong." });
  }
};


/**
 * 3️⃣ Reset Password after verifying OTP
 */
const resetPass = async (req, res) => {
  try {
    const { email, newPass } = req.body;

    if (!email || !newPass) {
      return res.status(400).json({ message: "Email and new password required." });
    }

    const existingUser = await user.findOne({ email });
    
    if (!existingUser) return res.status(404).json({ message: "User not found." });

    // ❌ Check if new password is same as old one
    const isSamePassword = await bcrypt.compare(newPass, existingUser.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password cannot be same as the old password." });
    }

    // ✅ Hash and update
    const hashedPassword = await bcrypt.hash(newPass, 10);
    existingUser.password = hashedPassword;
    await existingUser.save();

    otpStore.delete(email);

    return res.status(200).json({ success: true, message: "Password reset successful!" });

  } catch (err) {
    console.error("❌ resetPass error:", err);
    return res.status(500).json({ message: "Something went wrong." });
  }
};


const updateProfile = async (req, res) => {
  try {
    const { email, bio } = req.body;
let avatar;

if (req.file) {
  avatar = req.file.path; // ✅ new upload (Cloudinary)
} else {
  avatar = existingUser?.avatar || existingAdmin?.avatar; // ✅ keep old
}console.log("💾 File saved as:", avatar);

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const existingUser = await user.findOne({ email });
    const existingAdmin = await admin.findOne({ email });
    console.log(existingUser)

    // ✅ USER
    if (existingUser) {
      if (bio) existingUser.bio = bio;
      if (avatar) existingUser.avatar = avatar;

      await existingUser.save();

     return res.json({
  success: true,
  user: {
    username: existingUser.username,
    email: existingUser.email,
    avatar: avatar, // ✅ JUST filename, not full URL
    bio: existingUser.bio,
    rank: existingUser.rank,
    credits: existingUser.credits,
    certificate: existingUser.certificate,
    createdAt: existingUser.createdAt,
        currentVersion: existingUser.currentVersion || "1.0.0", // ✅ required!
        

  },
});


    }

    // ✅ ADMIN
    if (existingAdmin) {
      if (bio) existingAdmin.bio = bio;
      if (avatar) existingAdmin.avatar = avatar;

      await existingAdmin.save();

      return res.json({
        success: true,
        admin: {
          adminUsername: existingAdmin.adminUsername,
          email: existingAdmin.email,
          avatar: avatar, // just filename
          bio: existingAdmin.bio,
              currentVersion: existingAdmin.currentVersion || "1.0.0",

        },
      });
    }

    return res.status(404).json({ success: false, message: "User not found" });
  } catch (err) {
    console.error("❌ Update profile error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};



const addTask = async (req, res) => {
  try {
    const { email, time, task, date } = req.body;
    console.log(email, time, task, date)

    if (!email || !time || !task || !date)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    const User = await user.findOne({ email });
    const Admin = await admin.findOne({ email });
    console.log("hey ",Admin)

    if (!User&&!Admin)
      return res.status(404).json({ success: false, message: "User not found" });
if(User){
  const tasksToday = User.schedule.filter(s => s.date === date);
    if (tasksToday.length >= 24) {
      return res.status(400).json({ success: false, message: "You can only add up to 24 tasks per day." });
    }
    User.schedule.push({ time, task, date });
    await User.save();
    
    const scheduleToday = User.schedule.filter(s => s.date === date);
    res.json({ success: true, schedule: scheduleToday });

}
  
    else if(admin){
       const tasksToday = Admin.schedule.filter(s => s.date === date);
    if (tasksToday.length >= 24) {
      return res.status(400).json({ success: false, message: "You can only add up to 24 tasks per day." });
    }
Admin.schedule.push({ time, task, date });
    await Admin.save();
    
    const scheduleToday = Admin.schedule.filter(s => s.date === date);
    res.json({ success: true, schedule: scheduleToday });
    }
    

  } catch (err) {
    console.error("❌ Add task error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSchedule = async (req, res) => {
  try {
    const { email, date } = req.body;

    const userDoc = await user.findOne({ email });
    const adminDoc = await admin.findOne({ email });

    if (!userDoc&&!adminDoc) return res.status(404).json({ success: false, message: "User not found" });
if(userDoc){
   const todayTasks = userDoc.schedule.filter(t => t.date === date);
    res.json({ success: true, schedule: todayTasks });
}
else{
   const todayTasks = adminDoc.schedule.filter(t => t.date === date);
    res.json({ success: true, schedule: todayTasks });
}
   
  } catch (err) {
    console.error("❌ Get schedule error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { email, index, date,taskId } = req.body;
    console.log("📩 Deleting task for", email, "at index", index, "on", date);

    const userDoc = await user.findOne({ email });
    const adminDoc = await admin.findOne({ email });

    if (!userDoc && !adminDoc) {
      return res.status(404).json({ success: false });
    }

   if (taskId && userDoc) {
  userDoc.schedule = userDoc.schedule.filter(task => task._id.toString() !== taskId);
  await userDoc.save();
  return res.json({ success: true, message: "Time has crossed and task has been removed" });
} else if (taskId && adminDoc) {
  adminDoc.schedule = adminDoc.schedule.filter(task => task._id.toString() !== taskId);
  await adminDoc.save();
  return res.json({ success: true, message: "Time has crossed and task has been removed" });
}


    if (userDoc) {
      const tasksOnDate = userDoc.schedule.filter(task => task.date === date);
      if (index >= 0 && index < tasksOnDate.length) {
        const globalIndex = userDoc.schedule.findIndex(
          (task, i) => task.date === date && tasksOnDate.indexOf(task) === index
        );
        if (globalIndex !== -1) {
          userDoc.schedule.splice(globalIndex, 1);
          await userDoc.save();
        }
      }
      const updatedSchedule = userDoc.schedule.filter(task => task.date === date);
      return res.json({ success: true, schedule: updatedSchedule });
    }

    if (adminDoc) {
      const tasksOnDate = adminDoc.schedule.filter(task => task.date === date);
      if (index >= 0 && index < tasksOnDate.length) {
        const globalIndex = adminDoc.schedule.findIndex(
          (task, i) => task.date === date && tasksOnDate.indexOf(task) === index
        );
        if (globalIndex !== -1) {
          adminDoc.schedule.splice(globalIndex, 1);
          await adminDoc.save();
        }
      }
      const updatedSchedule = adminDoc.schedule.filter(task => task.date === date);
      return res.json({ success: true, schedule: updatedSchedule });
    }

  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const toggleDone = async (req, res) => {
  try {
    const { email, index, date } = req.body;

    const userDoc = await user.findOne({ email });
    const adminDoc = await admin.findOne({ email });

    if (!userDoc && !adminDoc) return res.status(404).json({ success: false });

    const doc = userDoc || adminDoc;

    // Only filter today's tasks and toggle the 'done' status of the one at the provided index
    const todaysTasks = doc.schedule.filter(task => task.date === date);

    if (index < 0 || index >= todaysTasks.length)
      return res.status(400).json({ success: false, message: "Invalid task index" });

    const targetTask = todaysTasks[index];

    // Find the actual task in the full schedule and toggle its 'done'
    const taskInSchedule = doc.schedule.find(task =>
      task.date === date &&
      task.task === targetTask.task &&
      task.time === targetTask.time
    );

    if (!taskInSchedule) return res.status(404).json({ success: false, message: "Task not found" });

    taskInSchedule.done = !taskInSchedule.done;
    await doc.save();

    const updatedSchedule = doc.schedule.filter(task => task.date === date);
    res.json({ success: true, schedule: updatedSchedule });

  } catch (err) {
    console.error("❌ Toggle error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const addCourses=async(req,res)=>{
try{
    const courseData = JSON.parse(req.body.courseData); // 📌 sent as FormData
const thumbnailFile = req.file?.path;
const findSameTitled=await courses.findOne({title:courseData.title})
const addCourseToSirProfile = await admin.findOne({ adminUsername: courseData.instructor });

console.log("addCourseToSirProfile", addCourseToSirProfile===null);

if (addCourseToSirProfile===null) {
  return res.status(404).json({ message: "No Instructor from admins like that" });
}
if(findSameTitled){return res.status(409).json({message:"Already with this name a course exists"})}



    const addCourses = new courses({
      title: courseData.title.trim(),
      thumbnail: thumbnailFile, // ✅ correct
      description: courseData.description,
      instructor: courseData.instructor,
      category: courseData.category,
      creditsRequired: courseData.creditsRequired,
      fees: courseData.fees,
      duration: courseData.duration,
      tags: courseData.tags,
      isLive: courseData.isLive,
    });

await addCourses.save()

const allCourses =await courses.find(); // get all courses

if(addCourses){
  res.status(200).json({
    message:"Added",
    addedCourse:allCourses
  })
}

if(addCourses){


addCourseToSirProfile.courseCreator.push(addCourses.title);
await addCourseToSirProfile.save();


}

}
catch (err) {
    console.error("❌ Get schedule error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
const buyCourse=async(req,res)=>{
const {courseName}=req.body

const findOneCourse=await courses.findOne({title:courseName})
console.log(findOneCourse,courseName)


if(findOneCourse){
res.status(200).json({
  message:"success",
  SelectedCourse:findOneCourse

})
}
else{
res.status(404).json({
  message:"couldn't find the course ",

})}
}


// authController.js

const getUserCourses = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("email",email)

    const userDetailsFind = await user.findOne({ email });
    const adminDetailsFind = await admin.findOne({ email });


    if (!userDetailsFind&&!adminDetailsFind) {
      return res.status(404).json({ message: "User||Admin not found" });
    }

    // User has an array of course titles, like ["D", "ReactJS", ...]
    if(userDetailsFind){
    const enrolledCourseTitles = userDetailsFind.courses || [];
  const courseDetailsFind = await courses.find({ title: { $in: enrolledCourseTitles } });
    console.log("hey",courseDetailsFind)

    return res.status(200).json({

      success:true,
      message: "success",
      courses: courseDetailsFind,
    });
    }
    else if(adminDetailsFind){
    const CourseTitlesAdmin = adminDetailsFind.courseCreator || [];
  const courseDetailsFind = await courses.find({ title: { $in: CourseTitlesAdmin } });
    console.log("hey",courseDetailsFind)

    return res.status(200).json({
      success:true,
      message: "success",
      courses: courseDetailsFind,
    });
    }
    else{
      return res.status(404).json({
        message:"No course found"
      })
    }


    // Get only the matching courses
  

  } catch (err) {
    console.error("❌ Error in getUserCourses:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const allCourses = await courses.find(); // assuming "Course" is your model
    console.log(allCourses)
    res.status(200).json({ message: "success", courses: allCourses });
  } catch (err) {
    console.error("❌ Error getting all courses:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllComments = async (req, res) => {
  const {courseName,videoName,title}=req.body
  try {
    const course = await courses.findOne({ title: courseName });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const video = course.videos.find(v => v.title === title);
console.log(video)
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const comments = video.comments || [];

    res.status(200).json({ success: true, comments });
  } catch (err) {
    console.error("❌ Error getting comments:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getCommentsReplies = async (req, res) => {
  const {courseName,videoName,title}=req.body
  try {

    console.log("abs",courseName,videoName,title)
    const course = await courses.findOne({ title: courseName });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const video = course.videos.find(v => v.title === title);
console.log(video)
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const comments = video.comments || [];

    res.status(200).json({ success: true, comments });
  } catch (err) {
    console.error("❌ Error getting comments:", err);
    res.status(500).json({ message: "Server error" });
  }
};


const currentSelectedCourse = async (req, res) => {
  try {
    const { title } = req.body;
    console.log("📩 Title received:", title);

    const courseNeededDetails = await courses.findOne({ title }); // ✅ Await this
    console.log("🎯 Course found:", courseNeededDetails);

    if (!courseNeededDetails) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({
      message: "success",
      course: courseNeededDetails,
    });
  } catch (err) {
    console.error("❌ Error finding course:", err);
    res.status(500).json({ message: "Server error" });
  }
};


const createAnAnnouncement = async (req, res) => {
  try {
    const { title, description, course } = req.body;

    const usersWithCourse = await user.find({ courses: course });
    if (!usersWithCourse || usersWithCourse.length === 0) {
      return res.status(404).json({ success: false, message: "No users enrolled in this course" });
    }

    // Save the announcement
    const announcement = new Announcement({ title, description, course });
    await announcement.save();

    // Setup email and WhatsApp (already implemented)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "thakkerkavy8@gmail.com",
        pass: process.env.nodemailer_pass,
      },
    });

    for (const u of usersWithCourse) {
      const mailOptions = {
        from: "Life Skills Dynamics <thakkerkavy8@gmail.com>",
        to: u.email,
        subject: title,
        text: description,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Sent to ${u.email}`);
      } catch (err) {
        console.error(`❌ Failed to send email to ${u.email}`, err.message);
      }

      if (u.phoneNumber) {
        try {
          const msg = await client.messages.create({
            from: process.env.TWILIO_NUMBER,
            to: `whatsapp:+91${u.phoneNumber}`,
            body: `📢 Announcement:\nTitle: ${title}\n${description ? `Details: ${description}` : ''}`,
          });
          console.log(`✅ WhatsApp sent to ${u.phoneNumber}: ${msg.sid}`);
        } catch (err) {
          console.error(`❌ WhatsApp failed for ${u.phoneNumber}:`, err.message);
        }
      }

      await new Promise(res => setTimeout(res, 300)); // optional throttle
    }

    return res.status(200).json({ success: true, message: "Announcement sent and saved." });

  } catch (err) {
    console.error("❌ Error in createAnAnnouncement:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const getSignature = async (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      { timestamp },
      process.env.CLOUD_API_SECRET
    );

    res.json({
      timestamp,
      signature,
      cloudName: process.env.CLOUD_NAME,
      apiKey: process.env.CLOUD_API_KEY,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signature error" });
  }
};
const uploadVideo = async (req, res) => {
  try {
    const { title, courseName, videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: "No video URL provided",
      });
    }

    const findCourse = await courses.findOne({ title: courseName });

    if (!findCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // 🔥 OPTIMIZED STREAM URL
    const finalUrl = videoUrl.replace(
      "/upload/",
      "/upload/f_mp4,q_auto,vc_auto/"
    );

    findCourse.videos.push({
      title: title,
      filename: finalUrl,
    });

    await findCourse.save();

    return res.status(200).json({
      success: true,
      message: "Video saved successfully",
    });

  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const videoOrder = async (req, res) => {
  try {
    const { current, courseName, order } = req.body;
    const findCourse = await courses.findOne({ title: courseName });
    if (!findCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const videos = findCourse.videos;

    const currentIndex = videos.findIndex(v => v.filename.includes(current.split("/").pop()));
    if (currentIndex === -1) {
      return res.status(400).json({ message: 'Current video not found in course' });
    }

    const previous = currentIndex > 0 ? videos[currentIndex - 1] : null;
    const next = currentIndex < videos.length - 1 ? videos[currentIndex + 1] : null;

    const isFirst = currentIndex === 0;
    const isLast = currentIndex === videos.length - 1;

    let response = {
      message: 'success',
      current,
      isFirst,
      isLast,
    };

    if (order === "prev") {
      response.previous = previous ? previous.filename : null;
    } else if (order === "next") {
      response.next = next ? next.filename : null;
    }

    return res.status(200).json(response);

  } catch (err) {
    console.error('Error in videoOrder:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



const setMcq = async (req, res) => {
  try {
    const { payload,admin } = req.body;

    if(!admin){
      return res.status(404).json("No admin found")
    }

    const { courseName, question, options, answer } = payload;

    if (!courseName || !question || !options || !answer) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
if (!Array.isArray(options) || !options.includes(answer)) {
  return res.status(400).json({ message: 'Answer must be one of the provided options.' });
}
    const crossCheck = await courses.findOne({title:courseName})

    if(!crossCheck){
            return res.status(400).json({ message: `Course you chose doesn't exist `});

    }

    // Check if course already has an MCQ entry
    const findTheCourse = await McqBank.findOne({ courseName });

    if (findTheCourse) {
      // Add question to existing course
      findTheCourse.questions.push({ question, options, answer });
      await findTheCourse.save();
      return res.status(200).json({ success:true,message: 'MCQ added to existing course.', data: findTheCourse });
    } else {
      // Create a new MCQ course with this question
      const newCourse = await McqBank.create({
        courseName,
        questions: [{ question, options, answer }]
      });

      return res.status(201).json({ success:true,message: 'New course and MCQ added.', data: newCourse });
    }
  } catch (err) {
    console.error('Error in setMcq:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getMcq = async (req, res) => {
  try {
   const {courseName}=req.body
  //  console.log("Sss",courseName)
  const getMcqs=await McqBank.findOne({courseName})

  if(getMcqs){
   return res.json({
    success:true,
    message:"Your MCQs",
    questions:getMcqs.questions


   })

  }

    return res.status(404).json({ success: false, message: "couldn't get MCQs" });
  } catch (err) {
    console.error('Error in setMcq:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { setMcq };


const mcqAns=async(req,res)=>{


  try{
  const {selectedCourse,question,ans,userName,userForCert,resultForCert}=req.body
if(userForCert&&resultForCert){
  
}

const courseFind = await McqBank.findOne({courseName:selectedCourse})
const foundQuestion = courseFind.questions.find(q => q.question === question);
const findAdmin = await admin.findOne({adminUsername:userName})
const findUser = await user.findOne({username:userName})

console.log(findUser)


if (!foundQuestion) {
  return res.status(404).json({ message: "Question not found" });
}

if(foundQuestion.answer===ans){

  


return res.json({
  success:true,
  message:"You're correct"


})

}
else{
  return res.json({
  success:false,
  message:"You're not correct"


})

}
  }
   catch (error) {
    console.error("❌ Error in registerUser:", error);
    return res.status(500).json({ message: "Internal server error" });
  }



}


const selectedCourseforDelete = async (req, res) => {
  const { courseTitle, title } = req.body;

  try {
    const updatedCourse = await courses.findOneAndUpdate(
      { title: courseTitle },
      { $pull: { videos: { title: title } } }, // remove video by title
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Video removed successfully',
      updatedCourse
    });
  } catch (err) {
    console.error("❌ Error in selectedCourseforDelete:", err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const createLiveSessions = async (req, res) => {
  try {
    const { payload, admin, titleLink } = req.body;
    const { courseName, title, scheduledTime, zoomLink } = payload;

    if (!courseName || !title || !scheduledTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const dateObject = new Date(scheduledTime);
    if (isNaN(dateObject.getTime())) {
      return res.status(400).json({ message: "Invalid scheduledTime format" });
    }

    // Admin updating zoom link
    if (admin && zoomLink) {
      const existingSession = await LiveSession.findOne({ courseName, title });
      if (!existingSession) {
        return res.status(404).json({
          success: false,
          message: 'No Live session scheduled on this title or selected course',
        });
      }

      existingSession.zoomLink = zoomLink;
      await existingSession.save();

      return res.status(200).json({
        success: true,
        message: 'Zoom link added to existing session',
      });
    }

    // Admin creating new session
    if (admin && !zoomLink) {
      const newSession = await LiveSession.create({
        courseName,
        title,
        scheduledTime: dateObject,
        createdBy: admin?._id || null,
      });

      // 📤 Notify all users enrolled in this course
      const usersWithCourse = await user.find({ courses: courseName });
      console.log("eeee",usersWithCourse)
      const formattedTime = newSession.scheduledTime.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      for (const u of usersWithCourse) {
        if (!u.phoneNumber) continue;

        try {
          const response = await client.messages.create({
            from: process.env.TWILIO_NUMBER,
            to: `whatsapp:+91${u.phoneNumber}`,
            body: `📢 Live Session Scheduled!\nCourse: ${courseName}\nTitle: ${title}\nTime: ${formattedTime}`,
          });
          console.log(`✅ WhatsApp sent to ${u.phoneNumber}: ${response.sid}`);
        } catch (err) {
          console.error(`❌ WhatsApp failed for ${u.phoneNumber}:`, err.message);
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Live session scheduled and WhatsApp alerts sent',
        data: newSession,
      });
    }

  } catch (err) {
    console.error("❌ Error in createLiveSessions:", err);
    return res.status(500).json({ message: 'Server error' });
  }
};



const getLiveSessions = async (req, res) => {
  try {
    const { name } = req.body;

    let isAdmin = false;
    let userCourses = [];

    // Check if the user is an admin
    const foundAdmin = await admin.findOne({ adminUsername: name });
    if (foundAdmin) {
      isAdmin = true;
    }

    // If not admin, check if the user exists and populate their courses
    if (!isAdmin) {
      const foundUser = await user.findOne({ username: name }).populate('courses');
      if (!foundUser) {
        return res.status(404).json({ success: false, message: "User/Admin not found" });
      }

      console.log("userCourses (raw):", foundUser.courses); // <- debugging check
      userCourses = foundUser.courses
      console.log("userCourses (raw):", userCourses); // <- debugging check

    }

    // Fetch relevant live sessions
    const liveSessions = isAdmin
      ? await LiveSession.find({})
      : await LiveSession.find({ courseName: { $in: userCourses } });

    return res.json({ success: true, message: "success", sessions: liveSessions });
  } catch (err) {
    console.error("Error in getLiveSessions:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  
  }
};

const getAllAnnouncements = async (req, res) => {
  try {
    const { email } = req.body;
    const foundUser = await user.findOne({ email }).populate('courses');

    if (!foundUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userCourses = foundUser.courses.map(c => c);
    const announcements = await Announcement.find({ course: { $in: userCourses } })
                                            .sort({ createdAt: -1 });
console.log("son of sardaar",userCourses)
    res.status(200).json({ success: true, message: "success", announcements });
  } catch (err) {
    console.error("Error in getAllAnnouncements:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



const comments = async (req, res) => {
  try {
    const { user, admin, courseName, videoName, comment, title } = req.body;
    const findCourse = await courses.findOne({ title: courseName });
// console.log("user",user.username)
    if (!findCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    const video = findCourse.videos.find(v => v.title === title);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if(user){
 const newComment = {
      user: user.username || admin.adminUsername || 'Anonymous',
      text: comment,
      timestamp: new Date(),
      replies: []

    };
    video.comments.push(newComment);

    }
    else if(admin){
       const newComment = {
      user: admin.adminUsername || 'Anonymous',
      text: comment,
      timestamp: new Date(),
      replies: []
    };
    video.comments.push(newComment);

    }

    else{
      res.status(200).json({message:"something went wrong"})
    }
   

    // Push the new comment into the video’s comments array

    // Save the course with the updated comments
    await findCourse.save();

    // console.log("✅ Comment added to video:", video.title);
    // console.log(video.comments);

    res.status(200).json({ message: "Comment added", comments: video.comments });
  } catch (error) {
    console.error("❌ Error in comments:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



const addReply = async (req, res) => {
  try { 
    const {user, admin, courseName, videoName,commentId, replyText } = req.body;
    console.log(user, admin, courseName, videoName,commentId, replyText)
    const course = await courses.findOne({ title: courseName });
    if (!course) return res.status(404).json({ message: "Course not found" });

    const video = course.videos.find(v => v.title === videoName);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const commentIndex = video.comments.findIndex(c => c._id.toString() === commentId);
    if (commentIndex === -1) return res.status(404).json({ message: "Comment not found" });

    const reply = {
      user,
      text: replyText,
      timestamp: new Date()
    };

    video.comments[commentIndex].replies.push(reply);
    await course.save();

    return res.status(200).json({ message: "Reply added", replies: video.comments[commentIndex].replies });
  } catch (error) {
    console.error("❌ Error in addReply:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const addFaq = async (req, res) => {
const { question, answer } = req.body;
  if (!question?.trim()) return res.status(400).json({ message: 'Question is required' });

  try {
    const addFaq = new faq({ question, answer });
    await addFaq.save();
    res.status(200).json({ message: 'FAQ added successfully', faq:addFaq });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add FAQ' });
  }

};


const getFaq = async (req, res) => {
  try {
    const faqs = await faq.find(); // assuming "Course" is your model
    console.log("Sss")
    res.status(200).json({ message: "success", allFaq: faqs });
  } catch (err) {
    console.error("❌ Error getting all courses:", err);
    res.status(500).json({ message: "Server error" });
  }

};
module.exports = {
  registerUser,
  verifyOTPAndRegister,resendOTP,
  loginUser,
  sendResetOTP,
  verifyResetOTP,
  resetPass,
  updateProfile,
  addTask,
  getSchedule,
  deleteTask,
  toggleDone,
  addCourses,
  buyCourse,
  getUserCourses,
  getAllCourses,
  currentSelectedCourse,
  createAnAnnouncement,
    uploadVideo,
    videoOrder,
    mcqAns,
    setMcq,
    getMcq,
    selectedCourseforDelete,
    createLiveSessions,
    getLiveSessions,
    getAllAnnouncements,
    getFaq,
    comments,
    addReply,
    getAllComments,
    getCommentsReplies,
    addFaq,
    getSignature

};
