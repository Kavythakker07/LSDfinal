
const express = require("express");

const upload = require("../middleware/upload");

const {sendResetOTP, verifyResetOTP,registerUser,verifyOTPAndRegister,loginUser,resetPass,updateProfile,addTask,getSchedule ,deleteTask,toggleDone,addCourses,buyCourse,getUserCourses,getAllCourses,getAllComments,getCommentsReplies,currentSelectedCourse,createAnAnnouncement,uploadVideo,videoOrder,mcqAns,setMcq,getMcq,selectedCourseforDelete,createLiveSessions,getLiveSessions,getAllAnnouncements,getSignature,comments,addReply,addFaq, getFaq, resendOTP} = require("../controllers/authController"); // ✅ Correct Import
const crypto = require("crypto");
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const verifyToken = require("../middleware/verifytoken");
const router = express.Router();
// const authCtrl = require("../controllers/authController");
const User = require("../models/users");
const admin = require("../models/admin");
const courses = require("../models/courses");

// Route for user registration
router.post("/register", registerUser);
router.post('/verify', verifyOTPAndRegister);
router.post("/login", loginUser);
router.post("/resendOTP", resendOTP);
router.post("/sendResetOTP", sendResetOTP);
router.post("/verifyResetOTP", verifyResetOTP);
router.post("/resetPass", resetPass);
router.post("/updateProfile", upload.single("avatar"), updateProfile);
router.post("/addTask", addTask);

router.post("/getSchedule", getSchedule);
router.post("/deleteTask", deleteTask);
router.post("/toggleDone", toggleDone);
router.post("/addCourses", upload.single("thumbnail"), addCourses);

router.post("/buyCourse", buyCourse);
router.post("/createLiveSessions", createLiveSessions);
router.post("/getLiveSessions",getLiveSessions)



router.post("/saveUserCourse", verifyToken, async (req, res) => {
  const { courseTitle, razorpayPaymentId } = req.body;

  const userEmail = req.user.email; // 🔥 SECURE

  try {
    console.log(userEmail, courseTitle, razorpayPaymentId);

    const user = await User.findOne({ email: userEmail });

    if (!user || !courseTitle) {
      return res.status(404).json({ message: "User or course not found" });
    }

    if (user.courses.includes(courseTitle)) {
      return res.status(409).json({ message: "Course already added" });
    }

    user.courses.push(courseTitle);
    await user.save();

    res.status(200).json({
      message: "Course saved to user",
      userCourseDetails: user
    });

  } catch (err) {
    console.error("❌ Backend error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/getUserCourses",getUserCourses)
router.post("/selectedCourseforDelete",selectedCourseforDelete)
router.post("/createOrder", verifyToken, async (req, res) => {
  try {
    const { courseTitle } = req.body;

    const course = await courses.findOne({ title: courseTitle });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const options = {
      amount: course.fees * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Order failed" });
  }
});

router.post("/verifyPayment",verifyToken, async (req, res) => {
  try {
    const { payment_id, order_id, signature, courseTitle } = req.body;
    const userEmail = req.user.email; // ✅ SECURE

    const body = order_id + "|" + payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // ✅ AFTER VERIFY → CALL YOUR EXISTING LOGIC
    const user = await User.findOne({ email: userEmail });

    if (!user || !courseTitle) {
      return res.status(404).json({ message: "User or course not found" });
    }

    if (user.courses.includes(courseTitle)) {
      return res.status(409).json({ message: "Course already added" });
    }

    user.courses.push(courseTitle);
    await user.save();

    res.json({
      success: true,
      userCourseDetails: user,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

 router.get("/getAllCourses", getAllCourses);
 router.get('/version', (req, res) => {
  // return res.json({ requiredVersion: process.env.EXPO_PUBLIC_REQ_VERSION || '1.0.0' });
  return res.json({ requiredVersion:   process.env.EXPO_PUBLIC_REQ_VERSION || '1.0.0' });

});
 router.post("/getComments", getAllComments);
 router.post("/getCommentsReplies", getCommentsReplies);


router.post("/currentSelectedCourse",currentSelectedCourse)
router.post("/createAnAnnouncement", createAnAnnouncement);
router.post("/getAllAnnouncements", getAllAnnouncements);

router.post("/uploadVideo", upload.single("video"), uploadVideo);

router.post("/next_prev",videoOrder)
router.post("/mcqans",mcqAns)
router.post("/setMcq",setMcq)
router.post("/getMcqs",getMcq)
router.get("/getFaq",getFaq)

 router.post("/comments", comments);
router.post("/reply", addReply);
router.post("/faq", addFaq);

router.get("/cloudinary-signature",getSignature );



module.exports = router;
