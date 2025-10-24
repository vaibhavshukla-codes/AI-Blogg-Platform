const { configureCloudinary } = require('../utils/cloudinary');

async function uploadImage(req, res, next) {
  try {
    if (!req.file) { res.status(400); throw new Error('No file uploaded'); }
    const cloudinary = configureCloudinary();
    const result = await cloudinary.uploader.upload_stream({ folder: 'ai-blog-platform' }, (error, uploadResult) => {
      if (error) return next(error);
      return res.status(201).json({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
    });
    // pipe buffer to stream
    const stream = result; // returned stream
    stream.end(req.file.buffer);
  } catch (e) { next(e); }
}

module.exports = { uploadImage };



