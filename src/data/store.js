const { v4: uuid } = require('uuid');
const { col, toApi, toApiList, C } = require('./mongoHelpers');

const boolInt = (v) => (v ? 1 : 0);

// ── Users ───────────────────────────────────────────────────────────────────
async function userFindById(id, { withPassword = false } = {}) {
  const proj = withPassword ? {} : { projection: { password: 0 } };
  const u = await col(C.USERS).findOne({ _id: id }, proj);
  return u ? toApi(u) : null;
}

async function userFindRawById(id) {
  return col(C.USERS).findOne({ _id: id });
}

async function userFindOneRaw(filter) {
  return col(C.USERS).findOne(filter);
}

async function userFindByPhone(phone) {
  return col(C.USERS).findOne({ phone });
}

async function userFindByEmail(email) {
  return col(C.USERS).findOne({ email });
}

async function userExistsPhoneExcept(phone, exceptId) {
  const u = await col(C.USERS).findOne({ phone, _id: { $ne: exceptId } });
  return Boolean(u);
}

async function userExistsEmailExcept(email, exceptId) {
  const u = await col(C.USERS).findOne({ email, _id: { $ne: exceptId } });
  return Boolean(u);
}

async function userInsert(doc) {
  const now = new Date();
  const row = {
    _id: doc._id,
    full_name: doc.full_name,
    email: doc.email,
    password: doc.password,
    role: doc.role,
    language: doc.language || 'ru',
    resident_status: doc.resident_status || 'tenant',
    verification_status: doc.verification_status != null ? doc.verification_status : 'pending',
    created_at: now,
    updated_at: now,
  };
  if (doc.phone) row.phone = doc.phone;
  await col(C.USERS).insertOne(row);
}

async function userSetRegistrationFields(id, fields) {
  await col(C.USERS).updateOne({ _id: id }, { $set: { ...fields, updated_at: new Date() } });
}

async function userUpdateProfile(id, fields) {
  const clean = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => v !== undefined)
  );
  const set = { ...clean, updated_at: new Date() };
  const unset = {};
  if (clean.phone === '' || clean.phone == null) {
    delete set.phone;
    unset.phone = '';
  }
  const upd = { $set: set };
  if (Object.keys(unset).length) upd.$unset = unset;
  await col(C.USERS).updateOne({ _id: id }, upd);
}

async function userUpdatePassword(id, hash) {
  await col(C.USERS).updateOne({ _id: id }, { $set: { password: hash, updated_at: new Date() } });
}

async function userListAdmin({ role } = {}) {
  const q = {};
  if (role) q.role = role;
  const rows = await col(C.USERS)
    .find(q, { projection: { password: 0 } })
    .sort({ created_at: -1 })
    .toArray();
  return toApiList(rows);
}

async function userListTechnicians() {
  const rows = await col(C.USERS)
    .find({ role: 'technician' }, { projection: { full_name: 1, email: 1 } })
    .sort({ full_name: 1 })
    .toArray();
  return toApiList(rows);
}

// ── Balances / prefs ────────────────────────────────────────────────────────
async function balanceEnsure(userId) {
  await col(C.BALANCES).updateOne(
    { _id: userId },
    { $setOnInsert: { _id: userId, user_id: userId, amount: 0, updated_at: new Date() } },
    { upsert: true }
  );
}

async function balanceGet(userId) {
  const b = await col(C.BALANCES).findOne({ _id: userId });
  return b ? { amount: b.amount, updated_at: b.updated_at } : { amount: 0, updated_at: null };
}

async function balanceInc(userId, delta) {
  await col(C.BALANCES).updateOne(
    { _id: userId },
    { $inc: { amount: delta }, $set: { updated_at: new Date() } },
    { upsert: true }
  );
}

async function notifPrefsEnsure(userId) {
  await col(C.NOTIF_PREFS).updateOne(
    { user_id: userId },
    {
      $setOnInsert: {
        _id: userId,
        user_id: userId,
        water_outage: 1,
        meetings: 1,
        repairs: 1,
        payments: 1,
        meters: 1,
        sound: 1,
        email: 0,
      },
    },
    { upsert: true }
  );
}

