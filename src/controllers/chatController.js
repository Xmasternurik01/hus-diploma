const { v4: uuid } = require('uuid');
const store = require('../data/store');
const { toApi } = require('../data/mongoHelpers');

const HOUR_MS = 60 * 60 * 1000;

const requireResidentOrAdmin = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'resident') return next();
  return res.status(403).json({ error: 'Доступ только для жителей и администратора' });
};

const adminCreateChat = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const id = uuid();
    await store.chatInsert({
      _id: id,
      title: String(title || '').trim(),
      description: String(description || '').trim(),
      created_by: req.user.id,
    });
    res.status(201).json(await store.chatById(id));
  } catch (e) {
    next(e);
  }
};

const adminListChats = async (_req, res, next) => {
  try {
    res.json(await store.chatList());
  } catch (e) {
    next(e);
  }
};

const listChats = async (req, res, next) => {
  try {
    const chats = await store.chatList();
    const out = await Promise.all(
      chats.map(async (c) => ({
        ...c,
        unread_count: await store.chatUnreadCount(c.id, req.user.id),
      }))
    );
    res.json(out);
  } catch (e) {
    next(e);
  }
};

async function enrichMessages(rawMessages, viewerId) {
  const ids = rawMessages.map((m) => m._id);
  const userIds = [...new Set(rawMessages.map((m) => m.user_id))];
  const users = await Promise.all(userIds.map((id) => store.userFindById(id)));
  const byUser = Object.fromEntries(users.filter(Boolean).map((u) => [u.id, u]));

  const reads = await store.chatReadsForMessages(ids);
  const readsByMsg = {};
  for (const r of reads) {
    if (!readsByMsg[r.message_id]) readsByMsg[r.message_id] = [];
    readsByMsg[r.message_id].push(r);
  }

  return rawMessages.map((m) => {
    const api = toApi(m);
    const author = byUser[m.user_id];
    api.author_name = author?.full_name || '—';
    api.author_role = author?.role || '';
    const fromMe = m.user_id === viewerId;
    const msgReads = readsByMsg[m._id] || [];
    const readByOthers = msgReads.filter((r) => r.user_id !== m.user_id);
    api.read_by_count = readByOthers.length;
    api.read_by_me = Boolean(msgReads.find((r) => r.user_id === viewerId));
    if (fromMe) {
      api.readers_preview = readByOthers.slice(0, 6).map((r) => {
        const u = byUser[r.user_id];
        return { user_id: r.user_id, full_name: u?.full_name || '—', read_at: r.read_at };
      });
    }
    return api;
  });
}

const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const chat = await store.chatById(chatId);
    if (!chat) return res.status(404).json({ error: 'Чат не найден' });

    const limit = parseInt(req.query.limit, 10) || 100;
    const before = req.query.before || null;
    const rows = await store.chatMessagesList(chatId, { limit, before });
    const viewerId = req.user.id;

    for (const m of rows) {
      if (m.user_id !== viewerId) await store.chatReadUpsert(m._id, viewerId);
    }
    if (rows.length) {
      const latest = rows[rows.length - 1].created_at;
      await store.chatUserStateSetLastRead(chatId, viewerId, latest);
    }

    const messages = await enrichMessages(rows, viewerId);
    res.json({ chat, messages });
  } catch (e) {
    next(e);
  }
};

const postMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const chat = await store.chatById(chatId);
    if (!chat) return res.status(404).json({ error: 'Чат не найден' });

    const body = String(req.body?.body ?? req.body?.text ?? '').trim();
    const imageUrl = req.file ? `/uploads/chats/${req.file.filename}` : null;
    if (!body && !imageUrl) {
      return res.status(400).json({ error: 'Введите текст или прикрепите фото' });
    }

    const id = uuid();
    await store.chatMessageInsert({
      _id: id,
      chat_id: chatId,
      user_id: req.user.id,
      body,
      image_url: imageUrl,
    });
    await store.chatTouchUpdated(chatId);

    const raw = await store.chatMessageRaw(id);
    const [msg] = await enrichMessages([raw], req.user.id);
    res.status(201).json(msg);
  } catch (e) {
    next(e);
  }
};

const editMessage = async (req, res, next) => {
  try {
    const { chatId, messageId } = req.params;
    const { body } = req.body;
    const chat = await store.chatById(chatId);
    if (!chat) return res.status(404).json({ error: 'Чат не найден' });

    const raw = await store.chatMessageRaw(messageId);
    if (!raw || raw.chat_id !== chatId) return res.status(404).json({ error: 'Сообщение не найдено' });
    if (raw.user_id !== req.user.id) return res.status(403).json({ error: 'Редактировать можно только свои сообщения' });

    const age = Date.now() - new Date(raw.created_at).getTime();
    if (age > HOUR_MS) return res.status(400).json({ error: 'Редактирование возможно только в течение часа после отправки' });

    const nextBody = String(body ?? '').trim();
    if (!nextBody && !raw.image_url) {
      return res.status(400).json({ error: 'Текст не может быть пустым' });
    }

    await store.chatMessageUpdateBody(messageId, nextBody);
    const updated = await store.chatMessageRaw(messageId);
    await store.chatTouchUpdated(chatId);
    const [msg] = await enrichMessages([updated], req.user.id);
    res.json(msg);
  } catch (e) {
    next(e);
  }
};

const getReaders = async (req, res, next) => {
  try {
    const { chatId, messageId } = req.params;
    const chat = await store.chatById(chatId);
    if (!chat) return res.status(404).json({ error: 'Чат не найден' });

    const raw = await store.chatMessageRaw(messageId);
    if (!raw || raw.chat_id !== chatId) return res.status(404).json({ error: 'Сообщение не найдено' });

    const isAuthor = raw.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) return res.status(403).json({ error: 'Список читателей доступен автору сообщения или администратору' });

    const reads = await store.chatReadsForMessage(messageId);
    const others = reads.filter((r) => r.user_id !== raw.user_id);
    const userIds = [...new Set(others.map((r) => r.user_id))];
    const users = await Promise.all(userIds.map((id) => store.userFindById(id)));
    const byId = Object.fromEntries(users.filter(Boolean).map((u) => [u.id, u]));

    res.json(
      others.map((r) => ({
        user_id: r.user_id,
        full_name: byId[r.user_id]?.full_name || '—',
        read_at: r.read_at,
      }))
    );
  } catch (e) {
    next(e);
  }
};

module.exports = {
  requireResidentOrAdmin,
  adminCreateChat,
  adminListChats,
  listChats,
  getMessages,
  postMessage,
  editMessage,
  getReaders,
};
