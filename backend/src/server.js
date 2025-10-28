const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const mongoose = require('mongoose');
require('dotenv').config();

const { connectDb } = require('./utils/db');
const { notFound, errorHandler } = require('./utils/error');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');
const commentRoutes = require('./routes/comment.routes');
const categoryRoutes = require('./routes/category.routes');
const uploadRoutes = require('./routes/upload.routes');
const searchRoutes = require('./routes/search.routes');
const notificationRoutes = require('./routes/notification.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api', limiter);

app.get('/api/health', async (req, res) => {
  try {
    // Check if MongoDB is connected
    const dbStatus = mongoose.connection.readyState;
    const dbStatusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Perform a database ping
    if (dbStatus === 1) {
      await mongoose.connection.db.admin().ping();
    }

    res.json({ 
      status: 'ok',
      database: {
        status: dbStatusMap[dbStatus],
        name: mongoose.connection.name || 'N/A',
        connected: dbStatus === 1
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error',
      message: 'Database connection issue',
      error: error.message
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

connectDb()
  .then(async () => {
    console.log('✅ Database connection established');
    
    // Verify we can perform operations
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log('📚 Available collections:', collections.map(c => c.name).join(', ') || 'None (will be created on first use)');
    } catch (e) {
      console.error('⚠️  Could not list collections:', e.message);
    }
    
    app.listen(PORT, () => {
      console.log('🚀 Server running on port', PORT);
      console.log('📍 API URL: http://localhost:' + PORT + '/api');
      console.log('❤️  Health check: http://localhost:' + PORT + '/api/health');
    });
  })
  .catch((err) => {
    console.error('❌ CRITICAL: Failed to connect to database');
    console.error('📝 Error details:', err.message);
    console.error('💡 Please check:');
    console.error('   1. MongoDB is running (local or cloud)');
    console.error('   2. MONGO_URI is correctly set in .env file');
    console.error('   3. Network/firewall settings allow connection');
    process.exit(1);
  });

module.exports = app;



