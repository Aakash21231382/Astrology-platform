const { uploadToRemoteContainer } = require('../services/uploadService');

/**
 * Upload single file and return CDN variant URL
 * POST /api/upload
 */
async function uploadFile(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file provided in form-data field "file"'
            });
        }

        const result = await uploadToRemoteContainer(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                url: result.url,
                id: result.id,
                filename: result.filename
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    uploadFile
};
