const { generateBlogFromPrompt } = require('../services/ai.service');
const { parseBlogAiResponse } = require('../utils/ai-parse');

async function generate(req, res, next) {
  try {
    if (!process.env.GEMINI_API_KEY?.trim()) {
      res.status(503);
      throw new Error(
        'AI generation is not configured. Add GEMINI_API_KEY to backend/.env (free key: https://aistudio.google.com/apikey)'
      );
    }

    const { prompt } = req.body;
    if (!prompt) {
      res.status(400);
      throw new Error('Prompt is required for AI generation');
    }

    if (prompt.length < 10) {
      res.status(400);
      throw new Error('Prompt is too short. Please provide a more detailed description (at least 10 characters).');
    }

    if (prompt.length > 1000) {
      res.status(400);
      throw new Error('Prompt is too long. Please keep it under 1000 characters.');
    }

    const text = await generateBlogFromPrompt(prompt);
    const parsed = parseBlogAiResponse(text);
    res.json({ result: parsed });
  } catch (e) {
    console.error('AI generation error:', e.message);

    if (!res.headersSent) {
      const message = e.message || 'AI generation failed';
      if (message.includes('not configured') || message.includes('suspended') || message.includes('invalid')) {
        res.status(503);
      } else if (
        message.includes('AI returned')
        || message.includes('invalid response')
        || message.includes('blocked')
        || message.includes('overloaded')
        || message.includes('quota')
        || message.includes('Rate limit')
      ) {
        res.status(502);
      } else {
        res.status(500);
      }
    }

    next(e);
  }
}

async function testConnection(req, res, next) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY not configured',
        suggestion: 'Add your Gemini API key to backend/.env. Get it at https://aistudio.google.com/apikey',
      });
    }

    const text = await generateBlogFromPrompt('Write a single sentence about artificial intelligence for beginners.');
    const parsed = parseBlogAiResponse(text);

    res.json({
      status: 'success',
      message: 'Gemini API is working correctly',
      title: parsed.title,
      apiKeyConfigured: true,
    });
  } catch (e) {
    res.status(500).json({
      error: e.message,
      suggestion: 'Check GEMINI_API_KEY at https://aistudio.google.com/apikey',
    });
  }
}

module.exports = { generate, testConnection };
