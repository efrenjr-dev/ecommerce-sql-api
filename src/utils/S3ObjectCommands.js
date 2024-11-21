const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");
const { s3Client } = require("../config/s3Client.js");
const config = require("../config/config.js");
const logger = require("../config/logger.js");

const uploadToS3 = async (file) => {
    try {
        const optimizedImage = await sharp(file.buffer)
            .resize({ width: 800 })
            .toFormat("jpeg")
            .jpeg({ quality: 80 })
            .toBuffer();

        const params = {
            Bucket: config.aws.bucketName,
            Key: `${Date.now()}-${file.originalname.split(".")[0]}.jpeg`,
            Body: optimizedImage,
            ContentType: "image/jpeg",
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

const deleteImagesFromS3 = async (imageUrls) => {
    const deletePromises = imageUrls.map(async (imageUrl) => {
        const key = getKeyFromUrl(imageUrl);
        if (key) {
            const command = new DeleteObjectCommand({
                Bucket: config.aws.bucketName,
                Key: key,
            });

            try {
                await s3Client.send(command);
                logger.debug(`Successfully deleted image with key: ${key}`);
            } catch (error) {
                logger.error(`Error deleting image with key: ${key}`, error);
                throw new Error(`Error deleting image with key: ${key}`);
            }
        } else {
            logger.warn(`Invalid URL, unable to extract key: ${imageUrl}`);
        }
    });

    await Promise.all(deletePromises);
};
const getKeyFromUrl = (url) => {
    const regex = /https:\/\/([^.]+)\.s3\.[a-z0-9-]+\.amazonaws\.com\/(.+)/;
    const match = url.match(regex);
    return match ? match[2] : null;
};

// Export both functions
module.exports = { uploadToS3, deleteImagesFromS3 };
