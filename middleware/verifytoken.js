const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  console.log("=================================");
  console.log("VERIFY TOKEN START");

  console.log("FULL HEADERS =>", req.headers);

  const authHeader = req.headers.authorization;

  console.log("AUTH HEADER =>", authHeader);

  if (!authHeader) {
    console.log("❌ No Authorization header found");

    return res.status(401).json({
      message: "No token provided"
    });
  }

  const token = authHeader.split(" ")[1];

  console.log("TOKEN =>", token);

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    console.log("✅ DECODED USER =>", decoded);

    req.user = decoded;

    next();

  } catch (err) {
    console.log("❌ TOKEN FAILED =>", err.message);

    return res.status(401).json({
      message: err.message
    });
  }
};

module.exports = verifyToken;