// ── Apartments / links ────────────────────────────────────────────────────────
async function aptFindById(id) {
  const a = await col(C.APARTMENTS).findOne({ _id: id });
  return a ? toApi(a) : null;
}

async function aptFindByApartmentNumber(num) {
  const a = await col(C.APARTMENTS).findOne({ apartment: String(num).trim() });
  return a;
}

async function aptListAll() {
  const rows = await col(C.APARTMENTS).find({}).sort({ building: 1, apartment: 1 }).toArray();
  return toApiList(rows);
}

async function userAptLinked(userId, apartmentId) {
  const l = await col(C.USER_APTS).findOne({ user_id: userId, apartment_id: apartmentId });
  return Boolean(l);
}

async function userAptInsert(userId, apartmentId, isOwner) {
  try {
    await col(C.USER_APTS).insertOne({
      _id: uuid(),
      user_id: userId,
      apartment_id: apartmentId,
      is_owner: isOwner ? 1 : 0,
    });
  } catch (e) {
    if (e.code !== 11000) throw e;
  }
}

async function userAptIdsForUser(userId) {
  const rows = await col(C.USER_APTS).find({ user_id: userId }).toArray();
  return rows.map((r) => r.apartment_id);
}

async function userApartmentsForUser(userId) {
  const links = await col(C.USER_APTS).find({ user_id: userId }).toArray();
  if (!links.length) return [];
  const ids = links.map((l) => l.apartment_id);
  const apts = await col(C.APARTMENTS).find({ _id: { $in: ids } }).toArray();
  const byId = Object.fromEntries(apts.map((a) => [a._id, toApi(a)]));
  return links.map((l) => ({ ...byId[l.apartment_id], is_owner: l.is_owner }));
}

async function userIdsByApartment(apartmentId) {
  const rows = await col(C.USER_APTS).find({ apartment_id: apartmentId }).toArray();
  return rows.map((r) => r.user_id);
}

async function ownerIdsByApartment(apartmentId) {
  const rows = await col(C.USER_APTS).find({ apartment_id: apartmentId, is_owner: 1 }).toArray();
  return rows.map((r) => r.user_id);
}

async function ownersByApartment(apartmentId) {
  const ids = await ownerIdsByApartment(apartmentId);
  if (!ids.length) return [];
  const rows = await col(C.USERS).find({ _id: { $in: ids } }, { projection: { password: 0 } }).toArray();
  return toApiList(rows);
}

async function userIdsByRole(role) {
  const rows = await col(C.USERS).find({ role }, { projection: { _id: 1 } }).toArray();
  return rows.map((r) => r._id);
}

// ── Family member join requests ─────────────────────────────────────────────
async function familyReqInsert(doc) {
  const now = new Date();
  await col(C.FAMILY_REQUESTS).insertOne({
    _id: doc._id,
    owner_id: doc.owner_id,
    requester_id: doc.requester_id,
    apartment_id: doc.apartment_id,
    status: doc.status || 'pending',
    created_at: now,
    updated_at: now,
  });
}

async function familyReqListForOwner(ownerId, { status = 'pending', limit = 100 } = {}) {
  const rows = await col(C.FAMILY_REQUESTS)
    .find({ owner_id: ownerId, ...(status ? { status } : {}) })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();
  return toApiList(rows);
}

async function familyReqById(id) {
  const r = await col(C.FAMILY_REQUESTS).findOne({ _id: id });
  return r ? toApi(r) : null;
}

async function familyReqSetStatus(id, status) {
  await col(C.FAMILY_REQUESTS).updateOne({ _id: id }, { $set: { status, updated_at: new Date() } });
}

async function userIdsResidents() {
  const rows = await col(C.USERS).find({ role: 'resident' }, { projection: { _id: 1 } }).toArray();
  return rows.map((r) => r._id);
}

