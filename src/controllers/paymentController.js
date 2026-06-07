const { v4: uuid } = require('uuid');
const store = require('../data/store');
const { processPayment } = require('../services/paymentGateway');
const { notify } = require('../services/notificationService');

const MAX_RETRY = 3;

const normalizeCardHolder = (v) => String(v ?? '').trim().toUpperCase();

const payBill = async (req, res, next) => {
  try {
    const { bill_id, method, card_number, card_expiry, card_cvc, card_holder_name } = req.body;
    const bill = await store.billRawById(bill_id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    if (bill.status === 'paid') return res.status(400).json({ error: 'Already paid' });
    if (!(await store.userAptLinked(req.user.id, bill.apartment_id)))
      return res.status(403).json({ error: 'Access denied' });

    const holder = normalizeCardHolder(card_holder_name);
    if (method === 'card') {
      if (!String(card_number || '').trim() || !String(card_expiry || '').trim() || !String(card_cvc || '').trim())
        return res.status(400).json({ error: 'Заполните номер карты, срок и CVC' });
      if (holder.length < 2)
        return res.status(400).json({ error: 'Укажите имя на карте латиницей, как на карте (заглавными буквами)' });
    }

    const paymentId = uuid();
    let attempt = 0, result = { success: false, message: '' };

    while (attempt < MAX_RETRY && !result.success) {
      attempt++;
      if (method === 'balance') {
        const bal = await store.balanceGet(req.user.id);
        if (!bal || bal.amount < bill.amount) { result = { success:false, message:'Insufficient balance' }; break; }
        await store.balanceInc(req.user.id, -bill.amount);
        result = { success:true, gatewayRef:`BAL-${Date.now()}` };
      } else {
        result = await processPayment({
          amount: bill.amount,
          method,
          card_number,
          card_expiry,
          card_cvc,
          card_holder_name: holder,
        });
      }
    }

    const now = new Date();
    const desc =
      method === 'card' && holder
        ? `Payment for ${bill_id}; holder: ${holder}`
        : `Payment for ${bill_id}`;
    await store.paymentInsert({
      _id: paymentId,
      user_id: req.user.id,
      apartment_id: bill.apartment_id,
      bill_id,
      amount: bill.amount,
      method,
      status: result.success ? 'success' : 'failed',
      gateway_ref: result.gatewayRef || null,
      retry_count: attempt,
      description: desc,
      created_at: now,
      completed_at: null,
    });

    if (result.success) {
      await store.billMarkPaid(bill_id);
      await store.paymentSetCompleted(paymentId);
      const payBody =
        method === 'card' && holder
          ? `Счёт ${bill.amount} ₸ оплачен. Держатель карты: ${holder}.`
          : `Счёт ${bill.amount} ₸ оплачен.`;
      await notify(req.user.id, { title: 'Оплата прошла успешно', body: payBody, type: 'payment' });
      return res.json({ success:true, payment_id:paymentId, gateway_ref:result.gatewayRef, amount:bill.amount });
    }
    await notify(req.user.id, { title:'Ошибка оплаты', body:`Не удалось оплатить: ${result.message}`, type:'warning' });
    return res.status(402).json({ success:false, payment_id:paymentId, message:result.message });
  } catch(e) { next(e); }
};

const topUp = async (req, res, next) => {
  try {
    const { amount, card_number, card_expiry, card_cvc, card_holder_name } = req.body;
    if (amount < 50) return res.status(422).json({ error: 'Minimum 50 ₸' });
    const holder = normalizeCardHolder(card_holder_name);
    if (!String(card_number || '').trim() || !String(card_expiry || '').trim() || !String(card_cvc || '').trim())
      return res.status(400).json({ error: 'Заполните данные карты' });
    if (holder.length < 2)
      return res.status(400).json({ error: 'Укажите имя на карте латиницей, как на карте (заглавными буквами)' });

    const result = await processPayment({
      amount,
      method: 'card',
      card_number,
      card_expiry,
      card_cvc,
      card_holder_name: holder,
    });
    if (result.success) {
      await store.balanceInc(req.user.id, amount);
      const bal = await store.balanceGet(req.user.id);
      const pid = uuid();
      const now = new Date();
      await store.paymentInsert({
        _id: pid,
        user_id: req.user.id,
        apartment_id: null,
        bill_id: null,
        amount,
        method: 'card',
        status: 'success',
        gateway_ref: result.gatewayRef,
        retry_count: 0,
        description: `Balance top-up; holder: ${holder}`,
        created_at: now,
        completed_at: now,
      });
      await notify(req.user.id, {
        title: 'Баланс пополнен',
        body: `Пополнено на ${amount} ₸. Держатель карты: ${holder}. Баланс: ${bal.amount} ₸`,
        type: 'payment',
      });
      return res.json({ success:true, new_balance: bal.amount });
    }
    return res.status(402).json({ success:false, message:result.message });
  } catch(e) { next(e); }
};

const getHistory = async (req, res, next) => {
  try {
    const { limit=20, offset=0 } = req.query;
    const payments = await store.paymentHistory(req.user.id, parseInt(limit,10), parseInt(offset,10));
    res.json(payments);
  } catch(e) { next(e); }
};

const getBalance = async (req, res, next) => {
  try {
    const b = await store.balanceGet(req.user.id);
    res.json({ balance: b?.amount || 0, updated_at: b?.updated_at });
  } catch(e) { next(e); }
};

module.exports = { payBill, topUp, getHistory, getBalance };
