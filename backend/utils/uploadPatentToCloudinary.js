const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// Allowed MIME types for patent documents
const ALLOWED_TYPES = {
  "application/pdf": { resource_type: "image", format: "pdf" },
  "image/jpeg":      { resource_type: "image", format: "jpg" },
  "image/png":       { resource_type: "image", format: "png" },
  "image/tiff":      { resource_type: "image", format: "tiff" },
  // Office docs — must stay as "raw" but we handle download differently
  "application/msword":                                                  { resource_type: "raw", format: "doc" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { resource_type: "raw", format: "docx" },
};

const uploadPatentToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const mimeConfig = ALLOWED_TYPES[file.mimetype] || { resource_type: "raw", format: undefined };

    const publicId = `${Date.now()}-${file.originalname.replace(/\s+/g, "_").replace(/\.[^/.]+$/, "")}`;

    const uploadOptions = {
      folder: "IPR_web/patents",
      resource_type: mimeConfig.resource_type,
      public_id: publicId,
      // Key fix: flag=attachment makes Cloudinary serve the file as a download
      flags: "attachment",
      // Store original filename so the browser uses it when downloading
      context: `original_filename=${file.originalname}`,
    };

    // For PDFs uploaded as "image" resource type, preserve quality
    if (file.mimetype === "application/pdf") {
      uploadOptions.pages = true;   // process all pages
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);

        // Build a reliable download URL
        // - For image/pdf resource types: append fl_attachment to the URL
        // - For raw: use the secure_url directly (already attachment-flagged)
        const downloadUrl = mimeConfig.resource_type === "image"
          ? result.secure_url.replace("/upload/", "/upload/fl_attachment/")
          : result.secure_url;

        resolve({
          ...result,
          download_url: downloadUrl,       // always use this for downloads
          original_filename: file.originalname,
          resource_type: mimeConfig.resource_type,
        });
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

module.exports = uploadPatentToCloudinary;