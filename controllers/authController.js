
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const user = require("../models/users");
const admin = require("../models/admin");
const courses = require("../models/courses");
const McqBank= require("../models/McqBank");
const faq= require("../models/faq");
const {
  logError,
  logAdminAction
} = require("../utils/loggers");

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
const isPasswordValid = await bcrypt.compare(
  adminPass,
  hashedPassword
);
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
      return res.status(400).json({
        message: "Email and password required."
      });
    }

    /*
    =================================
    USER LOGIN
    =================================
    */

    const existingUser = await user.findOne({ email });

    if (existingUser) {
      const isPasswordValid = await bcrypt.compare(
        password,
        existingUser.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Invalid password or email."
        });
      }

      existingUser.currentVersion = currentAppVersionActual;

      /*
      USER ACCESS TOKEN
      */

      const accessToken = jwt.sign(
        {
          id: existingUser._id,
          email: existingUser.email,
          role: "user"
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "15m"
        }
      );

      /*
      USER REFRESH TOKEN
      */

      const refreshToken = jwt.sign(
        {
          id: existingUser._id,
          role: "user"
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "30d"
        }
      );

      existingUser.refreshToken = refreshToken;
      await existingUser.save();

     return res.status(200).json({
  success: true,
  message: "Login successful",
  user: {
    username: existingUser.username,
    email: existingUser.email,
    avatar: existingUser.avatar,
    bio: existingUser.bio,
    rank: existingUser.rank,
    courses: existingUser.courses,
    currentVersion: existingUser.currentVersion
  },
  accessToken,
  refreshToken
});
    }

    /*
    =================================
    ADMIN LOGIN
    =================================
    */

    const existingAdmin = await admin.findOne({ email });

    if (existingAdmin) {
      const isPasswordValid = await bcrypt.compare(
        password,
        existingAdmin.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Invalid password or email."
        });
      }

      existingAdmin.currentVersion = currentAppVersionActual;

      /*
      ADMIN ACCESS TOKEN
      More strict security
      */

      const accessToken = jwt.sign(
        {
          id: existingAdmin._id,
          email: existingAdmin.email,
          role: "admin"
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "10m"
        }
      );

      /*
      ADMIN REFRESH TOKEN
      Shorter than users
      */

      const refreshToken = jwt.sign(
        {
          id: existingAdmin._id,
          role: "admin"
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "15d"
        }
      );

      existingAdmin.refreshToken = refreshToken;
      await existingAdmin.save();

 return res.status(200).json({
  success: true,
  message: "Login successful for admin",
  admin: {
    adminUsername: existingAdmin.adminUsername,
    email: existingAdmin.email,
    avatar: existingAdmin.avatar,
    bio: existingAdmin.bio,
    currentVersion: existingAdmin.currentVersion
  },
  accessToken,
  refreshToken
});
    }

    return res.status(404).json({
      message: "Email doesn't exist"
    });

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        message: "No refresh token provided"
      });
    }

    /*
    VERIFY REFRESH TOKEN
    */

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    /*
    CHECK ROLE
    */

    let existingUser = null;
    let existingAdmin = null;

    if (decoded.role === "user") {
      existingUser = await user.findById(decoded.id);

      if (!existingUser) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      if (existingUser.refreshToken !== refreshToken) {
        return res.status(403).json({
          message: "Invalid refresh token"
        });
      }

      /*
      NEW USER ACCESS TOKEN
      */

      const newAccessToken = jwt.sign(
        {
          id: existingUser._id,
          email: existingUser.email,
          role: "user"
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "15m"
        }
      );

      /*
      ROTATE USER REFRESH TOKEN
      */

      const newRefreshToken = jwt.sign(
        {
          id: existingUser._id,
          role: "user"
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "30d"
        }
      );

      existingUser.refreshToken = newRefreshToken;
      await existingUser.save();

      return res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });
    }

    /*
    ADMIN REFRESH FLOW
    */

    if (decoded.role === "admin") {
      existingAdmin = await admin.findById(decoded.id);

      if (!existingAdmin) {
        return res.status(404).json({
          message: "Admin not found"
        });
      }

      if (existingAdmin.refreshToken !== refreshToken) {
        return res.status(403).json({
          message: "Invalid refresh token"
        });
      }

      /*
      NEW ADMIN ACCESS TOKEN
      */

      const newAccessToken = jwt.sign(
        {
          id: existingAdmin._id,
          email: existingAdmin.email,
          role: "admin"
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "10m"
        }
      );

      /*
      ROTATE ADMIN REFRESH TOKEN
      */

      const newRefreshToken = jwt.sign(
        {
          id: existingAdmin._id,
          role: "admin"
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "15d"
        }
      );

      existingAdmin.refreshToken = newRefreshToken;
      await existingAdmin.save();

      return res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });
    }

    return res.status(403).json({
      message: "Invalid role"
    });

  } catch (error) {
    console.error("Refresh Token Error:", error);

    return res.status(403).json({
      message: "Refresh token expired. Please login again."
    });
  }
};


