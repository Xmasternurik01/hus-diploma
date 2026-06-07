/**
 * Названия услуг и подписи в стиле ежемесячной квитанции ЕРЦ (Астана).
 * Ключи service в API остаются: gas, water, electricity, heating, maintenance …
 */
(function () {
  const SERVICE_LABELS = {
    gas: 'Газоснабжение по показаниям ПУ',
    water: 'Водоснабжение и водоотведение по ПУ',
    electricity: 'Электроэнергия (Астана-РЭК)',
    heating: 'Автономное отопление по площади',
    maintenance: 'Эксплуатационные расходы (ОСИ)',
    waste: 'Вывоз ТБО',
    intercom: 'Домофон',
    video: 'Видеонаблюдение',
    elevator: 'Техническое обслуживание лифтов',
    eodn: 'Электроэнергия на общедомовые нужды (ОДН)',
  };

  window.SERVICE_LABELS = SERVICE_LABELS;
  window.RECEIPT_BRANDING = {
    issuer: 'Астана ЕРЦ',
    issuerFull: 'Единый расчётный центр — Астана ЕРЦ',
    receiptKind: 'Квитанция за коммунальные услуги',
    managementBody: 'ОСИ МЖК Budapest',
    paymentDeadlinePrefix: 'Срок оплаты до',
    columnsHint:
      'По аналогии с бумажной квитанцией: период, объём по ПУ, тариф, начислено, к оплате',
  };

  window.serviceLabel = function (key) {
    if (!key) return '—';
    return SERVICE_LABELS[key] || key;
  };
})();
