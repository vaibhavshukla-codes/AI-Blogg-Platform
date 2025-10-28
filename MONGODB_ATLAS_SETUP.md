# 🗄️ MongoDB Atlas Setup Guide

This guide will help you connect your AI Blog Platform to MongoDB Atlas cloud database.

## 📋 What You Get

✅ **All CRUD operations** are automatically synced with MongoDB Atlas
✅ **Cascade Deletes** - When you delete posts, all related comments are automatically deleted
✅ **Data Persistence** - All data is stored securely in the cloud
✅ **Real-time Updates** - Changes are immediately reflected in MongoDB Atlas

---

## 🚀 Step-by-Step Setup

### Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a **FREE** account (no credit card required)
3. Choose the **FREE tier (M0)** - 512 MB storage

### Step 2: Create a Cluster

1. After login, click **"Build a Database"**
2. Select **FREE Shared Cluster** (M0)
3. Choose your preferred **Cloud Provider & Region** (select closest to you)
4. Name your cluster (e.g., `ai-blog-cluster`)
5. Click **"Create Cluster"** (takes 1-3 minutes)

### Step 3: Create Database User

1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set username and password (remember these!)
   - Example: Username: `bloguser`, Password: `SecurePass123!`
5. Set **Database User Privileges** to: **"Read and write to any database"**
6. Click **"Add User"**

### Step 4: Allow Network Access

1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. For development, click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ For production, add only your specific IP addresses
4. Click **"Confirm"**

### Step 5: Get Your Connection String

1. Go back to **"Database"** (in left sidebar)
2. Click **"Connect"** button on your cluster
3. Select **"Connect your application"**
4. Choose **Driver: Node.js** and **Version: Latest**
5. Copy the connection string - it looks like:
   ```
   mongodb+srv://bloguser:<password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Configure Your Backend

1. Open your backend `.env` file (create one if it doesn't exist)
2. Replace the connection string and add your database name:

```bash
# Replace <password> with your actual password
# Add your database name after .net/ (we use 'ai_blog_platform')
MONGO_URI=mongodb+srv://bloguser:SecurePass123!@cluster0.abc123.mongodb.net/ai_blog_platform?retryWrites=true&w=majority

# Other settings
PORT=5001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:5173
```

**Important Notes:**

- Replace `<password>` with your actual database user password
- Replace `cluster0.abc123` with your actual cluster address
- Add `/ai_blog_platform` after `.mongodb.net` to specify the database name

---

## 🎯 Collections in MongoDB Atlas

Your application uses these collections (they'll be created automatically):

1. **users** - User accounts and profiles
2. **posts** - Blog posts with content
3. **comments** - Comments and replies
4. **categories** - Blog categories
5. **notifications** - User notifications

---

## ✅ Verify Connection

### Test Your Connection

1. Start your backend server:

   ```bash
   cd backend
   npm start
   ```

2. You should see:

   ```
   🔌 Attempting to connect to MongoDB...
   📍 URI: mongodb+srv://bloguser:****@cluster0.abc123.mongodb.net/...
   ✅ MongoDB connected successfully
   📊 Database: ai_blog_platform
   🏓 Database ping successful
   ```

3. Check MongoDB Atlas Dashboard:
   - Go to your cluster in MongoDB Atlas
   - Click **"Browse Collections"**
   - You should see your `ai_blog_platform` database

---

## 🔄 CRUD Operations - Automatically Synced!

### ✅ What Happens in MongoDB Atlas

| **Action**            | **What Gets Saved/Updated**                               |
| --------------------- | --------------------------------------------------------- |
| 👤 **Register User**  | New document in `users` collection                        |
| 📝 **Create Post**    | New document in `posts` collection                        |
| 💬 **Add Comment**    | New document in `comments` collection                     |
| ✏️ **Edit Post**      | Updates existing document in `posts`                      |
| 👍 **Like Post**      | Updates `likes` array in `posts` document                 |
| 🗑️ **Delete Post**    | Removes post + ALL related comments + notifications       |
| 🗑️ **Delete Comment** | Removes comment + ALL replies + related notifications     |
| 🗑️ **Delete User**    | Removes user + ALL their posts + comments + notifications |

### 🔗 Cascade Delete Features

**When you delete a POST:**

- ✅ Post is deleted from MongoDB Atlas
- ✅ All comments on that post are deleted
- ✅ All notifications related to that post are deleted

**When you delete a COMMENT:**

- ✅ Comment is deleted from MongoDB Atlas
- ✅ All replies to that comment are deleted
- ✅ All notifications related to that comment are deleted

**When you delete a USER:**

- ✅ User account is deleted from MongoDB Atlas
- ✅ All posts by that user are deleted
- ✅ All comments by that user are deleted
- ✅ All notifications for that user are deleted

---

## 🧪 Test Your Setup

### Test in Your Browser

1. Start both frontend and backend:

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. Open `http://localhost:5173`

