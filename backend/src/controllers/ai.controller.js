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
      
      // Try to find JSON object in the response (more aggressive extraction)
      // Look for the outermost { } pair that contains "title" field
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log('🔍 Attempting to parse cleaned text (first 300 chars):', cleanText.substring(0, 300));
      
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
      console.log('📄 Problematic text (first 500 chars):', text.substring(0, 500));
      console.log('📝 Attempting aggressive fallback parsing...');
      
      // Fallback 1: Try to find JSON with "title" field
      const titleMatch = text.match(/\{[^{}]*"title"\s*:\s*"[^"]*"[^{}]*(?:\{[^}]*\}[^{}]*)*\}/);
      if (titleMatch) {
        try {
          parsed = JSON.parse(titleMatch[0]);
          console.log('✅ Fallback parsing successful with title match');
          
          // Apply validations
          if (!parsed.summary) {
            const plainText = (parsed.content || '').replace(/<[^>]*>/g, '').trim();
            parsed.summary = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
          }
          if (!parsed.category) parsed.category = 'General';
          if (!parsed.tags || !Array.isArray(parsed.tags)) parsed.tags = [];
          if (!parsed.content) parsed.content = '<p>AI generation incomplete. Please try again.</p>';
          
        } catch (fallbackError) {
          console.error('❌ Fallback parsing failed:', fallbackError.message);
          parsed = null;
        }
      }
      
      // Fallback 2: Manual field extraction from text
      if (!parsed) {
        console.log('⚠️ Manual field extraction from AI response...');
        
        try {
          // Try to extract fields manually
          const titleMatch = text.match(/"title"\s*:\s*"([^"]*)"/);
          const contentMatch = text.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          const summaryMatch = text.match(/"summary"\s*:\s*"([^"]*)"/);
          const categoryMatch = text.match(/"category"\s*:\s*"([^"]*)"/);
          const tagsMatch = text.match(/"tags"\s*:\s*\[(.*?)\]/);
          
          if (titleMatch || contentMatch) {
            parsed = {
              title: titleMatch ? titleMatch[1] : 'AI Generated Post',
              content: contentMatch ? contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '<p>Content generation incomplete.</p>',
              summary: summaryMatch ? summaryMatch[1] : '',
              category: categoryMatch ? categoryMatch[1] : 'General',
              tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, '')) : []
            };
            
            // Ensure content has HTML
            if (!parsed.content.includes('<')) {
              parsed.content = `<p>${parsed.content}</p>`;
            }
            
            // Generate summary if missing
            if (!parsed.summary) {
              const plainText = parsed.content.replace(/<[^>]*>/g, '').trim();
              parsed.summary = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
            }
            
            console.log('✅ Manual extraction successful');
          }
        } catch (extractError) {
          console.error('❌ Manual extraction failed:', extractError.message);
        }
      }
      
      // Fallback 3: Last resort - return error
      if (!parsed) {
        console.error('❌ All parsing attempts failed');
        res.status(500);
        throw new Error('AI generated invalid response. Please try again with a different prompt. The AI service is working, but the response format was unexpected.');
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


