const store = require('../data/store');

const getNotifications = async (req, res, next) => {
  try {
    const { limit=20, offset=0, unread_only } = req.query;
    const rows = await store.notifList(req.user.id, {
      limit: parseInt(limit,10),
      offset: parseInt(offset,10),
      unreadOnly: unread_only === 'true',
    });
    res.json(rows);
  } catch(e) { next(e); }
};

const markRead = async (req, res, next) => {
  try {
    await store.notifMarkRead(req.params.id, req.user.id);
    res.json({ message:'Marked as read' });
  } catch(e) { next(e); }
};

const markAllRead = async (req, res, next) => {
  try {
    await store.notifMarkAllRead(req.user.id);
    res.json({ message:'All read' });
  } catch(e) { next(e); }
};

const deleteNotification = async (req, res, next) => {
  try {
    await store.notifDelete(req.params.id, req.user.id);
    res.json({ message:'Deleted' });
  } catch(e) { next(e); }
};

const getPrefs = async (req, res, next) => {
  try {
    const p = await store.notifPrefsGet(req.user.id);
    res.json(p);
  } catch(e) { next(e); }
};

const updatePrefs = async (req, res, next) => {
  try {
    const { water_outage, meetings, repairs, payments, meters, sound, email } = req.body;
    const p = await store.notifPrefsUpsert(req.user.id, {
      water_outage, meetings, repairs, payments, meters, sound, email,
    });
    res.json(p);
  } catch(e) { next(e); }
};

module.exports = { getNotifications, markRead, markAllRead, deleteNotification, getPrefs, updatePrefs };
