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
    
    const systemPrompt = `You are a professional blog content generator. Generate a complete blog post based on the user's topic.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown, no code blocks, no extra text
2. Start with { and end with }
3. Use proper HTML tags in content field
4. All fields are required

JSON Format (copy this structure exactly):
{
  "title": "Write an engaging, clear title here (40-80 characters)",
  "content": "<h2>First Section</h2><p>Write well-structured content with proper HTML tags. Use headings (h2, h3), paragraphs (p), lists (ul, li), bold (strong), and italic (em) tags.</p><h2>Second Section</h2><p>Continue with informative, well-formatted content that provides value to readers.</p>",
  "summary": "Write 1-2 compelling sentences that summarize the post and hook the reader.",
  "tags": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "category": "Choose ONE: Technology, Health, Business, Lifestyle, Education, Science, Travel, Food, Sports, or Entertainment"
}

Requirements:
- title: Clear, engaging (40-80 chars)
- content: Rich HTML with <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags. Minimum 300 words.
- summary: 1-2 sentences (100-200 chars)
- tags: 5-8 lowercase keywords (use hyphens for multi-word: "machine-learning")
- category: Single category name

Your response must be valid JSON only. No additional text before or after the JSON object.`;
    
    const fullPrompt = `${systemPrompt}\n\n---\n\nTopic: ${prompt}\n\nGenerate the blog post as JSON:`;
    
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



