const express = require('express');
const { executeQuery } = require('../config/database');
const { verifyToken, requireAuditor, logAudit } = require('../middleware/auth');

const router = express.Router();

// Apply middleware to all routes
router.use(verifyToken);
router.use(requireAuditor);
router.use(logAudit);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Mock data for demonstration
    const mockData = {
      userStats: {
        MX: 45,
        CL: 32,
        REMOTO: 28
      },
      assetStats: {
        available: 25,
        assigned: 78,
        maintenance: 5,
        retired: 12
      },
      recentLogs: [
        {
          id: 1,
          action: 'USER_CREATED',
          resource_type: 'user',
          resource_id: 'user_123',
          details: '{"name": "Nuevo Usuario", "department": "IT"}',
          created_at: '2024-01-20T10:30:00Z',
          full_name: 'Admin User',
          username: 'admin'
        },
        {
          id: 2,
          action: 'ASSET_ASSIGNED',
          resource_type: 'asset',
          resource_id: 'asset_456',
          details: '{"asset_name": "MacBook Pro", "assigned_to": "Juan Pérez"}',
          created_at: '2024-01-20T09:15:00Z',
          full_name: 'Admin User',
          username: 'admin'
        },
        {
          id: 3,
          action: 'OFFBOARDING_STARTED',
          resource_type: 'employee',
          resource_id: 'emp_789',
          details: '{"employee_name": "Carlos Mendoza", "reason": "Resignation"}',
          created_at: '2024-01-20T08:45:00Z',
          full_name: 'Admin User',
          username: 'admin'
        }
      ],
      activeAssignments: [
        {
          id: 1,
          asset_name: 'MacBook Pro 16"',
          asset_tag: 'LAPTOP-001',
          assigned_to_name: 'Juan Pérez',
          assignment_date: '2024-01-15T10:00:00Z'
        },
        {
          id: 2,
          asset_name: 'Dell Monitor 27"',
          asset_tag: 'MONITOR-002',
          assigned_to_name: 'María García',
          assignment_date: '2024-01-18T14:30:00Z'
        },
        {
          id: 3,
          asset_name: 'iPhone 14',
          asset_tag: 'PHONE-003',
          assigned_to_name: 'Pedro López',
          assignment_date: '2024-01-19T09:15:00Z'
        }
      ],
      alerts: [
        {
          id: 1,
          action: 'USER_CREATED',
          details: '{"name": "Nuevo Usuario", "location": "MX", "source": "Hibob"}',
          created_at: '2024-01-20T10:30:00Z',
          full_name: 'Admin User',
          username: 'admin'
        }
      ]
    };

    res.json(mockData);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simulate new user from Hibob (for testing alerts)
