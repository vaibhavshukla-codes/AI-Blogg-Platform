const { generateBlogFromPrompt } = require('../services/ai.service');

async function generate(req, res, next) {
  try {
    const { prompt } = req.body;
    if (!prompt) { res.status(400); throw new Error('prompt required'); }
    const text = await generateBlogFromPrompt(prompt);
    
    // Expecting the model to output JSON; try parsing but be lenient
    let parsed;
    try {
      // Clean up markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (_) {
          parsed = { raw: text, title: 'AI Generated Content', content: text };
        }
      } else {
        parsed = { raw: text, title: 'AI Generated Content', content: text };
      }
    }
    res.json({ result: parsed });
  } catch (e) { next(e); }
}

async function testConnection(req, res, next) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'OPENAI_API_KEY not configured',
        suggestion: 'Add your OpenAI API key to the .env file'
      });
    }
    
    // Test with a simple prompt
    const text = await generateBlogFromPrompt('Write a single sentence about AI');
    res.json({ 
      status: 'success',
      message: 'OpenAI API is working correctly',
      sample: text.substring(0, 100)
    });
  } catch (e) {
    res.status(500).json({ 
      error: e.message,
      suggestion: 'Please check your OpenAI API key and account credits at https://platform.openai.com/account/billing'
    });
  }
}

module.exports = { generate, testConnection };


