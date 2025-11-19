const express = require('express');
const { executeQuery } = require('../config/database');
const { verifyToken, requireAuditor, logAudit } = require('../middleware/auth');
const { generateResponsibilityLetter, generateOnboardingPDF } = require('../utils/documentGenerator');
const jumpcloudRouter = require('./jumpcloud');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');

// Try to load jira-client, but don't fail if it's not available
let JiraClient = null;
try {
  JiraClient = require('jira-client');
} catch (error) {
  console.log('⚠️ jira-client module not available, Jira integration disabled');
}

const router = express.Router();

// Initialize Jira client helper function
function getJiraClient() {
  if (!JiraClient) {
    console.log('⚠️ jira-client module not available');
    return null; // jira-client module not available
  }

  const jiraHost = process.env.JIRA_HOST; // e.g., 'your-domain.atlassian.net'
  const jiraEmail = process.env.JIRA_EMAIL;
  const jiraApiToken = process.env.JIRA_API_TOKEN;

  console.log('🔍 Jira configuration check:', {
    hasJiraClient: !!JiraClient,
    hasHost: !!jiraHost,
    hasEmail: !!jiraEmail,
    hasToken: !!jiraApiToken,
    host: jiraHost || 'NOT SET',
    email: jiraEmail ? `${jiraEmail.substring(0, 5)}...` : 'NOT SET',
    tokenLength: jiraApiToken ? jiraApiToken.length : 0
  });

  if (!jiraHost || !jiraEmail || !jiraApiToken) {
    console.log('❌ Jira not configured - missing credentials');
    return null; // Jira not configured
  }

  try {
    const client = new JiraClient({
      host: jiraHost,
      username: jiraEmail,
      password: jiraApiToken,
      apiVersion: '3',
      strictSSL: true
    });
    console.log('✅ Jira client initialized successfully');
    return client;
  } catch (error) {
    console.error('❌ Error initializing Jira client:', error);
    return null;
  }
}

// Helper function to extract text from Jira ADF format
function extractTextFromADF(adf) {
  if (!adf || !adf.content) return '';
  let text = '';
  adf.content.forEach(node => {
    if (node.type === 'text' && node.text) {
      text += node.text + ' ';
    } else if (node.content) {
      text += extractTextFromADF(node) + ' ';
    }
  });
  return text.trim();
}

