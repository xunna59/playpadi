const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../upload/');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Create a flexible storage configuration that selects the destination folder based on file field name
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Determine folder based on the field name
        let folderName;
        if (file.fieldname === 'display_picture') {
            folderName = 'display_img';
        } else if (file.fieldname === 'cover_photo') {
            folderName = 'cover_photo';
        } else if (file.fieldname === 'youtube_cover') {
            folderName = 'youtube';
        } else {
            folderName = 'others'; // Optional fallback folder
        }

        const targetDir = path.join(uploadDir, folderName);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        // Create a unique file name using a timestamp and the original file name
        const fileName = `${Date.now()}_${file.originalname}`;
        cb(null, fileName);
    },
});

// Create a single multer instance with the above storage and file filter settings
const flexibleUpload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);
        if (extname && mimeType) {
            return cb(null, true);
        } else {
            return cb(new Error('Only images (jpeg, jpg, png) are allowed'));
        }
    },

    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max size

});

module.exports = flexibleUpload;