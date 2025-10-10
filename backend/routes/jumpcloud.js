const express = require('express');
const axios = require('axios');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply middleware to all routes
router.use(verifyToken);
router.use(requireAdmin);

// JumpCloud API configuration
const JUMPCLOUD_API_BASE = 'https://console.jumpcloud.com/api';
const JUMPCLOUD_API_KEY = process.env.JUMPCLOUD_API_KEY || 'jca_8j2iX9AkqTgQzwwyqtTfV1rN69N4m1NF3Mii';

// Check if API key is valid format
function isValidApiKeyFormat(apiKey) {
    // JumpCloud API keys typically start with 'jca_' and are 40+ characters
    return apiKey && apiKey.startsWith('jca_') && apiKey.length >= 40;
}

// Helper function to make JumpCloud API requests
async function makeJumpCloudRequest(endpoint, params = {}) {
  try {
    console.log(`Making request to: ${JUMPCLOUD_API_BASE}${endpoint}`);
    console.log(`Using API key: ${JUMPCLOUD_API_KEY.substring(0, 10)}...`);
    
    const response = await axios.get(`${JUMPCLOUD_API_BASE}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'x-api-key': JUMPCLOUD_API_KEY,
        'Content-Type': 'application/json'
      },
      params,
      timeout: 10000 // 10 second timeout
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response data type: ${typeof response.data}`);
    console.log(`Response data length: ${Array.isArray(response.data) ? response.data.length : 'not array'}`);
    return response.data;
  } catch (error) {
    console.error('JumpCloud API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(`JumpCloud API Error: ${error.response?.statusText || error.message}`);
  }
}

// Test endpoint to verify JumpCloud connectivity
router.get('/test', async (req, res) => {
  try {
    // Try to get system users
    const systemUsers = await makeJumpCloudRequest('/systemusers');
    res.json({
      message: 'JumpCloud API connection successful',
      totalUsers: systemUsers.totalCount || (systemUsers.results ? systemUsers.results.length : 0),
      sampleUser: systemUsers.results && systemUsers.results.length > 0 ? {
        id: systemUsers.results[0].id,
        username: systemUsers.results[0].username,
        email: systemUsers.results[0].email,
        displayname: systemUsers.results[0].displayname
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'JumpCloud API connection failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Configuration check endpoint
router.get('/config', async (req, res) => {
  const isApiKeyFormatValid = isValidApiKeyFormat(JUMPCLOUD_API_KEY);
  
  res.json({
    apiKeyConfigured: !!JUMPCLOUD_API_KEY,
    apiKeyFormat: isApiKeyFormatValid ? 'valid' : 'invalid',
    apiKeyPreview: JUMPCLOUD_API_KEY ? `${JUMPCLOUD_API_KEY.substring(0, 10)}...` : 'Not configured',
    baseUrl: JUMPCLOUD_API_BASE,
    timestamp: new Date().toISOString(),
    troubleshooting: {
      steps: [
        '1. Go to JumpCloud Console → Settings → API Key Management',
        '2. Generate a new API key with "Read Users" permissions',
        '3. Set JUMPCLOUD_API_KEY environment variable',
        '4. Restart the backend service'
      ]
    }
  });
});

// Get total users count from JumpCloud
router.get('/users/count', async (req, res) => {
  try {
    // Try to get real data from JumpCloud
    const usersData = await makeJumpCloudRequest('/systemusers');
    const totalUsers = usersData.totalCount || (usersData.results ? usersData.results.length : 0);
    
    res.json({
      totalUsers,
      source: 'JumpCloud',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching users count from JumpCloud:', error);
    
    // Determine the specific issue with the API key
    let errorMessage = 'API connection failed';
    let sourceLabel = 'JumpCloud (Error)';
    
    if (error.message.includes('Not Found')) {
      errorMessage = 'API key is invalid or has no permissions';
      sourceLabel = 'JumpCloud (API Key Invalid)';
    } else if (error.message.includes('Unauthorized')) {
      errorMessage = 'API key is unauthorized';
      sourceLabel = 'JumpCloud (Unauthorized)';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'API request timed out';
      sourceLabel = 'JumpCloud (Timeout)';
    }
    
    // Check if API key format is valid
    const isApiKeyFormatValid = isValidApiKeyFormat(JUMPCLOUD_API_KEY);
    if (!isApiKeyFormatValid) {
      errorMessage = 'API key format is invalid (should start with jca_ and be 40+ characters)';
      sourceLabel = 'JumpCloud (Invalid Format)';
    }
    
    // Fallback to simulated data when API is not available
    const simulatedUsers = [
      { id: 1, username: 'john.doe', email: 'john.doe@company.com', active: true },
      { id: 2, username: 'jane.smith', email: 'jane.smith@company.com', active: true },
      { id: 3, username: 'mike.johnson', email: 'mike.johnson@company.com', active: true },
      { id: 4, username: 'sarah.wilson', email: 'sarah.wilson@company.com', active: true },
      { id: 5, username: 'david.brown', email: 'david.brown@company.com', active: true },
      { id: 6, username: 'lisa.garcia', email: 'lisa.garcia@company.com', active: true },
      { id: 7, username: 'robert.miller', email: 'robert.miller@company.com', active: true },
      { id: 8, username: 'emily.davis', email: 'emily.davis@company.com', active: true },
      { id: 9, username: 'alex.munoz', email: 'alex.munoz@xepelin.com', active: true },
      { id: 10, username: 'maria.rodriguez', email: 'maria.rodriguez@company.com', active: true }
    ];
    
    res.json({
      totalUsers: simulatedUsers.length,
      source: sourceLabel,
      lastUpdated: new Date().toISOString(),
      note: `Using simulated data. ${errorMessage}. Please check JumpCloud API configuration.`,
      error: errorMessage,
      apiKeyFormat: isApiKeyFormatValid ? 'valid' : 'invalid',
      troubleshooting: {
        steps: [
          '1. Verify API key is valid in JumpCloud console',
          '2. Check API key has "Read Users" permissions',
          '3. Ensure API key format starts with "jca_" and is 40+ characters',
          '4. Test API key directly with curl or Postman'
        ]
      }
    });
  }
});

// Get users list from JumpCloud
router.get('/users', async (req, res) => {
  try {
    const { limit = 100, skip = 0, sort = 'username' } = req.query;
    
    const usersData = await makeJumpCloudRequest('/users', {
      limit: parseInt(limit),
      skip: parseInt(skip),
      sort: sort
    });
    
    // Transform the data to match our expected format
    const users = usersData.results.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstname,
      lastName: user.lastname,
      fullName: `${user.firstname || ''} ${user.lastname || ''}`.trim(),
      active: user.activated,
      created: user.created,
      lastLogin: user.lastLogin,
      department: user.department,
      location: user.location,
      phoneNumber: user.phoneNumber,
      employeeIdentifier: user.employeeIdentifier
    }));
    
    res.json({
      users,
      totalCount: usersData.totalCount || users.length,
      source: 'JumpCloud',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching users from JumpCloud:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users from JumpCloud',
      details: error.message 
    });
  }
});

// Get user details by ID from JumpCloud
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await makeJumpCloudRequest(`/users/${id}`);
    
    const user = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      firstName: userData.firstname,
      lastName: userData.lastname,
      fullName: `${userData.firstname || ''} ${userData.lastname || ''}`.trim(),
      active: userData.activated,
      created: userData.created,
      lastLogin: userData.lastLogin,
      department: userData.department,
      location: userData.location,
      phoneNumber: userData.phoneNumber,
      employeeIdentifier: userData.employeeIdentifier
    };
    
    res.json({
      user,
      source: 'JumpCloud',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user from JumpCloud:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user from JumpCloud',
      details: error.message 
    });
  }
});

// Get system statistics from JumpCloud
router.get('/stats', async (req, res) => {
  try {
    // Get users count
    const usersData = await makeJumpCloudRequest('/users');
    const totalUsers = usersData.results ? usersData.results.length : 0;
    
    // Get active users (you might need to filter based on your criteria)
    const activeUsers = usersData.results ? 
      usersData.results.filter(user => user.activated).length : 0;
    
    res.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      source: 'JumpCloud',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats from JumpCloud:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats from JumpCloud',
      details: error.message 
    });
  }
});

