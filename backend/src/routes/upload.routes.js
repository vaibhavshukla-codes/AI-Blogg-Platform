const router = require('express').Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../controllers/upload.controller');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  }
});

function handleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    res.status(400);
    return next(err);
  });
}

router.post('/image', protect, handleUpload, uploadImage);

module.exports = router;
