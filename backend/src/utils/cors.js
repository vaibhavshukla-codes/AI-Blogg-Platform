const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
];

function getAllowedOrigins() {
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || '').split(',')
  ]
    .map((origin) => origin && origin.trim())
    .filter(Boolean);

  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins])];
}

function isPreviewDeployment(hostname) {
  return hostname === 'vercel.app'
    || hostname.endsWith('.vercel.app')
    || hostname === 'onrender.com'
    || hostname.endsWith('.onrender.com');
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (getAllowedOrigins().includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    return isPreviewDeployment(hostname);
  } catch {
    return false;
  }
}

module.exports = { getAllowedOrigins, isAllowedOrigin };
