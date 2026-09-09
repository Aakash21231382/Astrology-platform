const axios = require('axios');
const FormData = require('form-data');

const UPLOAD_URL = process.env.UPLOAD_SERVICE_URL || 'https://host0008-001-site1.qtempurl.com/api/uploadfile';

/**
 * Upload a file buffer to the remote file container API
 * @param {Buffer} fileBuffer 
 * @param {string} originalname 
 * @param {string} mimetype 
 * @returns {Promise<string>} Public URL of the uploaded file
 */
async function uploadToRemoteContainer(fileBuffer, originalname, mimetype) {
    try {
        const formData = new FormData();
        formData.append('file', fileBuffer, {
            filename: originalname,
            contentType: mimetype
        });

        const response = await axios.post(UPLOAD_URL, formData, {
            headers: {
                ...formData.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 60000 // 60s
        });

        if (response.data && response.data.success && response.data.result && response.data.result.variants && response.data.result.variants.length > 0) {
            return {
                url: response.data.result.variants[0],
                id: response.data.result.id,
                filename: response.data.result.filename
            };
        } else if (response.data && response.data.result && response.data.result.variants && response.data.result.variants.length > 0) {
            return {
                url: response.data.result.variants[0],
                id: response.data.result.id,
                filename: response.data.result.filename
            };
        } else {
            throw new Error(`Invalid response structure from upload service: ${JSON.stringify(response.data)}`);
        }
    } catch (error) {
        console.error('[UploadService] Error uploading file to remote service:', error.message);
        if (error.response) {
            console.error('[UploadService] Response data:', error.response.data);
        }
        throw new Error(`Failed to upload file: ${error.message}`);
    }
}

module.exports = {
    uploadToRemoteContainer
};