// Helper function to extract field value from text
function extractFieldFromText(text, keywords) {
  if (!text) return '';
  const lowerText = text.toLowerCase();
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}\\s*[:=]\\s*([^\\n,;]+)`, 'i');
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
}

// Apply middleware to all routes
router.use(verifyToken);
router.use(requireAuditor);
router.use(logAudit);

// Get employee by Employee ID from Jira
router.get('/jira-employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const jira = getJiraClient();
    
    if (!jira) {
      return res.status(503).json({ 
        error: 'Jira integration not available',
        employee: null 
      });
    }

    try {
      console.log('🔍 Searching Jira for Employee ID:', employeeId);
      
      // Search by custom field "HD - Employee ID"
      // We need to find the custom field ID first, or search by the field name
      // Let's try searching in the project and filtering by the custom field
      const jql = `project = "Helpdesk On/Off" AND "HD - Employee ID" ~ "${employeeId}"`;
      
      const searchResults = await jira.searchJira(jql, {
        maxResults: 1,
        fields: ['summary', 'description', 'reporter', 'status', 'project', 'assignee', 'creator']
      });

      if (!searchResults.issues || searchResults.issues.length === 0) {
        return res.json({ 
          employee: null,
          message: 'Employee not found in Jira'
        });
      }

      const issue = searchResults.issues[0];
      
      // Extract custom fields
      // Note: Custom fields in Jira are accessed via their internal ID (customfield_XXXXX)
      // We'll need to map the field names to IDs, but for now let's try accessing them directly
      const fields = issue.fields;
      
      // Try to find custom fields - Jira API returns them as customfield_XXXXX
      // We need to search through all custom fields or know their IDs
      // For now, let's get all fields and search for our custom fields
      const employeeData = {
        id: issue.id,
        employeeId: employeeId,
        name: '',
        firstName: '',
        lastName: '',
        email: fields.reporter?.emailAddress || fields.assignee?.emailAddress || '',
        position: '',
        department: '',
        location: '',
        startDate: '',
        jiraTicket: issue.key,
        project: fields.project?.name || fields.project?.key || 'Helpdesk On/Off',
        status: fields.status?.name || 'active'
      };

      // Get all custom fields
      const customFields = Object.keys(fields).filter(key => key.startsWith('customfield_'));
      
      // Try to find our custom fields by searching field metadata or by common patterns
      // For now, we'll use a helper function to search for fields by name pattern
      for (const fieldKey of customFields) {
        const fieldValue = fields[fieldKey];
        if (!fieldValue) continue;
        
        // Get field metadata to find field name
        // This requires an additional API call, so let's try a different approach
        // We can search by field value patterns or get field definitions
      }
      
      // Alternative: Get full issue with expanded fields
      const fullIssue = await jira.findIssue(issue.key, null, 'all');
      
      // Now try to extract custom fields from fullIssue
      const fullFields = fullIssue.fields;
      
      // Search for custom fields by their value content
      // HD - FIRST NAME, HD - LAST NAME, HD - JOB TITLE, HD - Department, HD - COUNTRY, HD - Start Date
      for (const key in fullFields) {
        if (key.startsWith('customfield_')) {
          const fieldValue = fullFields[key];
          
          // Try to identify fields by their content or metadata
          // For custom fields with names, we might need to query field definitions
          // Let's try to get field definitions
        }
      }
      
      // Get field definitions to map field names to IDs using REST API
      let fieldDefinitions = [];
      try {
        fieldDefinitions = await jira.get('/rest/api/3/field');
        if (!Array.isArray(fieldDefinitions)) {
          fieldDefinitions = [];
        }
      } catch (e) {
        console.log('⚠️ Could not get field definitions:', e.message);
        fieldDefinitions = [];
      }
      
      // Find our custom fields by name
      const employeeIdField = fieldDefinitions.find(f => f.name === 'HD - Employee ID');
      const firstNameField = fieldDefinitions.find(f => f.name === 'HD - FIRST NAME');
      const lastNameField = fieldDefinitions.find(f => f.name === 'HD - LAST NAME');
      const jobTitleField = fieldDefinitions.find(f => f.name === 'HD - JOB TITLE');
      const departmentField = fieldDefinitions.find(f => f.name === 'HD - Department');
      const countryField = fieldDefinitions.find(f => f.name === 'HD - COUNTRY');
      const startDateField = fieldDefinitions.find(f => f.name === 'HD - Start Date');
      
      // Extract values using field IDs
      if (firstNameField && fullFields[firstNameField.id]) {
        employeeData.firstName = String(fullFields[firstNameField.id]).trim();
      }
      if (lastNameField && fullFields[lastNameField.id]) {
        employeeData.lastName = String(fullFields[lastNameField.id]).trim();
      }
      if (jobTitleField && fullFields[jobTitleField.id]) {
        employeeData.position = String(fullFields[jobTitleField.id]).trim();
      }
      if (departmentField && fullFields[departmentField.id]) {
        employeeData.department = String(fullFields[departmentField.id]).trim();
      }
      if (countryField && fullFields[countryField.id]) {
        const countryValue = fullFields[countryField.id];
        // Country might be an object with a value property
        employeeData.location = typeof countryValue === 'object' && countryValue.value 
          ? countryValue.value 
          : String(countryValue).trim();
      }
      if (startDateField && fullFields[startDateField.id]) {
        const dateValue = fullFields[startDateField.id];
        employeeData.startDate = typeof dateValue === 'string' ? dateValue : dateValue?.value || '';
      }
      
      // Combine first and last name
      employeeData.name = `${employeeData.firstName} ${employeeData.lastName}`.trim() || fullFields.summary || 'N/A';

      res.json({
        employee: employeeData,
        message: 'Employee found in Jira'
      });

    } catch (jiraError) {
      console.error('❌ Error searching Jira for employee:', jiraError.message);
      res.status(500).json({ 
        error: 'Error searching Jira',
        details: jiraError.message,
        employee: null
      });
    }

  } catch (error) {
    console.error('Get Jira employee error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get employees from Jira for onboarding (from a specific channel/project)
router.get('/jira-employees', async (req, res) => {
  try {
    const { search = '', project = '', limit = 50, employeeId } = req.query;
    const searchLimit = parseInt(limit) || 50;

    let employees = [];

    // Try to connect to real Jira API
    const jira = getJiraClient();
    
    if (jira) {
      try {
        console.log('🔗 Connecting to Jira API...');
        
        // Search for issues in the specified project
        // Project: "Helpdesk On/Off"
        // Queues: "Onboarding Chile", "Onboarding Mexico" (excluding Offboarding)
        let searchResults;
        let jql;
        
        // Default project is "Helpdesk On/Off"
        const targetProject = project || 'Helpdesk On/Off';
        
        // Use axios directly for JQL search (jira-client uses deprecated API)
        const axios = require('axios');
        const baseUrl = `https://${process.env.JIRA_HOST}`;
        const auth = {
          username: process.env.JIRA_EMAIL,
          password: process.env.JIRA_API_TOKEN
        };

        // Get field definitions first to find custom field IDs
        let customFieldIds = {};
        try {
          const fieldResponse = await axios.get(`${baseUrl}/rest/api/3/field`, {
            auth: auth,
            headers: { 'Accept': 'application/json' }
          });
          
          const fieldsArray = Array.isArray(fieldResponse.data) ? fieldResponse.data : [];
          
          customFieldIds = {
            employeeId: fieldsArray.find(f => f.name === 'HD - Employee ID')?.id,
            firstName: fieldsArray.find(f => f.name === 'HD - FIRST NAME')?.id,
            lastName: fieldsArray.find(f => f.name === 'HD - LAST NAME')?.id,
            jobTitle: fieldsArray.find(f => f.name === 'HD - JOB TITLE')?.id,
            department: fieldsArray.find(f => f.name === 'HD - Department')?.id,
            country: fieldsArray.find(f => f.name === 'HD - COUNTRY')?.id,
            startDate: fieldsArray.find(f => f.name === 'HD - Start Date')?.id
          };
          
          console.log('✅ Custom field IDs found:', {
            employeeId: customFieldIds.employeeId || 'Not found',
            firstName: customFieldIds.firstName || 'Not found',
            lastName: customFieldIds.lastName || 'Not found',
            jobTitle: customFieldIds.jobTitle || 'Not found'
          });
        } catch (fieldError) {
          console.log('⚠️ Could not get field definitions:', fieldError.message);
        }

        // If searching by employee ID, use that
        if (employeeId) {
          // First, try to find by custom field ID across all projects (more flexible)
          // Since we know HELP-2201 exists with employee ID 1822, the project might be "HELP" or similar
          if (customFieldIds.employeeId) {
            // Try exact match first (most reliable)
            jql = `${customFieldIds.employeeId} = "${employeeId}" ORDER BY created DESC`;
            console.log('🔍 Trying JQL with custom field (exact, all projects):', jql);
            
            try {
              const searchResponseExact = await axios.post(
                `${baseUrl}/rest/api/3/search`,
                {
                  jql: jql,
                  maxResults: searchLimit,
                  fields: ['summary', 'description', 'reporter', 'status', 'project', 'assignee', 'creator', customFieldIds.employeeId, customFieldIds.firstName, customFieldIds.lastName, customFieldIds.jobTitle, customFieldIds.department, customFieldIds.country, customFieldIds.startDate].filter(Boolean)
                },
                {
                  auth: auth,
                  headers: { 'Accept': 'application/json' }
                }
              );
              searchResults = searchResponseExact.data;
              console.log(`📊 Found ${searchResults.issues?.length || 0} issues with custom field exact match (all projects)`);
              
              // If found, use those results
              if (searchResults.issues && searchResults.issues.length > 0) {
                // Continue with the results we found
              } else {
                // If no results with exact, try contains
                jql = `${customFieldIds.employeeId} ~ "${employeeId}" ORDER BY created DESC`;
                console.log('🔍 Trying JQL with custom field (contains, all projects):', jql);
                
                const searchResponseContains = await axios.post(
                  `${baseUrl}/rest/api/3/search`,
                  {
                    jql: jql,
                    maxResults: searchLimit,
                    fields: ['summary', 'description', 'reporter', 'status', 'project', 'assignee', 'creator', customFieldIds.employeeId, customFieldIds.firstName, customFieldIds.lastName, customFieldIds.jobTitle, customFieldIds.department, customFieldIds.country, customFieldIds.startDate].filter(Boolean)
                  },
                  {
                    auth: auth,
                    headers: { 'Accept': 'application/json' }
                  }
                );
                searchResults = searchResponseContains.data;
                console.log(`📊 Found ${searchResults.issues?.length || 0} issues with custom field contains (all projects)`);
              }
            } catch (allProjectsError) {
              console.log('⚠️ All projects search failed, trying project-specific...', allProjectsError.response?.data?.errorMessages || allProjectsError.message);
              searchResults = { issues: [] };
            }
            
            // If still no results from all projects, try with specific project
            if (!searchResults.issues || searchResults.issues.length === 0) {
              jql = `project = "${targetProject}" AND ${customFieldIds.employeeId} ~ "${employeeId}" ORDER BY created DESC`;
            } else {
              // We have results, skip to processing
              jql = null;
            }
          } else {
            jql = `project = "${targetProject}" AND "HD - Employee ID" ~ "${employeeId}" ORDER BY created DESC`;
          }
          
          // Only execute project-specific search if jql is set (meaning we don't already have results)
          if (jql) {
            try {
              console.log('🔍 Trying JQL with custom field in project:', jql);
              const searchResponse = await axios.post(
                `${baseUrl}/rest/api/3/search`,
                {
                  jql: jql,
                  maxResults: searchLimit,
                  fields: ['summary', 'description', 'reporter', 'status', 'project', 'assignee', 'creator', customFieldIds.employeeId, customFieldIds.firstName, customFieldIds.lastName, customFieldIds.jobTitle, customFieldIds.department, customFieldIds.country, customFieldIds.startDate].filter(Boolean)
                },
                {
                  auth: auth,
                  headers: { 'Accept': 'application/json' }
                }
              );
              searchResults = searchResponse.data;
              console.log(`📊 Found ${searchResults.issues?.length || 0} issues with custom field in project`);
            } catch (jqlError) {
            const errorData = jqlError.response?.data || {};
            const errorMessages = errorData.errorMessages || [];
            const errors = errorData.errors || {};
            console.log('⚠️ JQL error details:', JSON.stringify({
              message: jqlError.message,
              status: jqlError.response?.status,
              errorMessages: errorMessages,
              errors: errors,
              jql: jql
            }, null, 2));
            
            // Fallback 1: Try exact match instead of contains (~)
            if (customFieldIds.employeeId) {
              try {
                jql = `project = "${targetProject}" AND ${customFieldIds.employeeId} = "${employeeId}" ORDER BY created DESC`;
                console.log('🔍 Trying exact match:', jql);
                const searchResponse3 = await axios.post(
                  `${baseUrl}/rest/api/3/search`,
                  {
                    jql: jql,
                    maxResults: searchLimit
                  },
                  {
                    auth: auth,
                    headers: { 'Accept': 'application/json' }
                  }
                );
                searchResults = searchResponse3.data;
                console.log(`📊 Found ${searchResults.issues?.length || 0} issues with exact match search`);
              } catch (e2) {
                console.log('⚠️ Exact match also failed, trying text search...');
                // Fallback 2: search in text fields
                jql = `project = "${targetProject}" AND text ~ "${employeeId}" ORDER BY created DESC`;
                try {
                  const searchResponse4 = await axios.post(
                    `${baseUrl}/rest/api/3/search`,
                    {
                      jql: jql,
                      maxResults: searchLimit
                    },
                    {
                      auth: auth,
                      headers: { 'Accept': 'application/json' }
                    }
                  );
                  searchResults = searchResponse4.data;
                  console.log(`📊 Found ${searchResults.issues?.length || 0} issues with text search`);
                } catch (e3) {
                  console.log('❌ All JQL searches failed:', JSON.stringify({
                    exactMatchError: e2.response?.data || e2.message,
                    textSearchError: e3.response?.data || e3.message
                  }, null, 2));
                  searchResults = { issues: [] };
                }
              }
            } else {
              // No custom field ID, just try text search
              jql = `project = "${targetProject}" AND text ~ "${employeeId}" ORDER BY created DESC`;
              try {
                const searchResponse3 = await axios.post(
                  `${baseUrl}/rest/api/3/search`,
                  {
                    jql: jql,
                    maxResults: searchLimit
                  },
                  {
                    auth: auth,
                    headers: { 'Accept': 'application/json' }
                  }
                );
                searchResults = searchResponse3.data;
                console.log(`📊 Found ${searchResults.issues?.length || 0} issues with text search`);
              } catch (e) {
                console.log('❌ All JQL searches failed:', JSON.stringify({
                  error: e.response?.data || e.message
                }, null, 2));
                searchResults = { issues: [] };
              }
            }
            }
          }
        } else {
          // Search for onboarding issues in the Helpdesk On/Off project
          // Exclude offboarding issues
          jql = `project = "${targetProject}" AND (summary ~ "onboard" OR description ~ "onboard") AND NOT (summary ~ "offboard" OR description ~ "offboard") ORDER BY created DESC`;
          
          try {
            const searchResponse = await axios.post(
              `${baseUrl}/rest/api/3/search`,
              {
                jql: jql,
                maxResults: searchLimit
              },
              {
                auth: auth,
                headers: { 'Accept': 'application/json' }
              }
            );
            searchResults = searchResponse.data;
          } catch (e) {
            console.log('⚠️ Error searching onboarding issues:', e.response?.data || e.message);
            searchResults = { issues: [] };
          }
        }
        
        // Custom field IDs were retrieved above before the search

        // Transform Jira issues into employee objects
        employees = await Promise.all((searchResults.issues || []).map(async (issue) => {
          // Get full issue to access all custom fields
          let fullIssue;
          try {
            fullIssue = await jira.findIssue(issue.key, null, 'all');
          } catch (e) {
            console.log(`⚠️ Could not get full issue ${issue.key}, using basic data`);
            fullIssue = issue;
          }
          
          const fields = fullIssue.fields || issue.fields || {};
          
          // Extract custom fields using their IDs
          const firstName = customFieldIds.firstName && fields[customFieldIds.firstName] 
            ? String(fields[customFieldIds.firstName]).trim() 
            : '';
          const lastName = customFieldIds.lastName && fields[customFieldIds.lastName] 
            ? String(fields[customFieldIds.lastName]).trim() 
            : '';
          const jobTitle = customFieldIds.jobTitle && fields[customFieldIds.jobTitle] 
            ? String(fields[customFieldIds.jobTitle]).trim() 
            : '';
          const department = customFieldIds.department && fields[customFieldIds.department] 
            ? String(fields[customFieldIds.department]).trim() 
            : '';
          const country = customFieldIds.country && fields[customFieldIds.country] 
            ? (typeof fields[customFieldIds.country] === 'object' && fields[customFieldIds.country].value
               ? String(fields[customFieldIds.country].value).trim()
               : String(fields[customFieldIds.country]).trim())
            : '';
          const startDate = customFieldIds.startDate && fields[customFieldIds.startDate] 
            ? (typeof fields[customFieldIds.startDate] === 'string' 
               ? fields[customFieldIds.startDate] 
               : fields[customFieldIds.startDate]?.value || '')
            : '';
          let empId = customFieldIds.employeeId && fields[customFieldIds.employeeId] 
            ? String(fields[customFieldIds.employeeId]).trim() 
            : '';
          
          // If employeeId not found, search through all custom fields
          if (!empId && employeeId) {
            for (const key in fields) {
              if (key.startsWith('customfield_')) {
                const value = String(fields[key] || '').trim();
                // Check if this value matches the search
                if (value && (value === employeeId || value.includes(employeeId))) {
                  empId = value;
                  console.log(`✅ Found Employee ID in custom field ${key}: ${empId}`);
                  break;
                }
              }
            }
          }
          
          // Combine first and last name
          const employeeName = `${firstName} ${lastName}`.trim() || fields.summary || 'N/A';
          
          // Extract email from reporter or assignee
          const email = fields.reporter?.emailAddress || 
                       fields.assignee?.emailAddress || 
                       fields.creator?.emailAddress || '';
          
          return {
            id: fullIssue.id || issue.id,
            name: employeeName,
            firstName: firstName,
            lastName: lastName,
            email: email,
            employeeId: empId || employeeId || issue.key,
            department: department,
            position: jobTitle,
            location: country,
            startDate: startDate,
            jiraTicket: issue.key,
            project: fields.project?.name || fields.project?.key || project || 'Onboarding',
            status: fields.status?.name || 'active',
            description: typeof fields.description === 'string' ? fields.description : ''
          };
        }));

        console.log(`✅ Found ${employees.length} employees from Jira`);
      } catch (jiraError) {
        console.error('❌ Error connecting to Jira:', jiraError.message);
        // Fall back to mock data if Jira connection fails
        console.log('⚠️ Falling back to mock data');
        employees = getMockJiraEmployees();
      }
    } else {
      console.log('ℹ️ Jira not configured, using mock data');
      // Use mock data if Jira is not configured
      employees = getMockJiraEmployees();
    }

    // Filter by search term if provided
    let filteredEmployees = employees;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower) ||
        (emp.employeeId && emp.employeeId.toLowerCase().includes(searchLower)) ||
        (emp.jiraTicket && emp.jiraTicket.toLowerCase().includes(searchLower))
      );
    }

    // Filter by project if provided
    if (project && jira) {
      // Already filtered by JQL, but we can refine here
      filteredEmployees = filteredEmployees.filter(emp => 
        emp.project.toLowerCase().includes(project.toLowerCase())
      );
    }

    // Limit results
    const limitedEmployees = filteredEmployees.slice(0, searchLimit);

    res.json({
      employees: limitedEmployees,
      total: filteredEmployees.length,
      message: jira ? 'Employees retrieved from Jira successfully' : 'Using mock data - configure Jira credentials',
      source: jira ? 'Jira' : 'Mock',
      project: project || 'Onboarding'
    });

  } catch (error) {
    console.error('Get Jira employees for onboarding error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Helper function for mock data
function getMockJiraEmployees() {
    return [
      {
        id: 'JIRA-ON-001',
        name: 'Carlos Mendoza',
        email: 'carlos.mendoza@company.com',
        employeeId: 'EMP1001',
        department: 'Engineering',
        position: 'Senior Software Engineer',
        location: 'MX',
        jiraTicket: 'ON-2024-001',
        project: 'Onboarding',
        status: 'active'
      },
      {
        id: 'JIRA-ON-002',
        name: 'Ana Silva',
        email: 'ana.silva@company.com',
        employeeId: 'EMP1002',
        department: 'Product',
        position: 'Product Manager',
        location: 'CL',
        jiraTicket: 'ON-2024-002',
        project: 'Onboarding',
        status: 'active'
      },
      {
        id: 'JIRA-ON-003',
        name: 'Roberto Fuentes',
        email: 'roberto.fuentes@company.com',
        employeeId: 'EMP1003',
        department: 'Design',
        position: 'UI/UX Designer',
        location: 'MX',
        jiraTicket: 'ON-2024-003',
        project: 'Onboarding',
        status: 'active'
      },
      {
        id: 'JIRA-ON-004',
        name: 'Patricia Ramírez',
        email: 'patricia.ramirez@company.com',
        employeeId: 'EMP1004',
        department: 'Sales',
        position: 'Sales Manager',
        location: 'CO',
        jiraTicket: 'ON-2024-004',
        project: 'Onboarding',
        status: 'active'
      },
      {
        id: 'JIRA-ON-005',
        name: 'Fernando Torres',
        email: 'fernando.torres@company.com',
        employeeId: 'EMP1005',
        department: 'Engineering',
        position: 'Backend Developer',
        location: 'REMOTO',
        jiraTicket: 'ON-2024-005',
        project: 'Onboarding',
        status: 'active'
      }
    ];
}

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

// PDF Templates CRUD
// Get all PDF templates
router.get('/pdf-templates', async (req, res) => {
  try {
    const templates = await executeQuery(`
      SELECT * FROM pdf_templates 
      WHERE is_active = true 
      ORDER BY is_default DESC, name
    `);

    // Parse JSON config for each template
    const parsedTemplates = templates.map(template => ({
      ...template,
      template_config: typeof template.template_config === 'string' 
        ? JSON.parse(template.template_config) 
        : template.template_config
    }));

    res.json({ templates: parsedTemplates });
  } catch (error) {
    console.error('Get PDF templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single PDF template
router.get('/pdf-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const templates = await executeQuery(
      'SELECT * FROM pdf_templates WHERE id = ?',
      [id]
    );

    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = templates[0];
    template.template_config = typeof template.template_config === 'string' 
      ? JSON.parse(template.template_config) 
      : template.template_config;

    res.json(template);
  } catch (error) {
    console.error('Get PDF template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create PDF template
router.post('/pdf-templates', async (req, res) => {
  try {
    const { name, description, template_config, is_default } = req.body;

    if (!name || !template_config) {
      return res.status(400).json({ 
        error: 'Name and template_config are required' 
      });
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await executeQuery(
        'UPDATE pdf_templates SET is_default = FALSE WHERE is_default = TRUE'
      );
    }

    const result = await executeQuery(
      'INSERT INTO pdf_templates (name, description, template_config, is_default, created_by) VALUES (?, ?, ?, ?, ?)',
      [
        name,
        description || '',
        JSON.stringify(template_config),
        is_default || false,
        req.user.id
      ]
    );

    res.json({ 
      message: 'PDF template created successfully',
      templateId: result.insertId
    });
  } catch (error) {
    console.error('Create PDF template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update PDF template
router.put('/pdf-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, template_config, is_default, is_active } = req.body;

    // Check if template exists
    const existing = await executeQuery(
      'SELECT * FROM pdf_templates WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await executeQuery(
        'UPDATE pdf_templates SET is_default = FALSE WHERE is_default = TRUE AND id != ?',
        [id]
      );
    }

    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (template_config !== undefined) {
      updateFields.push('template_config = ?');
      updateValues.push(JSON.stringify(template_config));
    }
    if (is_default !== undefined) {
      updateFields.push('is_default = ?');
      updateValues.push(is_default);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await executeQuery(
      `UPDATE pdf_templates SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'PDF template updated successfully' });
  } catch (error) {
    console.error('Update PDF template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete PDF template
router.delete('/pdf-templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if template exists
    const existing = await executeQuery(
      'SELECT * FROM pdf_templates WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Soft delete (set is_active to false) instead of hard delete
    await executeQuery(
      'UPDATE pdf_templates SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({ message: 'PDF template deleted successfully' });
  } catch (error) {
    console.error('Delete PDF template error:', error);
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
    // Note: Using employee_id as integer (required field), if not provided use 0 or generate one
    const finalEmployeeId = employeeId ? parseInt(employeeId) || 0 : 0;
    
    const processResult = await executeQuery(
      'INSERT INTO onboarding_processes (employee_name, employee_id, position, department, location, start_date, status, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        employeeName,
        finalEmployeeId,
        position,
        department,
        location,
        startDate,
        'in_progress',
        0
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
        op.signature_url,
        op.signature_request_id,
        op.document_path
      FROM onboarding_processes op
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

// Update onboarding process progress (must be before /:id route)
router.put('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be a number between 0 and 100' });
    }

    // Calculate completed steps based on progress
    const process = await executeQuery('SELECT * FROM onboarding_processes WHERE id = ?', [id]);
    if (process.length === 0) {
      return res.status(404).json({ error: 'Process not found' });
    }

    // Get total steps
    const steps = await executeQuery('SELECT * FROM onboarding_steps WHERE process_id = ?', [id]);
    const totalSteps = steps.length;
    const completedSteps = Math.round((progress / 100) * totalSteps);

    // Update steps based on progress percentage
    if (totalSteps > 0) {
      for (let i = 0; i < totalSteps; i++) {
        const stepStatus = i < completedSteps ? 'completed' : (i === completedSteps && progress > 0 ? 'in_progress' : 'pending');
        await executeQuery(
          'UPDATE onboarding_steps SET status = ?, completed_at = ? WHERE process_id = ? AND step_order = ?',
          [
            stepStatus,
            stepStatus === 'completed' ? new Date() : null,
            id,
            i + 1
          ]
        );
      }
    }

    res.json({ 
      message: 'Progress updated successfully',
      progress,
      completedSteps,
      totalSteps
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete onboarding process (must be before /:id route)
router.put('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    // Update all steps to completed
    await executeQuery(
      'UPDATE onboarding_steps SET status = "completed", completed_at = NOW() WHERE process_id = ?',
      [id]
    );

    // Update process status to completed
    await executeQuery(
      'UPDATE onboarding_processes SET status = "completed", completed_at = NOW() WHERE id = ?',
      [id]
    );

    res.json({ message: 'Process completed successfully' });
  } catch (error) {
    console.error('Complete process error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate onboarding PDF with Snipe IT data (must be before /:id route)
// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/images');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pdf-template-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload image for PDF template
router.post('/upload-image', verifyToken, upload.single('image'), async (req, res) => {
  try {
    console.log('📤 Upload request received');
    console.log('File:', req.file);
    console.log('Body:', req.body);
    
    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imagePath = `/uploads/images/${req.file.filename}`;
    console.log('✅ Image uploaded successfully:', imagePath);
    
    res.json({ 
      path: imagePath,
      filename: req.file.filename,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('❌ Upload image error:', error);
    res.status(500).json({ error: 'Error uploading image', details: error.message });
  }
});

router.post('/generate-pdf', async (req, res) => {
  try {
    const { 
      employeeName, 
      employeeId, 
      email, 
      position, 
      department, 
      location, 
      startDate,
      templateId,
      templateConfig,
      processId  // ID del proceso de onboarding (opcional)
    } = req.body;

    // Validate required fields
    if (!employeeName || !email) {
      return res.status(400).json({ 
        error: 'Employee name and email are required' 
      });
    }

    // Get template if templateId is provided
    let template = null;
    if (templateId) {
      try {
        const templates = await executeQuery(
          'SELECT * FROM pdf_templates WHERE id = ? AND is_active = TRUE',
          [templateId]
        );
        if (templates.length > 0) {
          template = templates[0];
          template.template_config = typeof template.template_config === 'string' 
            ? JSON.parse(template.template_config) 
            : template.template_config;
        }
      } catch (templateError) {
        console.error('Error loading template:', templateError);
      }
    } else if (templateConfig) {
      // Use provided template config
      template = { template_config: templateConfig };
    } else {
      // Get default template
      try {
        const templates = await executeQuery(
          'SELECT * FROM pdf_templates WHERE is_default = TRUE AND is_active = TRUE LIMIT 1'
        );
        if (templates.length > 0) {
          template = templates[0];
          template.template_config = typeof template.template_config === 'string' 
            ? JSON.parse(template.template_config) 
            : template.template_config;
        }
      } catch (templateError) {
        console.error('Error loading default template:', templateError);
      }
    }

    // Get assets from Snipe IT
    let assets = [];
    try {
      if (jumpcloudRouter.getEmployeeAssetsFromSnipeIT) {
        assets = await jumpcloudRouter.getEmployeeAssetsFromSnipeIT(email, employeeName);
        console.log(`Found ${assets.length} assets for ${employeeName} from Snipe IT`);
      } else {
        console.log('Snipe IT function not available, using empty assets array');
      }
    } catch (snipeError) {
      console.error('Error fetching assets from Snipe IT:', snipeError);
      // Continue with empty assets array
      assets = [];
    }

    // Generate PDF
    let pdfPath;
    try {
      pdfPath = await generateOnboardingPDF({
        employeeName,
        employeeId: employeeId || '',
        email,
        position: position || 'N/A',
        department: department || 'N/A',
        location: location || 'REMOTO',
        startDate: startDate ? new Date(startDate) : new Date(),
        assets,
        generatedBy: req.user.full_name || req.user.username || 'System',
        generatedAt: new Date(),
        templateConfig: template ? template.template_config : null
      });
      
      console.log(`PDF generated successfully at: ${pdfPath}`);
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      return res.status(500).json({ 
        error: 'Error generating PDF', 
        details: pdfError.message 
      });
    }

    // Check if file exists
    if (!await fs.pathExists(pdfPath)) {
      console.error(`PDF file not found: ${pdfPath}`);
      return res.status(500).json({ 
        error: 'PDF file was not created' 
      });
    }

    // Integración con HelloSign y Slack (opcional)
    let signatureUrl = null;
    let signatureRequestId = null;
    
    try {
      const { createSignatureRequest, isHelloSignConfigured } = require('../utils/signature');
      const { sendOnboardingSignatureRequest, isSlackConfigured } = require('../utils/slack');

      // Si HelloSign está configurado, crear solicitud de firma
      if (isHelloSignConfigured()) {
        console.log('[Onboarding] Creando solicitud de firma en HelloSign...');
        
        const signatureResult = await createSignatureRequest({
          filePath: pdfPath,
          employeeName: employeeName,
          employeeEmail: email,
          title: `Documento de Onboarding - ${employeeName}`,
          subject: 'Por favor firma tu documento de onboarding',
          message: `Hola ${employeeName},\n\nPor favor revisa y firma el documento de onboarding adjunto.\n\nGracias.`
        });

        if (signatureResult.success) {
          signatureUrl = signatureResult.signatureUrl;
          signatureRequestId = signatureResult.signatureRequestId;
          console.log('[Onboarding] Solicitud de firma creada:', signatureRequestId);
          console.log('[Onboarding] URL de firma:', signatureUrl);
          
          // Guardar en la base de datos si hay processId
          if (processId) {
            try {
              await executeQuery(
                'UPDATE onboarding_processes SET signature_url = ?, signature_request_id = ?, document_path = ? WHERE id = ?',
                [signatureUrl, signatureRequestId, pdfPath, processId]
              );
              console.log('[Onboarding] URL de firma guardada en proceso:', processId);
            } catch (dbError) {
              console.error('[Onboarding] Error guardando URL de firma:', dbError);
              // No fallar si hay error al guardar
            }
          }
        }
      }

      // Si Slack está configurado, enviar notificación
      if (isSlackConfigured() && signatureUrl) {
        console.log('[Onboarding] Enviando notificación a Slack...');
        
        // Intentar obtener información del manager si está disponible
        let managerName = null;
        let managerSlackId = null;
        
        // Aquí podrías buscar el manager del empleado si tienes esa información
        // Por ahora usamos el usuario que generó el documento
        managerName = req.user.full_name || req.user.username;

        await sendOnboardingSignatureRequest({
          employeeName: employeeName,
          employeeEmail: email,
          signatureUrl: signatureUrl,
          managerName: managerName,
          managerSlackId: managerSlackId
        });
        
        console.log('[Onboarding] Notificación de Slack enviada');
      } else if (isSlackConfigured() && !signatureUrl) {
        // Si Slack está configurado pero no HelloSign, enviar mensaje simple
        const { sendSlackMessage } = require('../utils/slack');
        await sendSlackMessage({
          text: `📝 Documento de Onboarding generado para ${employeeName} (${email})\n\nEl documento está listo pero la integración de firma electrónica no está configurada.`,
          username: 'TechSupport Onboarding',
          icon: ':memo:'
        });
      }
    } catch (integrationError) {
      // No fallar la generación del PDF si hay error en integraciones
      console.error('[Onboarding] Error en integraciones (Slack/HelloSign):', integrationError.message);
      // Continuar con el flujo normal
    }

    // Guardar document_path en la base de datos si hay processId
    if (processId && pdfPath) {
      try {
        await executeQuery(
          'UPDATE onboarding_processes SET document_path = ? WHERE id = ?',
          [pdfPath, processId]
        );
      } catch (dbError) {
        console.error('[Onboarding] Error guardando document_path:', dbError);
      }
    }

    // Send PDF file with optional signature information
    const filename = path.basename(pdfPath);
    
    // Si hay información de firma, incluirla en headers personalizados
    if (signatureUrl) {
      res.setHeader('X-Signature-Url', signatureUrl);
      res.setHeader('X-Signature-Request-Id', signatureRequestId);
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    
    const fileStream = fs.createReadStream(pdfPath);
    
    fileStream.on('error', (streamError) => {
      console.error('Error reading PDF file:', streamError);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Error reading PDF file', 
          details: streamError.message 
        });
      }
    });
    
    fileStream.pipe(res);
    
    res.on('close', () => {
      if (!fileStream.destroyed) {
        fileStream.destroy();
      }
    });

  } catch (error) {
    console.error('Generate onboarding PDF error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Enviar solicitud de firma a Slack para un proceso de onboarding
router.post('/:processId/send-signature-request', async (req, res) => {
  try {
    const { processId } = req.params;

    // Obtener información del proceso
    const processes = await executeQuery(
      'SELECT * FROM onboarding_processes WHERE id = ?',
      [processId]
    );

    if (processes.length === 0) {
      return res.status(404).json({ error: 'Proceso de onboarding no encontrado' });
    }

    const process = processes[0];

    if (!process.email) {
      return res.status(400).json({ error: 'El proceso no tiene email asociado' });
    }

    // Verificar si hay URL de firma guardada
    let signatureUrl = process.signature_url;
    let signatureRequestId = process.signature_request_id;

    // Si no hay documento, generar uno primero
    if (!process.document_path) {
      try {
        console.log('[Onboarding] Generando documento para proceso:', processId);
        const { generateOnboardingPDF } = require('../utils/documentGenerator');
        const path = require('path');
        const fs = require('fs-extra');
        
        // Generar PDF
        const pdfPath = await generateOnboardingPDF({
          employeeName: process.employee_name,
          employeeId: process.employee_id || '',
          email: process.email,
          position: process.position || 'N/A',
          department: process.department || 'N/A',
          location: process.location || 'REMOTO',
          startDate: process.start_date ? new Date(process.start_date) : new Date(),
          assets: [],
          generatedBy: req.user.full_name || req.user.username || 'System',
          generatedAt: new Date(),
          templateConfig: null
        });
        
        // Guardar document_path
        await executeQuery(
          'UPDATE onboarding_processes SET document_path = ? WHERE id = ?',
          [pdfPath, processId]
        );
        process.document_path = pdfPath;
        console.log('[Onboarding] Documento generado:', pdfPath);
      } catch (docError) {
        console.error('[Onboarding] Error generando documento:', docError);
        // Continuar sin documento
      }
    }

    // Si no hay URL de firma, intentar crear una si hay documento
    if (!signatureUrl && process.document_path) {
      try {
        const { createSignatureRequest, isHelloSignConfigured } = require('../utils/signature');
        
        if (isHelloSignConfigured()) {
          console.log('[Onboarding] Creando nueva solicitud de firma para proceso:', processId);
          
          const signatureResult = await createSignatureRequest({
            filePath: process.document_path,
            employeeName: process.employee_name,
            employeeEmail: process.email,
            title: `Documento de Onboarding - ${process.employee_name}`,
            subject: 'Por favor firma tu documento de onboarding',
            message: `Hola ${process.employee_name},\n\nPor favor revisa y firma el documento de onboarding adjunto.\n\nGracias.`
          });

          if (signatureResult.success) {
            signatureUrl = signatureResult.signatureUrl;
            signatureRequestId = signatureResult.signatureRequestId;
            
            // Guardar en la base de datos
            await executeQuery(
              'UPDATE onboarding_processes SET signature_url = ?, signature_request_id = ? WHERE id = ?',
              [signatureUrl, signatureRequestId, processId]
            );
          }
        }
      } catch (signatureError) {
        console.error('[Onboarding] Error creando solicitud de firma:', signatureError);
        // Continuar sin URL de firma
      }
    }

    // Si aún no hay URL de firma, crear un link interno de firma
    if (!signatureUrl) {
      // Crear un link interno que abra la herramienta de firma con el documento
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3003';
      signatureUrl = `${baseUrl}/#pdf-signer-section?processId=${processId}&document=${encodeURIComponent(process.document_path || '')}`;
    }

    // Enviar mensaje a Slack
    const { sendOnboardingSignatureRequest, isSlackConfigured } = require('../utils/slack');
    
    if (!isSlackConfigured()) {
      return res.status(400).json({ 
        error: 'Slack no está configurado. Configura SLACK_WEBHOOK_URL en las variables de entorno.' 
      });
    }

    const result = await sendOnboardingSignatureRequest({
      employeeName: process.employee_name,
      employeeEmail: process.email,
      signatureUrl: signatureUrl,
      managerName: req.user.full_name || req.user.username,
      managerSlackId: null
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Solicitud de firma enviada a Slack exitosamente',
        signatureUrl: signatureUrl
      });
    } else {
      res.status(500).json({
        error: 'Error enviando solicitud de firma a Slack',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Error sending signature request:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Get single onboarding process with details (must be after specific routes)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get process details
    const processes = await executeQuery(`
      SELECT *
      FROM onboarding_processes
      WHERE id = ?
    `, [id]);

    if (processes.length === 0) {
      return res.status(404).json({ error: 'Process not found' });
    }

    const process = processes[0];

    // Get steps for the process
    const steps = await executeQuery(
      'SELECT * FROM onboarding_steps WHERE process_id = ? ORDER BY step_order',
      [id]
    );

    process.steps = steps;
    process.completed_steps = steps.filter(s => s.status === 'completed').length;
    process.total_steps = steps.length;
    process.progress = process.total_steps > 0 ? (process.completed_steps / process.total_steps) * 100 : 0;

    res.json(process);

  } catch (error) {
    console.error('Get onboarding process error:', error);
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
