const jwt = require('jsonwebtoken');
const store = require('../data/store');

const authenticate = async (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' });

  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = await store.userFindById(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'Access denied' });
  next();
};

const requireVerified = (req, res, next) => {
  // Admin/technician/utility_provider are not subject to resident verification gating
  if (req.user.role !== 'resident') return next();
  if (req.user.verification_status !== 'approved') {
    return res.status(403).json({ error: 'Аккаунт не подтверждён. Дождитесь подтверждения администратора.' });
  }
  next();
};

module.exports = { authenticate, authorize, requireVerified };
