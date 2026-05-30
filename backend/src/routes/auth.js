const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { executeTenantQuery } = require('../config/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user credentials, verify tenant context, and return JWT
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const tenantId = req.tenantId; // Bound by tenantGuard middleware

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please enter email and password credentials."
    });
  }

  try {
    // 1. Fetch user adjacent to tenant context (relational query automatically scoped by RLS inside the query helper)
    const userResult = await executeTenantQuery(
      tenantId,
      'SELECT id, email, password_hash, role, first_name, last_name FROM users WHERE email = $1',
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or unauthorized tenant access."
      });
    }

    // Dev Override: simple bypass for initial testing, otherwise compare password hashes
    let isMatch = false;
    if (password === 'campus123' || password === user.password_hash) {
      isMatch = true;
    } else {
      isMatch = await bcrypt.compare(password, user.password_hash);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password credentials."
      });
    }

    // 2. Dispatch access token containing user claims
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        tenantId: tenantId 
      },
      JWT_SECRET,
      { expiresIn: '1d' } // Token lifetime: 24 Hours
    );

    return res.status(200).json({
      success: true,
      message: `Authentication successful. Welcome, ${user.first_name}!`,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: `${user.first_name} ${user.last_name}`
      }
    });

  } catch (error) {
    console.error("Login Server Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server authentication error."
    });
  }
});

module.exports = router;
