const { v4: uuid } = require('uuid');
const store = require('../data/store');
const { notifyAll } = require('../services/notificationService');

const getNews = async (req, res, next) => {
  try {
    const { category, q, limit=20, offset=0 } = req.query;
    const rows = await store.newsList({
      category,
      q,
      limit: parseInt(limit,10),
      offset: parseInt(offset,10),
    });
    res.json(rows);
  } catch(e) { next(e); }
};

const getNewsById = async (req, res, next) => {
  try {
    const n = await store.newsById(req.params.id);
    if (!n) return res.status(404).json({ error:'Not found' });
    res.json(n);
  } catch(e) { next(e); }
};

const createNews = async (req, res, next) => {
  try {
    const { title, body, category, published=1 } = req.body;
    const id = uuid();
    const now = new Date();
    const pub = Boolean(published);
    await store.newsInsert({
      _id: id,
      author_id: req.user.id,
      title,
      body,
      category: category||'general',
      published: pub,
      created_at: now,
      updated_at: now,
    });
    if (pub) await notifyAll({ title:`📢 ${title}`, body:body.slice(0,100), type:'info' });
    res.status(201).json(await store.newsById(id));
  } catch(e) { next(e); }
};

const updateNews = async (req, res, next) => {
  try {
    const { title, body, category, published } = req.body;
    const n = await store.newsRaw(req.params.id);
    if (!n) return res.status(404).json({ error:'Not found' });
    const fields = {
      title: title ?? n.title,
      body: body ?? n.body,
      category: category ?? n.category,
      published: published !== undefined ? Boolean(published) : Boolean(n.published),
    };
    await store.newsUpdate(req.params.id, fields);
    res.json(await store.newsById(req.params.id));
  } catch(e) { next(e); }
};

const deleteNews = async (req, res, next) => {
  try {
    await store.newsDelete(req.params.id);
    res.json({ message:'Deleted' });
  } catch(e) { next(e); }
};

module.exports = { getNews, getNewsById, createNews, updateNews, deleteNews };
