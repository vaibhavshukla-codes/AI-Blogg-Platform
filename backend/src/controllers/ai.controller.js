const { generateBlogFromPrompt } = require('../services/ai.service');

async function generate(req, res, next) {
  try {
    const { prompt } = req.body;
    if (!prompt) { 
      res.status(400); 
      throw new Error('Prompt is required for AI generation'); 
    }
    
    // Validate prompt length
    if (prompt.length < 10) {
      res.status(400);
      throw new Error('Prompt is too short. Please provide a more detailed description (at least 10 characters).');
    }
    
    if (prompt.length > 1000) {
      res.status(400);
      throw new Error('Prompt is too long. Please keep it under 1000 characters.');
    }
    
    console.log('🤖 Generating AI content for prompt:', prompt.substring(0, 100) + '...');
    const text = await generateBlogFromPrompt(prompt);
    console.log('📄 Raw AI response length:', text.length, 'characters');
    console.log('📄 First 200 chars:', text.substring(0, 200) + '...');
    
    // Parse the AI response
    let parsed;
    try {
      // Remove markdown code blocks if present (in case AI adds them despite instructions)
      let cleanText = text
        .replace(/```json\s*/gi, '')
        .replace(/```javascript\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // Remove any leading/trailing text before/after JSON
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      parsed = JSON.parse(cleanText);
      console.log('✅ Successfully parsed AI response');
      
      // Validate and sanitize required fields
      if (!parsed.title || !parsed.content) {
        console.warn('⚠️ Missing required fields, adding defaults');
        parsed.title = parsed.title || 'AI Generated Post';
        parsed.content = parsed.content || '<p>Content generation incomplete. Please try again.</p>';
      }
      
      // Ensure summary exists
      if (!parsed.summary) {
        // Generate summary from content
        const plainText = parsed.content.replace(/<[^>]*>/g, '').trim();
        parsed.summary = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
        console.log('📝 Generated summary from content');
      }
      
      // Ensure category exists
      if (!parsed.category) {
        parsed.category = 'General';
        console.log('📝 Set default category: General');
      }
      
      // Ensure tags is an array and properly formatted
      if (!parsed.tags) {
        parsed.tags = [];
      } else if (!Array.isArray(parsed.tags)) {
        if (typeof parsed.tags === 'string') {
          parsed.tags = parsed.tags.split(',').map(t => t.trim().toLowerCase());
        } else {
          parsed.tags = [];
        }
      } else {
        // Ensure all tags are lowercase strings
        parsed.tags = parsed.tags.map(t => String(t).trim().toLowerCase()).filter(Boolean);
      }
      
      // Validate content has HTML tags
      if (!parsed.content.includes('<')) {
        parsed.content = `<p>${parsed.content}</p>`;
        console.log('📝 Wrapped plain text content in paragraph tags');
      }
      
      console.log('✅ Validation complete:', {
        title: parsed.title.substring(0, 50),
        contentLength: parsed.content.length,
        summaryLength: parsed.summary.length,
        category: parsed.category,
        tagsCount: parsed.tags.length
      });
      
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError.message);
      console.log('📝 Attempting fallback parsing...');
      
      // Fallback: try to extract JSON from anywhere in the text
      const jsonMatch = text.match(/\{[\s\S]*"title"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          console.log('✅ Fallback parsing successful');
          
          // Apply same validations
          if (!parsed.summary) {
            const plainText = (parsed.content || text).replace(/<[^>]*>/g, '').trim();
            parsed.summary = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
          }
          if (!parsed.category) parsed.category = 'General';
          if (!Array.isArray(parsed.tags)) parsed.tags = [];
          
        } catch (_) {
          console.error('❌ Fallback parsing also failed');
          // Last resort: create a structured response from the raw text
          const plainText = text.replace(/<[^>]*>/g, '').trim();
          parsed = {
            title: 'AI Generated Content',
            content: text.includes('<') ? text : `<p>${text}</p>`,
            summary: plainText.substring(0, 150) + (plainText.length > 150 ? '...' : ''),
            tags: ['ai-generated'],
            category: 'General'
          };
          console.log('⚠️ Using fallback structure with raw AI output');
        }
      } else {
        console.error('❌ Could not find JSON in response');
        const plainText = text.replace(/<[^>]*>/g, '').trim();
        parsed = {
          title: 'AI Generated Content',
          content: text.includes('<') ? text : `<p>${text}</p>`,
          summary: plainText.substring(0, 150) + (plainText.length > 150 ? '...' : ''),
          tags: ['ai-generated'],
          category: 'General'
        };
        console.log('⚠️ Using fallback structure');
      }
    }
    
    console.log('📤 Sending parsed result to frontend');
    res.json({ result: parsed });
  } catch (e) { 
    console.error('❌ AI generation error:', e.message);
    console.error('Stack:', e.stack);
    next(e); 
  }
}

async function testConnection(req, res, next) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY not configured',
        suggestion: 'Add your Gemini API key to the .env file. Get it at https://makersuite.google.com/app/apikey'
      });
    }
    
    // Test with a simple prompt
    const text = await generateBlogFromPrompt('Write a single sentence about AI');
    res.json({ 
      status: 'success',
      message: 'Gemini API is working correctly',
      sample: text.substring(0, 100),
      apiKeyConfigured: true
    });
  } catch (e) {
    res.status(500).json({ 
      error: e.message,
      suggestion: 'Please check your Gemini API key at https://makersuite.google.com/app/apikey'
    });
  }
}

module.exports = { generate, testConnection };