// ── Meters ───────────────────────────────────────────────────────────────────
async function meterPrevAccepted(apartmentId, meterType) {
  return col(C.METER_READINGS).findOne(
    { apartment_id: apartmentId, meter_type: meterType, status: 'accepted' },
    { sort: { submitted_at: -1 } }
  );
}

async function meterInsert(doc) {
  await col(C.METER_READINGS).insertOne(doc);
}

async function meterById(id) {
  const r = await col(C.METER_READINGS).findOne({ _id: id });
  return r ? toApi(r) : null;
}

async function meterRawById(id) {
  return col(C.METER_READINGS).findOne({ _id: id });
}

async function meterListForUser(apartmentIds, { apartment_id, meter_type, limit, offset }) {
  const match = {};
  if (apartment_id && apartmentIds.includes(apartment_id)) match.apartment_id = apartment_id;
  else match.apartment_id = { $in: apartmentIds };
  if (meter_type) match.meter_type = meter_type;

  const rows = await col(C.METER_READINGS)
    .aggregate([
      { $match: match },
      { $sort: { submitted_at: -1 } },
      { $skip: offset },
      { $limit: limit },
      { $lookup: { from: C.USERS, localField: 'user_id', foreignField: '_id', as: 'u' } },
      { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
      { $addFields: { submitted_by_name: '$u.full_name' } },
      { $project: { u: 0 } },
    ])
    .toArray();
  return toApiList(rows);
}

async function meterLatest(apartmentId, types) {
  const result = {};
  for (const t of types) {
    const r = await col(C.METER_READINGS).findOne(
      { apartment_id: apartmentId, meter_type: t },
      { sort: { submitted_at: -1 } }
    );
    result[t] = r ? toApi(r) : null;
  }
  return result;
}

async function meterUpdateReview(id, { status, flagged_reason, reviewed_by }) {
  await col(C.METER_READINGS).updateOne(
    { _id: id },
    {
      $set: {
        status,
        flagged_reason: flagged_reason ?? null,
        reviewed_at: new Date(),
        reviewed_by,
      },
    }
  );
}

async function meterFlaggedList() {
  const rows = await col(C.METER_READINGS)
    .aggregate([
      { $match: { status: 'flagged' } },
      { $sort: { submitted_at: -1 } },
      { $lookup: { from: C.USERS, localField: 'user_id', foreignField: '_id', as: 'u' } },
      { $unwind: '$u' },
      { $lookup: { from: C.APARTMENTS, localField: 'apartment_id', foreignField: '_id', as: 'a' } },
      { $unwind: '$a' },
      {
        $addFields: {
          full_name: '$u.full_name',
          address: '$a.address',
          apartment: '$a.apartment',
        },
      },
      { $project: { u: 0, a: 0 } },
    ])
    .toArray();
  return toApiList(rows);
}

async function meterAverageConsumption(apartmentId, meterType, months = 6) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  
  const rows = await col(C.METER_READINGS)
    .aggregate([
      {
        $match: {
          apartment_id: apartmentId,
          meter_type: meterType,
          status: 'accepted',
          consumption: { $ne: null, $gt: 0 },
          submitted_at: { $gte: cutoff },
        },
      },
      {
        $group: {
          _id: null,
          avgConsumption: { $avg: '$consumption' },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();
  
  if (rows.length === 0 || rows[0].count < 2) {
    return null;
  }
  
  return rows[0].avgConsumption;
}

// ── Bills ─────────────────────────────────────────────────────────────────────
function periodMonthBounds(period) {
  const [y, m] = period.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { start, end };
}

async function meterAcceptedInPeriod(apartmentId, meterType, period) {
  const { start, end } = periodMonthBounds(period);
  return col(C.METER_READINGS).findOne(
    {
      apartment_id: apartmentId,
      meter_type: meterType,
      status: 'accepted',
      submitted_at: { $gte: start, $lt: end },
    },
    { sort: { submitted_at: -1 } }
  );
}

async function billExists(apartmentId, period, service) {
  const b = await col(C.BILLS).findOne({ apartment_id, period, service });
  return Boolean(b);
}

/** Любой счёт за период (как в SQLite: один проход генерации на квартиру+период) */
async function billsHasAnyForPeriod(apartmentId, period) {
  const b = await col(C.BILLS).findOne({ apartment_id, period });
  return Boolean(b);
}

async function billInsert(doc) {
  await col(C.BILLS).insertOne(doc);
}

async function billById(id) {
  const b = await col(C.BILLS).findOne({ _id: id });
  return b ? toApi(b) : null;
}

async function billRawById(id) {
  return col(C.BILLS).findOne({ _id: id });
}

async function billsListForApts(aptIds, filters) {
  const q = {};
  if (filters.apartment_id && aptIds.includes(filters.apartment_id)) q.apartment_id = filters.apartment_id;
  else q.apartment_id = { $in: aptIds };
  if (filters.period) q.period = filters.period;
  if (filters.status) q.status = filters.status;
  if (filters.service) q.service = filters.service;
  const rows = await col(C.BILLS).find(q).sort({ generated_at: -1 }).toArray();
  return toApiList(rows);
}

async function billMarkPaid(id) {
  await col(C.BILLS).updateOne({ _id: id }, { $set: { status: 'paid' } });
}

async function billsSumUnpaid(aptIds) {
  const agg = await col(C.BILLS)
    .aggregate([
      { $match: { apartment_id: { $in: aptIds }, status: { $in: ['unpaid', 'overdue'] } } },
      { $group: { _id: null, t: { $sum: '$amount' } } },
    ])
    .toArray();
  return agg[0]?.t || 0;
}

async function billsListAdmin(limit = 500) {
  const rows = await col(C.BILLS).find({}).sort({ generated_at: -1 }).limit(limit).toArray();
  return toApiList(rows);
}

async function detailedBillInsert(doc) {
  await col(C.DETAILED_BILLS).insertOne(doc);
}

// ── Payments ──────────────────────────────────────────────────────────────────
async function paymentInsert(doc) {
  await col(C.PAYMENTS).insertOne(doc);
}

async function paymentSetCompleted(id) {
  await col(C.PAYMENTS).updateOne({ _id: id }, { $set: { completed_at: new Date() } });
}

async function paymentHistory(userId, limit, offset) {
  const rows = await col(C.PAYMENTS)
    .aggregate([
      { $match: { user_id: userId } },
      { $sort: { created_at: -1 } },
      { $skip: offset },
      { $limit: limit },
      { $lookup: { from: C.BILLS, localField: 'bill_id', foreignField: '_id', as: 'b' } },
      { $unwind: { path: '$b', preserveNullAndEmptyArrays: true } },
      { $addFields: { service: '$b.service', period: '$b.period' } },
      { $project: { b: 0 } },
    ])
    .toArray();
  return toApiList(rows);
}

async function paymentsSumSuccessYear(aptIds, year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const agg = await col(C.PAYMENTS)
    .aggregate([
      {
        $match: {
          apartment_id: { $in: aptIds },
          status: 'success',
          created_at: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: null, t: { $sum: '$amount' } } },
    ])
    .toArray();
  return agg[0]?.t || 0;
}

async function paymentLastSuccess(aptIds) {
  const p = await col(C.PAYMENTS).findOne(
    { apartment_id: { $in: aptIds }, status: 'success' },
    { sort: { created_at: -1 } }
  );
  return p?.created_at || null;
}

// ── Requests ─────────────────────────────────────────────────────────────────
async function requestInsert(doc) {
  await col(C.REQUESTS).insertOne(doc);
}

async function requestById(id) {
  const r = await col(C.REQUESTS).findOne({ _id: id });
  return r ? toApi(r) : null;
}

async function requestRawById(id) {
  return col(C.REQUESTS).findOne({ _id: id });
}

async function requestsListResident(userId, { status, priority, limit, offset }) {
  const match = { user_id: userId };
  if (status) match.status = status;
  if (priority) match.priority = priority;
  const rows = await col(C.REQUESTS)
    .aggregate([
      { $match: match },
      { $sort: { priority: -1, created_at: -1 } },
      { $skip: offset },
      { $limit: limit },
      { $lookup: { from: C.APARTMENTS, localField: 'apartment_id', foreignField: '_id', as: 'a' } },
      { $unwind: '$a' },
      { $lookup: { from: C.USERS, localField: 'assigned_to', foreignField: '_id', as: 'tech' } },
      { $unwind: { path: '$tech', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          address: '$a.address',
          apartment: '$a.apartment',
          technician_name: '$tech.full_name',
        },
      },
      { $project: { a: 0, tech: 0 } },
    ])
    .toArray();
  return toApiList(rows);
}

async function requestsListAdmin({ status, priority, limit, offset }) {
  const match = {};
  if (status) match.status = status;
  if (priority) match.priority = priority;
  const rows = await col(C.REQUESTS)
    .aggregate([
      { $match: match },
      { $sort: { priority: -1, created_at: -1 } },
      { $skip: offset },
      { $limit: limit },
      { $lookup: { from: C.APARTMENTS, localField: 'apartment_id', foreignField: '_id', as: 'a' } },
      { $unwind: '$a' },
      { $lookup: { from: C.USERS, localField: 'user_id', foreignField: '_id', as: 'res' } },
      { $unwind: '$res' },
      { $lookup: { from: C.USERS, localField: 'assigned_to', foreignField: '_id', as: 'tech' } },
      { $unwind: { path: '$tech', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          address: '$a.address',
          apartment: '$a.apartment',
          resident_name: '$res.full_name',
          technician_name: '$tech.full_name',
        },
      },
      { $project: { a: 0, res: 0, tech: 0 } },
    ])
    .toArray();
  return toApiList(rows);
}

async function requestDetail(id) {
  const rows = await col(C.REQUESTS)
    .aggregate([
      { $match: { _id: id } },
      { $lookup: { from: C.APARTMENTS, localField: 'apartment_id', foreignField: '_id', as: 'a' } },
      { $unwind: '$a' },
      { $lookup: { from: C.USERS, localField: 'user_id', foreignField: '_id', as: 'res' } },
      { $unwind: '$res' },
      { $lookup: { from: C.USERS, localField: 'assigned_to', foreignField: '_id', as: 'tech' } },
      { $unwind: { path: '$tech', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          address: '$a.address',
          apartment: '$a.apartment',
          resident_name: '$res.full_name',
          technician_name: '$tech.full_name',
        },
      },
      { $project: { a: 0, res: 0, tech: 0 } },
    ])
    .toArray();
  const r = rows[0];
  return r ? toApi(r) : null;
}

async function requestAssign(id, technicianId) {
  await col(C.REQUESTS).updateOne(
    { _id: id },
    { $set: { assigned_to: technicianId, status: 'in_progress', updated_at: new Date() } }
  );
}

async function requestUpdateStatus(id, status) {
  const set = { status, updated_at: new Date() };
  if (status === 'resolved') set.resolved_at = new Date();
  else set.resolved_at = null;
  await col(C.REQUESTS).updateOne({ _id: id }, { $set: set });
}

async function userFindTechnician(id) {
  return col(C.USERS).findOne({ _id: id, role: 'technician' });
}

// ── News ─────────────────────────────────────────────────────────────────────
async function newsList({ category, q, limit, offset }) {
  const parts = [{ published: { $in: [true, 1] } }];
  if (category) parts.push({ category });
  if (q) parts.push({ $or: [{ title: new RegExp(q, 'i') }, { body: new RegExp(q, 'i') }] });
  const match = parts.length === 1 ? parts[0] : { $and: parts };
  const rows = await col(C.NEWS)
    .aggregate([
      { $match: match },
      { $sort: { created_at: -1 } },
      { $skip: offset },
      { $limit: limit },
      { $lookup: { from: C.USERS, localField: 'author_id', foreignField: '_id', as: 'u' } },
      { $unwind: '$u' },
      { $addFields: { author_name: '$u.full_name' } },
      { $project: { u: 0 } },
    ])
    .toArray();
  return toApiList(rows);
}

async function newsById(id) {
  const rows = await col(C.NEWS)
    .aggregate([
      { $match: { _id: id } },
      { $lookup: { from: C.USERS, localField: 'author_id', foreignField: '_id', as: 'u' } },
      { $unwind: '$u' },
      { $addFields: { author_name: '$u.full_name' } },
      { $project: { u: 0 } },
    ])
    .toArray();
  const n = rows[0];
  return n ? toApi(n) : null;
}

async function newsInsert(doc) {
  await col(C.NEWS).insertOne(doc);
}

async function newsUpdate(id, fields) {
  await col(C.NEWS).updateOne({ _id: id }, { $set: { ...fields, updated_at: new Date() } });
}

async function newsDelete(id) {
  await col(C.NEWS).deleteOne({ _id: id });
}

async function newsRaw(id) {
  return col(C.NEWS).findOne({ _id: id });
}

// ── Notifications ────────────────────────────────────────────────────────────
async function notifInsert(userId, title, body, type) {
  await col(C.NOTIFICATIONS).insertOne({
    _id: uuid(),
    user_id: userId,
    title,
    body,
    type,
    is_read: 0,
    created_at: new Date(),
  });
}

async function notifList(userId, { limit, offset, unreadOnly }) {
  const q = { user_id: userId };
  if (unreadOnly) q.is_read = 0;
  const rows = await col(C.NOTIFICATIONS)
    .find(q)
    .sort({ created_at: -1 })
    .skip(offset)
    .limit(limit)
    .toArray();
  return toApiList(rows);
}

async function notifMarkRead(id, userId) {
  await col(C.NOTIFICATIONS).updateOne({ _id: id, user_id: userId }, { $set: { is_read: 1 } });
}

async function notifMarkAllRead(userId) {
  await col(C.NOTIFICATIONS).updateMany({ user_id: userId }, { $set: { is_read: 1 } });
}

async function notifDelete(id, userId) {
  await col(C.NOTIFICATIONS).deleteOne({ _id: id, user_id: userId });
}

async function notifCountUnread(userId) {
  return col(C.NOTIFICATIONS).countDocuments({ user_id: userId, is_read: 0 });
}

async function notifPrefsGet(userId) {
  let p = await col(C.NOTIF_PREFS).findOne({ user_id: userId });
  if (!p) {
    await notifPrefsEnsure(userId);
    p = await col(C.NOTIF_PREFS).findOne({ user_id: userId });
  }
  return toApi(p);
}

async function notifPrefsUpsert(userId, fields) {
  const set = {
    user_id: userId,
    water_outage: boolInt(fields.water_outage),
    meetings: boolInt(fields.meetings),
    repairs: boolInt(fields.repairs),
    payments: boolInt(fields.payments),
    meters: boolInt(fields.meters),
    sound: boolInt(fields.sound),
    email: boolInt(fields.email),
  };
  await col(C.NOTIF_PREFS).findOneAndUpdate(
    { user_id: userId },
    { $set: set, $setOnInsert: { _id: userId } },
    { upsert: true }
  );
  return notifPrefsGet(userId);
}

// ── Reports ───────────────────────────────────────────────────────────────────
async function reportOverview() {
  const [
    totalResidents,
    totalApartments,
    openRequests,
    totalRevenueAgg,
    unpaidBills,
    pendingReadings,
  ] = await Promise.all([
    col(C.USERS).countDocuments({ role: 'resident' }),
    col(C.APARTMENTS).countDocuments({}),
    col(C.REQUESTS).countDocuments({ status: { $in: ['new', 'in_progress'] } }),
    col(C.PAYMENTS).aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, c: { $sum: '$amount' } } }]).toArray(),
    col(C.BILLS).countDocuments({ status: 'unpaid' }),
    col(C.METER_READINGS).countDocuments({ status: 'pending' }),
  ]);
  return {
    totalResidents,
    totalApartments,
    openRequests,
    totalRevenue: totalRevenueAgg[0]?.c || 0,
    unpaidBills,
    pendingReadings,
  };
}

