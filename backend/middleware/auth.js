const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Set JWT_SECRET in production. The fallback keeps existing local installations usable.
const secret = () => process.env.JWT_SECRET || process.env.JWT_KEY || 'examnova-local-development-secret-change-before-production';

exports.requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token || !secret()) return res.status(401).json({ message: 'Authentication is required' });
    const payload = jwt.verify(token, secret());
    const user = await User.findById(payload.sub).select('-password');
    if (!user) return res.status(401).json({ message: 'Your session is no longer valid' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired session' });
  }
};

exports.allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return res.status(403).json({ message: 'You do not have permission for this action' });
  next();
};
