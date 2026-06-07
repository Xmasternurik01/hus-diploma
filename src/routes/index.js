const express = require('express');
const { body  } = require('express-validator');
const router  = express.Router();

const { authenticate, authorize, requireVerified } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const upload = require('../middleware/upload');

const auth   = require('../controllers/authController');
const meters = require('../controllers/meterController');
const billing= require('../controllers/billingController');
const payments=require('../controllers/paymentController');
const reqs   = require('../controllers/requestController');
const news   = require('../controllers/newsController');
const notifs = require('../controllers/notificationController');
const reports= require('../controllers/reportController');
const chats  = require('../controllers/chatController');

const maybeChatPhoto = (req, res, next) => {
  if (req.is('multipart/form-data')) return upload.single('photo')(req, res, next);
  next();
};

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/auth/send-sms-code', [body('phone').notEmpty()], validate, auth.sendSmsCode);
router.post('/auth/register', [
  body('full_name').notEmpty(),
  body('phone').notEmpty(),
  body('password').isLength({ min: 6 }),
  body('sms_code').notEmpty(),
  body('email').optional({ checkFalsy: true }).isEmail()
], validate, auth.register);
router.post('/auth/login', [
  body('password').notEmpty(),
  body().custom(v => {
    if (!v) return false;
    return Boolean(v.phone || v.email || v.login);
  }).withMessage('Укажите телефон или email')
], validate, auth.login);
router.post('/auth/complete-registration', authenticate, [
  body('residential_complex').notEmpty(),
  body('entrance').notEmpty(),
  body('floor').isInt({ min: 1, max: 99 }),
  body('apartment_number').notEmpty(),
  body('iin').matches(/^\d{12}$/),
  body('resident_status').isIn(['owner', 'tenant', 'family_member'])
], validate, auth.completeRegistration);
router.get ('/auth/me',       authenticate, auth.me);
router.put ('/auth/profile',  authenticate, [
  body('full_name').optional({ checkFalsy: true }).isLength({ min: 2, max: 120 }),
  body('phone').optional({ checkFalsy: true }).matches(/^[+\d\s\-()]{7,20}$/),
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('language').optional({ checkFalsy: true }).isIn(['ru', 'kz', 'en'])
], validate, auth.updateProfile);
router.put ('/auth/password', authenticate, [
  body('current_password').notEmpty(),
  body('new_password').isLength({min:8}).matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
], validate, auth.changePassword);

// ── Meters ────────────────────────────────────────────────────────────────────
router.post('/meters',             authenticate, requireVerified, upload.single('photo'), [body('apartment_id').notEmpty(), body('meter_type').isIn(['cold_water','hot_water','electricity','gas']), body('value').isFloat({min:0})], validate, meters.submitReading);
router.get ('/meters',             authenticate, meters.getReadings);
router.get ('/meters/latest',      authenticate, meters.getLatest);
router.get ('/meters/flagged',     authenticate, authorize('admin','utility_provider'), meters.getFlagged);
router.put ('/meters/:id/review',  authenticate, authorize('admin','utility_provider'), [body('approved').isBoolean()], validate, meters.reviewReading);

// ── Billing ───────────────────────────────────────────────────────────────────
router.get ('/billing',            authenticate, billing.getBills);
router.get ('/billing/summary',    authenticate, billing.getSummary);
router.get ('/billing/:id',        authenticate, billing.getBillById);
router.post('/billing/generate',   authenticate, authorize('admin'), [body('apartment_id').notEmpty(), body('period').matches(/^\d{4}-\d{2}$/)], validate, billing.generateBills);
router.post('/billing/create-detailed', authenticate, authorize('utility_provider', 'admin'), billing.createDetailedBill);

// ── Payments ──────────────────────────────────────────────────────────────────
router.get ('/payments',           authenticate, payments.getHistory);
router.get ('/payments/balance',   authenticate, payments.getBalance);
router.post('/payments/pay',       authenticate, requireVerified, [body('bill_id').notEmpty(), body('method').isIn(['card','balance','kaspi'])], validate, payments.payBill);
router.post('/payments/topup',     authenticate, requireVerified, [body('amount').isFloat({min:50})], validate, payments.topUp);

