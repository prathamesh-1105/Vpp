const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * Validates JWT authorization header token and binds payload to request context.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <TOKEN>"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Missing authorization bearer token."
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Expired or invalid token."
      });
    }

    // Bind decoded payload fields to request context
    req.user = {
      id: decodedUser.id,
      email: decodedUser.email,
      role: decodedUser.role,
      tenantId: decodedUser.tenantId
    };

    // Ensure token tenant boundary aligns with active client tenant scope
    if (req.tenantId && req.user.tenantId !== req.tenantId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Tenant context mismatch error."
      });
    }

    next();
  });
};

/**
 * Generates Role privilege guards to block unauthorized users.
 * 
 * @param {...string} allowedRoles - Permitted roles e.g. 'faculty', 'admin'
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Insufficient privileges. Required: [${allowedRoles.join(', ')}]`
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
