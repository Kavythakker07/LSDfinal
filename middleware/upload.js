const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
 params: async (req, file) => {
  let folder = "uploads";

  if (req.originalUrl.includes("uploadVideo")) {
    folder = "videos";
  } else if (req.originalUrl.includes("updateProfile")) {
    folder = "avatars";
  } else if (req.originalUrl.includes("addCourses")) {
    folder = "thumbnails";
  }

  return {
    folder,
    resource_type: "auto",
    public_id: Date.now() + "-" + file.originalname.split('.')[0], // 🔥 FIX DOUBLE EXT
  };
}
});

const upload = multer({ storage });

module.exports = upload;


