const { executeQuery, getConnection } = require('../config/database');

async function migrateSignatureFields() {
  let connection;
  try {
    console.log('🔄 Iniciando migración de campos de firma...');
    
    connection = await getConnection();
    
    // Verificar si las columnas ya existen
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'onboarding_processes'
      AND COLUMN_NAME IN ('signature_url', 'signature_request_id', 'document_path')
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 Columnas existentes:', existingColumns);
    
    // Agregar signature_url si no existe
    if (!existingColumns.includes('signature_url')) {
      console.log('➕ Agregando columna signature_url...');
      await connection.execute(`
        ALTER TABLE onboarding_processes 
        ADD COLUMN signature_url TEXT NULL
      `);
      console.log('✅ Columna signature_url agregada');
    } else {
      console.log('⏭️  Columna signature_url ya existe');
    }
    
    // Agregar signature_request_id si no existe
    if (!existingColumns.includes('signature_request_id')) {
      console.log('➕ Agregando columna signature_request_id...');
      await connection.execute(`
        ALTER TABLE onboarding_processes 
        ADD COLUMN signature_request_id VARCHAR(255) NULL
      `);
      console.log('✅ Columna signature_request_id agregada');
    } else {
      console.log('⏭️  Columna signature_request_id ya existe');
    }
    
    // Agregar document_path si no existe
    if (!existingColumns.includes('document_path')) {
      console.log('➕ Agregando columna document_path...');
      await connection.execute(`
        ALTER TABLE onboarding_processes 
        ADD COLUMN document_path VARCHAR(500) NULL
      `);
      console.log('✅ Columna document_path agregada');
    } else {
      console.log('⏭️  Columna document_path ya existe');
    }
    
    // Verificar si el índice ya existe
    const [indexes] = await connection.execute(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'onboarding_processes'
      AND INDEX_NAME = 'idx_signature_request_id'
    `);
    
    if (indexes.length === 0) {
      console.log('➕ Creando índice idx_signature_request_id...');
      await connection.execute(`
        CREATE INDEX idx_signature_request_id 
        ON onboarding_processes(signature_request_id)
      `);
      console.log('✅ Índice idx_signature_request_id creado');
    } else {
      console.log('⏭️  Índice idx_signature_request_id ya existe');
    }
    
    console.log('✅ Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateSignatureFields()
    .then(() => {
      console.log('🎉 Migración finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { migrateSignatureFields };

