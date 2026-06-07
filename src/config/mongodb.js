const { MongoClient } = require('mongodb');

let client;
let db;
let lastError = null;

/** Подключение к MongoDB. Без успешного подключения сервер не стартует (см. `src/index.js`). */
async function connectMongo() {
  lastError = null;
  const uri = (process.env.MONGODB_URI || '').trim();
  if (!uri) {
    console.warn('MongoDB: в .env не задан MONGODB_URI');
    return null;
  }

  const dbName = (process.env.MONGODB_DB || 'jkh_digital').trim();

  try {
    if (client) {
      try { await client.close(); } catch (_) {}
      client = undefined;
      db = undefined;
    }

    client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    await client.connect();
    db = client.db(dbName);
    await db.command({ ping: 1 });

    console.log(`MongoDB: подключено → база "${dbName}"`);
    return db;
  } catch (e) {
    lastError = e.message || String(e);
    client = undefined;
    db = undefined;
    console.warn('MongoDB: не удалось подключиться —', lastError);
    return null;
  }
}

function getDb() {
  return db;
}

function getClient() {
  return client;
}

function getMongoStatus() {
  return { connected: Boolean(db), error: lastError };
}

module.exports = { connectMongo, getDb, getClient, getMongoStatus };
