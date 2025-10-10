const express = require('express');
const { executeQuery } = require('../config/database');
const { verifyToken, requireAuditor, logAudit } = require('../middleware/auth');

const router = express.Router();

// Apply middleware to all routes
router.use(verifyToken);
router.use(requireAuditor);
router.use(logAudit);

// Get all offboarding processes
router.get('/', async (req, res) => {
  try {
    // Mock data for demonstration
    const mockProcesses = [
      {
        id: 1,
        employee_name: 'Carlos Mendoza',
        email: 'carlos.mendoza@company.com',
        position: 'Senior Developer',
        department: 'IT',
        location: 'MX',
        status: 'in_progress',
        end_date: '2024-02-15',
        progress: 65,
        created_at: '2024-01-10T09:00:00Z',
        reason: 'Resignation'
      },
      {
        id: 2,
        employee_name: 'Ana Rodríguez',
        email: 'ana.rodriguez@company.com',
        position: 'HR Manager',
        department: 'HR',
        location: 'CL',
        status: 'pending',
        end_date: '2024-02-20',
        progress: 0,
        created_at: '2024-01-12T14:30:00Z',
        reason: 'End of Contract'
      },
      {
        id: 3,
        employee_name: 'Miguel Torres',
        email: 'miguel.torres@company.com',
        position: 'Sales Director',
        department: 'Sales',
        location: 'MX',
        status: 'completed',
        end_date: '2024-01-30',
        progress: 100,
        created_at: '2024-01-05T11:15:00Z',
        reason: 'Retirement'
      },
      {
        id: 4,
        employee_name: 'Laura Jiménez',
        email: 'laura.jimenez@company.com',
        position: 'Finance Analyst',
        department: 'Finance',
        location: 'REMOTO',
        status: 'in_progress',
        end_date: '2024-02-25',
        progress: 40,
        created_at: '2024-01-15T16:45:00Z',
        reason: 'Resignation'
      },
      {
        id: 5,
        employee_name: 'Roberto Silva',
        email: 'roberto.silva@company.com',
        position: 'Operations Manager',
        department: 'Operations',
        location: 'CL',
        status: 'pending',
        end_date: '2024-03-01',
        progress: 0,
        created_at: '2024-01-18T10:20:00Z',
        reason: 'Termination'
      }
    ];

    res.json({ processes: mockProcesses });
  } catch (error) {
    console.error('Get offboarding processes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get offboarding templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await executeQuery(`
      SELECT * FROM offboarding_templates 
      WHERE is_active = true 
      ORDER BY name
    `);

    res.json({ templates });
  } catch (error) {
    console.error('Get offboarding templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create offboarding template
router.post('/templates', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      steps, 
      department, 
      position_level,
      auto_return_assets,
      data_retention_days
    } = req.body;

    if (!name || !steps || !Array.isArray(steps)) {
      return res.status(400).json({ 
        error: 'Name and steps are required' 
      });
    }

    const result = await executeQuery(
      'INSERT INTO offboarding_templates (name, description, steps, department, position_level, auto_return_assets, data_retention_days, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        description || '',
        JSON.stringify(steps),
        department || null,
        position_level || null,
        auto_return_assets || true,
        data_retention_days || 30,
        req.user.id
      ]
    );

    res.json({ 
      message: 'Offboarding template created successfully',
      templateId: result.insertId
    });

  } catch (error) {
    console.error('Create offboarding template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start offboarding process for employee
router.post('/start', async (req, res) => {
  try {
    const { 
      employeeId, 
      lastWorkingDay, 
      reason, 
      templateId,
      customSteps,
      returnAssets,
      dataRetentionDays
    } = req.body;

    if (!employeeId || !lastWorkingDay) {
      return res.status(400).json({ 
        error: 'Employee ID and last working day are required' 
      });
    }

    // Get employee information
    const employees = await executeQuery(
      'SELECT * FROM users WHERE id = ?',
      [employeeId]
    );

    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = employees[0];

    // Get template if provided
    let template = null;
    if (templateId) {
      const templates = await executeQuery(
        'SELECT * FROM offboarding_templates WHERE id = ?',
        [templateId]
      );
      template = templates[0];
    }

    // Create offboarding process
    const processResult = await executeQuery(
      'INSERT INTO offboarding_processes (employee_id, employee_name, last_working_day, reason, template_id, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        employeeId,
        employee.full_name,
        lastWorkingDay,
        reason || 'Resignation',
        templateId || null,
        'in_progress',
        req.user.id
      ]
    );

    const processId = processResult.insertId;

    // Create steps based on template or custom steps
    let steps = [];
    if (template) {
      steps = JSON.parse(template.steps);
    } else if (customSteps) {
      steps = customSteps;
    } else {
      // Default steps
      steps = [
        { name: 'Return company assets', description: 'Collect all assigned equipment', completed: false, due_date: lastWorkingDay },
        { name: 'Revoke system access', description: 'Disable user accounts and access', completed: false, due_date: lastWorkingDay },
        { name: 'Data backup and transfer', description: 'Backup and transfer work data', completed: false, due_date: lastWorkingDay },
        { name: 'Exit interview', description: 'Conduct exit interview', completed: false, due_date: lastWorkingDay },
        { name: 'Final paperwork', description: 'Complete final documentation', completed: false, due_date: lastWorkingDay }
      ];
    }

    // Insert steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await executeQuery(
        'INSERT INTO offboarding_steps (process_id, step_name, description, step_order, due_date, status, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          processId,
          step.name,
          step.description || '',
          i + 1,
          step.due_date || lastWorkingDay,
          'pending',
          step.assigned_to || req.user.id
        ]
      );
    }

    // Auto-return assets if specified
    if (returnAssets !== false) {
      const assignedAssets = await executeQuery(
        'SELECT aa.*, a.name as asset_name, a.asset_tag FROM asset_assignments aa JOIN assets a ON aa.asset_id = a.id WHERE aa.user_id = ? AND aa.return_date IS NULL',
        [employeeId]
      );

      for (const assignment of assignedAssets) {
        // Return asset
        await executeQuery(
          'UPDATE asset_assignments SET return_date = NOW(), return_notes = ? WHERE id = ?',
          [`Returned during offboarding process for ${employee.full_name}`, assignment.id]
        );

        // Update asset status
        await executeQuery(
          'UPDATE assets SET status = "available" WHERE id = ?',
          [assignment.asset_id]
        );

        // Log the return
        await executeQuery(
          'INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            req.user.id,
            'ASSET_RETURNED',
            'asset',
            assignment.asset_id,
            JSON.stringify({ 
              asset_name: assignment.asset_name,
              asset_tag: assignment.asset_tag,
              returned_by: employee.full_name,
              reason: 'Offboarding process'
            }),
            req.ip || req.connection.remoteAddress,
            req.get('User-Agent'),
            req.user.location
          ]
        );
      }
    }

    // Schedule data retention cleanup
    const retentionDays = dataRetentionDays || (template ? template.data_retention_days : 30);
    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() + parseInt(retentionDays));

    await executeQuery(
      'INSERT INTO data_retention_schedule (employee_id, cleanup_date, status, created_by) VALUES (?, ?, ?, ?)',
      [employeeId, cleanupDate, 'scheduled', req.user.id]
    );

    res.json({ 
      message: 'Offboarding process started successfully',
      processId,
      steps: steps.length,
      assetsReturned: returnAssets !== false ? assignedAssets.length : 0
    });

  } catch (error) {
    console.error('Start offboarding process error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get offboarding processes
router.get('/processes', async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status !== 'all') {
      whereClause += ' AND op.status = ?';
      params.push(status);
    }

    // Get total count
    const countResult = await executeQuery(`
      SELECT COUNT(*) as total 
      FROM offboarding_processes op
      ${whereClause}
    `, params);

    // Get processes
    const processes = await executeQuery(`
      SELECT 
        op.*,
        u.full_name as created_by_name,
        e.full_name as employee_name
      FROM offboarding_processes op
      LEFT JOIN users u ON op.created_by = u.id
      LEFT JOIN users e ON op.employee_id = e.id
      ${whereClause}
      ORDER BY op.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Get steps for each process
    for (const process of processes) {
      const steps = await executeQuery(
        'SELECT * FROM offboarding_steps WHERE process_id = ? ORDER BY step_order',
        [process.id]
      );
      process.steps = steps;
      process.completed_steps = steps.filter(s => s.status === 'completed').length;
      process.total_steps = steps.length;
      process.progress = process.total_steps > 0 ? (process.completed_steps / process.total_steps) * 100 : 0;
    }

    res.json({
      processes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get offboarding processes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update offboarding step
router.patch('/steps/:stepId', async (req, res) => {
  try {
    const { stepId } = req.params;
    const { status, notes, completed_at } = req.body;

    if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await executeQuery(
      'UPDATE offboarding_steps SET status = ?, notes = ?, completed_at = ? WHERE id = ?',
      [
        status,
        notes || null,
        status === 'completed' ? (completed_at || new Date()) : null,
        stepId
      ]
    );

    // Check if all steps are completed
    const steps = await executeQuery(
      'SELECT status FROM offboarding_steps WHERE process_id = (SELECT process_id FROM offboarding_steps WHERE id = ?)',
      [stepId]
    );

    const allCompleted = steps.every(step => step.status === 'completed');
    if (allCompleted) {
      await executeQuery(
        'UPDATE offboarding_processes SET status = "completed", completed_at = NOW() WHERE id = (SELECT process_id FROM offboarding_steps WHERE id = ?)',
        [stepId]
      );
    }

    res.json({ message: 'Step updated successfully' });

  } catch (error) {
    console.error('Update offboarding step error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee assets for offboarding
router.get('/employee/:employeeId/assets', async (req, res) => {
  try {
    const { employeeId } = req.params;

    const assets = await executeQuery(`
      SELECT 
        aa.*,
        a.name as asset_name,
        a.asset_tag,
        a.category,
        a.location
      FROM asset_assignments aa
      JOIN assets a ON aa.asset_id = a.id
      WHERE aa.user_id = ? AND aa.return_date IS NULL
    `, [employeeId]);

    res.json({ assets });

  } catch (error) {
    console.error('Get employee assets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employees from Jira via N8N
router.get('/jira-employees', async (req, res) => {
  try {
    // This endpoint will receive data from N8N webhook
    // For now, we'll return mock data structure
    const mockEmployees = [
      {
        id: 'jira-001',
        name: 'Juan Pérez',
        email: 'juan.perez@company.com',
        department: 'IT',
        position: 'Software Developer',
        lastWorkingDay: '2024-02-15',
        reason: 'Resignation',
        jiraTicket: 'OFF-2024-001',
        status: 'pending_offboarding'
      },
      {
        id: 'jira-002', 
        name: 'María García',
        email: 'maria.garcia@company.com',
        department: 'HR',
        position: 'HR Specialist',
        lastWorkingDay: '2024-02-20',
        reason: 'End of Contract',
        jiraTicket: 'OFF-2024-002',
        status: 'pending_offboarding'
      },
      {
        id: 'jira-003',
        name: 'Pedro López',
        email: 'pedro.lopez@company.com',
        department: 'Sales',
        position: 'Account Manager',
        lastWorkingDay: '2024-02-25',
        reason: 'Resignation',
        jiraTicket: 'OFF-2024-003',
        status: 'pending_offboarding'
      },
      {
        id: 'jira-004',
        name: 'Sofia Martínez',
        email: 'sofia.martinez@company.com',
        department: 'Finance',
        position: 'Financial Analyst',
        lastWorkingDay: '2024-03-01',
        reason: 'Termination',
        jiraTicket: 'OFF-2024-004',
        status: 'pending_offboarding'
      },
      {
        id: 'jira-005',
        name: 'Diego Herrera',
        email: 'diego.herrera@company.com',
        department: 'Operations',
        position: 'Operations Coordinator',
        lastWorkingDay: '2024-03-05',
        reason: 'End of Contract',
        jiraTicket: 'OFF-2024-005',
        status: 'pending_offboarding'
      },
      {
        id: 'jira-006',
        name: 'Carmen Vega',
        email: 'carmen.vega@company.com',
        department: 'IT',
        position: 'DevOps Engineer',
        lastWorkingDay: '2024-03-10',
        reason: 'Resignation',
        jiraTicket: 'OFF-2024-006',
        status: 'pending_offboarding'
      }
    ];

    res.json({ 
      employees: mockEmployees,
      message: 'Employees retrieved from Jira successfully'
    });

  } catch (error) {
    console.error('Get Jira employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create exit letter for employee
router.post('/create-exit-letter', async (req, res) => {
  try {
    const { 
      employeeId, 
      employeeName, 
      email, 
      department, 
      position, 
      lastWorkingDay, 
      reason,
      jiraTicket 
    } = req.body;

    if (!employeeId || !employeeName || !lastWorkingDay) {
      return res.status(400).json({ 
        error: 'Employee ID, name and last working day are required' 
      });
    }

    // Get employee assets from Snipe IT (mock for now)
    const employeeAssets = [
      {
        asset_tag: 'LAPTOP-001',
        name: 'MacBook Pro 16"',
        category: 'Laptop',
        assigned_date: '2023-01-15',
        location: 'Mexico City'
      },
      {
        asset_tag: 'MOUSE-001', 
        name: 'Wireless Mouse',
        category: 'Peripheral',
        assigned_date: '2023-01-15',
        location: 'Mexico City'
      }
    ];

    // Prepare data for N8N webhook
    const exitLetterData = {
      employee: {
        id: employeeId,
        name: employeeName,
        email: email,
        department: department,
        position: position,
        lastWorkingDay: lastWorkingDay,
        reason: reason,
        jiraTicket: jiraTicket
      },
      assets: employeeAssets,
      timestamp: new Date().toISOString(),
      requestedBy: req.user.id,
      requestedByName: req.user.full_name || req.user.username
    };

    // Send to N8N webhook (mock for now)
    // In real implementation, this would be an HTTP request to N8N
    console.log('Sending exit letter data to N8N:', exitLetterData);

    // Mock response from N8N
    const n8nResponse = {
      success: true,
      documentId: `EXIT-${employeeId}-${Date.now()}`,
      hibobDocumentId: `HIBOB-${employeeId}-${Date.now()}`,
      message: 'Exit letter created and sent to Hibob eSign successfully'
    };

    // Log the action
    await executeQuery(
      'INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        'EXIT_LETTER_CREATED',
        'employee',
        employeeId,
        JSON.stringify({
          employee_name: employeeName,
          jira_ticket: jiraTicket,
          document_id: n8nResponse.documentId,
          hibob_document_id: n8nResponse.hibobDocumentId
        }),
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent'),
        req.user.location
      ]
    );

    res.json({
      message: 'Exit letter created successfully',
      documentId: n8nResponse.documentId,
      hibobDocumentId: n8nResponse.hibobDocumentId,
      assets: employeeAssets
    });

  } catch (error) {
    console.error('Create exit letter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