async function reportPaymentsByMonth({ from, to }) {
  const match = {};
  if (from || to) {
    match.created_at = {};
    if (from) match.created_at.$gte = new Date(from);
    if (to) match.created_at.$lte = new Date(to + 'T23:59:59.999Z');
  }
  const rows = await col(C.PAYMENTS)
    .aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
          count: { $sum: 1 },
          total: { $sum: '$amount' },
          collected: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, '$amount', 0] } },
        },
      },
      { $sort: { _id: -1 } },
      { $project: { month: '$_id', count: 1, total: 1, collected: 1, _id: 0 } },
    ])
    .toArray();
  return rows;
}

async function reportRequests() {
  const [byStatusRaw, byPriorityRaw, avgAgg] = await Promise.all([
    col(C.REQUESTS).aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),
    col(C.REQUESTS).aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]).toArray(),
    col(C.REQUESTS)
      .aggregate([
        { $match: { resolved_at: { $ne: null } } },
        {
          $project: {
            hours: {
              $divide: [{ $subtract: ['$resolved_at', '$created_at'] }, 3600000],
            },
          },
        },
        { $group: { _id: null, h: { $avg: '$hours' } } },
      ])
      .toArray(),
  ]);
  const byStatus = byStatusRaw.map((r) => ({ status: r._id, count: r.count }));
  const byPriority = byPriorityRaw.map((r) => ({ priority: r._id, count: r.count }));
  return {
    byStatus,
    byPriority,
    avg_resolution_hours: avgAgg[0]?.h ?? null,
  };
}

