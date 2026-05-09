
const express = require("express");

const upload = require("../middleware/upload");

const {refreshToken,logoutUser,sendResetOTP, verifyResetOTP,registerUser,verifyOTPAndRegister,loginUser,resetPass,updateProfile,addTask,getSchedule ,deleteTask,toggleDone,addCourses,buyCourse,getUserCourses,getAllCourses,getAllComments,getCommentsReplies,currentSelectedCourse,createAnAnnouncement,getFreeCourses,uploadVideo,videoOrder,mcqAns,setMcq,getMcq,selectedCourseforDelete,createLiveSessions,getLiveSessions,getAllAnnouncements,getSignature,comments,addReply,addFaq, getFaq, resendOTP} = require("../controllers/authController"); // ✅ Correct Import
const crypto = require("crypto");
const Razorpay = require("razorpay");
const isAdmin = require("../middleware/isAdmin");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const {
  logError,
  logAdminAction
} = require("../utils/loggers");
const verifyToken = require("../middleware/verifytoken");
const router = express.Router();
// const authCtrl = require("../controllers/authController");
const User = require("../models/users");
const admin = require("../models/admin");
const courses = require("../models/courses");
const {
  otpLimiter,
  loginLimiter
} = require("../middleware/rateLimiter");
// Route for user registration
router.post("/register", registerUser);
router.post('/verify', verifyOTPAndRegister);
router.post(
  "/login",
  loginLimiter,
  loginUser
);
router.post(
  "/resendOTP",
  otpLimiter,
  resendOTP
);
router.post(
  "/sendResetOtp",
  otpLimiter,
  sendResetOTP
);
router.post("/verifyResetOTP", verifyResetOTP);
router.post("/resetPass", resetPass);
router.post("/updateProfile", upload.single("avatar"), updateProfile);
router.post("/addTask", addTask);

router.post("/getSchedule", getSchedule);
router.post("/deleteTask", deleteTask);
router.post("/toggleDone", toggleDone);
router.post(
  "/addCourses",
  verifyToken,
  isAdmin,
  upload.single("thumbnail"),
  addCourses
);
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
router.post("/getFreeCourses",getFreeCourses)

router.post(
  "/selectedCourseforDelete",
  verifyToken,
  isAdmin,
  selectedCourseforDelete
)
router.post("/createOrder", verifyToken, async (req, res) => {
  try {
    /*
    =====================================
    USER SECURITY CHECK
    =====================================
    */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    /*
    =====================================
    GET REQUEST DATA
    =====================================
    */

    const { courseTitle } = req.body;

    if (!courseTitle) {
      return res.status(400).json({
        success: false,
        message: "Course title is required"
      });
    }

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

    /*
    =====================================
    CHECK IF USER EXISTS
    =====================================
    */

    const existingUser = await req.user.findById(
      req.user.id
    );

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    /*
    =====================================
    PREVENT DUPLICATE PURCHASE
    =====================================
    */

    if (
      existingUser.courses.includes(course.title)
    ) {
      return res.status(409).json({
        success: false,
        message: "Course already purchased"
      });
    }

    /*
    =====================================
    CREATE RAZORPAY ORDER
    =====================================
    */

    const options = {
      amount: Number(course.fees) * 100, // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(
      options
    );

    /*
    =====================================
    SUCCESS RESPONSE
    =====================================
    */

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      order,
      courseTitle: course.title
    });

  } catch (error) {
    /*
    =====================================
    ERROR LOG
    =====================================
    */

    logError({
      route: "createOrder",
      error,
      extra: {
        courseTitle: req.body?.courseTitle,
        userId: req.user?.id || "unknown",
        userEmail: req.user?.email || "unknown"
      }
    });

    return res.status(500).json({
      success: false,
      message: "Payment initialization failed"
    });
  }
});

router.post("/verifyPayment",verifyToken, async (req, res) => {
    try {
    /*
    =====================================
    USER SECURITY CHECK
    =====================================
    */

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    /*
    =====================================
    GET REQUEST DATA
    =====================================
    */

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseTitle
    } = req.body;

    /*
    =====================================
    VALIDATION
    =====================================
    */

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !courseTitle
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment details"
      });
    }

    /*
    =====================================
    VERIFY SIGNATURE
    =====================================
    */

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    if (
      generatedSignature !== razorpay_signature
    ) {
      logError({
        route: "verifyPayment",
        error: "Invalid Razorpay signature",
        extra: {
          userId: req.user.id,
          userEmail: req.user.email,
          courseTitle
        }
      });

      return res.status(400).json({
        success: false,
        message: "Payment verification failed"
      });
    }

    /*
    =====================================
    FIND USER
    =====================================
    */

    const existingUser = await req.user.findById(
      req.user.id
    );

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    /*
    =====================================
    PREVENT DUPLICATE COURSE SAVE
    =====================================
    */

    if (
      !existingUser.courses.includes(courseTitle)
    ) {
      existingUser.courses.push(courseTitle);
      await existingUser.save();
    }

    /*
    =====================================
    SUCCESS RESPONSE
    =====================================
    */

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully"
    });

  } catch (error) {
    /*
    =====================================
    ERROR LOG
    =====================================
    */

    logError({
      route: "verifyPayment",
      error,
      extra: {
        userId: req.user?.id || "unknown",
        userEmail: req.user?.email || "unknown",
        courseTitle: req.body?.courseTitle
      }
    });

    return res.status(500).json({
      success: false,
      message: "Payment verification failed"
    });
  }
});

 router.get("/getAllCourses", getAllCourses);
 
 router.get('/version', (req, res) => {
  // return res.json({ requiredVersion: process.env.EXPO_PUBLIC_REQ_VERSION || '1.0.0' });
  return res.json({ requiredVersion:   process.env.EXPO_PUBLIC_REQ_VERSION || '1.0.0' });

});
 router.post("/getComments", getAllComments);
 router.post("/getCommentsReplies", getCommentsReplies);

router.post("/addComment",comments)
router.post("/refresh-token", refreshToken);
router.post("/logout", logoutUser);

router.post("/currentSelectedCourse",currentSelectedCourse)
router.post("/createAnAnnouncement", createAnAnnouncement);
router.post("/getAllAnnouncements", getAllAnnouncements);
router.post("/getComments", getAllComments)


router.post(
  "/uploadVideo",
  verifyToken,
  isAdmin,
  upload.single("video"),
  uploadVideo
);
router.post("/next_prev",videoOrder)
router.post("/mcqans",mcqAns)
router.post(
  "/setMcq",
  verifyToken,
  isAdmin,
  setMcq
);
router.post("/getMcqs",getMcq)
router.get("/getFaq",getFaq)

 router.post("/comments", comments);
router.post("/reply", addReply);
router.post("/faq", addFaq);

router.get("/cloudinary-signature",getSignature );



module.exports = router;
