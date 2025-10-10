const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const users = await executeQuery(
      'SELECT id, username, email, role, location, full_name, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    const user = users[0];
    
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Check if user has admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

// Check if user has auditor or admin role
const requireAuditor = (req, res, next) => {
  if (!['admin', 'auditor'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Auditor or Admin role required.' });
  }
  next();
};

// Log audit trail
const logAudit = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log the action after response is sent
    setTimeout(async () => {
      try {
        const action = `${req.method} ${req.route?.path || req.path}`;
        const details = {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress
        };

        await executeQuery(
          'INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            req.user?.id || null,
            action,
            'api',
            req.params.id || null,
            JSON.stringify(details),
            req.ip || req.connection.remoteAddress,
            req.get('User-Agent'),
            req.user?.location || 'REMOTO'
          ]
        );
      } catch (error) {
        console.error('Audit logging failed:', error);
      }
    }, 0);
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireAuditor,
  logAudit
};
