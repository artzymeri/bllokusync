const { sequelize } = require('./config/database');

async function fixMigrations() {
  try {
    console.log('🔧 Fixing migration state...\n');

    // List of obsolete migrations that should be marked as executed
    const obsoleteMigrations = [
      'add_floors_to_properties.sql',
      'complete_privileged_to_property_manager_migration.sql',
      'corrected_migration.sql',
      'create_cities_table.sql',
      'create_property_managers_table.sql',
      'final_migration.sql',
      'fix_payment_month_dates.sql',
      'rename_privileged_to_property_manager.sql',
      'update_enum_privileged_to_property_manager.sql'
    ];

    console.log('Marking obsolete migrations as executed:\n');

    for (const migration of obsoleteMigrations) {
      try {
        await sequelize.query(
          'INSERT IGNORE INTO migrations (filename) VALUES (?)',
          { replacements: [migration] }
        );
        console.log(`  ✓ Marked: ${migration}`);
      } catch (error) {
        console.log(`  ⚠️  Skipped (already marked): ${migration}`);
      }
    }

    console.log('\n✅ Migration state fixed successfully!');
    console.log('You can now restart the server and the archived columns migration will run.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing migrations:', error);
    process.exit(1);
  }
}

// Connect to database and run
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established.\n');
    return fixMigrations();
  })
  .catch(err => {
    console.error('Unable to connect to database:', err);
    process.exit(1);
  });

