const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { validateComment } = require('../middleware/validation');
const { addComment, getComments, toggleReaction, moderate } = require('../controllers/comment.controller');

router.get('/:postId', getComments);
router.post('/', protect, validateComment, addComment);
router.post('/:id/react', protect, toggleReaction);
router.put('/:id/moderate', protect, authorize('admin'), moderate);

module.exports = router;


