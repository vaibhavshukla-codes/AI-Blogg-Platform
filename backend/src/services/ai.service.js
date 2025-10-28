const { GoogleGenerativeAI } = require('@google/generative-ai');

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in environment variables');
  return new GoogleGenerativeAI(apiKey);
}

// Retry function with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = i === maxRetries - 1;
      const is503Error = error.message?.includes('503') || error.message?.includes('overloaded');
      const is429Error = error.message?.includes('429') || error.message?.includes('Rate limit');
      
      if (isLastAttempt || (!is503Error && !is429Error)) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, i);
      console.log(`⏳ Retry attempt ${i + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function generateBlogFromPrompt(prompt) {
  try {
    const genAI = getClient();
    // Use gemini-2.5-flash - stable, fast, and perfect for blog generation
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });
    
    const systemPrompt = `You are an expert blog writer. Create high-quality, SEO-friendly blog content.

CRITICAL: Your response must be PURE JSON ONLY. Do NOT use markdown code blocks, do NOT add any explanation text.

Start your response directly with { and end with }. Nothing before or after.

Required JSON structure:
{
  "title": "An engaging, SEO-friendly title (50-60 characters)",
  "content": "<p>Well-structured HTML content using proper tags like <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em></p>",
  "summary": "A compelling 1-2 sentence summary",
  "metaDescription": "SEO-optimized description (under 155 characters)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "A relevant category (Technology, Health, Business, Lifestyle, Education, Science, etc.)"
}

Content Guidelines:
- Title: Engaging, clear, 50-60 characters
- Content: Rich HTML formatting with headings, paragraphs, lists where appropriate
- Summary: Concise, compelling, 1-2 sentences
- Tags: 5-8 lowercase keywords (no spaces within tags, use hyphens if needed)
- Category: Single word or two-word category
- MetaDescription: SEO-friendly, under 155 characters

REMEMBER: Output ONLY the JSON object. No markdown, no code blocks, no explanatory text.`;
    
    const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}\n\nJSON Response:`;
    
    // Use retry logic for API calls
    const text = await retryWithBackoff(async () => {
      console.log('📡 Calling Gemini API...');
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    }, 3, 1000);
    
    console.log('✅ Gemini API call successful');
    return text;
  } catch (error) {
    console.error('Gemini API Error (Full):', error);
    console.error('Error message:', error.message);
    console.error('Error status:', error.status);
    console.error('Error details:', error.details);
    
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('invalid API key')) {
      throw new Error('Gemini API key is invalid. Please check your GEMINI_API_KEY environment variable. Get your key at https://makersuite.google.com/app/apikey');
    }
    
    if (error.message?.includes('503') || error.message?.includes('overloaded') || error.message?.includes('Service Unavailable')) {
      throw new Error('The AI service is currently overloaded. Please try again in a few moments. You can write your post manually in the meantime.');
    }
    
    if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Gemini API quota exceeded. Please check your quota at https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas');
    }
    
    if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      throw new Error('The AI model is not available. Please contact support if this persists.');
    }
    
    // Log the error stack for debugging
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    
    throw new Error(`AI generation failed: ${error.message || 'Unknown error'}. You can write your post manually or try again later.`);
  }
}

module.exports = { generateBlogFromPrompt };



