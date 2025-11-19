const express = require('express');
const axios = require('axios');
const { executeQuery } = require('../config/database');
const { verifyToken, requireAuditor, logAudit } = require('../middleware/auth');

const router = express.Router();

// Apply middleware to all routes
router.use(verifyToken);
router.use(requireAuditor);
router.use(logAudit);

// Snipe-IT configuration
const SNIPE_IT_API_BASE = process.env.SNIPE_IT_API_BASE || 'https://api.dev.cl.internal.xepelin.tech/v1/irt/xnipe-it';
const SNIPE_IT_API_KEY = process.env.SNIPE_IT_API_KEY || '';

// Helper function to make Snipe-IT API requests
async function makeSnipeItRequest(endpoint, params = {}) {
  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${SNIPE_IT_API_BASE}${cleanEndpoint}`;
    
    const response = await axios.get(fullUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${SNIPE_IT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      params,
      timeout: 10000
    });
    
    return response.data;
  } catch (error) {
    console.error('Snipe-IT API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message
    });
    throw error;
  }
}

// Get dashboard statistics from Snipe-IT
router.get('/stats', async (req, res) => {
  try {
    let totalUsers = 0;
    let availableAssets = 0;
    let assignedAssets = 0;
    let userStats = { MX: 0, CL: 0, REMOTO: 0 };
    
    try {
      // Get total users from Snipe-IT
      const usersResponse = await makeSnipeItRequest('/users', {
        limit: 1,
        offset: 0
      });
      totalUsers = usersResponse.total || (usersResponse.rows ? usersResponse.rows.length : 0);
      
      // Get all users to calculate stats by location
      const allUsersResponse = await makeSnipeItRequest('/users', {
        limit: 1000,
        offset: 0
      });
      
      const users = allUsersResponse.rows || [];
      users.forEach(user => {
        const location = user.location ? (user.location.name || user.location) : 'REMOTO';
        if (location === 'MX' || location.includes('México') || location.includes('Mexico')) {
          userStats.MX++;
        } else if (location === 'CL' || location.includes('Chile')) {
          userStats.CL++;
        } else {
          userStats.REMOTO++;
        }
      });
      
      // Get assets statistics from Snipe-IT
      const assetsResponse = await makeSnipeItRequest('/hardware', {
        limit: 1000,
        offset: 0
      });
      
      const assets = assetsResponse.rows || [];
      console.log(`📦 Found ${assets.length} assets in Snipe-IT`);
      
      // Count assets by status
      assets.forEach(asset => {
        const statusLabel = asset.status_label || {};
        const status = statusLabel.status_meta || statusLabel.name || '';
        const statusName = statusLabel.name || '';
        const statusId = statusLabel.id;
        
        // Available assets (Ready to Deploy, Available, etc.)
        // Check multiple conditions for available assets
        const isAvailable = 
          status === 'ready to deploy' || 
          status === 'deployable' ||
          statusId === 1 || // Common ID for "Ready to Deploy"
          statusName?.toLowerCase().includes('ready') ||
          statusName?.toLowerCase().includes('available') ||
          statusName?.toLowerCase().includes('disponible') ||
          statusName?.toLowerCase().includes('deployable');
        
        if (isAvailable && !asset.assigned_to) {
          availableAssets++;
        }
        
        // Assigned assets (Deployed, Assigned, etc.)
        // Check if asset is assigned to someone
        const isAssigned = 
          asset.assigned_to !== null && asset.assigned_to !== undefined ||
          asset.assigned_to_id !== null && asset.assigned_to_id !== undefined ||
          status === 'deployed' ||
          statusId === 2 || // Common ID for "Deployed"
          statusName?.toLowerCase().includes('deployed') ||
          statusName?.toLowerCase().includes('assigned') ||
          statusName?.toLowerCase().includes('asignado');
        
        if (isAssigned) {
          assignedAssets++;
        }
      });
      
      console.log(`📊 Assets counted - Available: ${availableAssets}, Assigned: ${assignedAssets}`);
      
      console.log('✅ Snipe-IT stats loaded:', {
        totalUsers,
        availableAssets,
        assignedAssets,
        userStats
      });
      
    } catch (snipeError) {
      console.error('❌ Error fetching data from Snipe-IT:', snipeError.message);
      console.error('❌ Error stack:', snipeError.stack);
      // Fallback to default values if Snipe-IT fails
      // Keep the values at 0 but log the error for debugging
      if (totalUsers === 0 && availableAssets === 0 && assignedAssets === 0) {
        console.warn('⚠️ All values are 0, this might indicate a connection issue with Snipe-IT');
      }
    }
    
    const assetStats = {
      available: availableAssets,
      assigned: assignedAssets,
      maintenance: 0,
      retired: 0
    };
    
    const dashboardData = {
      userStats: userStats,
      assetStats: assetStats,
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
      ],
      source: 'Snipe-IT',
      totalUsers: totalUsers,
      _debug: {
        usersFetched: totalUsers > 0,
        assetsFetched: (availableAssets + assignedAssets) > 0,
        timestamp: new Date().toISOString()
      }
    };

    console.log('📤 Sending dashboard data:', {
      totalUsers,
      availableAssets,
      assignedAssets,
      userStats
    });

    res.json(dashboardData);

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