// Get systems/devices from JumpCloud
router.get('/systems', async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;
    
    const systemsData = await makeJumpCloudRequest('/systems', {
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
    
    // Transform the data to match our expected format
    const systems = systemsData.results.map(system => ({
      id: system._id,
      hostname: system.hostname,
      os: system.os,
      osFamily: system.osFamily,
      version: system.version,
      arch: system.arch,
      lastContact: system.lastContact,
      created: system.created,
      organization: system.organization,
      networkInterfaces: system.networkInterfaces,
      status: system.lastContact ? 'online' : 'offline'
    }));
    
    res.json({
      systems,
      totalCount: systemsData.totalCount || systems.length,
      source: 'JumpCloud',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching systems from JumpCloud:', error);
    res.status(500).json({ 
      error: 'Failed to fetch systems from JumpCloud',
      details: error.message 
    });
  }
});

// Get systems count from JumpCloud
router.get('/systems/count', async (req, res) => {
  try {
    const systemsData = await makeJumpCloudRequest('/systems');
    const totalSystems = systemsData.totalCount || (systemsData.results ? systemsData.results.length : 0);
    
    res.json({
      totalSystems,
      source: 'JumpCloud',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching systems count from JumpCloud:', error);
    
    // Fallback to simulated data when API is not available
    const simulatedSystems = [
      { id: 1, hostname: 'macbook-pro-001', os: 'Mac OS X', status: 'online' },
      { id: 2, hostname: 'dell-laptop-002', os: 'Windows 11', status: 'online' },
      { id: 3, hostname: 'macbook-air-003', os: 'Mac OS X', status: 'offline' },
      { id: 4, hostname: 'thinkpad-004', os: 'Windows 11', status: 'online' },
      { id: 5, hostname: 'surface-pro-005', os: 'Windows 11', status: 'online' }
    ];
    
    res.json({
      totalSystems: simulatedSystems.length,
      source: 'JumpCloud (Simulated - API Error)',
      lastUpdated: new Date().toISOString(),
      note: 'Using simulated data due to API error',
      error: error.message
    });
  }
});

// Get system details by ID from JumpCloud
router.get('/systems/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const systemData = await makeJumpCloudRequest(`/systems/${id}`);
    
    const system = {
      id: systemData._id,
      hostname: systemData.hostname,
      os: systemData.os,
      osFamily: systemData.osFamily,
      version: systemData.version,
      arch: systemData.arch,
      lastContact: systemData.lastContact,
      created: systemData.created,
      organization: systemData.organization,
      networkInterfaces: systemData.networkInterfaces,
      status: systemData.lastContact ? 'online' : 'offline'
    };
    
    res.json({
      system,
      source: 'JumpCloud',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching system from JumpCloud:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system from JumpCloud',
      details: error.message 
    });
  }
});

// Get system groups from JumpCloud
router.get('/groups', async (req, res) => {
  try {
    const groupsData = await makeJumpCloudRequest('/v2/groups', { limit: 100 });
    
    // Filter groups by specific location groups
    const targetGroups = [
      'CL-ALL LAPTOPS DEVICES',
      'MX-ALL LAPTOPS DEVICES', 
      'RM-ALL DEVICES'
    ];
    
    const locationGroups = groupsData.filter(group => 
      targetGroups.includes(group.name)
    );
    
    res.json({
      groups: locationGroups,
      totalGroups: locationGroups.length,
      source: 'JumpCloud',
      lastUpdated: new Date().toISOString(),
      debug: {
        allGroups: groupsData.map(g => ({ name: g.name, type: g.type })),
        targetGroups: targetGroups
      }
    });
  } catch (error) {
    console.error('Error fetching groups from JumpCloud:', error);
    res.status(500).json({ 
      error: 'Failed to fetch groups from JumpCloud',
      details: error.message 
    });
  }
});

// Get device counts by location groups
router.get('/groups/counts', async (req, res) => {
  try {
    // Get all groups
    const groupsData = await makeJumpCloudRequest('/v2/groups', { limit: 100 });
    
    console.log('All available groups:', groupsData.map(g => g.name));
    
    // Define target groups with their display names
    const targetGroups = [
      { name: 'CL-ALL LAPTOPS DEVICES', displayName: 'Chile (CL)', shortName: 'CL' },
      { name: 'MX-ALL LAPTOPS DEVICES', displayName: 'México (MX)', shortName: 'MX' },
      { name: 'RM-ALL DEVICES', displayName: 'Remoto (RM)', shortName: 'RM' }
    ];
    
    // Filter and map groups
    const groupCounts = [];
    
    for (const targetGroup of targetGroups) {
      const group = groupsData.find(g => g.name === targetGroup.name);
      console.log(`Looking for group: ${targetGroup.name}, found:`, group ? 'YES' : 'NO');
      
      if (group) {
        // Get the actual device count for this group
        try {
          const membersData = await makeJumpCloudRequest(`/v2/systemgroups/${group.id}/members`, { limit: 100 });
          const actualCount = membersData.length;
          
          console.log(`Group ${targetGroup.name} has ${actualCount} devices`);
          
          groupCounts.push({
            id: group.id,
            name: targetGroup.displayName,
            shortName: targetGroup.shortName,
            originalName: group.name,
            count: actualCount,
            realData: true
          });
        } catch (memberError) {
          console.error(`Error getting members for group ${targetGroup.name}:`, memberError);
          // Fallback to a placeholder count if we can't get the real count
          groupCounts.push({
            id: group.id,
            name: targetGroup.displayName,
            shortName: targetGroup.shortName,
            originalName: group.name,
            count: 0,
            realData: false,
            error: memberError.message
          });
        }
      }
    }
    
    // If we don't have all groups, add simulated ones for missing groups
    const foundGroupNames = groupCounts.map(g => g.originalName);
    const missingGroups = targetGroups.filter(tg => !foundGroupNames.includes(tg.name));
    
    console.log('Missing groups:', missingGroups.map(g => g.name));
    
    missingGroups.forEach(missingGroup => {
      groupCounts.push({
        id: `simulated-${missingGroup.shortName.toLowerCase()}`,
        name: missingGroup.displayName,
        shortName: missingGroup.shortName,
        originalName: missingGroup.name,
        count: Math.floor(Math.random() * 300) + 200,
        simulated: true,
        realData: false
      });
    });
    
    res.json({
      groupCounts,
      totalDevices: groupCounts.reduce((sum, group) => sum + group.count, 0),
      source: 'JumpCloud',
      lastUpdated: new Date().toISOString(),
      note: groupCounts.some(g => g.simulated) ? 'Some groups simulated - verify group names in JumpCloud' : null,
      debug: {
        availableGroups: groupsData.map(g => g.name),
        foundGroups: groupCounts.filter(g => g.realData).map(g => g.originalName),
        missingGroups: missingGroups.map(g => g.name)
      }
    });
  } catch (error) {
    console.error('Error fetching group counts from JumpCloud:', error);
    
    // Fallback to simulated data with correct group names
    const simulatedGroups = [
      { id: 'cl-group', name: 'Chile (CL)', shortName: 'CL', originalName: 'CL-ALL LAPTOPS DEVICES', count: 380 },
      { id: 'mx-group', name: 'México (MX)', shortName: 'MX', originalName: 'MX-ALL LAPTOPS DEVICES', count: 450 },
      { id: 'rm-group', name: 'Remoto (RM)', shortName: 'RM', originalName: 'RM-ALL DEVICES', count: 303 }
    ];
    
    res.json({
      groupCounts: simulatedGroups,
      totalDevices: simulatedGroups.reduce((sum, group) => sum + group.count, 0),
      source: 'JumpCloud (Simulated - API Error)',
      lastUpdated: new Date().toISOString(),
      note: 'Using simulated data due to API error',
      error: error.message
    });
  }
});

// Snipe-IT Integration
const SNIPE_IT_API_BASE = process.env.SNIPE_IT_API_BASE || 'https://your-snipe-it-instance.com/api/v1';
const SNIPE_IT_API_KEY = process.env.SNIPE_IT_API_KEY || 'your-snipe-it-api-key';

// Helper function to make Snipe-IT API requests
async function makeSnipeItRequest(endpoint, params = {}) {
  try {
    console.log(`Making Snipe-IT request to: ${SNIPE_IT_API_BASE}${endpoint}`);
    
    const response = await axios.get(`${SNIPE_IT_API_BASE}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${SNIPE_IT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      params,
      timeout: 10000 // 10 second timeout
    });
    
    console.log(`Snipe-IT Response status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error('Snipe-IT API Error:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

// Get available assets from Snipe-IT
router.get('/snipe/assets/available', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const assetsData = await makeSnipeItRequest('/hardware', {
      limit: parseInt(limit),
      offset: parseInt(offset),
      status_id: 1, // Available status (you may need to adjust this)
      sort: 'created_at',
      order: 'desc'
    });
    
    // Filter for available assets
    const availableAssets = assetsData.rows.filter(asset => 
      asset.status_label && 
      asset.status_label.status_meta === 'deployable' // Available for deployment
    );
    
    res.json({
      assets: availableAssets,
      totalAvailable: availableAssets.length,
      totalAssets: assetsData.total,
      source: 'Snipe-IT',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching available assets from Snipe-IT:', error);
    
    // Fallback to simulated data
    const simulatedAssets = [
      { id: 1, name: 'MacBook Pro 16"', asset_tag: 'MBP001', model: 'MacBook Pro 16-inch', status_label: { status_meta: 'deployable' } },
      { id: 2, name: 'Dell Latitude 5520', asset_tag: 'DLT002', model: 'Dell Latitude 5520', status_label: { status_meta: 'deployable' } },
      { id: 3, name: 'MacBook Air M2', asset_tag: 'MBA003', model: 'MacBook Air M2', status_label: { status_meta: 'deployable' } },
      { id: 4, name: 'ThinkPad X1 Carbon', asset_tag: 'TPX004', model: 'ThinkPad X1 Carbon', status_label: { status_meta: 'deployable' } },
      { id: 5, name: 'Surface Pro 9', asset_tag: 'SPR005', model: 'Surface Pro 9', status_label: { status_meta: 'deployable' } }
    ];
    
    res.json({
      assets: simulatedAssets,
      totalAvailable: simulatedAssets.length,
      totalAssets: simulatedAssets.length,
      source: 'Snipe-IT (Simulated - API Error)',
      lastUpdated: new Date().toISOString(),
      note: 'Using simulated data due to API error',
      error: error.message
    });
  }
});

// Get assets count by status from Snipe-IT
router.get('/snipe/assets/count', async (req, res) => {
  try {
    const assetsData = await makeSnipeItRequest('/hardware', {
      limit: 1000,
      offset: 0
    });
    
    // Count assets by status
    const statusCounts = {};
    assetsData.rows.forEach(asset => {
      const status = asset.status_label?.status_meta || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const availableCount = statusCounts['deployable'] || 0;
    const totalCount = assetsData.total;
    
    res.json({
      availableAssets: availableCount,
      totalAssets: totalCount,
      statusBreakdown: statusCounts,
      source: 'Snipe-IT',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching assets count from Snipe-IT:', error);
    
    // Fallback to simulated data
    res.json({
      availableAssets: 25,
      totalAssets: 150,
      statusBreakdown: {
        'deployable': 25,
        'deployed': 100,
        'pending': 15,
        'archived': 10
      },
      source: 'Snipe-IT (Simulated - API Error)',
      lastUpdated: new Date().toISOString(),
      note: 'Using simulated data due to API error',
      error: error.message
    });
  }
});

// Test Snipe-IT connection
router.get('/snipe/test', async (req, res) => {
  try {
    const testData = await makeSnipeItRequest('/statuslabels');
    
    res.json({
      message: 'Snipe-IT API connection successful',
      statusLabels: testData.rows?.slice(0, 5) || [],
      totalStatusLabels: testData.total || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing Snipe-IT connection:', error);
    res.status(500).json({ 
      error: 'Failed to connect to Snipe-IT',
      details: error.message,
      troubleshooting: {
        steps: [
          '1. Verify SNIPE_IT_API_BASE environment variable',
          '2. Verify SNIPE_IT_API_KEY environment variable',
          '3. Check Snipe-IT API permissions',
          '4. Ensure Snipe-IT instance is accessible'
        ]
      }
    });
  }
});

module.exports = router;
