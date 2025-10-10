const express = require('express');
const { executeQuery } = require('../config/database');
const { verifyToken, requireAuditor, logAudit } = require('../middleware/auth');
const { generateResponsibilityLetter } = require('../utils/documentGenerator');

const router = express.Router();

// Apply middleware to all routes
router.use(verifyToken);
router.use(requireAuditor);
router.use(logAudit);

// Get new hires data
router.get('/new-hires', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Mock data for demonstration
    const mockNewHires = [
      {
        id: 1,
        name: 'Sofia Martínez',
        location: 'CL',
        created_at: '2024-01-15T09:00:00Z',
        created_by: 'Admin User',
        created_by_username: 'admin',
        source: 'Hibob',
        department: 'Finance',
        position: 'Financial Analyst'
      },
      {
        id: 2,
        name: 'Diego Herrera',
        location: 'MX',
        created_at: '2024-01-18T14:30:00Z',
        created_by: 'Admin User',
        created_by_username: 'admin',
        source: 'Hibob',
        department: 'Operations',
        position: 'Operations Coordinator'
      },
      {
        id: 3,
        name: 'Carmen Vega',
        location: 'REMOTO',
        created_at: '2024-01-05T11:15:00Z',
        created_by: 'Admin User',
        created_by_username: 'admin',
        source: 'Hibob',
        department: 'IT',
        position: 'DevOps Engineer'
      },
      {
        id: 4,
        name: 'Alejandro Ramírez',
        location: 'MX',
        created_at: '2024-01-20T16:45:00Z',
        created_by: 'Admin User',
        created_by_username: 'admin',
        source: 'Hibob',
        department: 'IT',
        position: 'Software Developer'
      },
      {
        id: 5,
        name: 'Valentina Torres',
        location: 'CL',
        created_at: '2024-01-22T10:20:00Z',
        created_by: 'Admin User',
        created_by_username: 'admin',
        source: 'Hibob',
        department: 'Marketing',
        position: 'Marketing Specialist'
      }
    ];

    res.json({ newHires: mockNewHires });

  } catch (error) {
    console.error('Get new hires error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create responsibility letter
router.post('/responsibility-letter', async (req, res) => {
  try {
    const { 
      employeeName, 
      employeeId, 
      position, 
      department, 
      location, 
      startDate, 
      assets, 
      additionalTerms 
    } = req.body;

    if (!employeeName || !position || !department || !location || !startDate) {
      return res.status(400).json({ 
        error: 'Employee name, position, department, location, and start date are required' 
      });
    }

    // Generate responsibility letter document
    const documentPath = await generateResponsibilityLetter({
      employeeName,
      employeeId: employeeId || '',
      position,
      department,
      location,
      startDate: new Date(startDate),
      assets: assets || [],
      additionalTerms: additionalTerms || '',
      generatedBy: req.user.full_name,
      generatedAt: new Date()
    });

    // Log document creation
    await executeQuery(
      'INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        'RESPONSIBILITY_LETTER_CREATED',
        'document',
        `letter_${Date.now()}`,
        JSON.stringify({ 
          employee_name: employeeName,
          position,
          department,
          location,
          document_path: documentPath
        }),
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        req.user.location
      ]
    );

    res.json({ 
      message: 'Responsibility letter created successfully',
      documentPath,
      downloadUrl: `/uploads/${documentPath.split('/').pop()}`
    });

  } catch (error) {
    console.error('Create responsibility letter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get responsibility letters by status
router.get('/responsibility-letters', async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    
    let whereClause = "WHERE al.action = 'RESPONSIBILITY_LETTER_CREATED'";
    if (status !== 'all') {
      whereClause += ` AND al.status = '${status}'`;
    }

    const letters = await executeQuery(`
      SELECT 
        al.id,
        al.created_at,
        al.details,
        al.location,
        al.status,
        u.full_name as created_by,
        u.username as created_by_username
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
    `);

    // Parse details
    const processedLetters = letters.map(letter => {
      try {
        const details = JSON.parse(letter.details);
        return {
          id: letter.id,
          employeeName: details.employeeName || details.employee_name,
          employeeId: details.employeeId,
          position: details.position,
          department: details.department,
          location: letter.location,
          status: letter.status || 'pending',
          startDate: details.startDate,
          assets: details.assets,
          additionalTerms: details.additionalTerms,
          created_at: letter.created_at,
          created_by: letter.created_by,
          document_path: details.documentPath || details.document_path
        };
      } catch (error) {
        return {
          id: letter.id,
          employeeName: 'N/A',
          position: 'N/A',
          department: 'N/A',
          location: letter.location,
          status: letter.status || 'pending',
          created_at: letter.created_at,
          created_by: letter.created_by,
          document_path: null
        };
      }
    });

    // Separate pending and sent letters
    const pendingLetters = processedLetters.filter(letter => letter.status === 'pending');
    const sentLetters = processedLetters.filter(letter => letter.status === 'sent');

    res.json({
      pendingLetters,
      sentLetters,
      total: processedLetters.length,
      pendingCount: pendingLetters.length,
      sentCount: sentLetters.length
    });

  } catch (error) {
    console.error('Get responsibility letters error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update letter status (mark as sent)
router.patch('/responsibility-letters/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'sent'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be pending or sent.' });
    }

    await executeQuery(
      'UPDATE audit_log SET status = ? WHERE id = ? AND action = ?',
      [status, id, 'RESPONSIBILITY_LETTER_CREATED']
    );

    res.json({ message: 'Letter status updated successfully' });

  } catch (error) {
    console.error('Update letter status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
