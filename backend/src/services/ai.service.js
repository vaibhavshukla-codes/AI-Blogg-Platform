const { GoogleGenerativeAI } = require('@google/generative-ai');

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in environment variables');
  return new GoogleGenerativeAI(apiKey);
}

async function generateBlogFromPrompt(prompt) {
  try {
    const genAI = getClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const systemPrompt = 'You are an expert blog writer. Write helpful, clear, SEO-friendly content.';
    const instruction = `Create a blog article based on this prompt. Provide your response as valid JSON with the following keys: title, content (in markdown format), summary (1-2 sentences), metaDescription (max 155 chars), tags (array of 5-8 relevant tags), category (single word category name).`;
    
    const fullPrompt = `${systemPrompt}\n\n${instruction}\n\nUser Request: ${prompt}\n\nProvide ONLY the JSON response, no other text.`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    
    if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('invalid API key')) {
      throw new Error('Gemini API key is invalid. Please check your GEMINI_API_KEY environment variable. Get your key at https://makersuite.google.com/app/apikey');
    }
    
    if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('Gemini API quota exceeded. Please check your quota at https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas');
    }
    
    if (error.message?.includes('429')) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    
    throw new Error(`AI generation failed: ${error.message || 'Unknown error'}. Make sure your Gemini API key is valid at https://makersuite.google.com/app/apikey`);
  }
}

module.exports = { generateBlogFromPrompt };