async function reportMeters() {
  const raw = await col(C.METER_READINGS)
    .aggregate([
      { $group: { _id: { meter_type: '$meter_type', status: '$status' }, count: { $sum: 1 } } },
    ])
    .toArray();
  return raw.map((r) => ({
    meter_type: r._id.meter_type,
    status: r._id.status,
    count: r.count,
  }));
}

// ── Resident chats ───────────────────────────────────────────────────────────
async function chatInsert(doc) {
  const now = new Date();
  await col(C.CHATS).insertOne({
    _id: doc._id,
    title: doc.title,
    description: doc.description || '',
    created_by: doc.created_by,
    created_at: now,
    updated_at: now,
  });
}

async function chatList() {
  const rows = await col(C.CHATS).find({}).sort({ updated_at: -1 }).toArray();
  return toApiList(rows);
}

async function chatById(id) {
  const c = await col(C.CHATS).findOne({ _id: id });
  return c ? toApi(c) : null;
}

async function chatTouchUpdated(id) {
  await col(C.CHATS).updateOne({ _id: id }, { $set: { updated_at: new Date() } });
}

async function chatMessageInsert(doc) {
  const now = new Date();
  await col(C.CHAT_MESSAGES).insertOne({
    _id: doc._id,
    chat_id: doc.chat_id,
    user_id: doc.user_id,
    body: doc.body != null ? String(doc.body) : '',
    image_url: doc.image_url || null,
    created_at: now,
    edited_at: null,
  });
}

