const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../config/s3Client.js");
const config = require("../config/config.js");
const logger = require("../config/logger.js");

const uploadToS3 = async (file) => {
    try {
        const params = {
            Bucket: config.aws.bucketName,
            Key: `${Date.now()}-${file.originalname}`, // Unique key for the file
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        const command = new PutObjectCommand(params);
        const response = await s3Client.send(command);
        logger.debug("S3 Response:", response);
        // Construct the public URL of the uploaded file
        const fileUrl = `https://${config.aws.bucketName}.s3.${config.aws.region}.amazonaws.com/${params.Key}`;
        logger.debug("File Url:", fileUrl);
        return fileUrl;
    } catch (error) {
        logger.error("Error uploading to S3:", error);
        throw new Error("File upload failed");
    }
};

module.exports = { uploadToS3 };
