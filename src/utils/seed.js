require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { connectMongo, getDb } = require('../config/mongodb');
const { ensureMongoIndexes } = require('../data/ensureMongoIndexes');
const { col, C } = require('../data/mongoHelpers');

async function run() {
  await connectMongo();
  const db = getDb();
  if (!db) throw new Error('MongoDB не подключена');
  await ensureMongoIndexes();

  console.log('🌱 Очистка коллекций и заполнение MongoDB...\n');
  for (const name of Object.values(C)) await db.collection(name).deleteMany({});

  const hash = bcrypt.hashSync('password123', 10);

  const users = [
    { _id: uuid(), name:'Аслан Жақыпов',  email:'aslan@jkh.kz',   role:'resident'         },
    { _id: uuid(), name:'Мария Иванова',  email:'maria@jkh.kz',   role:'resident'         },
    { _id: uuid(), name:'Администратор',  email:'admin@jkh.kz',   role:'admin'            },
    { _id: uuid(), name:'Петров А.В.',    email:'petrov@jkh.kz',  role:'technician'       },
    { _id: uuid(), name:'КазГорГаз API', email:'utility@jkh.kz', role:'utility_provider' },
  ];

  // Extra demo residents:
  // - 20 owners (approved)
  // - 3 tenants (approved, only where owner exists)
  // - 5 family members (approved, only where owner exists)
  const owners = Array.from({ length: 20 }).map((_, i) => ({
    _id: uuid(),
    name: `Собственник ${String(i + 1).padStart(2, '0')}`,
    email: `owner${String(i + 1).padStart(2, '0')}@jkh.kz`,
    role: 'resident',
    resident_status: 'owner',
    verification_status: 'approved',
    phone: `+7701${String(1000000 + i).padStart(7, '0')}`,
    iin: `900101${String(100000 + i).padStart(6, '0')}`,
  }));
  const tenants = Array.from({ length: 3 }).map((_, i) => ({
    _id: uuid(),
    name: `Арендатор ${String(i + 1).padStart(2, '0')}`,
    email: `tenant${String(i + 1).padStart(2, '0')}@jkh.kz`,
    role: 'resident',
    resident_status: 'tenant',
    verification_status: 'approved',
    phone: `+7702${String(2000000 + i).padStart(7, '0')}`,
    iin: `910101${String(200000 + i).padStart(6, '0')}`,
  }));
  const family = Array.from({ length: 5 }).map((_, i) => ({
    _id: uuid(),
    name: `Член семьи ${String(i + 1).padStart(2, '0')}`,
    email: `family${String(i + 1).padStart(2, '0')}@jkh.kz`,
    role: 'resident',
    resident_status: 'family_member',
    verification_status: 'approved',
    phone: `+7703${String(3000000 + i).padStart(7, '0')}`,
    iin: `920101${String(300000 + i).padStart(6, '0')}`,
  }));

  users.push(...owners, ...tenants, ...family);

  const now = new Date();
  for (const u of users) {
    await col(C.USERS).insertOne({
      _id: u._id,
      full_name: u.name,
      email: u.email,
      ...(u.phone ? { phone: u.phone } : {}),
      password: hash,
      role: u.role,
      language: 'ru',
      resident_status: u.resident_status || 'tenant',
      verification_status: u.verification_status || 'approved',
      ...(u.iin ? { iin: u.iin } : {}),
      created_at: now,
      updated_at: now,
    });
    await col(C.BALANCES).insertOne({
      _id: u._id,
      user_id: u._id,
      amount: u.role === 'resident' ? 2450 : 0,
      updated_at: now,
    });
    await col(C.NOTIF_PREFS).insertOne({
      _id: u._id,
      user_id: u._id,
      water_outage: 1,
      meetings: 1,
      repairs: 1,
      payments: 1,
      meters: 1,
      sound: 1,
      email: 0,
    });
  }
  console.log(`✅ ${users.length} users`);

  // Create enough apartments for all owners and for tenant/family links
  const apts = [
    { _id: uuid(), address:'Астана, пр. Кабанбай батыра, д. 59/3', building:'59/3', apartment:'96', area_sqm:65, residents:3 },
    { _id: uuid(), address:'Астана, пр. Кабанбай батыра, д. 59/3', building:'59/3', apartment:'34', area_sqm:48, residents:2 },
    ...Array.from({ length: 20 }).map((_, i) => ({
      _id: uuid(),
      address: 'Астана, Сыганак 10',
      building: '10',
      apartment: String(101 + i),
      area_sqm: 45 + (i % 5) * 7,
      residents: 2 + (i % 3),
    })),
  ];
  for (const a of apts) {
    await col(C.APARTMENTS).insertOne({
      _id: a._id,
      address: a.address,
      building: a.building,
      apartment: a.apartment,
      area_sqm: a.area_sqm,
      residents: a.residents,
    });
  }
  const links = [
    { _id: uuid(), user_id: users[0]._id, apartment_id: apts[0]._id, is_owner: 1 },
    { _id: uuid(), user_id: users[1]._id, apartment_id: apts[1]._id, is_owner: 1 },
  ];

  // Link each owner to a dedicated apartment
  // Owners use apartments starting from index 2.
  owners.forEach((o, idx) => {
    const apt = apts[2 + idx];
    links.push({ _id: uuid(), user_id: o._id, apartment_id: apt._id, is_owner: 1 });
    // Store step-2 fields on user for convenience in admin/user views
    col(C.USERS).updateOne(
      { _id: o._id },
      { $set: { residential_complex: 'ОСИ МЖК Budapest', entrance: '1', floor: 5, apartment_number: apt.apartment, verification_method: 'seed' } }
    ).catch(()=>{});
  });

  // Link tenants and family members to apartments that already have an owner
  tenants.forEach((t, idx) => {
    const apt = apts[2 + (idx % owners.length)];
    links.push({ _id: uuid(), user_id: t._id, apartment_id: apt._id, is_owner: 0 });
    col(C.USERS).updateOne(
      { _id: t._id },
      { $set: { residential_complex: 'ОСИ МЖК Budapest', entrance: '1', floor: 5, apartment_number: apt.apartment, verification_method: 'seed' } }
    ).catch(()=>{});
  });
  family.forEach((f, idx) => {
    const apt = apts[2 + (idx % owners.length)];
    links.push({ _id: uuid(), user_id: f._id, apartment_id: apt._id, is_owner: 0 });
    col(C.USERS).updateOne(
      { _id: f._id },
      { $set: { residential_complex: 'ОСИ МЖК Budapest', entrance: '1', floor: 5, apartment_number: apt.apartment, verification_method: 'seed' } }
    ).catch(()=>{});
  });

  await col(C.USER_APTS).insertMany(links);
  console.log(`✅ ${apts.length} apartments`);

  const readings = [
    { type:'cold_water',  val:128, prev:108, date:'2026-03-20' },
    { type:'hot_water',   val:91,  prev:74,  date:'2026-03-20' },
    { type:'electricity', val:3400,prev:3200,date:'2026-03-20' },
    { type:'gas',         val:650, prev:618, date:'2026-03-20' },
    { type:'cold_water',  val:108, prev:89,  date:'2026-02-18' },
    { type:'hot_water',   val:74,  prev:57,  date:'2026-02-18' },
    { type:'electricity', val:3200,prev:3010,date:'2026-02-18' },
    { type:'gas',         val:618, prev:583, date:'2026-02-18' },
  ];
  for (const r of readings) {
    await col(C.METER_READINGS).insertOne({
      _id: uuid(),
      apartment_id: apts[0]._id,
      user_id: users[0]._id,
      meter_type: r.type,
      value: r.val,
      previous_value: r.prev,
      consumption: r.val - r.prev,
      status: 'accepted',
      submitted_at: new Date(`${r.date}T10:00:00`),
      photo_url: null,
      flagged_reason: null,
    });
  }
  console.log(`✅ ${readings.length} meter readings`);

  const bills = [
    { period:'2026-03', service:'gas',        consumption:32,  unit:'m3',  rate:6.07,  amount:194.24, status:'unpaid' },
    { period:'2026-03', service:'water',      consumption:20,  unit:'m3',  rate:89.0,  amount:1780.00,status:'unpaid' },
    { period:'2026-03', service:'electricity',consumption:200, unit:'kWh', rate:21.61, amount:4322.00,status:'unpaid' },
    { period:'2026-03', service:'heating',    consumption:65,  unit:'m2',  rate:22.15, amount:1439.75,status:'unpaid' },
    { period:'2026-02', service:'gas',        consumption:35,  unit:'m3',  rate:6.07,  amount:212.45, status:'paid'   },
    { period:'2026-02', service:'water',      consumption:19,  unit:'m3',  rate:89.0,  amount:1691.00,status:'paid'   },
    { period:'2026-02', service:'electricity',consumption:190, unit:'kWh', rate:21.61, amount:4105.90,status:'paid'   },
    { period:'2026-02', service:'heating',    consumption:65,  unit:'m2',  rate:22.15, amount:1439.75,status:'paid'   },
  ];
  const billIds = [];
  for (const b of bills) {
    const id = uuid();
    billIds.push({ id, status:b.status, amount:b.amount });
    await col(C.BILLS).insertOne({
      _id: id,
      apartment_id: apts[0]._id,
      period: b.period,
      service: b.service,
      consumption: b.consumption,
      unit: b.unit,
      rate: b.rate,
      amount: b.amount,
      due_date: '2026-04-25',
      status: b.status,
      generated_at: now,
    });
  }
  for (const b of billIds.filter(x => x.status === 'paid')) {
    await col(C.PAYMENTS).insertOne({
      _id: uuid(),
      user_id: users[0]._id,
      apartment_id: apts[0]._id,
      bill_id: b.id,
      amount: b.amount,
      method: 'card',
      status: 'success',
      gateway_ref: `GW-SEED-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
      description: 'Seed payment',
      retry_count: 0,
      created_at: new Date('2026-03-15T12:00:00'),
      completed_at: new Date('2026-03-15T12:00:05'),
    });
  }
  console.log(`✅ ${bills.length} bills`);

  const reqData = [
    { title:'Протечка в ванной', desc:'Течёт кран',          priority:'standard', status:'in_progress', tech:users[3]._id },
    { title:'Шум в подвале',     desc:'Странные звуки',       priority:'standard', status:'new',         tech:null       },
    { title:'Не работает домофон',desc:'Не реагирует на звонок',priority:'standard',status:'resolved',    tech:users[3]._id},
  ];
  for (const r of reqData) {
    await col(C.REQUESTS).insertOne({
      _id: uuid(),
      user_id: users[0]._id,
      apartment_id: apts[0]._id,
      title: r.title,
      description: r.desc,
      priority: r.priority,
      status: r.status,
      assigned_to: r.tech,
      photo_urls: [],
      created_at: new Date('2026-04-10T09:00:00'),
      updated_at: new Date('2026-04-10T10:00:00'),
      resolved_at: r.status === 'resolved' ? new Date('2026-04-11T10:00:00') : null,
    });
  }
  console.log(`✅ ${reqData.length} requests`);

  const newsItems = [
    { title:'Плановое отключение воды 25 апреля', body:'25 апреля с 10:00 до 17:00 отключение холодной воды.', category:'outage'  },
    { title:'Оплата за март 2026',                body:'Квитанции сформированы. Срок оплаты — 25 апреля.',     category:'payment' },
    { title:'Ремонт трубопровода',               body:'Ремонтные работы продлятся 4 дня. Извините.',           category:'repair'  },
    { title:'Собрание жильцов 27 апреля 19:00',  body:'Повестка: благоустройство двора, видеонаблюдение.',     category:'meeting' },
  ];
  for (const n of newsItems) {
    await col(C.NEWS).insertOne({
      _id: uuid(),
      author_id: users[2]._id,
      title: n.title,
      body: n.body,
      category: n.category,
      published: true,
      created_at: now,
      updated_at: now,
    });
  }

  for (const notif of [
    { u:users[0]._id, t:'🚧 Отключение воды',  b:'25 апреля с 10:00 до 17:00', type:'warning' },
    { u:users[0]._id, t:'📢 Собрание жильцов', b:'27 апреля в 19:00',          type:'info'    },
    { u:users[0]._id, t:'💳 Квитанции готовы', b:'Оплатите до 25 апреля.',     type:'payment' },
  ])
    await col(C.NOTIFICATIONS).insertOne({
      _id: uuid(),
      user_id: notif.u,
      title: notif.t,
      body: notif.b,
      type: notif.type,
      is_read: 0,
      created_at: now,
    });

  console.log('✅ News + notifications\n');
  console.log('🎉 Done! Test accounts (password: password123):');
  console.log('  Resident:  aslan@jkh.kz');
  console.log('  Admin:     admin@jkh.kz');
  console.log('  Tech:      petrov@jkh.kz');
  console.log('  Utility:   utility@jkh.kz');
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
