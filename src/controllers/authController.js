const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const store = require('../data/store');
const { toApi } = require('../data/mongoHelpers');
const { generateCode, sendSms, storeCode, verifyCode } = require('../services/smsService');

const sign = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const normalizePhone = (phone = '') => {
  const raw = String(phone || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  // Canonicalize to +7XXXXXXXXXX (KZ/RU style) when it looks like a local number.
  if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`;
  if (digits.length === 10) return `+7${digits}`;
  // Fallback: keep as +<digits>
  return `+${digits}`;
};

const phoneVariants = (phoneLike = '') => {
  const raw = String(phoneLike || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return [];
  const variants = new Set();
  variants.add(normalizePhone(raw));       // canonical
  variants.add(digits);                    // legacy stored without +
  variants.add(`+${digits}`);              // minimal +
  if (digits.length === 11 && digits.startsWith('8')) {
    variants.add(`7${digits.slice(1)}`);
    variants.add(`+7${digits.slice(1)}`);
  }
  if (digits.length === 10) {
    variants.add(`7${digits}`);
    variants.add(`+7${digits}`);
  }
  return Array.from(variants).filter(Boolean);
};
const normalizeIin = (iin = '') => String(iin).replace(/\D/g, '').trim();
const isEmail = (value = '') => /\S+@\S+\.\S+/.test(value);

const register = async (req, res, next) => {
  try {
    const { full_name, email, phone, password, sms_code } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const normalizedEmail = email?.trim().toLowerCase();

    if (!verifyCode(normalizedPhone, sms_code)) {
      return res.status(400).json({ error: 'Некорректный или истёкший SMS-код' });
    }
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Телефон обязателен' });
    }
    if (await store.userFindByPhone(normalizedPhone)) {
      return res.status(409).json({ error: 'Номер уже зарегистрирован' });
    }
    if (normalizedEmail && await store.userFindByEmail(normalizedEmail)) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const id = uuid();
    const emailToSave = normalizedEmail || `${normalizedPhone.replace('+', '')}@phone.local`;
    await store.userInsert({
      _id: id,
      full_name,
      email: emailToSave,
      phone: normalizedPhone,
      password: bcrypt.hashSync(password, 10),
      role: 'resident',
    });
    await store.balanceEnsure(id);
    await store.notifPrefsEnsure(id);

    const user = await store.userFindById(id);
    res.status(201).json({ token: sign(user), user });
  } catch (e) { next(e); }
};

const sendSmsCode = async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!phone) return res.status(400).json({ error: 'Укажите номер телефона' });
  
  const code = generateCode();
  const result = await sendSms(phone, code);
  
  if (result.success) {
    storeCode(phone, code);
    res.json({
      message: 'SMS-код отправлен',
      phone,
      ...(result.demoCode ? { demo_code: result.demoCode } : {})
    });
  } else {
    res.status(500).json({ error: 'Ошибка отправки SMS', details: result.error });
  }
};

const login = async (req, res, next) => {
  try {
    const { phone, email, login: loginVal, password } = req.body;
    const normalizedPhone = normalizePhone(phone || loginVal);
    const phoneCandidates = phoneVariants(phone || loginVal);
    const normalizedEmail = String(email || loginVal || '').trim().toLowerCase();
    let userRow = null;
    if (normalizedPhone) {
      userRow = await store.userFindOneRaw({
        phone: phoneCandidates.length ? { $in: phoneCandidates } : normalizedPhone
      });
    }
    if (!userRow && normalizedEmail && isEmail(normalizedEmail))
      userRow = await store.userFindOneRaw({ email: normalizedEmail });

    if (!userRow) return res.status(401).json({ error: 'Неверный телефон/email или пароль' });

    // Check password - support both bcrypt hash and plain text for DB accounts
    let passwordMatch = false;
    try {
      passwordMatch = bcrypt.compareSync(password, userRow.password);
    } catch (e) {
      // If bcrypt fails, try plain text comparison (for DB accounts)
      passwordMatch = password === userRow.password;
    }

    if (!passwordMatch) return res.status(401).json({ error: 'Неверный телефон/email или пароль' });

    const user = await store.userFindById(userRow._id);
    res.json({ token: sign(user), user });
  } catch (e) { next(e); }
};

const completeRegistration = async (req, res, next) => {
  try {
    const {
      residential_complex,
      entrance,
      floor,
      apartment_number,
      iin,
      resident_status
    } = req.body;
    const cleanIin = normalizeIin(iin);
    if (cleanIin.length !== 12) {
      return res.status(400).json({ error: 'ИИН должен содержать 12 цифр' });
    }

    const apartmentNo = String(apartment_number).trim();
    const apartment = await store.aptFindByApartmentNumber(apartmentNo);
    if (!apartment?._id) {
      return res.status(400).json({ error: 'Квартира не найдена. Проверьте номер квартиры' });
    }

    // Tenant/family require an owner already linked to this apartment
    const owners = await store.ownersByApartment(apartment._id);
    const approvedOwners = owners.filter((u) => u.verification_status === 'approved');

    if (resident_status === 'tenant' && !approvedOwners.length) {
      return res.status(400).json({ error: 'Арендатор может зарегистрироваться только если собственник уже зарегистрирован и подтверждён' });
    }
    if (resident_status === 'family_member' && !approvedOwners.length) {
      return res.status(400).json({ error: 'Для "член семьи" сначала должен быть зарегистрирован собственник' });
    }

    const nextVerification =
      resident_status === 'family_member' ? 'awaiting_owner' : 'pending';

    await store.userSetRegistrationFields(req.user.id, {
      iin: cleanIin,
      residential_complex: residential_complex.trim(),
      entrance: String(entrance).trim(),
      floor: Number(floor),
      apartment_number: apartmentNo,
      resident_status,
      verification_status: nextVerification,
      verification_method: 'admin_review',
    });

    if (resident_status === 'family_member') {
      const { notify } = require('../services/notificationService');
      const { v4: uuid } = require('uuid');
      // Send request to the first approved owner (if several, we pick the latest by created_at in future; now first is ok)
      const owner = approvedOwners[0];
      const reqId = uuid();
      await store.familyReqInsert({
        _id: reqId,
        owner_id: owner.id,
        requester_id: req.user.id,
        apartment_id: apartment._id,
        status: 'pending',
      });
      await notify(owner.id, {
        title: 'Запрос: добавить члена семьи',
        body: `${req.user.full_name} просит привязать квартиру №${apartmentNo}. Откройте личный кабинет → "Привязка квартиры" для подтверждения.`,
        type: 'info',
      });
    } else {
      await store.userAptInsert(req.user.id, apartment._id, resident_status === 'owner');
    }

    const raw = await store.userFindRawById(req.user.id);
    if (raw?.password) delete raw.password;
    res.json({
      message: 'Данные отправлены на подтверждение администратора',
      user: toApi(raw),
    });
  } catch (e) { next(e); }
};

const me = async (req, res) => {
  const apartments = await store.userApartmentsForUser(req.user.id);
  const balance = await store.balanceGet(req.user.id);
  const unread = await store.notifCountUnread(req.user.id);
  res.json({ user: req.user, apartments, balance: balance.amount || 0, unread_notifications: unread });
};

const updateProfile = async (req, res, next) => {
  try {
    const { full_name, phone, email, language } = req.body;
    const nextPhone = phone ? normalizePhone(phone) : req.user.phone;
    const nextEmail = email ? String(email).trim().toLowerCase() : req.user.email;
    const nextName = full_name?.trim() || req.user.full_name;
    const nextLanguage = language || req.user.language || 'ru';

    if (nextPhone && await store.userExistsPhoneExcept(nextPhone, req.user.id)) {
      return res.status(409).json({ error: 'Этот номер уже используется' });
    }
    if (nextEmail && await store.userExistsEmailExcept(nextEmail, req.user.id)) {
      return res.status(409).json({ error: 'Этот email уже используется' });
    }

    await store.userUpdateProfile(req.user.id, {
      full_name: nextName,
      phone: nextPhone,
      email: nextEmail,
      language: nextLanguage,
    });
    res.json(await store.userFindById(req.user.id));
  } catch (e) { next(e); }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await store.userFindRawById(req.user.id);
    
    // Check current password - support both bcrypt hash and plain text
    let passwordMatch = false;
    try {
      passwordMatch = bcrypt.compareSync(current_password, user.password);
    } catch (e) {
      passwordMatch = current_password === user.password;
    }
    
    if (!passwordMatch)
      return res.status(400).json({ error: 'Current password is incorrect' });
    if (current_password === new_password) {
      return res.status(400).json({ error: 'Новый пароль должен отличаться от текущего' });
    }
    await store.userUpdatePassword(req.user.id, bcrypt.hashSync(new_password, 10));
    res.json({ message: 'Password changed' });
  } catch (e) { next(e); }
};

// ── Owner actions: approve/reject family member request ─────────────────────
const listFamilyRequests = async (req, res, next) => {
  try {
    const rows = await store.familyReqListForOwner(req.user.id, { status: 'pending', limit: 200 });
    res.json(rows);
  } catch (e) { next(e); }
};

const approveFamilyRequest = async (req, res, next) => {
  try {
    const r = await store.familyReqById(req.params.id);
    if (!r || r.owner_id !== req.user.id) return res.status(404).json({ error: 'Запрос не найден' });
    if (r.status !== 'pending') return res.status(409).json({ error: 'Запрос уже обработан' });

    // Link requester to apartment (non-owner) and move them to admin verification
    await store.userAptInsert(r.requester_id, r.apartment_id, false);
    await store.userSetRegistrationFields(r.requester_id, {
      verification_status: 'pending',
      verification_method: 'owner_then_admin',
    });
    await store.familyReqSetStatus(r.id, 'approved');

    const { notify } = require('../services/notificationService');
    await notify(r.requester_id, {
      title: 'Запрос подтверждён собственником',
      body: 'Собственник подтвердил привязку. Теперь ожидайте подтверждение администратора.',
      type: 'info',
    });

    res.json({ ok: true });
  } catch (e) { next(e); }
};

const rejectFamilyRequest = async (req, res, next) => {
  try {
    const r = await store.familyReqById(req.params.id);
    if (!r || r.owner_id !== req.user.id) return res.status(404).json({ error: 'Запрос не найден' });
    if (r.status !== 'pending') return res.status(409).json({ error: 'Запрос уже обработан' });

    await store.familyReqSetStatus(r.id, 'rejected');
    await store.userSetRegistrationFields(r.requester_id, {
      verification_status: 'rejected',
      verification_method: 'owner_rejected',
    });

    const { notify } = require('../services/notificationService');
    await notify(r.requester_id, {
      title: 'Запрос отклонён собственником',
      body: 'Собственник отклонил привязку квартиры.',
      type: 'warning',
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
};

/** Создание учётной записи поставщика услуг (только админ) */
const createUtilityProvider = async (req, res, next) => {
  try {
    const { full_name, email, password, phone } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !isEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Укажите корректный email' });
    }
    if (await store.userFindByEmail(normalizedEmail)) {
      return res.status(409).json({ error: 'Этот email уже занят' });
    }
    const normalizedPhone = phone ? normalizePhone(phone) : '';
    if (normalizedPhone && await store.userFindByPhone(normalizedPhone)) {
      return res.status(409).json({ error: 'Этот телефон уже занят' });
    }
    const pwd = String(password || '');
    if (pwd.length < 8) {
      return res.status(400).json({ error: 'Пароль не короче 8 символов' });
    }
    const id = uuid();
    await store.userInsert({
      _id: id,
      full_name: String(full_name || '').trim(),
      email: normalizedEmail,
      phone: normalizedPhone || undefined,
      password: bcrypt.hashSync(pwd, 10),
      role: 'utility_provider',
      resident_status: 'tenant',
      verification_status: 'approved',
    });
    await store.balanceEnsure(id);
    await store.notifPrefsEnsure(id);
    const user = await store.userFindById(id);
    res.status(201).json({ user });
  } catch (e) { next(e); }
};

module.exports = {
  register,
  sendSmsCode,
  login,
  completeRegistration,
  me,
  updateProfile,
  changePassword,
  listFamilyRequests,
  approveFamilyRequest,
  rejectFamilyRequest,
  createUtilityProvider
};
