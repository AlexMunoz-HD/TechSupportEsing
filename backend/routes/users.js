const express = require('express');
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database');
const { verifyToken, requireAdmin, logAudit } = require('../middleware/auth');

const router = express.Router();

// Apply middleware to all routes
router.use(verifyToken);
router.use(requireAdmin);
router.use(logAudit);

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await executeQuery(
      'SELECT id, username, email, role, location, full_name, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const users = await executeQuery(
      'SELECT id, username, email, role, location, full_name, is_active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: users[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { username, email, password, role, location, full_name } = req.body;
    
    // Validate required fields
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'Username, email, password, and full name are required' });
    }
    
    // Validate role
    if (role && !['admin', 'auditor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or auditor' });
    }
    
    // Validate location
    if (location && !['MX', 'CL', 'REMOTO'].includes(location)) {
      return res.status(400).json({ error: 'Invalid location. Must be MX, CL, or REMOTO' });
    }
    
    // Check if username already exists
    const existingUsername = await executeQuery(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsername.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Check if email already exists
    const existingEmail = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const result = await executeQuery(
      'INSERT INTO users (username, email, password_hash, role, location, full_name) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, password_hash, role || 'auditor', location || 'REMOTO', full_name]
    );
    
    // Get created user
    const newUser = await executeQuery(
      'SELECT id, username, email, role, location, full_name, is_active, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({ 
      message: 'User created successfully',
      user: newUser[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, location, full_name, is_active } = req.body;
    
    // Check if user exists
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validate role if provided
    if (role && !['admin', 'auditor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or auditor' });
    }
    
    // Validate location if provided
    if (location && !['MX', 'CL', 'REMOTO'].includes(location)) {
      return res.status(400).json({ error: 'Invalid location. Must be MX, CL, or REMOTO' });
    }
    
    // Check if username already exists (excluding current user)
    if (username) {
      const existingUsername = await executeQuery(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, id]
      );
      
      if (existingUsername.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }
    
    // Check if email already exists (excluding current user)
    if (email) {
      const existingEmail = await executeQuery(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );
      
      if (existingEmail.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }
    
    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    
    if (username) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    
    if (role) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    
    if (location) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }
    
    if (full_name) {
      updateFields.push('full_name = ?');
      updateValues.push(full_name);
    }
    
    if (typeof is_active === 'boolean') {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateValues.push(id);
    
    // Update user
    await executeQuery(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );
    
    // Get updated user
    const updatedUser = await executeQuery(
      'SELECT id, username, email, role, location, full_name, is_active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    
    res.json({ 
      message: 'User updated successfully',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Change user password
router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    // Check if user exists
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Hash new password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Update password
    await executeQuery(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [password_hash, id]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Error updating password' });
  }
});

// Toggle user active status
router.put('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const existingUser = await executeQuery(
      'SELECT id, is_active FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentStatus = existingUser[0].is_active;
    const newStatus = !currentStatus;
    
    // Update status
    await executeQuery(
      'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, id]
    );
    
    res.json({ 
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      is_active: newStatus
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Error toggling user status' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const existingUser = await executeQuery(
      'SELECT id, username FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent deleting own account
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Delete user
    await executeQuery('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error deleting user' });
  }
});

module.exports = router;