3. **Test CRUD Operations:**
   - ✅ Register a new account → Check `users` collection in Atlas
   - ✅ Create a new post → Check `posts` collection in Atlas
   - ✅ Add a comment → Check `comments` collection in Atlas
   - ✅ Delete a post → Verify post + comments removed from Atlas
   - ✅ Delete a comment → Verify comment + replies removed from Atlas

### View Data in MongoDB Atlas

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Click on your cluster
3. Click **"Browse Collections"**
4. Select your database (`ai_blog_platform`)
5. Browse each collection to see your data

---

## 🔍 Monitor Your Database

### Real-time Monitoring

1. In MongoDB Atlas, click **"Metrics"** tab
2. See real-time:
   - Operations per second
   - Connections
   - Network usage
   - Storage size

### View Logs

1. Click **"Logs"** tab
2. See all database operations
3. Filter by time, type, or operation

---

## 🛡️ Security Best Practices

### For Development

- ✅ Use strong passwords for database users
- ✅ Use "Allow Access from Anywhere" for testing

### For Production

- 🔒 Change JWT_SECRET to a strong random string
- 🔒 Update network access to allow only your server IPs
- 🔒 Enable backup (free on M2+ clusters)
- 🔒 Use environment variables (never commit .env to git)
- 🔒 Enable MongoDB Atlas alerts

---

## 🆘 Troubleshooting

### Connection Error: Authentication Failed

**Problem:** Wrong username or password
**Solution:**

1. Go to "Database Access" in MongoDB Atlas
2. Edit user and reset password
3. Update MONGO_URI in .env file

### Connection Error: Network Timeout

**Problem:** IP not whitelisted
**Solution:**

1. Go to "Network Access" in MongoDB Atlas
2. Click "Add IP Address"
3. Add your current IP or use 0.0.0.0/0 for all

### Connection Error: ENOTFOUND

**Problem:** Wrong cluster URL
**Solution:**

1. Go to your cluster in MongoDB Atlas
2. Click "Connect" → "Connect your application"
3. Copy the exact connection string
4. Make sure to add `/ai_blog_platform` after `.mongodb.net`

### Database Not Created

**Problem:** Database doesn't appear in Atlas
**Solution:**

- The database is created automatically when you insert the first document
- Try registering a user or creating a post
- Refresh MongoDB Atlas "Browse Collections" page

---

## 📊 Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: String ('admin' | 'user'),
  avatarUrl: String,
  bio: String,
  social: {
    website: String,
    twitter: String,
    github: String,
    linkedin: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Posts Collection

```javascript
{
  _id: ObjectId,
  title: String,
  slug: String (unique, indexed),
  content: String,
  coverImageUrl: String,
  category: String (indexed),
  tags: [String] (indexed),
  summary: String,
  readingTimeMinutes: Number,
  author: ObjectId (ref: User, indexed),
  likes: [ObjectId] (ref: User),
  dislikes: [ObjectId] (ref: User),
  status: String ('draft' | 'pending' | 'published' | 'rejected'),
  views: Number,
  viewedBy: [ObjectId] (ref: User),
  metaDescription: String,
  moderationReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Comments Collection

```javascript
{
  _id: ObjectId,
  post: ObjectId (ref: Post, indexed),
  author: ObjectId (ref: User, indexed),
  content: String,
  parent: ObjectId (ref: Comment, indexed),
  likes: [ObjectId] (ref: User),
  dislikes: [ObjectId] (ref: User),
  status: String ('visible' | 'hidden'),
  createdAt: Date,
  updatedAt: Date
}
```

### Categories Collection

```javascript
{
  _id: ObjectId,
  name: String (unique),
  slug: String (unique, indexed),
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Notifications Collection

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User, indexed),
  type: String ('comment' | 'post_status' | 'ai_update'),
  message: String,
  read: Boolean,
  meta: Object,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎉 Success!

Your AI Blog Platform is now fully connected to MongoDB Atlas! All your CRUD operations will automatically sync with the cloud database, and cascade deletes are enabled to maintain data integrity.

**Next Steps:**

1. Test all features (register, post, comment, delete)
2. Check MongoDB Atlas to verify data is being saved
3. Monitor your database usage in Atlas dashboard
4. Set up backups (recommended for production)

**Need Help?**

- MongoDB Atlas Docs: [https://docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- MongoDB University (Free): [https://university.mongodb.com](https://university.mongodb.com)



