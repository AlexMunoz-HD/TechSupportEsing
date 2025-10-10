const express = require('express');
const { executeQuery } = require('../config/database');
const { verifyToken, requireAuditor, logAudit } = require('../middleware/auth');
const { generateAssignmentDocument } = require('../utils/documentGenerator');

const router = express.Router();

// Apply middleware to all routes
router.use(verifyToken);
router.use(requireAuditor);
router.use(logAudit);

// Get all assets
router.get('/', async (req, res) => {
  try {
    const { status, location, category, assigned } = req.query;
    
    // Mock data for demonstration
    const mockAssets = [
      {
        id: 1,
        name: 'MacBook Pro 16"',
        asset_tag: 'LAPTOP-001',
        category: 'Laptop',
        status: 'assigned',
        location: 'MX',
        assigned_to: 1,
        assigned_to_name: 'Juan Pérez',
        assigned_to_username: 'juan.perez',
        purchase_date: '2023-01-15',
        warranty_expiry: '2025-01-15',
        created_at: '2023-01-15T10:00:00Z'
      },
      {
        id: 2,
        name: 'Dell Monitor 27"',
        asset_tag: 'MONITOR-002',
        category: 'Monitor',
        status: 'assigned',
        location: 'CL',
        assigned_to: 2,
        assigned_to_name: 'María García',
        assigned_to_username: 'maria.garcia',
        purchase_date: '2023-02-20',
        warranty_expiry: '2025-02-20',
        created_at: '2023-02-20T14:30:00Z'
      },
      {
        id: 3,
        name: 'iPhone 14',
        asset_tag: 'PHONE-003',
        category: 'Phone',
        status: 'assigned',
        location: 'REMOTO',
        assigned_to: 3,
        assigned_to_name: 'Pedro López',
        assigned_to_username: 'pedro.lopez',
        purchase_date: '2023-03-10',
        warranty_expiry: '2025-03-10',
        created_at: '2023-03-10T09:15:00Z'
      },
      {
        id: 4,
        name: 'Dell Laptop 15"',
        asset_tag: 'LAPTOP-004',
        category: 'Laptop',
        status: 'available',
        location: 'MX',
        assigned_to: null,
        assigned_to_name: null,
        assigned_to_username: null,
        purchase_date: '2023-04-05',
        warranty_expiry: '2025-04-05',
        created_at: '2023-04-05T11:20:00Z'
      },
      {
        id: 5,
        name: 'Samsung Monitor 24"',
        asset_tag: 'MONITOR-005',
        category: 'Monitor',
        status: 'maintenance',
        location: 'CL',
        assigned_to: null,
        assigned_to_name: null,
        assigned_to_username: null,
        purchase_date: '2023-05-12',
        warranty_expiry: '2025-05-12',
        created_at: '2023-05-12T16:45:00Z'
      },
      {
        id: 6,
        name: 'iPad Pro 12.9"',
        asset_tag: 'TABLET-006',
        category: 'Tablet',
        status: 'assigned',
        location: 'MX',
        assigned_to: 4,
        assigned_to_name: 'Laura Jiménez',
        assigned_to_username: 'laura.jimenez',
        purchase_date: '2023-06-18',
        warranty_expiry: '2025-06-18',
        created_at: '2023-06-18T13:10:00Z'
      },
      {
        id: 7,
        name: 'MacBook Air 13"',
        asset_tag: 'LAPTOP-007',
        category: 'Laptop',
        status: 'retired',
        location: 'CL',
        assigned_to: null,
        assigned_to_name: null,
        assigned_to_username: null,
        purchase_date: '2022-08-30',
        warranty_expiry: '2024-08-30',
        created_at: '2022-08-30T10:30:00Z'
      },
      {
        id: 8,
        name: 'Dell Desktop PC',
        asset_tag: 'DESKTOP-008',
        category: 'Desktop',
        status: 'available',
        location: 'REMOTO',
        assigned_to: null,
        assigned_to_name: null,
        assigned_to_username: null,
        purchase_date: '2023-07-25',
        warranty_expiry: '2025-07-25',
        created_at: '2023-07-25T15:20:00Z'
      }
    ];

    // Filter assets based on query parameters
    let filteredAssets = mockAssets;

    if (status) {
      filteredAssets = filteredAssets.filter(asset => asset.status === status);
    }

    if (location) {
      filteredAssets = filteredAssets.filter(asset => asset.location === location);
    }

    if (category) {
      filteredAssets = filteredAssets.filter(asset => asset.category === category);
    }

    if (assigned === 'true') {
      filteredAssets = filteredAssets.filter(asset => asset.assigned_to !== null);
    } else if (assigned === 'false') {
      filteredAssets = filteredAssets.filter(asset => asset.assigned_to === null);
    }

    res.json({ assets: filteredAssets });

  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get asset by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const assets = await executeQuery(`
      SELECT 
        a.*,
        u.full_name as assigned_to_name,
        u.username as assigned_to_username
      FROM assets a
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE a.id = ?
    `, [id]);

    if (assets.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Get assignment history
    const assignments = await executeQuery(`
      SELECT 
        aa.*,
        u.full_name as assigned_to_name,
        assigned_by_user.full_name as assigned_by_name
      FROM asset_assignments aa
      JOIN users u ON aa.user_id = u.id
      JOIN users assigned_by_user ON aa.assigned_by = assigned_by_user.id
      WHERE aa.asset_id = ?
      ORDER BY aa.assignment_date DESC
    `, [id]);

    res.json({ 
      asset: assets[0],
      assignments 
    });

  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new asset
router.post('/', async (req, res) => {
  try {
    const { asset_tag, name, category, location } = req.body;

    if (!asset_tag || !name || !category || !location) {
      return res.status(400).json({ 
        error: 'Asset tag, name, category, and location are required' 
      });
    }

    // Check if asset tag already exists
    const existingAssets = await executeQuery(
      'SELECT id FROM assets WHERE asset_tag = ?',
      [asset_tag]
    );

    if (existingAssets.length > 0) {
      return res.status(400).json({ error: 'Asset tag already exists' });
    }

    const result = await executeQuery(
      'INSERT INTO assets (asset_tag, name, category, location) VALUES (?, ?, ?, ?)',
      [asset_tag, name, category, location]
    );

    // Log asset creation
    await executeQuery(
      'INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        'ASSET_CREATED',
        'asset',
        result.insertId.toString(),
        JSON.stringify({ asset_tag, name, category, location }),
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        req.user.location
      ]
    );

    res.status(201).json({ 
      message: 'Asset created successfully',
      assetId: result.insertId 
    });

  } catch (error) {
    console.error('Create asset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign asset to user
router.post('/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get asset details
    const assets = await executeQuery(
      'SELECT * FROM assets WHERE id = ?',
      [id]
    );

    if (assets.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const asset = assets[0];

    if (asset.status === 'assigned') {
      return res.status(400).json({ error: 'Asset is already assigned' });
    }

    // Get user details
    const users = await executeQuery(
      'SELECT * FROM users WHERE id = ? AND is_active = true',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }

    const user = users[0];

    // Start transaction
    const connection = await require('../config/database').getConnection();
    await connection.beginTransaction();

    try {
      // Update asset status
      await connection.execute(
        'UPDATE assets SET assigned_to = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userId, 'assigned', id]
      );

      // Create assignment record
      const assignmentResult = await connection.execute(
        'INSERT INTO asset_assignments (asset_id, user_id, assigned_by, notes) VALUES (?, ?, ?, ?)',
        [id, userId, req.user.id, notes || null]
      );

      // Generate assignment document
      const documentPath = await generateAssignmentDocument({
        assetName: asset.name,
        assetTag: asset.asset_tag,
        userName: user.full_name,
        userLocation: user.location,
        assignedBy: req.user.full_name,
        assignmentDate: new Date(),
        notes: notes || ''
      });

      // Update assignment with document path
      await connection.execute(
        'UPDATE asset_assignments SET document_path = ? WHERE id = ?',
        [documentPath, assignmentResult[0].insertId]
      );

      // Log assignment
      await connection.execute(
        'INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          req.user.id,
          'ASSET_ASSIGNED',
          'asset',
          id,
          JSON.stringify({ 
            asset_name: asset.name, 
            asset_tag: asset.asset_tag,
            assigned_to: user.full_name,
            assigned_to_location: user.location,
            document_generated: true
          }),
          req.ip || req.connection.remoteAddress,
          req.get('User-Agent'),
          req.user.location
        ]
      );

      await connection.commit();

      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('asset_assigned', {
          assetId: id,
          assetName: asset.name,
          assignedTo: user.full_name,
          assignedToLocation: user.location,
          timestamp: new Date().toISOString()
        });
      }

      res.json({ 
        message: 'Asset assigned successfully',
        assignmentId: assignmentResult[0].insertId,
        documentPath
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Assign asset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Return asset
router.post('/:id/return', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Get asset details
    const assets = await executeQuery(
      'SELECT * FROM assets WHERE id = ?',
      [id]
    );

    if (assets.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const asset = assets[0];

    if (asset.status !== 'assigned') {
      return res.status(400).json({ error: 'Asset is not currently assigned' });
    }

    // Start transaction
    const connection = await require('../config/database').getConnection();
    await connection.beginTransaction();

    try {
      // Update asset status
      await connection.execute(
        'UPDATE assets SET assigned_to = NULL, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['available', id]
      );

      // Update assignment record
      await connection.execute(
        'UPDATE asset_assignments SET return_date = CURRENT_TIMESTAMP, notes = CONCAT(COALESCE(notes, ""), "\nReturn notes: ", ?) WHERE asset_id = ? AND return_date IS NULL',
        [notes || '', id]
      );

      // Log return
      await connection.execute(
        'INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          req.user.id,
          'ASSET_RETURNED',
          'asset',
          id,
          JSON.stringify({ 
            asset_name: asset.name, 
            asset_tag: asset.asset_tag,
            return_notes: notes || ''
          }),
          req.ip || req.connection.remoteAddress,
          req.get('User-Agent'),
          req.user.location
        ]
      );

      await connection.commit();

      res.json({ message: 'Asset returned successfully' });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Return asset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update asset
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, location, status } = req.body;

    // Get current asset
    const assets = await executeQuery(
      'SELECT * FROM assets WHERE id = ?',
      [id]
    );

    if (assets.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const currentAsset = assets[0];

    // Update asset
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }

    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }

    if (location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    await executeQuery(
      `UPDATE assets SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Log update
    await executeQuery(
      'INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        'ASSET_UPDATED',
        'asset',
        id,
        JSON.stringify({ 
          asset_tag: currentAsset.asset_tag,
          changes: { name, category, location, status }
        }),
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        req.user.location
      ]
    );

    res.json({ message: 'Asset updated successfully' });

  } catch (error) {
    console.error('Update asset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
