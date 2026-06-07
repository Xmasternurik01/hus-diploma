const { v4: uuid } = require('uuid');
const store = require('../data/store');
const { notify } = require('../services/notificationService');

const createRequest = async (req, res, next) => {
  try {
    const { apartment_id, title, description, is_emergency } = req.body;
    const photos = req.files ? req.files.map(f => `/uploads/requests/${f.filename}`) : [];
    if (!(await store.userAptLinked(req.user.id, apartment_id)))
      return res.status(403).json({ error: 'Apartment not linked to your account' });

    const id = uuid();
    const priority = (is_emergency === true || is_emergency === 'true') ? 'urgent' : 'standard';
    const now = new Date();
    await store.requestInsert({
      _id: id,
      user_id: req.user.id,
      apartment_id,
      title,
      description,
      priority,
      status: 'new',
      assigned_to: null,
      photo_urls: photos,
      created_at: now,
      updated_at: now,
      resolved_at: null,
    });

    await notify(req.user.id, {
      title: 'Заявка принята',
      body: `"${title}" зарегистрирована${priority==='urgent' ? ' как срочная' : ''}.`,
      type: 'request'
    });
    res.status(201).json(await store.requestById(id));
  } catch(e) { next(e); }
};

const getRequests = async (req, res, next) => {
  try {
    const { status, priority, limit=20, offset=0 } = req.query;
    const opts = { status, priority, limit: parseInt(limit,10), offset: parseInt(offset,10) };
    const rows = req.user.role === 'resident'
      ? await store.requestsListResident(req.user.id, opts)
      : await store.requestsListAdmin(opts);
    res.json(rows);
  } catch(e) { next(e); }
};

const getById = async (req, res, next) => {
  try {
    const r = await store.requestDetail(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    if (req.user.role==='resident' && r.user_id!==req.user.id) return res.status(403).json({ error:'Access denied' });
    if (typeof r.photo_urls === 'string') {
      try { r.photo_urls = JSON.parse(r.photo_urls||'[]'); } catch { r.photo_urls = []; }
    }
    if (!Array.isArray(r.photo_urls)) r.photo_urls = r.photo_urls || [];
    res.json(r);
  } catch(e) { next(e); }
};

const assignTechnician = async (req, res, next) => {
  try {
    const { technician_id } = req.body;
    const r = await store.requestRawById(req.params.id);
    if (!r) return res.status(404).json({ error:'Not found' });
    if (!(await store.userFindTechnician(technician_id)))
      return res.status(404).json({ error:'Technician not found' });
    await store.requestAssign(req.params.id, technician_id);
    await notify(technician_id, { title:'Вам назначена заявка', body:r.title, type:'request' });
    await notify(r.user_id, { title:'Заявка обновлена', body:`"${r.title}" передана в работу.`, type:'request' });
    res.json(await store.requestById(req.params.id));
  } catch(e) { next(e); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, comment } = req.body;
    const r = await store.requestRawById(req.params.id);
    if (!r) return res.status(404).json({ error:'Not found' });
    await store.requestUpdateStatus(req.params.id, status);
    if (['resolved','archived'].includes(status))
      await notify(r.user_id, { title:'Заявка выполнена', body:`"${r.title}" выполнена.${comment?' '+comment:''}`, type:'request' });
    res.json(await store.requestById(req.params.id));
  } catch(e) { next(e); }
};

module.exports = { createRequest, getRequests, getById, assignTechnician, updateStatus };