const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(200).json({
        message: "Logout successful"
      });
    }

    /*
    VERIFY TOKEN TO FIND ROLE
    */

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      if (decoded.role === "user") {
        const existingUser = await user.findById(decoded.id);

        if (existingUser) {
          existingUser.refreshToken = null;
          await existingUser.save();
        }
      }

      if (decoded.role === "admin") {
        const existingAdmin = await admin.findById(decoded.id);

        if (existingAdmin) {
          existingAdmin.refreshToken = null;
          await existingAdmin.save();
        }
      }

    } catch (err) {
      console.log("Token already invalid during logout",err);
    }

    return res.status(200).json({
      message: "Logout successful"
    });

  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      message: "Logout failed"
    });
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

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required."
      });
    }

    // ✅ FIRST find user/admin
    const existingUser = await user.findOne({ email });
    const existingAdmin = await admin.findOne({ email });

    if (!existingUser && !existingAdmin) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ✅ THEN decide avatar
    let avatar;

    if (req.file) {
      avatar = req.file.path;
    } else {
      avatar =
        existingUser?.avatar ||
        existingAdmin?.avatar ||
        "";
    }

    /*
    =================================
    USER UPDATE
    =================================
    */

    if (existingUser) {
      if (bio) existingUser.bio = bio;
      if (avatar) existingUser.avatar = avatar;

      await existingUser.save();

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: {
          username: existingUser.username,
          email: existingUser.email,
          avatar: existingUser.avatar,
          bio: existingUser.bio,
          rank: existingUser.rank,
          currentVersion:
            existingUser.currentVersion || "1.0.0"
        }
      });
    }

    /*
    =================================
    ADMIN UPDATE
    =================================
    */

    if (existingAdmin) {
      if (bio) existingAdmin.bio = bio;
      if (avatar) existingAdmin.avatar = avatar;

      await existingAdmin.save();

      return res.status(200).json({
        success: true,
        message: "Admin profile updated successfully",
        admin: {
          adminUsername: existingAdmin.adminUsername,
          email: existingAdmin.email,
          avatar: existingAdmin.avatar,
          bio: existingAdmin.bio,
          currentVersion:
            existingAdmin.currentVersion || "1.0.0"
        }
      });
    }

  } catch (err) {
    console.error("Update profile error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
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


const addCourses = async (req, res) => {
  try {
    /*
    =====================================
    ADMIN SECURITY CHECK
    =====================================
    */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only"
      });
    }

    /*
    =====================================
    GET FORM DATA
    =====================================
    */

    const courseData = JSON.parse(req.body.courseData);
    const thumbnailFile = req.file?.path;

    /*
    =====================================
    VALIDATION
    =====================================
    */

    if (!courseData.title || !thumbnailFile) {
      return res.status(400).json({
        success: false,
        message: "Title and thumbnail are required"
      });
    }

    /*
    =====================================
    CHECK DUPLICATE COURSE
    =====================================
    */

    const findSameTitled = await courses.findOne({
      title: courseData.title
    });

    if (findSameTitled) {
      return res.status(409).json({
        success: false,
        message: "A course with this title already exists"
      });
    }

    /*
    =====================================
    CHECK INSTRUCTOR EXISTS
    =====================================
    */

    const addCourseToSirProfile = await admin.findOne({
      adminUsername: courseData.instructor
    });

    if (!addCourseToSirProfile) {
      return res.status(404).json({
        success: false,
        message: "No instructor admin found with this name"
      });
    }

    /*
    =====================================
    CREATE COURSE
    =====================================
    */

    const newCourse = new courses({
      title: courseData.title.trim(),
      thumbnail: thumbnailFile,
      description: courseData.description,
      instructor: courseData.instructor,
      category: courseData.category,
      creditsRequired: courseData.creditsRequired,
      fees: courseData.fees,
      duration: courseData.duration,
      tags: courseData.tags,
      isLive: courseData.isLive,
    });

    await newCourse.save();

    /*
    =====================================
    UPDATE INSTRUCTOR PROFILE
    =====================================
    */

    addCourseToSirProfile.courseCreator.push(
      newCourse.title
    );

    await addCourseToSirProfile.save();

    /*
    =====================================
    ADMIN ACTION LOG
    =====================================
    */

    logAdminAction({
      adminEmail: req.user.email,
      action: "COURSE_ADDED",
      details: {
        title: newCourse.title,
        instructor: newCourse.instructor
      }
    });

    /*
    =====================================
    GET UPDATED COURSES
    =====================================
    */

    const allCourses = await courses.find();

    /*
    =====================================
    SUCCESS RESPONSE
    =====================================
    */

    return res.status(200).json({
      success: true,
      message: "Course added successfully",
      addedCourse: allCourses
    });

  } catch (error) {
    /*
    =====================================
    ERROR LOG
    =====================================
    */

    logError({
      route: "addCourses",
      error,
      extra: {
        adminEmail: req.user?.email || "unknown"
      }
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
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

const getFreeCourses = async (req, res) => {
  try {
    const { email } = req.body;

    
    console.log("email",email)

    const userDetailsFind = await user.findOne({ email });
    const adminDetailsFind = await admin.findOne({ email });
    const freeCourses = await courses.find({fees:0})

    if (!userDetailsFind&&!adminDetailsFind) {
      return res.status(404).json({ message: "User||Admin not found" });
    }


    // User has an array of course titles, like ["D", "ReactJS", ...]
    if(freeCourses){
  

    return res.status(200).json({

      success:true,
      message: "success",
      courses: freeCourses,
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
  const {courseName,title}=req.body
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
    /*
    =====================================
    ADMIN SECURITY CHECK
    =====================================
    */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only"
      });
    }

    /*
    =====================================
    GET REQUEST DATA
    =====================================
    */

    const {
      title,
      courseName,
      videoUrl
    } = req.body;

    /*
    =====================================
    VALIDATION
    =====================================
    */

    if (!title || !courseName || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: "Title, course name and video URL are required"
      });
    }

    /*
    =====================================
    FIND COURSE
    =====================================
    */

    const course = await courses.findOne({
      title: courseName
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    /*
    =====================================
    CHECK DUPLICATE VIDEO
    =====================================
    */

    const alreadyExists = course.videos.find(
      (video) => video.title === title
    );

    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: "Video with this title already exists"
      });
    }

    /*
    =====================================
    ADD VIDEO
    =====================================
    */

    course.videos.push({
      title,
      filename: videoUrl
    });

    await course.save();

    /*
    =====================================
    ADMIN ACTION LOG
    =====================================
    */

    logAdminAction({
      adminEmail: req.user.email,
      action: "VIDEO_UPLOADED",
      details: {
        courseName,
        videoTitle: title
      }
    });

    /*
    =====================================
    SUCCESS RESPONSE
    =====================================
    */

    return res.status(200).json({
      success: true,
      message: "Video uploaded successfully"
    });

  } catch (error) {
    /*
    =====================================
    ERROR LOG
    =====================================
    */

    logError({
      route: "uploadVideo",
      error,
      extra: {
        title: req.body?.title,
        courseName: req.body?.courseName,
        adminEmail: req.user?.email || "unknown"
      }
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error"
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
    /*
    =====================================
    ADMIN SECURITY CHECK
    =====================================
    */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only"
      });
    }

    /*
    =====================================
    GET REQUEST DATA
    =====================================
    */

    const { payload } = req.body;

    if (!payload) {
      return res.status(400).json({
        success: false,
        message: "Payload is required"
      });
    }

    const {
      courseName,
      question,
      options,
      answer
    } = payload;

    /*
    =====================================
    VALIDATION
    =====================================
    */

    if (
      !courseName ||
      !question ||
      !options ||
      !answer
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (
      !Array.isArray(options) ||
      !options.includes(answer)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Answer must be one of the provided options"
      });
    }

    /*
    =====================================
    CHECK COURSE EXISTS
    =====================================
    */

    const crossCheck = await courses.findOne({
      title: courseName
    });

    if (!crossCheck) {
      return res.status(404).json({
        success: false,
        message: "Selected course does not exist"
      });
    }

    /*
    =====================================
    FIND EXISTING MCQ COURSE
    =====================================
    */

    const findTheCourse =
      await McqBank.findOne({
        courseName
      });

    /*
    =====================================
    ADD TO EXISTING COURSE
    =====================================
    */

    if (findTheCourse) {
      findTheCourse.questions.push({
        question,
        options,
        answer
      });

      await findTheCourse.save();

      logAdminAction({
        adminEmail: req.user.email,
        action: "MCQ_ADDED",
        details: {
          courseName,
          question
        }
      });

      return res.status(200).json({
        success: true,
        message: "MCQ added to existing course",
        data: findTheCourse
      });
    }

    /*
    =====================================
    CREATE NEW MCQ COURSE
    =====================================
    */

    const newCourse = await McqBank.create({
      courseName,
      questions: [
        {
          question,
          options,
          answer
        }
      ]
    });

    logAdminAction({
      adminEmail: req.user.email,
      action: "MCQ_CREATED",
      details: {
        courseName,
        question
      }
    });

    return res.status(201).json({
      success: true,
      message: "New course and MCQ added",
      data: newCourse
    });

  } catch (error) {
    /*
    =====================================
    ERROR LOG
    =====================================
    */

    logError({
      route: "setMcq",
      error,
      extra: {
        adminEmail: req.user?.email || "unknown",
        courseName:
          req.body?.payload?.courseName || "unknown"
      }
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
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
  try {
    /*
    =====================================
    ADMIN SECURITY CHECK
    =====================================
    */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only"
      });
    }

    /*
    =====================================
    GET REQUEST DATA
    =====================================
    */

    const { courseTitle, title } = req.body;

    if (!courseTitle || !title) {
      return res.status(400).json({
        success: false,
        message: "Course title and video title are required"
      });
    }

    console.log("📩 Title received:", courseTitle);

    /*
    =====================================
    FIND COURSE
    =====================================
    */

    const course = await courses.findOne({
      title: courseTitle
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    console.log("🎯 Course found:", course);

    /*
    =====================================
    FIND VIDEO
    =====================================
    */

    const videoToDelete = course.videos.find(
      (video) => video.title === title
    );

    if (!videoToDelete) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }

    /*
    =====================================
    DELETE VIDEO FROM ARRAY
    =====================================
    */

    course.videos = course.videos.filter(
      (video) => video.title !== title
    );

    await course.save();

    /*
    =====================================
    ADMIN ACTION LOG
    =====================================
    */

    logAdminAction({
      adminEmail: req.user.email,
      action: "VIDEO_DELETED",
      details: {
        courseTitle,
        videoTitle: title
      }
    });

    /*
    =====================================
    SUCCESS RESPONSE
    =====================================
    */

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully"
    });

  } catch (error) {
    /*
    =====================================
    ERROR LOG
    =====================================
    */

    logError({
      route: "selectedCourseforDelete",
      error,
      extra: {
        courseTitle: req.body?.courseTitle,
        title: req.body?.title,
        adminEmail: req.user?.email || "unknown"
      }
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
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
    const { user, courseName,  comment, videoTitle } = req.body;
    const findCourse = await courses.findOne({ title: courseName });
// console.log("user",user.username)
    if (!findCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    const video = findCourse.videos.find(v => v.title === videoTitle);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if(user){
 const newComment = {
      user: user || 'Anonymous',
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
  getFreeCourses,
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
    getSignature,
    refreshToken,
    logoutUser

};
