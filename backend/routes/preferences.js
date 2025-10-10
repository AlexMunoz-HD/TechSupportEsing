const express = require('express');
const { executeQuery } = require('../config/database');
const { verifyToken, logAudit } = require('../middleware/auth');

const router = express.Router();

// Apply middleware to all routes
router.use(verifyToken);
router.use(logAudit);

// Get user preferences
router.get('/', async (req, res) => {
  try {
    const preferences = await executeQuery(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [req.user.id]
    );

    if (preferences.length === 0) {
      // Create default preferences
      await executeQuery(
        'INSERT INTO user_preferences (user_id, theme, notifications, dashboard_layout, shortcuts) VALUES (?, ?, ?, ?, ?)',
        [
          req.user.id,
          'light',
          JSON.stringify({
            email: true,
            push: true,
            dashboard: true,
            assets: true,
            audit: false,
            responsibility: true
          }),
          JSON.stringify({
            widgets: [
              { id: 'stats', position: { x: 0, y: 0 }, size: { w: 4, h: 2 } },
              { id: 'chart', position: { x: 4, y: 0 }, size: { w: 4, h: 2 } },
              { id: 'activity', position: { x: 8, y: 0 }, size: { w: 4, h: 2 } },
              { id: 'newhires', position: { x: 0, y: 2 }, size: { w: 6, h: 3 } },
              { id: 'assignments', position: { x: 6, y: 2 }, size: { w: 6, h: 3 } }
            ]
          }),
          JSON.stringify({
            'Ctrl+K': 'focus_search',
            'Ctrl+N': 'new_asset',
            'Ctrl+A': 'audit_page',
            'Ctrl+R': 'responsibility_page',
            'Ctrl+D': 'dashboard_page',
            'Escape': 'close_modals'
          })
        ]
      );

      // Get the created preferences
      const newPreferences = await executeQuery(
        'SELECT * FROM user_preferences WHERE user_id = ?',
        [req.user.id]
      );
      
      return res.json({ preferences: newPreferences[0] });
    }

    res.json({ preferences: preferences[0] });

  } catch (error) {
    console.error('Get user preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user preferences
router.put('/preferences', async (req, res) => {
  try {
    const { theme, notifications, dashboard_layout, shortcuts } = req.body;

    const preferences = await executeQuery(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [req.user.id]
    );

    if (preferences.length === 0) {
      // Create new preferences
      await executeQuery(
        'INSERT INTO user_preferences (user_id, theme, notifications, dashboard_layout, shortcuts) VALUES (?, ?, ?, ?, ?)',
        [
          req.user.id,
          theme || 'light',
          JSON.stringify(notifications || {}),
          JSON.stringify(dashboard_layout || {}),
          JSON.stringify(shortcuts || {})
        ]
      );
    } else {
      // Update existing preferences
      await executeQuery(
        'UPDATE user_preferences SET theme = ?, notifications = ?, dashboard_layout = ?, shortcuts = ?, updated_at = NOW() WHERE user_id = ?',
        [
          theme || preferences[0].theme,
          JSON.stringify(notifications || JSON.parse(preferences[0].notifications)),
          JSON.stringify(dashboard_layout || JSON.parse(preferences[0].dashboard_layout)),
          JSON.stringify(shortcuts || JSON.parse(preferences[0].shortcuts)),
          req.user.id
        ]
      );
    }

    res.json({ message: 'Preferences updated successfully' });

  } catch (error) {
    console.error('Update user preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update theme
router.patch('/theme', async (req, res) => {
  try {
    const { theme } = req.body;

    if (!['light', 'dark', 'auto'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme. Must be light, dark, or auto' });
    }

    const preferences = await executeQuery(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [req.user.id]
    );

    if (preferences.length === 0) {
      await executeQuery(
        'INSERT INTO user_preferences (user_id, theme) VALUES (?, ?)',
        [req.user.id, theme]
      );
    } else {
      await executeQuery(
        'UPDATE user_preferences SET theme = ?, updated_at = NOW() WHERE user_id = ?',
        [theme, req.user.id]
      );
    }

    res.json({ message: 'Theme updated successfully', theme });

  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update notifications preferences
router.patch('/notifications', async (req, res) => {
  try {
    const { notifications } = req.body;

    const preferences = await executeQuery(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [req.user.id]
    );

    if (preferences.length === 0) {
      await executeQuery(
        'INSERT INTO user_preferences (user_id, notifications) VALUES (?, ?)',
        [req.user.id, JSON.stringify(notifications)]
      );
    } else {
      const currentNotifications = JSON.parse(preferences[0].notifications || '{}');
      const updatedNotifications = { ...currentNotifications, ...notifications };
      
      await executeQuery(
        'UPDATE user_preferences SET notifications = ?, updated_at = NOW() WHERE user_id = ?',
        [JSON.stringify(updatedNotifications), req.user.id]
      );
    }

    res.json({ message: 'Notification preferences updated successfully' });

  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update dashboard layout
router.patch('/dashboard-layout', async (req, res) => {
  try {
    const { dashboard_layout } = req.body;

    const preferences = await executeQuery(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [req.user.id]
    );

    if (preferences.length === 0) {
      await executeQuery(
        'INSERT INTO user_preferences (user_id, dashboard_layout) VALUES (?, ?)',
        [req.user.id, JSON.stringify(dashboard_layout)]
      );
    } else {
      await executeQuery(
        'UPDATE user_preferences SET dashboard_layout = ?, updated_at = NOW() WHERE user_id = ?',
        [JSON.stringify(dashboard_layout), req.user.id]
      );
    }

    res.json({ message: 'Dashboard layout updated successfully' });

  } catch (error) {
    console.error('Update dashboard layout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update shortcuts
router.patch('/shortcuts', async (req, res) => {
  try {
    const { shortcuts } = req.body;

    const preferences = await executeQuery(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [req.user.id]
    );

    if (preferences.length === 0) {
      await executeQuery(
        'INSERT INTO user_preferences (user_id, shortcuts) VALUES (?, ?)',
        [req.user.id, JSON.stringify(shortcuts)]
      );
    } else {
      const currentShortcuts = JSON.parse(preferences[0].shortcuts || '{}');
      const updatedShortcuts = { ...currentShortcuts, ...shortcuts };
      
      await executeQuery(
        'UPDATE user_preferences SET shortcuts = ?, updated_at = NOW() WHERE user_id = ?',
        [JSON.stringify(updatedShortcuts), req.user.id]
      );
    }

    res.json({ message: 'Shortcuts updated successfully' });

  } catch (error) {
    console.error('Update shortcuts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available themes
router.get('/themes', async (req, res) => {
  try {
    const themes = [
      {
        id: 'light',
        name: 'Light Mode',
        description: 'Clean and bright interface',
        preview: '/images/themes/light-preview.png'
      },
      {
        id: 'dark',
        name: 'Dark Mode',
        description: 'Easy on the eyes in low light',
        preview: '/images/themes/dark-preview.png'
      },
      {
        id: 'auto',
        name: 'Auto',
        description: 'Follows system preference',
        preview: '/images/themes/auto-preview.png'
      }
    ];

    res.json({ themes });

  } catch (error) {
    console.error('Get themes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get default shortcuts
router.get('/shortcuts/default', async (req, res) => {
  try {
    const defaultShortcuts = {
      'Ctrl+K': 'focus_search',
      'Ctrl+N': 'new_asset',
      'Ctrl+A': 'audit_page',
      'Ctrl+R': 'responsibility_page',
      'Ctrl+D': 'dashboard_page',
      'Ctrl+O': 'onboarding_page',
      'Ctrl+F': 'offboarding_page',
      'Escape': 'close_modals',
      'F1': 'help',
      'Ctrl+/': 'show_shortcuts'
    };

    res.json({ shortcuts: defaultShortcuts });

  } catch (error) {
    console.error('Get default shortcuts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
