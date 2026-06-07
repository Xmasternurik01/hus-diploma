const { v4: uuid } = require('uuid');
const store = require('../data/store');
const { notify } = require('../services/notificationService');
const { verifyReading } = require('../services/utilityService');

const THRESHOLDS = { cold_water:30, hot_water:20, electricity:1000, gas:100 };
const DEVIATION_THRESHOLD = 0.5;

const submitReading = async (req, res, next) => {
  try {
    const { apartment_id, meter_type, value } = req.body;
    const photo_url = req.file ? `/uploads/meters/${req.file.filename}` : null;

    if (!(await store.userAptLinked(req.user.id, apartment_id)))
      return res.status(403).json({ error: 'Apartment not linked to your account' });

    const prevRow = await store.meterPrevAccepted(apartment_id, meter_type);
    const previousValue = prevRow?.value ?? null;
    const consumption   = previousValue !== null ? Number(value) - previousValue : null;

    if (previousValue !== null && Number(value) < previousValue)
      return res.status(422).json({ error: 'New reading cannot be less than previous reading' });

    let status = 'pending', flaggedReason = null;

    if (previousValue !== null) {
      const avgConsumption = await store.meterAverageConsumption(apartment_id, meter_type);
      
      if (avgConsumption !== null) {
        const deviation = Math.abs((consumption - avgConsumption) / avgConsumption);
        
        if (deviation > DEVIATION_THRESHOLD) {
          if (consumption > avgConsumption) {
            flaggedReason = `Потребление (${consumption.toFixed(2)}) значительно выше среднего (${avgConsumption.toFixed(2)}) на ${((deviation * 100).toFixed(0))}%`;
          } else {
            flaggedReason = `Потребление (${consumption.toFixed(2)}) значительно ниже среднего (${avgConsumption.toFixed(2)}) на ${((deviation * 100).toFixed(0))}%`;
          }
          status = 'flagged';
        } else {
          status = 'accepted';
        }
      } else {
        if (consumption > THRESHOLDS[meter_type]) {
          const check = await verifyReading({ meterType: meter_type, value, previousValue, apartmentId: apartment_id });
          status = check.approved ? 'accepted' : 'flagged';
          flaggedReason = check.approved ? null : check.reason;
        } else {
          status = 'accepted';
        }
      }
    }

    const id = uuid();
    const now = new Date();
    await store.meterInsert({
      _id: id,
      apartment_id,
      user_id: req.user.id,
      meter_type,
      value: Number(value),
      previous_value: previousValue,
      consumption,
      photo_url,
      status,
      flagged_reason: flaggedReason,
      submitted_at: now,
    });

    await notify(req.user.id, {
      title: 'Показания получены',
      body: `${meter_type.replace('_',' ')}: ${value} — ${status === 'accepted' ? 'принято' : 'на проверке'}`,
      type: 'meter'
    });

    res.status(201).json(await store.meterById(id));
  } catch (e) { next(e); }
};

const getReadings = async (req, res, next) => {
  try {
    const { apartment_id, meter_type, limit=20, offset=0 } = req.query;
    const aptIds = await store.userAptIdsForUser(req.user.id);
    if (!aptIds.length) return res.json([]);

    const rows = await store.meterListForUser(aptIds, {
      apartment_id,
      meter_type,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
    res.json(rows);
  } catch(e) { next(e); }
};

const getLatest = async (req, res, next) => {
  try {
    const { apartment_id } = req.query;
    if (!apartment_id) return res.status(400).json({ error: 'apartment_id required' });
    if (!(await store.userAptLinked(req.user.id, apartment_id)))
      return res.status(403).json({ error: 'Access denied' });

    const types = ['cold_water','hot_water','electricity','gas'];
    const result = await store.meterLatest(apartment_id, types);
    res.json(result);
  } catch(e) { next(e); }
};

const reviewReading = async (req, res, next) => {
  try {
    const { approved, reason } = req.body;
    const reading = await store.meterRawById(req.params.id);
    if (!reading) return res.status(404).json({ error: 'Not found' });
    if (reading.status !== 'flagged') return res.status(400).json({ error: 'Not flagged' });

    await store.meterUpdateReview(req.params.id, {
      status: approved ? 'accepted' : 'rejected',
      flagged_reason: reason || null,
      reviewed_by: req.user.id,
    });

    await notify(reading.user_id, {
      title: 'Показания проверены',
      body: approved ? 'Ваши показания подтверждены.' : `Показания отклонены: ${reason || ''}`,
      type: 'meter'
    });
    res.json(await store.meterById(req.params.id));
  } catch(e) { next(e); }
};

const getFlagged = async (req, res, next) => {
  try {
    res.json(await store.meterFlaggedList());
  } catch(e) { next(e); }
};

module.exports = { submitReading, getReadings, getLatest, reviewReading, getFlagged };
