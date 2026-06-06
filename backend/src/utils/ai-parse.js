function sanitizeBlogResult(raw) {
  const parsed = { ...raw };

  if (!parsed.title?.trim()) {
    parsed.title = 'AI Generated Post';
  } else {
    parsed.title = parsed.title.trim();
  }

  if (!parsed.content?.trim()) {
    parsed.content = '<p>Content generation incomplete. Please try again or edit manually.</p>';
  } else {
    parsed.content = parsed.content.trim();
    if (!parsed.content.includes('<')) {
      parsed.content = `<p>${parsed.content}</p>`;
    }
  }

  const plainText = parsed.content.replace(/<[^>]*>/g, '').trim();
  if (!parsed.summary?.trim()) {
    parsed.summary = plainText.length > 150
      ? `${plainText.substring(0, 150)}...`
      : plainText;
  } else {
    parsed.summary = parsed.summary.trim();
  }

  if (!parsed.category?.trim()) {
    parsed.category = 'Technology';
  } else {
    parsed.category = parsed.category.trim();
  }

  if (!Array.isArray(parsed.tags)) {
    if (typeof parsed.tags === 'string') {
      parsed.tags = parsed.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    } else {
      parsed.tags = [];
    }
  } else {
    parsed.tags = parsed.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  }

  return parsed;
}

function extractJsonObject(text) {
  let cleanText = text
    .replace(/```json\s*/gi, '')
    .replace(/```javascript\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const jsonStart = cleanText.indexOf('{');
  const jsonEnd = cleanText.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
  }

  return JSON.parse(cleanText);
}

function parseBlogAiResponse(text) {
  try {
    return sanitizeBlogResult(extractJsonObject(text));
  } catch (parseError) {
    console.error('AI JSON parsing failed:', parseError.message);

    const titleMatch = text.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const contentMatch = text.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
    const summaryMatch = text.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const categoryMatch = text.match(/"category"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const tagsMatch = text.match(/"tags"\s*:\s*\[(.*?)\]/s);

    if (titleMatch || contentMatch) {
      return sanitizeBlogResult({
        title: titleMatch ? titleMatch[1].replace(/\\"/g, '"') : undefined,
        content: contentMatch ? contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : undefined,
        summary: summaryMatch ? summaryMatch[1].replace(/\\"/g, '"') : undefined,
        category: categoryMatch ? categoryMatch[1].replace(/\\"/g, '"') : undefined,
        tags: tagsMatch
          ? tagsMatch[1].split(',').map((t) => t.trim().replace(/"/g, ''))
          : [],
      });
    }

    throw new Error('AI generated invalid response. Please try again with a different prompt.');
  }
}

module.exports = { sanitizeBlogResult, parseBlogAiResponse };
