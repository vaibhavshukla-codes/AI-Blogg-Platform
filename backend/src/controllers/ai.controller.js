const { generateBlogFromPrompt } = require('../services/ai.service');

async function generate(req, res, next) {
  try {
    const { prompt } = req.body;
    if (!prompt) { res.status(400); throw new Error('prompt required'); }
    const text = await generateBlogFromPrompt(prompt);
    // Expecting the model to output JSON; try parsing but be lenient
    let parsed;
    try { parsed = JSON.parse(text); } catch (_) { parsed = { raw: text }; }
    res.json({ result: parsed });
  } catch (e) { next(e); }
}

module.exports = { generate };


