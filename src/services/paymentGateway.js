// Mock external payment gateway (replace with real Kaspi/Halyk API in production)
const processPayment = async ({ amount, card_holder_name }) => {
  await new Promise((r) => setTimeout(r, 300));
  const success = Math.random() > 0.1; // 90% success rate for testing
  const holderTag = card_holder_name ? `-${String(card_holder_name).slice(0, 6).replace(/\s/g, '')}` : '';
  return {
    success,
    gatewayRef: success
      ? `GW-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}${holderTag}`
      : null,
    message: success ? 'Payment authorized' : 'Payment declined by gateway',
  };
};

module.exports = { processPayment };
