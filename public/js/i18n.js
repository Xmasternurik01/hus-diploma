/* ─── Localization / i18n ───────────────────────────────────────────────────── */
const translations = {
  ru: {
     // Dashboard
    nav_dashboard: 'Личный кабинет',
    welcome: 'Добро пожаловать',
    current_balance: 'Текущий баланс',

    quick_summary: 'Краткая сводка',
    to_pay: 'К оплате',
    due_date: 'Срок оплаты',
    active_requests: 'Активные заявки',
    new_news: 'Новые новости',

    submit_reading: 'Передать показания',
    my_requests: 'Мои заявки',
    pay_online: 'Оплатить онлайн',
    nav_charges: 'Начисления',

    latest_charges: 'Последние начисления',
    period: 'Период',
    service: 'Услуга',
    amount: 'Сумма',
    status: 'Статус',

    news: 'Новости',
    new: 'Новое',

    unpaid: 'Не оплачено',
    paid: 'Оплачено',
    overdue: 'Просрочено',

    apartment: 'Квартира',
    profile: 'Профиль',
    settings: 'Настройки',
    notifications: 'Уведомления',
    logout: 'Выйти',
    nav_meters: 'Показания',
    nav_payments: 'Платежи',
    nav_requests: 'Заявки',
    nav_news: 'Новости',
    nav_chats: 'Чат',
    nav_profile: 'Профиль',
    // Topbar home page
    navFeatures: 'Возможности',
    navHow: 'Как работает',
    navAudience: 'Для кого',
    navFaq: 'FAQ',
    navContacts: 'Контакты',

    // Landing Hero
    heroTitle: 'Управление домом онлайн для ОСИ и жильцов',
    heroSubtitle:
    'Оплата коммунальных услуг, заявки, голосования и уведомления в одном приложении. Экономьте время и управляйте домом прозрачно.',

    loginBtn: 'Войти',
    registerBtn: 'Зарегистрироваться',
    connectHouseBtn: 'Подключить дом',

    chipKazakhstan:
    '🇰🇿 Поддержка Казахстана и ОСИ',
    chipPayments:
    '💳 Kaspi и онлайн-платежи',
    chipNotifications:
    '🔔 Push и WhatsApp уведомления',

    // Trust block
    trustTitle:
    'Почему доверяют JKH Digital',
    trustSubtitle:
    'Понятный сервис для жильцов и удобный инструмент для ОСИ.',
    launchTime:
    'на запуск дома',
    phoneAccess:
    'доступ с телефона',
    historyOps:
    'история операций',
    languageSupport:
    'языковая поддержка',

    // Problems
    problemsTitle:
    'Какие проблемы решает сервис',
    problemsSubtitle:
    'Жильцы получают удобство, ОСИ — контроль и прозрачность.',

    // Sections
    forResidents:
    'Для жильцов',
    forOsi:
    'Для ОСИ и УК',

    residentFeature1:
    'Оплата коммуналки онлайн',
    residentFeature2:
    'Заявка сантехнику за 1 минуту',
    residentFeature3:
    'Уведомления от ОСИ и УК',
    residentFeature4:
    'История платежей и начислений',
    residentFeature5:
    'Голосования по дому',

    osiFeature1:
    'Управление заявками по приоритетам',
    osiFeature2:
    'Сбор и контроль платежей',
    osiFeature3:
    'Массовые уведомления жильцам',
    osiFeature4:
    'Контроль задолженностей',
    osiFeature5:
    'Электронные документы и отчеты',

    // How it works
    howTitle:
    'Как это работает',
    howSubtitle:
    'Запуск без сложного обучения, всё максимально просто.',
    step1:
    '1. Зарегистрируйтесь',
    step1Desc:
    'Создайте аккаунт жильца или представителя ОСИ.',
    step2:
    '2. Привяжите квартиру',
    step2Desc:
    'Подтвердите адрес и получите доступ к данным дома.',
    step3:
    '3. Пользуйтесь сервисами',
    step3Desc:
    'Оплачивайте, подавайте заявки, голосуйте и следите за новостями.',

    // Platform
    platformTitle:
    'Интерфейс платформы',
    platformSubtitle:
    'Даже простые визуальные экраны повышают доверие пользователей.',

    mockTitle1: 'Экран заявок',
    mockDesc1: 'Статусы, исполнитель, сроки',

    mockTitle2: 'Оплата услуг',
    mockDesc2: 'Kaspi/карта, история операций',

    mockTitle3: 'Уведомления',
    mockDesc3: 'Важные новости и напоминания',

    mockTitle4: 'Голосования',
    mockDesc4: 'Онлайн-решения жильцов',

    mockTitle5: 'Документы',
    mockDesc5: 'Протоколы, отчеты, акты',

    mockTitle6: 'Мобильная версия',
    mockDesc6: 'Управление домом в телефоне',

    // Photo Cards
    photoDesc1:
    'Оплата коммунальных услуг онлайн за пару минут.',
    photoDesc2:
    'Заявки по дому: сантехника, лифт, уборка, электрика.',
    photoDesc3:
    'ОСИ и УК видят прозрачную аналитику и статус дома.',

    // Features
    featuresTitle:
    'Возможности платформы',

    featureColumn1:
    'Функция',
    featureColumn2:
    'Описание',

    featureName1:
    'Заявки',
    featureDesc1:
    'Сантехник, лифт, уборка и контроль статусов',

    featureName2:
    'Платежи',
    featureDesc2:
    'Коммунальные услуги онлайн, включая Kaspi',

    featureName3:
    'Голосования',
    featureDesc3:
    'Прозрачные решения жителей по дому',

    featureName4:
    'Уведомления',
    featureDesc4:
    'Новости дома через push и WhatsApp',

    featureName5:
    'Документы',
    featureDesc5:
    'Протоколы, отчеты и важные файлы ОСИ',

    featureName6:
    'Чат',
    featureDesc6:
    'Коммуникация жильцов и управляющей команды',

    // Audience
    audienceTitle:
    'Для кого сервис',

    audience1:
    'ОСИ',
    audience2:
    'ЖК и новостройки',
    audience3:
    'Управляющие компании',
    audience4:
    'Жильцы',
    audience5:
    'ТСЖ и кооперативы',
    audience6:
    'Сервисные подрядчики',

    // Kazakhstan
    kazakhstanTitle:
    'Преимущества для Казахстана',

    kzAdvantage1:
    '🇰🇿 Локальная поддержка ОСИ',
    kzAdvantage2:
    '📱 Удобно с телефона',
    kzAdvantage3:
    '🔒 Безопасное хранение данных',
    kzAdvantage4:
    '💳 Онлайн-оплата и Kaspi QR',
    kzAdvantage5:
    '🔔 Push и WhatsApp уведомления',
    kzAdvantage6:
    '🌐 Русский и қазақша интерфейс',

    // Pricing
    pricingTitle:
    'Тарифы',
    pricingSubtitle:
    'Прозрачный подход для жителей и ОСИ.',

    pricingFree:
    'Бесплатно для жильцов',
    pricingDesc:
    'Для ОСИ и УК тариф зависит от количества квартир. Подключение дома — по заявке.',
    pricingBtn:
    'Узнать тариф ОСИ',

    // Reviews
    reviewsTitle:
    'Отзывы',
    review1:
    '"Сервис сократил звонки в ОСИ и ускорил оплату." — Председатель ОСИ, Алматы',
    review2:
    '"Заявки и уведомления стали понятными для всех жителей." — УК, Астана',

    // FAQ
    faqTitle:
    'FAQ',
    faqQuestion1:
    'Как подключить дом?',
    faqAnswer1:
    'Оставьте заявку, мы свяжемся с ОСИ/УК и запустим дом поэтапно.',
    faqQuestion2:
    'Кто видит мои данные?',
    faqAnswer2:
    'Только подтверждённые жильцы и управляющая организация.',
    faqQuestion3:
    'Можно ли оплачивать через Kaspi?',
    faqAnswer3:
    'Да, поддерживаются Kaspi и банковские карты.',
    faqQuestion4:
    'Как подтвердить квартиру?',
    faqAnswer4:
    'Через код подтверждения или проверку управляющей компанией.',
    faqQuestion5:
    'Есть ли мобильная версия?',
    faqAnswer5:
    'Да, сервис адаптирован для смартфонов и планшетов.',

    // Contacts
    contactsTitle:
    'Контакты',
    contactsSubtitle:
    'Готовы подключить ваш дом и показать демо.',
    contactsAddress:
    'Адрес: Астана, Казахстан',

    // Quick actions
    quickActions:
    'Быстрые действия',
    contactsBottomText:
    'Инновационные решения для комфортной жизни в современном доме.',

    // Footer
    footerText:
    '© 2026 JKH Digital • Платформа для ОСИ, УК и жильцов Казахстана',
  },

  kz: {
    // Dashboard
    nav_dashboard: 'Жеке кабинет',
    welcome: 'Қош келдіңіз',
    current_balance: 'Ағымдағы баланс',

    quick_summary: 'Қысқаша мәлімет',
    to_pay: 'Төлеуге',
    due_date: 'Төлеу мерзімі',
    active_requests: 'Белсенді өтініштер',
    new_news: 'Жаңа жаңалықтар',

    submit_reading: 'Көрсеткіш енгізу',
    my_requests: 'Менің өтініштерім',
    pay_online: 'Онлайн төлеу',
    nav_charges: 'Есептеулер',

    latest_charges: 'Соңғы есептеулер',
    period: 'Кезең',
    service: 'Қызмет',
    amount: 'Сома',
    status: 'Күйі',

    news: 'Жаңалықтар',
    new: 'Жаңа',

    unpaid: 'Төленбеген',
    paid: 'Төленген',
    overdue: 'Мерзімі өткен',

    apartment: 'Пәтер',
    profile: 'Профиль',
    settings: 'Баптаулар',
    notifications: 'Хабарламалар',
    logout: 'Шығу',
     nav_meters: 'Көрсеткіштер',
    nav_payments: 'Төлемдер',
    nav_requests: 'Өтініштер',
    nav_news: 'Жаңалықтар',
    nav_chats: 'Чат',
    nav_profile: 'Профиль',
    // Topbar home page
    navFeatures: 'Мүмкіндіктер',
    navHow: 'Қалай жұмыс істейді',
    navAudience: 'Кімдерге арналған',
    navFaq: 'FAQ',
    navContacts: 'Байланыс',

    // Landing Hero
    heroTitle:
    'ОСИ және тұрғындарға арналған үйді онлайн басқару',
    heroSubtitle:
    'Коммуналдық төлемдер, өтініштер, дауыс беру және хабарламалар бір қосымшада. Уақытты үнемдеп, үйді ашық түрде басқарыңыз.',

    loginBtn: 'Кіру',
    registerBtn: 'Тіркелу',
    connectHouseBtn: 'Үйді қосу',

    chipKazakhstan:
    '🇰🇿 Қазақстан және ОСИ қолдауы',
    chipPayments:
    '💳 Kaspi және онлайн төлемдер',
    chipNotifications:
    '🔔 Push және WhatsApp хабарламалары',

    // Trust block
    trustTitle:
    'Неліктен JKH Digital-ға сенеді',
    trustSubtitle:
    'Тұрғындарға түсінікті сервис және ОСИ үшін ыңғайлы құрал.',
    launchTime:
    'үйді іске қосу',
    phoneAccess:
    'телефоннан қолжетімділік',
    historyOps:
    'операциялар тарихы',
    languageSupport:
    'тілдік қолдау',

    // Problems
    problemsTitle:
    'Сервис қандай мәселелерді шешеді',
    problemsSubtitle:
    'Тұрғындар ыңғайлылық алады, ОСИ — бақылау мен ашықтық.',

    // Sections
    forResidents:
    'Тұрғындар үшін',
    forOsi:
    'ОСИ және БК үшін',

    residentFeature1:
    'Коммуналдық төлемдерді онлайн төлеу',
    residentFeature2:
    'Сантехникке 1 минутта өтініш беру',
    residentFeature3:
    'ОСИ және БК хабарламалары',
    residentFeature4:
    'Төлемдер мен есептеулер тарихы',
    residentFeature5:
    'Үй бойынша дауыс беру',

    osiFeature1:
    'Өтініштерді басымдық бойынша басқару',
    osiFeature2:
    'Төлемдерді жинау және бақылау',
    osiFeature3:
    'Тұрғындарға жаппай хабарламалар',
    osiFeature4:
    'Қарыздарды бақылау',
    osiFeature5:
    'Электронды құжаттар мен есептер',

    // How it works
    howTitle:
    'Қалай жұмыс істейді',
    howSubtitle:
    'Күрделі оқытусыз іске қосу, барлығы өте қарапайым.',
    step1:
    '1. Тіркеліңіз',
    step1Desc:
    'Тұрғын немесе ОСИ өкілі аккаунтын жасаңыз.',
    step2:
    '2. Пәтерді байланыстырыңыз',
    step2Desc:
    'Мекенжайды растаңыз және үй деректеріне қол жеткізіңіз.',
    step3:
    '3. Қызметтерді пайдаланыңыз',
    step3Desc:
    'Төлеңіз, өтініш беріңіз, дауыс беріңіз және жаңалықтарды бақылаңыз.',

    // Platform
    platformTitle:
    'Платформа интерфейсі',
    platformSubtitle:
    'Қарапайым визуалды экрандардың өзі пайдаланушы сенімін арттырады.',

    mockTitle1: 'Өтініштер экраны',
    mockDesc1: 'Мәртебелер, орындаушы, мерзімдер',

    mockTitle2: 'Қызмет төлемі',
    mockDesc2: 'Kaspi/карта, операциялар тарихы',

    mockTitle3: 'Хабарламалар',
    mockDesc3: 'Маңызды жаңалықтар мен ескертулер',

    mockTitle4: 'Дауыс беру',
    mockDesc4: 'Тұрғындардың онлайн шешімдері',

    mockTitle5: 'Құжаттар',
    mockDesc5: 'Хаттамалар, есептер, актілер',

    mockTitle6: 'Мобильді нұсқа',
    mockDesc6: 'Телефон арқылы үйді басқару',

    // Photo Cards
    photoDesc1:
    'Коммуналдық қызметтерді бірнеше минутта онлайн төлеу.',
    photoDesc2:
    'Үй бойынша өтініштер: сантехника, лифт, тазалық, электр.',
    photoDesc3:
    'ОСИ мен БК үйдің аналитикасы мен мәртебесін көреді.',

    // Features
    featuresTitle:
    'Платформа мүмкіндіктері',

    featureColumn1:
    'Функция',
    featureColumn2:
    'Сипаттама',

    featureName1:
    'Өтініштер',
    featureDesc1:
    'Сантехник, лифт, тазалық және мәртебені бақылау',

    featureName2:
    'Төлемдер',
    featureDesc2:
    'Kaspi қоса алғанда онлайн коммуналдық төлемдер',

    featureName3:
    'Дауыс беру',
    featureDesc3:
    'Тұрғындардың ашық шешімдері',

    featureName4:
    'Хабарламалар',
    featureDesc4:
    'Push және WhatsApp арқылы үй жаңалықтары',

    featureName5:
    'Құжаттар',
    featureDesc5:
    'Хаттамалар, есептер және ОСИ файлдары',

    featureName6:
    'Чат',
    featureDesc6:
    'Тұрғындар мен басқару тобы арасындағы байланыс',

    // Audience
    audienceTitle:
    'Сервис кімдерге арналған',

    audience1:
    'ОСИ',
    audience2:
    'ТК және жаңа үйлер',
    audience3:
    'Басқарушы компаниялар',
    audience4:
    'Тұрғындар',
    audience5:
    'ПИК және кооперативтер',
    audience6:
    'Сервистік мердігерлер',

    // Kazakhstan
    kazakhstanTitle:
    'Қазақстан үшін артықшылықтар',

    kzAdvantage1:
    '🇰🇿 ОСИ үшін жергілікті қолдау',
    kzAdvantage2:
    '📱 Телефоннан ыңғайлы',
    kzAdvantage3:
    '🔒 Деректерді қауіпсіз сақтау',
    kzAdvantage4:
    '💳 Онлайн төлем және Kaspi QR',
    kzAdvantage5:
    '🔔 Push және WhatsApp хабарламалары',
    kzAdvantage6:
    '🌐 Орыс және қазақ тіліндегі интерфейс',

    // Pricing
    pricingTitle:
    'Тарифтер',
    pricingSubtitle:
    'Тұрғындар мен ОСИ үшін ашық тәсіл.',

    pricingFree:
    'Тұрғындар үшін тегін',
    pricingDesc:
    'ОСИ және БК үшін тариф пәтер санына байланысты. Үйді қосу — өтінім арқылы.',
    pricingBtn:
    'ОСИ тарифін білу',

    // Reviews
    reviewsTitle:
    'Пікірлер',

    review1:
    '"Сервис ОСИ-ге қоңырауларды азайтып, төлемдерді жылдамдатты." — ОСИ төрағасы, Алматы',
    review2:
    '"Өтініштер мен хабарламалар барлық тұрғындарға түсінікті болды." — БК, Астана',

    // FAQ
    faqTitle:
    'FAQ',
    faqQuestion1:
    'Үйді қалай қосуға болады?',
    faqAnswer1:
    'Өтініш қалдырыңыз, біз ОСИ/БК-мен байланысып, үйді кезең-кезеңімен іске қосамыз.',
    faqQuestion2:
    'Менің деректерімді кім көреді?',
    faqAnswer2:
    'Тек расталған тұрғындар мен басқарушы ұйым.',
    faqQuestion3:
    'Kaspi арқылы төлеуге бола ма?',
    faqAnswer3:
    'Иә, Kaspi және банк карталары қолданылады.',
    faqQuestion4:
    'Пәтерді қалай растауға болады?',
    faqAnswer4:
    'Растау коды немесе басқарушы компания тексеруі арқылы.',
    faqQuestion5:
    'Мобильді нұсқа бар ма?',
    faqAnswer5:
    'Иә, сервис смартфондар мен планшеттерге бейімделген.',

    // Contacts
    contactsTitle:
    'Байланыс',
    contactsSubtitle:
    'Үйіңізді қосуға және демо көрсетуге дайынбыз.',
    contactsAddress:
    'Мекенжай: Астана, Қазақстан',

    // Quick actions
    quickActions:
    'Жылдам әрекеттер',
    contactsBottomText:
    'Заманауи үйде жайлы өмір сүруге арналған инновациялық шешімдер.',

    // Footer
    footerText:
    '© 2026 JKH Digital • Қазақстан тұрғындары мен ОСИ үшін платформа',
  },

  en: {
    // Dashboard
    nav_dashboard: 'Dashboard',
    welcome: 'Welcome',
    current_balance: 'Current Balance',

    quick_summary: 'Quick Summary',
    to_pay: 'To Pay',
    due_date: 'Due Date',
    active_requests: 'Active Requests',
    new_news: 'New News',

    submit_reading: 'Submit Reading',
    my_requests: 'My Requests',
    pay_online: 'Pay Online',
    nav_charges: 'Charges',

    latest_charges: 'Latest Charges',
    period: 'Period',
    service: 'Service',
    amount: 'Amount',
    status: 'Status',

    news: 'News',
    new: 'New',

    unpaid: 'Unpaid',
    paid: 'Paid',
    overdue: 'Overdue',

    apartment: 'Apartment',
    profile: 'Profile',
    settings: 'Settings',
    notifications: 'Notifications',
    logout: 'Logout',
    nav_meters: 'Meter Readings',
    nav_payments: 'Payments',
    nav_requests: 'Requests',
    nav_news: 'News',
    nav_chats: 'Chats',
    nav_profile: 'Profile',
    // Topbar home page
    navFeatures: 'Features',
    navHow: 'How It Works',
    navAudience: 'Audience',
    navFaq: 'FAQ',
    navContacts: 'Contacts',

    // Landing Hero
    heroTitle:
    'Online Home Management for OSI and Residents',
    heroSubtitle:
    'Utility payments, requests, voting, and notifications in one platform. Save time and manage your building transparently.',

    loginBtn: 'Login',
    registerBtn: 'Register',
    connectHouseBtn: 'Connect Building',

    chipKazakhstan:
    '🇰🇿 Kazakhstan & OSI Support',
    chipPayments:
    '💳 Kaspi & Online Payments',
    chipNotifications:
    '🔔 Push & WhatsApp Notifications',

    // Trust block
    trustTitle:
    'Why People Trust JKH Digital',
    trustSubtitle:
    'A clear service for residents and a convenient tool for OSI management.',
    launchTime:
    'to launch building',
    phoneAccess:
    'mobile access',
    historyOps:
    'operation history',
    languageSupport:
    'language support',

    // Problems
    problemsTitle:
    'What Problems the Service Solves',
    problemsSubtitle:
    'Residents get convenience, while OSI gets transparency and control.',

    // Sections
    forResidents:
    'For Residents',
    forOsi:
    'For OSI & Management',

    residentFeature1:
    'Online utility payments',
    residentFeature2:
    'Plumber request in 1 minute',
    residentFeature3:
    'Notifications from OSI and management',
    residentFeature4:
    'Payment and billing history',
    residentFeature5:
    'Building voting system',

    osiFeature1:
    'Priority-based request management',
    osiFeature2:
    'Payment collection and monitoring',
    osiFeature3:
    'Mass notifications for residents',
    osiFeature4:
    'Debt monitoring',
    osiFeature5:
    'Electronic documents and reports',

    // How it works
    howTitle:
    'How It Works',
    howSubtitle:
    'Quick onboarding without complicated training.',
    step1:
    '1. Register',
    step1Desc:
    'Create a resident or OSI representative account.',
    step2:
    '2. Link Your Apartment',
    step2Desc:
    'Confirm your address and access building data.',
    step3:
    '3. Use the Services',
    step3Desc:
    'Pay bills, submit requests, vote, and follow updates.',

    // Platform
    platformTitle:
    'Platform Interface',
    platformSubtitle:
    'Even simple visual screens increase user trust.',

    mockTitle1: 'Request Screen',
    mockDesc1: 'Statuses, assignee, deadlines',

    mockTitle2: 'Service Payments',
    mockDesc2: 'Kaspi/card, operation history',

    mockTitle3: 'Notifications',
    mockDesc3: 'Important news and reminders',

    mockTitle4: 'Voting',
    mockDesc4: 'Online resident decisions',

    mockTitle5: 'Documents',
    mockDesc5: 'Protocols, reports, acts',

    mockTitle6: 'Mobile Version',
    mockDesc6: 'Manage your building from phone',

    // Photo Cards
    photoDesc1:
    'Pay utility services online in just a few minutes.',
    photoDesc2:
    'Building requests: plumbing, elevator, cleaning, electrical.',
    photoDesc3:
    'OSI and management companies see transparent analytics and building status.',

    // Features
    featuresTitle:
    'Platform Features',

    featureColumn1:
    'Feature',
    featureColumn2:
    'Description',

    featureName1:
    'Requests',
    featureDesc1:
    'Plumbing, elevator, cleaning, and status tracking',

    featureName2:
    'Payments',
    featureDesc2:
    'Online utility payments including Kaspi',

    featureName3:
    'Voting',
    featureDesc3:
    'Transparent resident decisions for the building',

    featureName4:
    'Notifications',
    featureDesc4:
    'Building news via push and WhatsApp',

    featureName5:
    'Documents',
    featureDesc5:
    'Protocols, reports, and important OSI files',

    featureName6:
    'Chat',
    featureDesc6:
    'Communication between residents and management team',

    // Audience
    audienceTitle:
    'Who the Service Is For',

    audience1:
    'OSI',
    audience2:
    'Residential Complexes & New Buildings',
    audience3:
    'Management Companies',
    audience4:
    'Residents',
    audience5:
    'HOA & Cooperatives',
    audience6:
    'Service Contractors',

    // Kazakhstan
    kazakhstanTitle:
    'Advantages for Kazakhstan',

    kzAdvantage1:
    '🇰🇿 Local OSI support',
    kzAdvantage2:
    '📱 Convenient mobile access',
    kzAdvantage3:
    '🔒 Secure data storage',
    kzAdvantage4:
    '💳 Online payments & Kaspi QR',
    kzAdvantage5:
    '🔔 Push & WhatsApp notifications',
    kzAdvantage6:
    '🌐 Russian & Kazakh interface',

    // Pricing
    pricingTitle:
    'Pricing',
    pricingSubtitle:
    'Transparent approach for residents and OSI.',

    pricingFree:
    'Free for residents',
    pricingDesc:
    'For OSI and management companies, pricing depends on the number of apartments. Building connection is available by request.',
    pricingBtn:
    'Get OSI Pricing',

    // Reviews
    reviewsTitle:
    'Reviews',

    review1:
    '"The service reduced calls to OSI and accelerated payments." — OSI Chairman, Almaty',
    review2:
    '"Requests and notifications became clear for all residents." — Management Company, Astana',

    // FAQ
    faqTitle:
    'FAQ',
    faqQuestion1:
    'How can I connect my building?',
    faqAnswer1:
    'Submit a request and we will contact the management company and launch the building step by step.',
    faqQuestion2:
    'Who can see my data?',
    faqAnswer2:
    'Only verified residents and the management organization.',
    faqQuestion3:
    'Can I pay via Kaspi?',
    faqAnswer3:
    'Yes, Kaspi and bank cards are supported.',
    faqQuestion4:
    'How do I verify my apartment?',
    faqAnswer4:
    'Through a confirmation code or management company verification.',
    faqQuestion5:
    'Is there a mobile version?',
    faqAnswer5:
    'Yes, the service is optimized for smartphones and tablets.',

    // Contacts
    contactsTitle:
    'Contacts',
    contactsSubtitle:
    'Ready to connect your building and provide a demo.',
    contactsAddress:
    'Address: Astana, Kazakhstan',

    // Quick actions
    quickActions:
    'Quick Actions',
    contactsBottomText:
    'Innovative solutions for comfortable living in a modern building.',

    // Footer
    footerText:
    '© 2026 JKH Digital • Platform for OSI, management companies, and residents of Kazakhstan',
  }
};

