const store = require('../data/store');

// Email configuration (would use nodemailer in production)
const sendEmail = async (to, subject, text) => {
  try {
    // In production, integrate with real email service (nodemailer, SendGrid, etc.)
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}, Body: ${text}`);
    // TODO: Implement real email sending
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({...});
  } catch (e) {
    console.error('Email send error:', e.message);
  }
};

const notify = async (userId, { title, body, type = 'info' }) => {
  try {
    // Save to database
    await store.notifInsert(userId, title, body, type);

    // Get user preferences
    const prefs = await store.notifPrefsGet(userId);
    const user = await store.userFindById(userId);

    // Send email if enabled and user has email
    if (prefs?.email && user?.email) {
      await sendEmail(user.email, title, body);
    }

    // Sound notification is handled on frontend via WebSocket or polling
  } catch (e) {
    console.error('notify error:', e.message);
  }
};

const notifyApartment = async (apartmentId, payload) => {
  const ids = await store.userIdsByApartment(apartmentId);
  await Promise.all(ids.map((id) => notify(id, payload)));
};

const notifyAll = async (payload) => {
  const ids = await store.userIdsResidents();
  await Promise.all(ids.map((id) => notify(id, payload)));
};

module.exports = { notify, notifyApartment, notifyAll };