router.post('/simulate-hibob-user', async (req, res) => {
  try {
    const { name, location = 'REMOTO' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Create a simulated user entry in audit log
    const result = await executeQuery(
      'INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        'USER_CREATED',
        'hibob_user',
        `hibob_${Date.now()}`,
        JSON.stringify({ 
          name, 
          location, 
          source: 'Hibob',
          simulated: true 
        }),
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        location
      ]
    );

    // Emit real-time alert to connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('new_user_alert', {
        id: result.insertId,
        name,
        location,
        timestamp: new Date().toISOString(),
        source: 'Hibob'
      });
    }

    res.json({ 
      message: 'Hibob user simulation created successfully',
      alert: {
        id: result.insertId,
        name,
        location,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Hibob simulation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit logs with filtering
router.get('/audit-logs', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      action, 
      location, 
      startDate, 
      endDate 
    } = req.query;

    // Mock audit logs data
    const mockLogs = [
      {
        id: 1,
        action: 'USER_CREATED',
        resource_type: 'user',
        resource_id: 'user_123',
        details: '{"name": "Nuevo Usuario", "department": "IT", "location": "MX"}',
        created_at: '2024-01-20T10:30:00Z',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0...',
        location: 'MX',
        full_name: 'Admin User',
        username: 'admin'
      },
      {
        id: 2,
        action: 'ASSET_ASSIGNED',
        resource_type: 'asset',
        resource_id: 'asset_456',
        details: '{"asset_name": "MacBook Pro", "assigned_to": "Juan Pérez", "asset_tag": "LAPTOP-001"}',
        created_at: '2024-01-20T09:15:00Z',
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0...',
        location: 'CL',
        full_name: 'Admin User',
        username: 'admin'
      },
      {
        id: 3,
        action: 'OFFBOARDING_STARTED',
        resource_type: 'employee',
        resource_id: 'emp_789',
        details: '{"employee_name": "Carlos Mendoza", "reason": "Resignation", "last_working_day": "2024-02-15"}',
        created_at: '2024-01-20T08:45:00Z',
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0...',
        location: 'REMOTO',
        full_name: 'Admin User',
        username: 'admin'
      },
      {
        id: 4,
        action: 'ASSET_RETURNED',
        resource_type: 'asset',
        resource_id: 'asset_789',
        details: '{"asset_name": "Dell Monitor", "returned_by": "María García", "asset_tag": "MONITOR-002"}',
        created_at: '2024-01-20T07:20:00Z',
        ip_address: '192.168.1.103',
        user_agent: 'Mozilla/5.0...',
        location: 'MX',
        full_name: 'Admin User',
        username: 'admin'
      },
      {
        id: 5,
        action: 'EXIT_LETTER_CREATED',
        resource_type: 'employee',
        resource_id: 'emp_456',
        details: '{"employee_name": "Pedro López", "document_id": "EXIT-456-20240120", "hibob_document_id": "HIBOB-456-20240120"}',
        created_at: '2024-01-20T06:10:00Z',
        ip_address: '192.168.1.104',
        user_agent: 'Mozilla/5.0...',
        location: 'CL',
        full_name: 'Admin User',
        username: 'admin'
      },
      {
        id: 6,
        action: 'USER_LOGIN',
        resource_type: 'user',
        resource_id: 'user_789',
        details: '{"login_time": "2024-01-20T05:30:00Z", "success": true}',
        created_at: '2024-01-20T05:30:00Z',
        ip_address: '192.168.1.105',
        user_agent: 'Mozilla/5.0...',
        location: 'REMOTO',
        full_name: 'Juan Pérez',
        username: 'juan.perez'
      },
      {
        id: 7,
        action: 'ASSET_MAINTENANCE',
        resource_type: 'asset',
        resource_id: 'asset_321',
        details: '{"asset_name": "iPhone 14", "maintenance_type": "Screen Repair", "asset_tag": "PHONE-003"}',
        created_at: '2024-01-19T16:45:00Z',
        ip_address: '192.168.1.106',
        user_agent: 'Mozilla/5.0...',
        location: 'MX',
        full_name: 'Admin User',
        username: 'admin'
      },
      {
        id: 8,
        action: 'ONBOARDING_COMPLETED',
        resource_type: 'employee',
        resource_id: 'emp_321',
        details: '{"employee_name": "Sofia Martínez", "department": "Finance", "start_date": "2024-01-15"}',
        created_at: '2024-01-19T15:20:00Z',
        ip_address: '192.168.1.107',
        user_agent: 'Mozilla/5.0...',
        location: 'CL',
        full_name: 'Admin User',
        username: 'admin'
      }
    ];

    // Filter logs based on query parameters
    let filteredLogs = mockLogs;

    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }

    if (location) {
      filteredLogs = filteredLogs.filter(log => log.location === location);
    }

    // Pagination
    const total = filteredLogs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    res.json({
      logs: paginatedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user activity summary
router.get('/user-activity', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const activity = await executeQuery(`
      SELECT 
        DATE(al.created_at) as date,
        al.action,
        COUNT(*) as count
      FROM audit_log al
      WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(al.created_at), al.action
      ORDER BY date DESC, al.action
    `, [days]);

    res.json({ activity });

  } catch (error) {
    console.error('User activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
