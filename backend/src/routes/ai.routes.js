const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { validateAI } = require('../middleware/validation');
const { generate } = require('../controllers/ai.controller');

router.post('/generate', protect, validateAI, generate);

module.exports = router;


