const mysql = require('mysql2/promise');

async function testUTF8() {
    const connection = await mysql.createConnection({
        host: 'db',
        port: 3306,
        user: 'techsupport_user',
        password: 'techsupport_pass',
        database: 'techsupport_db',
        charset: 'utf8mb4'
    });

    try {
        // Test inserting special characters
        const testData = {
            username: 'test_user_ñ',
            email: 'test@example.com',
            password_hash: 'test_hash',
            full_name: 'José María González-López',
            role: 'auditor',
            location: 'MX'
        };

        // Insert test data
        await connection.execute(
            'INSERT INTO users (username, email, password_hash, full_name, role, location) VALUES (?, ?, ?, ?, ?, ?)',
            [testData.username, testData.email, testData.password_hash, testData.full_name, testData.role, testData.location]
        );

        // Retrieve and display the data
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [testData.username]);
        
        console.log('✅ UTF-8 Test Results:');
        console.log('Inserted:', testData.full_name);
        console.log('Retrieved:', rows[0].full_name);
        console.log('Match:', testData.full_name === rows[0].full_name ? '✅ YES' : '❌ NO');
        
        // Clean up test data
        await connection.execute('DELETE FROM users WHERE username = ?', [testData.username]);
        
    } catch (error) {
        console.error('❌ UTF-8 Test Failed:', error);
    } finally {
        await connection.end();
    }
}

testUTF8();
