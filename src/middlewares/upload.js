const multer = require("multer");

const storage = multer.memoryStorage(); // Store files in memory buffer
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only JPEG, PNG, and GIF files are allowed"));
        }
        cb(null, true);
    },
});

module.exports = { upload };
