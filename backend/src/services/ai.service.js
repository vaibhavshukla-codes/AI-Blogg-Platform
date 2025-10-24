const OpenAI = require('openai');

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  return new OpenAI({ apiKey });
}

async function generateBlogFromPrompt(prompt) {
  const client = getClient();
  const system = 'You are an expert blog writer. Write helpful, clear, SEO-friendly content.';
  const user = `Create a blog article based on this prompt. Provide JSON with keys: title, content (markdown), summary (1-2 sentences), metaDescription (max 155 chars), tags (array of 5-8), category.`;
  const input = `${prompt}`;
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
      { role: 'user', content: input },
    ],
    temperature: 0.7,
  });
  const text = res.choices?.[0]?.message?.content || '';
  return text;
}

module.exports = { generateBlogFromPrompt };



