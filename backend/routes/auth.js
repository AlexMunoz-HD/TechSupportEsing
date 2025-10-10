const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const { verifyToken, logAudit } = require('../middleware/auth');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from database
    const users = await executeQuery(
      'SELECT id, username, email, password_hash, role, location, full_name, is_active FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log successful login
    await executeQuery(
      'INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        user.id,
        'LOGIN',
        'user',
        user.id.toString(),
        JSON.stringify({ success: true }),
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        user.location
      ]
    );

    // Return user data (without password)
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { password_hash, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get current password hash
    const users = await executeQuery(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await executeQuery(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, req.user.id]
    );

    // Log password change
    await executeQuery(
      'INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        'PASSWORD_CHANGED',
        'user',
        req.user.id.toString(),
        JSON.stringify({ success: true }),
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        req.user.location
      ]
    );

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (client-side token removal, but log the action)
router.post('/logout', verifyToken, async (req, res) => {
  try {
    // Log logout action
    await executeQuery(
      'INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        'LOGOUT',
        'user',
        req.user.id.toString(),
        JSON.stringify({ success: true }),
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        req.user.location
      ]
    );

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
