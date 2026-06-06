const mongoose = require('mongoose');

let listenersAttached = false;
let connectionPromise = null;

function validateMongoUri(uri) {
  if (!uri) {
    throw new Error('MONGO_URI not set in environment variables');
  }

  if (uri.includes('<username>') || uri.includes('<password>') || uri.includes('<cluster>')) {
    throw new Error('MONGO_URI still contains placeholder values');
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error('MONGO_URI must start with mongodb:// or mongodb+srv://');
  }
}

function attachConnectionListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });
}

async function connectDb() {
  const mongoUri = process.env.MONGO_URI?.trim();

  validateMongoUri(mongoUri);

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  mongoose.set('strictQuery', true);
  attachConnectionListeners();

  connectionPromise = (async () => {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
    });

    await mongoose.connection.db.admin().ping();
    const isLocal = mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost');
    console.log(`MongoDB connected (${isLocal ? 'local' : 'remote'}) — database: ${mongoose.connection.name}`);

    return mongoose.connection;
  })();

  try {
    return await connectionPromise;
  } catch (error) {
    connectionPromise = null;
    console.error('Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

module.exports = { connectDb };
