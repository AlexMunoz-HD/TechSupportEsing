const express = require('express');
const { executeQuery } = require('../config/database');
const { verifyToken, requireAuditor, logAudit } = require('../middleware/auth');

const router = express.Router();

// Apply middleware to all routes
router.use(verifyToken);
router.use(requireAuditor);
router.use(logAudit);

// Get audit logs with advanced filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      resourceType,
      location, 
      userId,
      startDate, 
      endDate,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (action) {
      whereClause += ' AND al.action = ?';
      params.push(action);
    }

    if (resourceType) {
      whereClause += ' AND al.resource_type = ?';
      params.push(resourceType);
    }

    if (location) {
      whereClause += ' AND al.location = ?';
      params.push(location);
    }

    if (userId) {
      whereClause += ' AND al.user_id = ?';
      params.push(userId);
    }

    if (startDate) {
      whereClause += ' AND al.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND al.created_at <= ?';
      params.push(endDate);
    }

    if (search) {
      whereClause += ' AND (al.details LIKE ? OR u.full_name LIKE ? OR u.username LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countResult = await executeQuery(`
      SELECT COUNT(*) as total 
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
    `, params);

    // Get paginated results
    const logs = await executeQuery(`
      SELECT 
        al.*, 
        u.full_name, 
        u.username,
        u.role
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit log by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const logs = await executeQuery(`
      SELECT 
        al.*, 
        u.full_name, 
        u.username,
        u.role
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = ?
    `, [id]);

    if (logs.length === 0) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json({ log: logs[0] });

  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Get action statistics
    const actionStats = await executeQuery(`
      SELECT 
        action,
        COUNT(*) as count
      FROM audit_log
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY action
      ORDER BY count DESC
    `, [days]);

    // Get location statistics
    const locationStats = await executeQuery(`
      SELECT 
        location,
        COUNT(*) as count
      FROM audit_log
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY location
      ORDER BY count DESC
    `, [days]);

    // Get daily activity
    const dailyActivity = await executeQuery(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM audit_log
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [days]);

    // Get top users by activity
    const topUsers = await executeQuery(`
      SELECT 
        u.full_name,
        u.username,
        u.role,
        COUNT(al.id) as activity_count
      FROM audit_log al
      JOIN users u ON al.user_id = u.id
      WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY u.id, u.full_name, u.username, u.role
      ORDER BY activity_count DESC
      LIMIT 10
    `, [days]);

    res.json({
      actionStats,
      locationStats,
      dailyActivity,
      topUsers,
      period: `${days} days`
    });

  } catch (error) {
    console.error('Audit stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit trends
router.get('/stats/trends', async (req, res) => {
  try {
    const { period = '7' } = req.query;

    const trends = await executeQuery(`
      SELECT 
        DATE(created_at) as date,
        action,
        COUNT(*) as count
      FROM audit_log
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at), action
      ORDER BY date DESC, action
    `, [period]);

    res.json({ trends, period: `${period} days` });

  } catch (error) {
    console.error('Audit trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export audit logs (CSV format)
router.get('/export/csv', async (req, res) => {
  try {
    const { 
      action, 
      resourceType,
      location, 
      startDate, 
      endDate 
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (action) {
      whereClause += ' AND al.action = ?';
      params.push(action);
    }

    if (resourceType) {
      whereClause += ' AND al.resource_type = ?';
      params.push(resourceType);
    }

    if (location) {
      whereClause += ' AND al.location = ?';
      params.push(location);
    }

    if (startDate) {
      whereClause += ' AND al.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND al.created_at <= ?';
      params.push(endDate);
    }

    const logs = await executeQuery(`
      SELECT 
        al.id,
        al.created_at,
        al.action,
        al.resource_type,
        al.resource_id,
        al.location,
        al.ip_address,
        u.full_name as user_name,
        u.username,
        u.role,
        al.details
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
    `, params);

    // Convert to CSV format
    const csvHeader = 'ID,Date,Action,Resource Type,Resource ID,Location,IP Address,User Name,Username,Role,Details\n';
    const csvRows = logs.map(log => {
      const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
      return [
        log.id,
        log.created_at,
        log.action,
        log.resource_type,
        log.resource_id || '',
        log.location,
        log.ip_address || '',
        log.user_name || '',
        log.username || '',
        log.role || '',
        details
      ].map(field => `"${field}"`).join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
