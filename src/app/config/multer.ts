import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "video/mp4",
      "video/quicktime",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }

    // Enforce stricter size per file type
    const imageSize = 5 * 1024 * 1024;   // 5 MB for images
    const videoSize = 50 * 1024 * 1024;  // 50 MB for videos
    const pdfSize = 10 * 1024 * 1024;    // 10 MB for PDFs

    if (file.mimetype.startsWith("image/") && file.size > imageSize) {
      return cb(new Error("Image files must be under 5 MB"));
    }
    if (file.mimetype === "application/pdf" && file.size > pdfSize) {
      return cb(new Error("PDF files must be under 10 MB"));
    }
    if (file.mimetype.startsWith("video/") && file.size > videoSize) {
      return cb(new Error("Video files must be under 50 MB"));
    }

    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});