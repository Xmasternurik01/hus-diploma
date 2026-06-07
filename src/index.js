require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('path');

const { connectMongo, getMongoStatus } = require('./config/mongodb');
const { ensureMongoIndexes } = require('./data/ensureMongoIndexes');

const routes = require('./routes/index');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Serve uploaded photos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// API
app.use('/api/v1', routes);

// Health check
app.get('/health', (_req, res) => {
  const { connected, error } = getMongoStatus();
  res.json({
    status: 'ok',
    ts: new Date().toISOString(),
    mongo: connected,
    ...(error && !connected ? { mongo_error: error } : {}),
  });
});

// SPA fallback → login
app.get('*', (_req, res) =>
  res.sendFile(path.join(__dirname, '..', 'public', 'html', 'login.html'))
);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

(async () => {
  const db = await connectMongo();
  if (!db) {
    console.error('\n❌  MongoDB не подключена. Задайте MONGODB_URI в .env и запустите службу MongoDB.\n');
    process.exit(1);
  }
  await ensureMongoIndexes();

  app.listen(PORT, () => {
    console.log(`\n🏢  JKH Digital  →  http://localhost:${PORT}/`);
    console.log(`🔗  API          →  http://localhost:${PORT}/api/v1\n`);
  });
})();

module.exports = app;

