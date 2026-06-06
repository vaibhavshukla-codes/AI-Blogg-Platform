# AI Blog Platform

Full-stack blogging platform with AI-assisted writing, comments, moderation, and image uploads.

**Stack:** React (Vite) · Express · MongoDB · JWT · Cloudinary · Google Gemini

## Features

- User registration, login, and role-based access (user / admin)
- Create, edit, publish, and delete posts with a rich text editor
- AI blog draft generation (Gemini)
- Cover images via Cloudinary
- Nested comments with edit, delete, and reactions
- Search, categories, notifications, and admin moderation

## Local development

### Prerequisites

- Node.js 18+
- MongoDB running locally (or MongoDB Atlas)
- Cloudinary account (for cover images)
- Gemini API key (for AI generation)

### Setup

```bash
cd backend && cp .env.example .env && npm install && npm run seed
cd ../frontend && cp .env.example .env && npm install
```

### Run

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

| Service   | URL |
|-----------|-----|
| App       | http://localhost:5173 |
| API       | http://localhost:5001/api |
| Health    | http://localhost:5001/api/health |

**Local seed admin:** `admin@local.dev` / `admin123456` (after `npm run seed`)

## Environment variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `5001`) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing auth tokens |
| `FRONTEND_URL` | Production frontend URL for CORS |
| `CLOUDINARY_*` | Cloudinary credentials |
| `GEMINI_API_KEY` | Google Gemini API key |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:5001/api`) |

## Project structure

```
AI-Blogg-Platform/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── scripts/seed-local.js
│   └── uploads/          # local fallback only; use Cloudinary in production
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── lib/
│       └── pages/
├── README.md
└── DEPLOYMENT.md
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment on Vercel + Render + MongoDB Atlas.
