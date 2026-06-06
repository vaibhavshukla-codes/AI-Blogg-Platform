const express = require('express');
const path = require('path');
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
const { isAllowedOrigin } = require('./utils/cors');

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

// ----- CORS config (robust, production-ready) -----
const corsOptions = {
  origin: function (origin, callback) {
    // Debug log for production troubleshooting
    // allow non-browser requests (curl, server-to-server) that have no origin
    if (!origin) return callback(null, true);

    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.error('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Request-Id']
};

app.use(cors(corsOptions));

// Add explicit OPTIONS handling for preflight requests
app.options('*', cors(corsOptions));
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api', limiter);

// ----- Root + health endpoints -----
app.get('/', (req, res) => {
  return res.status(200).json({ message: 'API is running. Use /api routes.' });
});

app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    if (dbStatus === 1) {
      await mongoose.connection.db.admin().ping();
    }

    return res.json({
      status: 'ok',
      database: {
        status: dbStatusMap[dbStatus],
        name: mongoose.connection.name || 'N/A',
        connected: dbStatus === 1
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      message: 'Database connection issue',
      error: error.message
    });
  }
});

// ----- API routes -----
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

async function startServer() {
  try {
    await connectDb();

    const server = app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
      }
      throw err;
    });
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.app = app;
module.exports.startServer = startServer;
