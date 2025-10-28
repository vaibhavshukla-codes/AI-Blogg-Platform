# ⚡ Quick Start: Connect to MongoDB Atlas

## 🎯 5-Minute Setup

### 1️⃣ Get Your MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free account and cluster (if you haven't already)
3. Get your connection string - it looks like:
   ```
   mongodb+srv://username:password@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
   ```

### 2️⃣ Update Your Backend .env File

Create or edit `backend/.env`:

```bash
# Replace with your MongoDB Atlas connection string
# Make sure to add /ai_blog_platform after .mongodb.net
MONGO_URI=mongodb+srv://username:password@cluster0.abc123.mongodb.net/ai_blog_platform?retryWrites=true&w=majority

PORT=5001
NODE_ENV=development
JWT_SECRET=your_secure_jwt_secret_here
FRONTEND_URL=http://localhost:5173

# Optional (for image uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional (for AI features)
GEMINI_API_KEY=
```

**Important:** Add `/ai_blog_platform` after `.mongodb.net` to specify the database name!

### 3️⃣ Test Your Connection

```bash
cd backend
node test-cascade-delete.js
```

You should see:

```
✅ Database connection established
☁️  Connected to MongoDB Atlas (Cloud)
✅ CASCADE DELETE TEST PASSED!
```

### 4️⃣ Start Your Application

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 🎉 You're All Set!

### ✅ What Works Now:

1. **All CRUD Operations Synced to MongoDB Atlas**

   - Register users → Saved to Atlas
   - Create posts → Saved to Atlas
   - Add comments → Saved to Atlas
   - Update posts → Updated in Atlas
   - Delete posts → Removed from Atlas

2. **Cascade Deletes Enabled**

   - Delete a post → All comments deleted automatically
   - Delete a comment → All replies deleted automatically
   - Delete a user → All their content deleted automatically

3. **Real-time Data**
   - View your data live in MongoDB Atlas dashboard
   - Browse Collections → Select `ai_blog_platform` database

---

## 🔍 Verify in MongoDB Atlas

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Click your cluster → **Browse Collections**
3. Select **ai_blog_platform** database
4. You'll see these collections:
   - `users` - User accounts
   - `posts` - Blog posts
   - `comments` - Comments and replies
   - `categories` - Post categories
   - `notifications` - User notifications

---

## 📚 Collections Schema

### 🗂️ **users** Collection

```
- name, email, password (hashed), role, avatarUrl, bio, social
- createdAt, updatedAt
```

### 📝 **posts** Collection

```
- title, slug, content, coverImageUrl, category, tags
- author (ref: User), status, views, likes, dislikes
- createdAt, updatedAt
```

### 💬 **comments** Collection

```
- post (ref: Post), author (ref: User), content
- parent (ref: Comment for replies)
- likes, dislikes, status
- createdAt, updatedAt
```

### 📁 **categories** Collection

```
- name, slug, description
- createdAt, updatedAt
```

### 🔔 **notifications** Collection

```
- user (ref: User), type, message, read, meta
- createdAt, updatedAt
```

---

## 🆘 Troubleshooting

### ❌ Connection Error: Authentication Failed

**Fix:** Check username/password in your connection string

### ❌ Connection Error: Network Timeout

**Fix:** Add your IP to Network Access in MongoDB Atlas (or allow 0.0.0.0/0)

### ❌ Database Not Showing in Atlas

**Fix:** Collections are created on first insert. Register a user or create a post.

---

## 📖 Full Documentation

For detailed setup instructions, see: **MONGODB_ATLAS_SETUP.md**

---

## 🎊 Success!

Your AI Blog Platform is now fully connected to MongoDB Atlas with:

- ✅ Real-time data synchronization
- ✅ Cascade delete functionality
- ✅ Cloud-based persistence
- ✅ Automatic collection management

**All your CRUD operations are now automatically synced with MongoDB Atlas!** 🚀


