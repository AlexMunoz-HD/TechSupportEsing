const express = require('express');
const { executeQuery } = require('../config/database');
const { verifyToken, requireAuditor, logAudit } = require('../middleware/auth');
const { generateResponsibilityLetter } = require('../utils/documentGenerator');

const router = express.Router();

// Apply middleware to all routes
router.use(verifyToken);
router.use(requireAuditor);
router.use(logAudit);

// Get all onboarding processes
router.get('/', async (req, res) => {
  try {
    // Mock data for demonstration
    const mockProcesses = [
      {
        id: 1,
        employee_name: 'Sofia Martínez',
        email: 'sofia.martinez@company.com',
        position: 'Financial Analyst',
        department: 'Finance',
        location: 'CL',
        status: 'in_progress',
        start_date: '2024-01-15',
        progress: 75,
        created_at: '2024-01-10T09:00:00Z',
        manager: 'Roberto Silva'
      },
      {
        id: 2,
        employee_name: 'Diego Herrera',
        email: 'diego.herrera@company.com',
        position: 'Operations Coordinator',
        department: 'Operations',
        location: 'MX',
        status: 'pending',
        start_date: '2024-02-01',
        progress: 0,
        created_at: '2024-01-18T14:30:00Z',
        manager: 'Laura Jiménez'
      },
      {
        id: 3,
        employee_name: 'Carmen Vega',
        email: 'carmen.vega@company.com',
        position: 'DevOps Engineer',
        department: 'IT',
        location: 'REMOTO',
        status: 'completed',
        start_date: '2024-01-05',
        progress: 100,
        created_at: '2024-01-02T11:15:00Z',
        manager: 'Carlos Mendoza'
      },
      {
        id: 4,
        employee_name: 'Alejandro Ramírez',
        email: 'alejandro.ramirez@company.com',
        position: 'Software Developer',
        department: 'IT',
        location: 'MX',
        status: 'in_progress',
        start_date: '2024-01-20',
        progress: 50,
        created_at: '2024-01-15T16:45:00Z',
        manager: 'Juan Pérez'
      },
      {
        id: 5,
        employee_name: 'Valentina Torres',
        email: 'valentina.torres@company.com',
        position: 'Marketing Specialist',
        department: 'Marketing',
        location: 'CL',
        status: 'pending',
        start_date: '2024-02-10',
        progress: 0,
        created_at: '2024-01-20T10:20:00Z',
        manager: 'Pedro López'
      }
    ];

    res.json({ processes: mockProcesses });
  } catch (error) {
    console.error('Get onboarding processes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get onboarding templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await executeQuery(`
      SELECT * FROM onboarding_templates 
      WHERE is_active = true 
      ORDER BY name
    `);

    res.json({ templates });
  } catch (error) {
    console.error('Get onboarding templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create onboarding template
router.post('/templates', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      steps, 
      department, 
      location, 
      position_level,
      auto_assign_assets,
      default_assets
    } = req.body;

    if (!name || !steps || !Array.isArray(steps)) {
      return res.status(400).json({ 
        error: 'Name and steps are required' 
      });
    }

    const result = await executeQuery(
      'INSERT INTO onboarding_templates (name, description, steps, department, location, position_level, auto_assign_assets, default_assets, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        description || '',
        JSON.stringify(steps),
        department || null,
        location || null,
        position_level || null,
        auto_assign_assets || false,
        JSON.stringify(default_assets || []),
        req.user.id
      ]
    );

    res.json({ 
      message: 'Onboarding template created successfully',
      templateId: result.insertId
    });

  } catch (error) {
    console.error('Create onboarding template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start onboarding process for new employee
router.post('/start', async (req, res) => {
  try {
    const { 
      employeeName, 
      employeeId, 
      email, 
      position, 
      department, 
      location, 
      startDate,
      managerId,
      templateId,
      customSteps
    } = req.body;

    if (!employeeName || !position || !department || !location || !startDate) {
      return res.status(400).json({ 
        error: 'Employee name, position, department, location, and start date are required' 
      });
    }

    // Get template if provided
    let template = null;
    if (templateId) {
      const templates = await executeQuery(
        'SELECT * FROM onboarding_templates WHERE id = ?',
        [templateId]
      );
      template = templates[0];
    }

    // Create onboarding process
    const processResult = await executeQuery(
      'INSERT INTO onboarding_processes (employee_name, employee_id, email, position, department, location, start_date, manager_id, template_id, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        employeeName,
        employeeId || null,
        email || null,
        position,
        department,
        location,
        startDate,
        managerId || null,
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
        { name: 'Create user account', description: 'Set up system access', completed: false, due_date: startDate },
        { name: 'Generate responsibility letter', description: 'Create and send responsibility letter', completed: false, due_date: startDate },
        { name: 'Assign assets', description: 'Assign required equipment', completed: false, due_date: startDate },
        { name: 'Setup workspace', description: 'Configure workspace and tools', completed: false, due_date: startDate },
        { name: 'Training completion', description: 'Complete required training', completed: false, due_date: startDate }
      ];
    }

    // Insert steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await executeQuery(
        'INSERT INTO onboarding_steps (process_id, step_name, description, step_order, due_date, status, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          processId,
          step.name,
          step.description || '',
          i + 1,
          step.due_date || startDate,
          'pending',
          step.assigned_to || req.user.id
        ]
      );
    }

    // Auto-assign assets if template specifies
    if (template && template.auto_assign_assets && template.default_assets) {
      const defaultAssets = JSON.parse(template.default_assets);
      for (const asset of defaultAssets) {
        // Find available asset of this type
        const availableAssets = await executeQuery(
          'SELECT * FROM assets WHERE category = ? AND status = "available" AND location = ? LIMIT 1',
          [asset.category, location]
        );

        if (availableAssets.length > 0) {
          const assetToAssign = availableAssets[0];
          
          // Assign asset
          await executeQuery(
            'INSERT INTO asset_assignments (asset_id, user_id, assigned_by, assignment_date, notes) VALUES (?, ?, ?, ?, ?)',
            [
              assetToAssign.id,
              null, // Will be updated when user account is created
              req.user.id,
              new Date(),
              `Auto-assigned during onboarding for ${employeeName}`
            ]
          );

          // Update asset status
          await executeQuery(
            'UPDATE assets SET status = "assigned" WHERE id = ?',
            [assetToAssign.id]
          );
        }
      }
    }

    // Generate responsibility letter automatically
    try {
      const documentPath = await generateResponsibilityLetter({
        employeeName,
        employeeId: employeeId || '',
        position,
        department,
        location,
        startDate: new Date(startDate),
        assets: template ? JSON.parse(template.default_assets || '[]') : [],
        additionalTerms: '',
        generatedBy: req.user.full_name,
        generatedAt: new Date()
      });

      // Update the responsibility letter step
      await executeQuery(
        'UPDATE onboarding_steps SET status = "completed", completed_at = NOW(), notes = ? WHERE process_id = ? AND step_name = "Generate responsibility letter"',
        [`Document generated: ${documentPath}`, processId]
      );
    } catch (error) {
      console.error('Error generating responsibility letter:', error);
    }

    res.json({ 
      message: 'Onboarding process started successfully',
      processId,
      steps: steps.length
    });

  } catch (error) {
    console.error('Start onboarding process error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get onboarding processes
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
      FROM onboarding_processes op
      ${whereClause}
    `, params);

    // Get processes
    const processes = await executeQuery(`
      SELECT 
        op.*,
        u.full_name as created_by_name,
        m.full_name as manager_name
      FROM onboarding_processes op
      LEFT JOIN users u ON op.created_by = u.id
      LEFT JOIN users m ON op.manager_id = m.id
      ${whereClause}
      ORDER BY op.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Get steps for each process
    for (const process of processes) {
      const steps = await executeQuery(
        'SELECT * FROM onboarding_steps WHERE process_id = ? ORDER BY step_order',
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
    console.error('Get onboarding processes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update onboarding step
router.patch('/steps/:stepId', async (req, res) => {
  try {
    const { stepId } = req.params;
    const { status, notes, completed_at } = req.body;

    if (!['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await executeQuery(
      'UPDATE onboarding_steps SET status = ?, notes = ?, completed_at = ? WHERE id = ?',
      [
        status,
        notes || null,
        status === 'completed' ? (completed_at || new Date()) : null,
        stepId
      ]
    );

    // Check if all steps are completed
    const steps = await executeQuery(
      'SELECT status FROM onboarding_steps WHERE process_id = (SELECT process_id FROM onboarding_steps WHERE id = ?)',
      [stepId]
    );

    const allCompleted = steps.every(step => step.status === 'completed');
    if (allCompleted) {
      await executeQuery(
        'UPDATE onboarding_processes SET status = "completed", completed_at = NOW() WHERE id = (SELECT process_id FROM onboarding_steps WHERE id = ?)',
        [stepId]
      );
    }

    res.json({ message: 'Step updated successfully' });

  } catch (error) {
    console.error('Update onboarding step error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
