const express = require('express');
const multer = require('multer');
const { uploadFile } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure in-memory storage for forwarding to remote file container
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 15 * 1024 * 1024 // 15 MB
    }
});

// Any authenticated user (Customer, Expert, Admin) or initial signup can upload
router.post('/', upload.single('file'), uploadFile);

module.exports = router;