async function chatMessageRaw(id) {
  return col(C.CHAT_MESSAGES).findOne({ _id: id });
}

async function chatMessagesList(chatId, { limit = 100, before } = {}) {
  const q = { chat_id: chatId };
  if (before) q.created_at = { $lt: new Date(before) };
  const rows = await col(C.CHAT_MESSAGES)
    .find(q)
    .sort({ created_at: -1 })
    .limit(Math.min(200, Math.max(1, limit)))
    .toArray();
  return rows.reverse();
}

async function chatMessageUpdateBody(id, body) {
  await col(C.CHAT_MESSAGES).updateOne(
    { _id: id },
    { $set: { body: String(body), edited_at: new Date() } }
  );
}

async function chatReadUpsert(messageId, userId) {
  const now = new Date();
  await col(C.CHAT_READS).updateOne(
    { message_id: messageId, user_id: userId },
    { $setOnInsert: { _id: uuid(), message_id: messageId, user_id: userId, read_at: now } },
    { upsert: true }
  );
}

async function chatReadsForMessages(messageIds) {
  if (!messageIds.length) return [];
  return col(C.CHAT_READS).find({ message_id: { $in: messageIds } }).toArray();
}

async function chatReadsForMessage(messageId) {
  return col(C.CHAT_READS).find({ message_id: messageId }).sort({ read_at: 1 }).toArray();
}

