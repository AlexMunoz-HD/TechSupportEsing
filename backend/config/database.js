const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'techsupport_user',
  password: process.env.DB_PASSWORD || 'techsupport_pass',
  database: process.env.DB_NAME || 'techsupport_db',
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  // Ensure UTF-8 encoding
  typeCast: function (field, next) {
    if (field.type === 'VAR_STRING' || field.type === 'STRING' || field.type === 'TEXT') {
      return field.string();
    }
    return next();
  }
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Initialize database connection
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    return rows[0].test === 1;
  } catch (error) {
    console.error('Database test failed:', error);
    return false;
  }
}

// Execute query with error handling
async function executeQuery(query, params = []) {
  try {
    // Use pool.execute which automatically handles connection management
    // The charset is already set in dbConfig, but we ensure it's set for each query
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
}

// Get connection from pool
async function getConnection() {
  return await pool.getConnection();
}

module.exports = {
  pool,
  initializeDatabase,
  testConnection,
  executeQuery,
  getConnection
};
