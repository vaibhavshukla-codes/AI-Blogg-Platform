# 🚀 Deployment Guide

## Prerequisites

Before deploying, ensure you have:

- [ ] MongoDB Atlas account (or local MongoDB)
- [ ] OpenAI API key
- [ ] Cloudinary account
- [ ] Vercel account (for frontend)
- [ ] Render/Heroku account (for backend)

## 🔧 Environment Setup

### 1. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address
5. Get your connection string

### 2. OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add credits to your account

### 3. Cloudinary Setup

1. Go to [Cloudinary](https://cloudinary.com/)
2. Create a free account
3. Get your cloud name, API key, and API secret

## 🖥️ Backend Deployment (Render)

### Step 1: Prepare Backend

```bash
cd backend
npm install
```

### Step 2: Deploy to Render

1. Go to [Render](https://render.com/)
2. Connect your GitHub repository
3. Create a new Web Service
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

### Step 3: Set Environment Variables

Add these in Render dashboard:

```
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ai_blog_platform
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=https://your-frontend-url.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_api_key
```

## 🌐 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

```bash
cd frontend
npm install
npm run build
```

### Step 2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com/)
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Set Environment Variables

Add these in Vercel dashboard:

```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

## 🔄 Alternative: Heroku Deployment

### Backend on Heroku

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set FRONTEND_URL=your_frontend_url
heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name
heroku config:set CLOUDINARY_API_KEY=your_api_key
heroku config:set CLOUDINARY_API_SECRET=your_api_secret
heroku config:set OPENAI_API_KEY=your_openai_key

# Deploy
git push heroku main
```

## 🌍 Frontend on Netlify

### Step 1: Build and Deploy

```bash
cd frontend
npm run build
```

### Step 2: Deploy to Netlify

1. Go to [Netlify](https://netlify.com/)
2. Drag and drop your `dist` folder
3. Or connect your GitHub repository

### Step 3: Set Environment Variables

In Netlify dashboard:

```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

## 🔐 Security Checklist

- [ ] Use strong JWT secrets
- [ ] Enable HTTPS
- [ ] Set up CORS properly
- [ ] Use environment variables
- [ ] Enable rate limiting
- [ ] Set up monitoring
- [ ] Regular security updates

## 📊 Monitoring & Analytics

### Backend Monitoring

- Use Render/Heroku logs
- Set up error tracking (Sentry)
- Monitor API performance

### Frontend Analytics

- Google Analytics
- Vercel Analytics
- Error tracking

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        # Add your deployment steps
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        # Add your deployment steps
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**

   - Check FRONTEND_URL in backend
   - Verify CORS configuration

2. **Database Connection**

   - Check MONGO_URI format
   - Verify IP whitelist in Atlas

3. **Environment Variables**

   - Ensure all required vars are set
   - Check for typos in variable names

4. **Build Failures**
   - Check Node.js version
   - Verify all dependencies are installed

### Debug Commands

```bash
# Check backend logs
heroku logs --tail

# Check frontend build
npm run build

# Test API locally
curl http://localhost:5000/api/health
```

## 📈 Performance Optimization

### Backend

- Enable gzip compression
- Use Redis for caching
- Optimize database queries
- Implement pagination

### Frontend

- Enable code splitting
- Optimize images
- Use CDN for static assets
- Implement lazy loading

## 🔄 Updates & Maintenance

### Regular Tasks

- [ ] Update dependencies
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Backup database
- [ ] Security audits

### Scaling

- Use MongoDB Atlas scaling
- Implement load balancing
- Add caching layers
- Monitor resource usage

---

## 🎉 You're Ready!

Your AI Blog Platform is now deployed and ready to use!

**Frontend**: https://your-app.vercel.app
**Backend**: https://your-app.onrender.com

Remember to:

1. Test all functionality
2. Set up monitoring
3. Create admin user
4. Configure domain (optional)
5. Set up backups