async function chatUserStateGet(chatId, userId) {
  return col(C.CHAT_USER_STATE).findOne({ chat_id: chatId, user_id: userId });
}

async function chatUserStateSetLastRead(chatId, userId, at) {
  const t = at instanceof Date ? at : new Date(at);
  await col(C.CHAT_USER_STATE).updateOne(
    { chat_id: chatId, user_id: userId },
    {
      $set: { last_read_at: t },
      $setOnInsert: { _id: uuid(), chat_id: chatId, user_id: userId },
    },
    { upsert: true }
  );
}

async function chatUnreadCount(chatId, userId) {
  const st = await chatUserStateGet(chatId, userId);
  const since = st?.last_read_at || new Date(0);
  return col(C.CHAT_MESSAGES).countDocuments({
    chat_id: chatId,
    user_id: { $ne: userId },
    created_at: { $gt: since },
  });
}

module.exports = {
  userFindById,
  userFindRawById,
  userFindOneRaw,
  userFindByPhone,
  userFindByEmail,
  userExistsPhoneExcept,
  userExistsEmailExcept,
  userInsert,
  userUpdateProfile,
  userUpdatePassword,
  userListAdmin,
  userListTechnicians,
  balanceEnsure,
  balanceGet,
  balanceInc,
  notifPrefsEnsure,
  aptFindById,
  aptFindByApartmentNumber,
  aptListAll,
  userAptLinked,
  userAptInsert,
  userAptIdsForUser,
  userApartmentsForUser,
  userIdsByApartment,
  ownerIdsByApartment,
  ownersByApartment,
  userIdsByRole,
  familyReqInsert,
  familyReqListForOwner,
  familyReqById,
  familyReqSetStatus,
  userIdsResidents,
  meterPrevAccepted,
  meterInsert,
  meterById,
  meterRawById,
  meterListForUser,
  meterLatest,
  meterUpdateReview,
  meterFlaggedList,
  meterAverageConsumption,
  meterAcceptedInPeriod,
  billExists,
  billsHasAnyForPeriod,
  billInsert,
  billById,
  billRawById,
  billsListForApts,
  billMarkPaid,
  billsSumUnpaid,
  billsListAdmin,
  detailedBillInsert,
  paymentInsert,
  paymentSetCompleted,
  paymentHistory,
  paymentsSumSuccessYear,
  paymentLastSuccess,
  requestInsert,
  requestById,
  requestRawById,
  requestsListResident,
  requestsListAdmin,
  requestDetail,
  requestAssign,
  requestUpdateStatus,
  userFindTechnician,
  newsList,
  newsById,
  newsInsert,
  newsUpdate,
  newsDelete,
  newsRaw,
  notifInsert,
  notifList,
  notifMarkRead,
  notifMarkAllRead,
  notifDelete,
  notifCountUnread,
  notifPrefsGet,
  notifPrefsUpsert,
  reportOverview,
  reportPaymentsByMonth,
  reportRequests,
  reportMeters,
  userSetRegistrationFields,
  chatInsert,
  chatList,
  chatById,
  chatTouchUpdated,
  chatMessageInsert,
  chatMessageRaw,
  chatMessagesList,
  chatMessageUpdateBody,
  chatReadUpsert,
  chatReadsForMessages,
  chatReadsForMessage,
  chatUserStateGet,
  chatUserStateSetLastRead,
  chatUnreadCount,
};
