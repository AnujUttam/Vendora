const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");
const fs = require("fs");

let s3Client = null;
const isS3Configured = Boolean(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET &&
  process.env.AWS_REGION
);

if (isS3Configured) {
  try {
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    console.log("AWS S3 Client Initialized successfully.");
  } catch (err) {
    console.warn("AWS S3 initialization warning:", err.message);
  }
}

/**
 * Upload a file buffer or file path to AWS S3 (or fallback to local disk storage).
 */
const uploadToS3 = async (file) => {
  const extension = path.extname(file.originalname || file.name || ".jpg");
  const uniqueName = `products/${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

  if (s3Client && isS3Configured) {
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: uniqueName,
        Body: file.buffer,
        ContentType: file.mimetype
      });

      await s3Client.send(command);

      const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueName}`;
      return {
        url: s3Url,
        provider: "s3",
        key: uniqueName
      };
    } catch (error) {
      console.warn("S3 upload failed, falling back to local storage:", error.message);
    }
  }

  // Local storage fallback
  const uploadsDir = path.join(__dirname, "../uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const localFileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const localFilePath = path.join(uploadsDir, localFileName);

  fs.writeFileSync(localFilePath, file.buffer);

  const localUrl = `/uploads/${localFileName}`;
  return {
    url: localUrl,
    provider: "local",
    key: localFileName
  };
};

module.exports = {
  uploadToS3,
  isS3Configured
};
