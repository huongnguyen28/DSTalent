const multer = require('multer');
const appRoot = require('app-root-path');
const crypto = require('crypto');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, appRoot + '\\public\\upload');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        cb(null, uniqueSuffix + file.originalname);
    }
});

module.exports = storage;