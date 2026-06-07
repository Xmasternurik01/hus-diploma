const { getDb } = require('../config/mongodb');

/** Коллекция или 503, если Mongo недоступна */
function col(name) {
  const db = getDb();
  if (!db) {
    const e = new Error('База данных MongoDB недоступна. Проверьте MONGODB_URI и службу MongoDB.');
    e.status = 503;
    throw e;
  }
  return db.collection(name);
}

/** Документ Mongo → ответ API (поле id вместо _id) */
function toApi(doc) {
  if (!doc) return doc;
  const o = { ...doc };
  if (o._id != null) o.id = o._id;
  delete o._id;
  return o;
}

function toApiList(docs) {
  return (docs || []).map(toApi);
}

const C = {
  USERS: 'users',
  APARTMENTS: 'apartments',
  USER_APTS: 'user_apartments',
  FAMILY_REQUESTS: 'family_requests',
  METER_READINGS: 'meter_readings',
  BILLS: 'bills',
  DETAILED_BILLS: 'detailed_bills',
  PAYMENTS: 'payments',
  BALANCES: 'balances',
  REQUESTS: 'requests',
  NEWS: 'news',
  NOTIFICATIONS: 'notifications',
  NOTIF_PREFS: 'notification_prefs',
  CHATS: 'resident_chats',
  CHAT_MESSAGES: 'chat_messages',
  CHAT_READS: 'chat_message_reads',
  CHAT_USER_STATE: 'chat_user_state',
};

module.exports = { col, toApi, toApiList, C };
