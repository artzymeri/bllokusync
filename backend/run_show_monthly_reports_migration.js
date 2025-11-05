const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'apartment_management'
    });

    console.log('Connected to database');

    // Check if column already exists
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM properties LIKE 'show_monthly_reports_to_tenants'"
    );

    if (columns.length > 0) {
      console.log('Column show_monthly_reports_to_tenants already exists. Skipping migration.');
      await connection.end();
      return;
    }

    console.log('Adding show_monthly_reports_to_tenants column to properties table...');

    // Add the column with default value TRUE for existing properties
    await connection.query(`
      ALTER TABLE properties
      ADD COLUMN show_monthly_reports_to_tenants BOOLEAN DEFAULT TRUE NOT NULL
      COMMENT 'Controls whether tenants of this property can view monthly reports'
    `);

    console.log('✓ Successfully added show_monthly_reports_to_tenants column');

    // Verify the migration
    const [result] = await connection.query(
      "SELECT COUNT(*) as count FROM properties WHERE show_monthly_reports_to_tenants = TRUE"
    );
    
    console.log(`✓ Migration complete. ${result[0].count} properties now have monthly reports enabled by default.`);

    await connection.end();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Migration failed:', error);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

runMigration();

