const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const arr = errors.array();
    return res.status(400).json({
      message: arr[0]?.msg || 'Validation failed',
      errors: arr
    });
  }
  next();
};

const validateRegister = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Please enter a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const validateLogin = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Please enter a valid email address'),
  body('password').notEmpty().withMessage('Password required'),
  handleValidationErrors
];

const validatePost = [
  body('title').trim().isLength({ min: 1 }).withMessage('Title required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content required'),
  body('category').optional().trim(),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('summary').optional().trim(),
  body('metaDescription').optional().trim(),
  handleValidationErrors
];

const validatePostUpdate = [
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('content').optional().trim().isLength({ min: 1 }).withMessage('Content cannot be empty'),
  body('category').optional().trim(),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('summary').optional().trim(),
  body('metaDescription').optional().trim(),
  handleValidationErrors
];

const validateComment = [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment must be 1-2000 characters'),
  body('postId').isMongoId().withMessage('Valid post ID required'),
  body('parent').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Valid parent comment ID required'),
  handleValidationErrors
];

const validateCommentUpdate = [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment must be 1-2000 characters'),
  handleValidationErrors
];

const validateCategory = [
  body('name').trim().isLength({ min: 1 }).withMessage('Category name required'),
  body('description').optional().trim(),
  handleValidationErrors
];

const validateAI = [
  body('prompt').trim().isLength({ min: 10 }).withMessage('Prompt must be at least 10 characters'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validatePost,
  validatePostUpdate,
  validateComment,
  validateCommentUpdate,
  validateCategory,
  validateAI,
  handleValidationErrors
};
