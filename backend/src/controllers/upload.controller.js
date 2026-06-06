const { configureCloudinary } = require('../utils/cloudinary');
const { Readable } = require('stream');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

function getBaseUrl(req) {
  return process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
}

function getFileExtension(file) {
  const fromName = path.extname(file.originalname || '').toLowerCase();
  if (fromName) return fromName;
  const mimeExtension = (file.mimetype || '').split('/')[1];
  return mimeExtension ? `.${mimeExtension}` : '';
}

async function saveLocalImage(req) {
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomUUID()}${getFileExtension(req.file)}`;
  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, req.file.buffer);

  return {
    url: `${getBaseUrl(req)}/uploads/${filename}`,
    public_id: filename,
    storage: 'local'
  };
}

async function uploadImage(req, res, next) {
  try {
    if (!req.file) { 
      res.status(400); 
      throw new Error('No file uploaded'); 
    }
    
    const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME
      && process.env.CLOUDINARY_API_KEY
      && process.env.CLOUDINARY_API_SECRET;

    if (!hasCloudinaryConfig) {
      const result = await saveLocalImage(req);
      return res.status(201).json(result);
    }

    const cloudinary = configureCloudinary();

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'ai-blog-platform',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      Readable.from(req.file.buffer).pipe(uploadStream);
    });

    return res.status(201).json({
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      storage: 'cloudinary',
    });
  } catch (e) { 
    console.error('Upload controller error:', e);
    next(e); 
  }
}

module.exports = { uploadImage };


