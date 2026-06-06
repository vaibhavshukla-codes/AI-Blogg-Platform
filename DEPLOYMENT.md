# Deployment Guide

Recommended production stack:

| Layer | Service |
|-------|---------|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Render](https://render.com) |
| Database | [MongoDB Atlas](https://www.mongodb.com/atlas) |
| Images | [Cloudinary](https://cloudinary.com) |
| AI | [Google AI Studio](https://aistudio.google.com/apikey) |

---

## 1. MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user with read/write access.
3. Under **Network Access**, allow your backend host IP (or `0.0.0.0/0` during initial setup).
4. Copy the connection string:

```
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ai_blog_platform?retryWrites=true&w=majority
```

5. Replace `<password>` with the URL-encoded password.

---

## 2. Cloudinary

1. Create an account at [cloudinary.com](https://cloudinary.com).
2. From the dashboard, copy:
   - Cloud name
   - API key
   - API secret

Cover images upload to the `ai-blog-platform` folder automatically.

---

## 3. Google Gemini

1. Get an API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Store it as `GEMINI_API_KEY` on the backend only.

---

## 4. Deploy backend (Render)

1. Push your code to GitHub.
2. In Render: **New → Web Service** → connect the repo.
3. Settings:

| Field | Value |
|-------|-------|
| Root directory | `backend` |
| Build command | `npm install` |
| Start command | `npm start` |
| Instance type | Free or paid |

4. Environment variables:

```env
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://...
JWT_SECRET=<generate-a-long-random-string>
FRONTEND_URL=https://your-app.vercel.app
FRONTEND_URLS=https://your-app.vercel.app
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GEMINI_API_KEY=...
```

5. Deploy and note the service URL, e.g. `https://ai-blog-api.onrender.com`.

6. Verify: `https://ai-blog-api.onrender.com/api/health`

### Seed production data (optional)

Run once from your machine with production `MONGO_URI`:

```bash
cd backend
MONGO_URI="your-atlas-uri" npm run seed
```

Change the default admin password immediately after first login.

---

## 5. Deploy frontend (Vercel)

1. In Vercel: **New Project** → import the same GitHub repo.
2. Settings:

| Field | Value |
|-------|-------|
| Root directory | `frontend` |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

3. Environment variable (set **before** building):

```env
VITE_API_URL=https://ai-blog-api.onrender.com/api
```

4. Deploy. Vercel assigns a URL like `https://your-app.vercel.app`.

5. Update the backend `FRONTEND_URL` on Render to match the Vercel URL, then redeploy the backend.

---

## 6. Post-deploy checklist

- [ ] `GET /api/health` returns `"connected": true`
- [ ] Register a new user on the live site
- [ ] Create and publish a post with a cover image
- [ ] Test AI generation in the post editor
- [ ] Confirm images load from `res.cloudinary.com`
- [ ] Rotate any API keys that were ever shared or committed
- [ ] Change default seed admin password if you ran `npm run seed`

---

## CORS

The backend allows origins from `FRONTEND_URL`, `FRONTEND_URLS`, and Vercel/Render preview domains automatically. If you use a custom domain, add it to `FRONTEND_URLS`.

---

## Common issues

| Problem | Fix |
|---------|-----|
| CORS error | Set `FRONTEND_URL` to your exact Vercel URL (no trailing slash) |
| API calls fail | Confirm `VITE_API_URL` ends with `/api` and rebuild the frontend |
| Images not showing | Verify Cloudinary env vars on the backend |
| AI generation fails | Check `GEMINI_API_KEY` and Render logs |
| 401 on all requests | Ensure `JWT_SECRET` is set and consistent across deploys |
| MongoDB timeout | Whitelist Render's IP or use `0.0.0.0/0` in Atlas network access |

---

## Local vs production

| | Local | Production |
|---|-------|------------|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/ai_blog_platform` | Atlas `mongodb+srv://...` |
| `VITE_API_URL` | `http://localhost:5001/api` | `https://your-api.onrender.com/api` |
| Images | Cloudinary (recommended) or `backend/uploads/` | Cloudinary only |
| `JWT_SECRET` | Dev value | Strong random string |

Never commit `.env` files. Set secrets only in your hosting provider's environment settings.
