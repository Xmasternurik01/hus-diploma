const { col, C } = require('./mongoHelpers');

async function ensureMongoIndexes() {
  try {
    await col(C.USERS).dropIndex('phone_1');
  } catch (_) {}
  await col(C.USERS).createIndex(
    { phone: 1 },
    {
      unique: true,
      partialFilterExpression: { phone: { $type: 'string', $gt: '' } },
    }
  );
  await col(C.USERS).createIndex({ email: 1 }, { unique: true });

  await col(C.USER_APTS).createIndex({ user_id: 1, apartment_id: 1 }, { unique: true });
  await col(C.USER_APTS).createIndex({ apartment_id: 1 });

  await col(C.FAMILY_REQUESTS).createIndex({ owner_id: 1, created_at: -1 });
  await col(C.FAMILY_REQUESTS).createIndex({ requester_id: 1, created_at: -1 });
  await col(C.FAMILY_REQUESTS).createIndex({ apartment_id: 1, status: 1, created_at: -1 });

  await col(C.METER_READINGS).createIndex({ apartment_id: 1, meter_type: 1, submitted_at: -1 });
  await col(C.METER_READINGS).createIndex({ status: 1 });

  await col(C.BILLS).createIndex({ apartment_id: 1, period: 1 });
  await col(C.BILLS).createIndex({ generated_at: -1 });

  await col(C.PAYMENTS).createIndex({ user_id: 1, created_at: -1 });
  await col(C.PAYMENTS).createIndex({ apartment_id: 1, created_at: -1 });

  await col(C.REQUESTS).createIndex({ user_id: 1, created_at: -1 });
  await col(C.REQUESTS).createIndex({ status: 1 });

  await col(C.NEWS).createIndex({ created_at: -1 });
  await col(C.NEWS).createIndex({ published: 1 });

  await col(C.NOTIFICATIONS).createIndex({ user_id: 1, created_at: -1 });

  await col(C.NOTIF_PREFS).createIndex({ user_id: 1 }, { unique: true });

  await col(C.CHATS).createIndex({ updated_at: -1 });
  await col(C.CHAT_MESSAGES).createIndex({ chat_id: 1, created_at: -1 });
  await col(C.CHAT_READS).createIndex({ message_id: 1, user_id: 1 }, { unique: true });
  await col(C.CHAT_READS).createIndex({ message_id: 1 });
  await col(C.CHAT_USER_STATE).createIndex({ chat_id: 1, user_id: 1 }, { unique: true });

  console.log('MongoDB: индексы проверены');
}

module.exports = { ensureMongoIndexes };
