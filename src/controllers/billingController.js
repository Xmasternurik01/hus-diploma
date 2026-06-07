const { v4: uuid } = require('uuid');
const store = require('../data/store');
const { notifyApartment } = require('../services/notificationService');

const RATES = {
  cold_water:  { rate: 89.0,  unit: 'm3',  service: 'water'       },
  hot_water:   { rate: 237.0, unit: 'm3',  service: 'water'       },
  electricity: { rate: 21.61, unit: 'kWh', service: 'electricity' },
  gas:         { rate: 6.07,  unit: 'm3',  service: 'gas'         },
};

const generateBills = async (req, res, next) => {
  try {
    const { apartment_id, period } = req.body;
    const apt = await store.aptFindById(apartment_id);
    if (!apt) return res.status(404).json({ error: 'Apartment not found' });

    const [year, month] = period.split('-');
    const dueDate = `${year}-${String(parseInt(month,10)+1).padStart(2,'0')}-25`;
    const generated = [];
    const now = new Date();

    if (await store.billsHasAnyForPeriod(apartment_id, period))
      return res.status(409).json({ error: 'Bills already generated for this period' });

    for (const [mType, info] of Object.entries(RATES)) {
      const reading = await store.meterAcceptedInPeriod(apartment_id, mType, period);
      if (!reading || reading.consumption == null) continue;

      const id = uuid();
      const amount = parseFloat((reading.consumption * info.rate).toFixed(2));
      await store.billInsert({
        _id: id,
        apartment_id,
        period,
        service: info.service,
        consumption: reading.consumption,
        unit: info.unit,
        rate: info.rate,
        amount,
        due_date: dueDate,
        status: 'unpaid',
        generated_at: now,
      });
      generated.push(await store.billById(id));
    }

    if (apt.area_sqm) {
      const id = uuid();
      const rate = 680;
      const amount = parseFloat((apt.area_sqm * rate).toFixed(2));
      await store.billInsert({
        _id: id,
        apartment_id,
        period,
        service: 'heating',
        consumption: apt.area_sqm,
        unit: 'm2',
        rate,
        amount,
        due_date: dueDate,
        status: 'unpaid',
        generated_at: now,
      });
      generated.push(await store.billById(id));
    }

    await notifyApartment(apartment_id, {
      title: `Квитанция за ${period} — Астана ЕРЦ`,
      body: `Сформированы начисления по показаниям ПУ. Оплатите до ${dueDate}.`,
      type: 'payment'
    });

    res.status(201).json({ period, apartment_id, bills: generated });
  } catch(e) { next(e); }
};

const getBills = async (req, res, next) => {
  try {
    const { apartment_id, period, status, service } = req.query;
    const aptIds = await store.userAptIdsForUser(req.user.id);
    if (!aptIds.length) return res.json([]);

    const rows = await store.billsListForApts(aptIds, { apartment_id, period, status, service });
    res.json(rows);
  } catch(e) { next(e); }
};

const getSummary = async (req, res, next) => {
  try {
    const aptIds = await store.userAptIdsForUser(req.user.id);
    if (!aptIds.length) return res.json({ total_unpaid:0, paid_this_year:0, last_payment_date:null });

    const year = new Date().getFullYear();
    const unpaid = await store.billsSumUnpaid(aptIds);
    const paidYear = await store.paymentsSumSuccessYear(aptIds, year);
    const lastPay = await store.paymentLastSuccess(aptIds);
    res.json({
      total_unpaid: unpaid,
      paid_this_year: paidYear,
      last_payment_date: lastPay ? (lastPay instanceof Date ? lastPay.toISOString() : lastPay) : null,
    });
  } catch(e) { next(e); }
};

const getBillById = async (req, res, next) => {
  try {
    const bill = await store.billById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Not found' });
    const linked = await store.userAptLinked(req.user.id, bill.apartment_id);
    if (!linked && req.user.role==='resident') return res.status(403).json({ error: 'Access denied' });
    res.json(bill);
  } catch(e) { next(e); }
};

const createDetailedBill = async (req, res, next) => {
  try {
    const {
      document_number,
      document_date,
      address,
      service_period,
      controller,
      due_date,
      services,
      total_amount
    } = req.body;

    if (!document_number || !document_date || !address || !service_period || !controller || !due_date || !services || !Array.isArray(services)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuid();
    const now = new Date();

    await store.detailedBillInsert({
      _id: id,
      document_number,
      document_date: new Date(document_date),
      address,
      service_period,
      controller,
      due_date: new Date(due_date),
      services,
      total_amount: parseFloat(total_amount),
      status: 'unpaid',
      created_by: req.user.id,
      created_at: now,
    });

    const bill = await store.billById(id);
    res.status(201).json(bill);
  } catch(e) { next(e); }
};

module.exports = { generateBills, getBills, getSummary, getBillById, createDetailedBill };
