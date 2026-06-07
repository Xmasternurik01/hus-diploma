// Mock external utility provider (replace with real API in production)
const LIMITS = { cold_water: 30, hot_water: 20, electricity: 1000, gas: 100 };

const verifyReading = async ({ meterType, value, previousValue }) => {
  await new Promise(r => setTimeout(r, 150));
  const consumption = value - previousValue;
  const limit = LIMITS[meterType] || Infinity;
  const approved = consumption >= 0 && consumption <= limit;
  return {
    approved,
    reason: approved ? null : `Consumption ${consumption} exceeds max ${limit}`
  };
};

module.exports = { verifyReading };
