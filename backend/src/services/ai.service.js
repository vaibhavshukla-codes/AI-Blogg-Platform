const { GoogleGenerativeAI } = require('@google/generative-ai');

const BLOG_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Engaging blog post title, 40-80 characters' },
    content: {
      type: 'string',
      description: 'Full blog HTML using h2, h3, p, ul, li, strong, em. At least 300 words.',
    },
    summary: { type: 'string', description: '1-2 sentence summary, 100-200 characters' },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: '5-8 lowercase keywords',
    },
    category: {
      type: 'string',
      description: 'One of: Technology, Health, Business, Lifestyle, Education, Science, Travel, Food, Sports, Entertainment',
    },
  },
  required: ['title', 'content', 'summary', 'tags', 'category'],
};

const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

const SYSTEM_PROMPT = `You are a professional blog content generator. Generate a complete, informative blog post for the given topic.

Rules:
- content must be valid HTML with <h2>, <h3>, <p>, <ul>, <li>, <strong>, and <em> tags
- content must be at least 300 words
- tags must be lowercase strings (use hyphens for multi-word tags)
- category must be exactly one of the allowed values in the schema`;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in environment variables');
  return new GoogleGenerativeAI(apiKey);
}

async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = i === maxRetries - 1;
      const retryable = error.message?.includes('503')
        || error.message?.includes('overloaded')
        || error.message?.includes('429')
        || error.message?.includes('Rate limit');

      if (isLastAttempt || !retryable) {
        throw error;
      }

      const delay = initialDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function generateWithModel(genAI, modelName, prompt) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      responseSchema: BLOG_RESPONSE_SCHEMA,
    },
  });

  const fullPrompt = `${SYSTEM_PROMPT}\n\nTopic: ${prompt}\n\nReturn the blog post as JSON matching the schema.`;
  const result = await model.generateContent(fullPrompt);
  const response = result.response;

  if (response.promptFeedback?.blockReason) {
    throw new Error('Your prompt was blocked by safety filters. Try rephrasing the topic.')
  }

  if (!response.candidates?.length) {
    throw new Error('AI returned no content. Please try a different prompt.')
  }

  let text
  try {
    text = response.text()
  } catch (textError) {
    const finishReason = response.candidates[0]?.finishReason
    throw new Error(
      finishReason === 'SAFETY'
        ? 'Content was blocked by safety filters. Try a different prompt.'
        : 'AI returned an unreadable response. Please try again.'
    )
  }

  if (!text?.trim()) {
    throw new Error('AI returned empty content. Please try again.')
  }

  return text
}

async function generateBlogFromPrompt(prompt) {
  const genAI = getClient();
  let lastError;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const text = await retryWithBackoff(() => generateWithModel(genAI, modelName, prompt));
      return text;
    } catch (error) {
      lastError = error;
      const notFound = error.message?.includes('404')
        || error.message?.includes('not found')
        || error.message?.includes('is not supported');

      if (notFound) {
        continue;
      }
      break;
    }
  }

  const error = lastError || new Error('AI generation failed');
  console.error('Gemini API Error:', error.message);

  if (error.message?.includes('CONSUMER_SUSPENDED') || error.message?.includes('has been suspended')) {
    throw new Error(
      'Your Gemini API key is suspended by Google. Create a new key at https://aistudio.google.com/apikey (use an AIza... key), update backend/.env, and restart the server.'
    );
  }

  if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('invalid API key')) {
    throw new Error('Gemini API key is invalid. Check GEMINI_API_KEY in backend/.env — get a key at https://aistudio.google.com/apikey');
  }

  if (error.message?.includes('503') || error.message?.includes('overloaded')) {
    throw new Error('The AI service is overloaded. Please try again in a few moments.');
  }

  if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
    throw new Error('Gemini API quota exceeded. Check your usage at https://aistudio.google.com/');
  }

  if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
  }

  throw new Error(`AI generation failed: ${error.message || 'Unknown error'}. You can write your post manually or try again later.`);
}

module.exports = { generateBlogFromPrompt };
