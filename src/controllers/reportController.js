const store = require('../data/store');

const getOverview = async (req, res, next) => {
  try {
    res.json(await store.reportOverview());
  } catch(e) { next(e); }
};

const getPaymentReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    res.json(await store.reportPaymentsByMonth({ from, to }));
  } catch(e) { next(e); }
};

const getRequestReport = async (req, res, next) => {
  try {
    res.json(await store.reportRequests());
  } catch(e) { next(e); }
};

const getMeterReport = async (req, res, next) => {
  try {
    res.json(await store.reportMeters());
  } catch(e) { next(e); }
};

module.exports = { getOverview, getPaymentReport, getRequestReport, getMeterReport };