// ── Requests ──────────────────────────────────────────────────────────────────
router.get ('/requests',           authenticate, reqs.getRequests);
router.get ('/requests/:id',       authenticate, reqs.getById);
router.post('/requests',           authenticate, requireVerified, upload.array('photos', 5), [body('apartment_id').notEmpty(), body('title').notEmpty(), body('description').notEmpty()], validate, reqs.createRequest);

// ── Family member requests (owner confirms) ─────────────────────────────────
router.get('/family/requests', authenticate, authorize('resident'), auth.listFamilyRequests);
router.post('/family/requests/:id/approve', authenticate, authorize('resident'), auth.approveFamilyRequest);
router.post('/family/requests/:id/reject', authenticate, authorize('resident'), auth.rejectFamilyRequest);
router.put ('/requests/:id/assign',authenticate, authorize('admin'), [body('technician_id').notEmpty()], validate, reqs.assignTechnician);
router.put ('/requests/:id/status',authenticate, authorize('admin','technician'), [body('status').isIn(['in_progress','resolved','archived','rejected'])], validate, reqs.updateStatus);

// ── News ──────────────────────────────────────────────────────────────────────
router.get ('/news',               news.getNews);
router.get ('/news/:id',           news.getNewsById);
router.post('/news',               authenticate, authorize('admin'), [body('title').notEmpty(), body('body').notEmpty()], validate, news.createNews);
router.put ('/news/:id',           authenticate, authorize('admin'), news.updateNews);
router.delete('/news/:id',         authenticate, authorize('admin'), news.deleteNews);

// ── Notifications ─────────────────────────────────────────────────────────────
router.get ('/notifications',           authenticate, notifs.getNotifications);
router.put ('/notifications/read-all',  authenticate, notifs.markAllRead);
router.put ('/notifications/:id/read',  authenticate, notifs.markRead);
router.delete('/notifications/:id',     authenticate, notifs.deleteNotification);
router.get ('/notifications/prefs',     authenticate, notifs.getPrefs);
router.put ('/notifications/prefs',     authenticate, notifs.updatePrefs);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports/overview', authenticate, authorize('admin'), reports.getOverview);
router.get('/reports/payments', authenticate, authorize('admin'), reports.getPaymentReport);
router.get('/reports/requests', authenticate, authorize('admin'), reports.getRequestReport);
router.get('/reports/meters',   authenticate, authorize('admin'), reports.getMeterReport);

// ── Admin extras ──────────────────────────────────────────────────────────────
const store = require('../data/store');

router.get('/admin/users', authenticate, authorize('admin'), async (req, res) => {
  const { role } = req.query;
  res.json(await store.userListAdmin({ role }));
});

router.post('/admin/users/utility-provider', authenticate, authorize('admin'), [
  body('full_name').notEmpty().isLength({ max: 120 }),
  body('email').isEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[A-Za-z])(?=.*\d).+$/),
  body('phone').optional({ checkFalsy: true }).matches(/^[+\d\s\-()]{7,20}$/),
], validate, auth.createUtilityProvider);

router.get('/users/technicians', authenticate, authorize('admin'), async (req, res) => {
  res.json(await store.userListTechnicians());
});

router.get('/apartments', authenticate, authorize('admin'), async (req, res) => {
  res.json(await store.aptListAll());
});

router.get('/admin/bills', authenticate, authorize('admin'), async (req, res) => {
  res.json(await store.billsListAdmin(500));
});

// ── Resident chats (админ создаёт, жители общаются) ───────────────────────────
router.post('/admin/chats', authenticate, authorize('admin'), [
  body('title').notEmpty().isLength({ max: 120 }),
  body('description').optional({ checkFalsy: true }).isLength({ max: 500 }),
], validate, chats.adminCreateChat);
router.get('/admin/chats', authenticate, authorize('admin'), chats.adminListChats);

router.get('/chats', authenticate, chats.requireResidentOrAdmin, chats.listChats);
router.get('/chats/:chatId/messages', authenticate, chats.requireResidentOrAdmin, chats.getMessages);
router.post('/chats/:chatId/messages', authenticate, chats.requireResidentOrAdmin, maybeChatPhoto, chats.postMessage);
router.put('/chats/:chatId/messages/:messageId', authenticate, chats.requireResidentOrAdmin, [
  body('body').notEmpty().isLength({ max: 4000 }),
], validate, chats.editMessage);
router.get('/chats/:chatId/messages/:messageId/readers', authenticate, chats.requireResidentOrAdmin, chats.getReaders);

module.exports = router;