const I18N = {
  currentLang: localStorage.getItem('jkh_lang') || 'ru',
  langs: ['ru', 'kz', 'en'],
  
  setLang(lang) {
    if (translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('jkh_lang', lang);
      this.applyTranslations();
    }
  },
  
  toggleLang() {
    const currentIndex = this.langs.indexOf(this.currentLang);
    const nextIndex = (currentIndex + 1) % this.langs.length;
    this.setLang(this.langs[nextIndex]);
  },
  
  t(key) {
    return translations[this.currentLang][key] || translations.ru[key] || key;
  },
  
  applyTranslations() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
    
    // Update language selector - highlight current language
    const langSelector = document.getElementById('langSelector');
    if (langSelector) {
      const langDisplay = {
        ru: '<strong>RU</strong> | KZ | EN',
        kz: 'RU | <strong>KZ</strong> | EN',
        en: 'RU | KZ | <strong>EN</strong>'
      };
      langSelector.innerHTML = langDisplay[this.currentLang];
    }
    
    // Update html lang attribute
    document.documentElement.lang = this.currentLang;
  },
  
  init() {
    this.applyTranslations();
  },
};

// Language buttons
document.querySelectorAll('.lang').forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    I18N.setLang(lang);

    // Remove active class
    document.querySelectorAll('.lang')
      .forEach(el => {
        el.classList.remove('active');
      });

    // Add active class
    btn.classList.add('active');
  });
});
