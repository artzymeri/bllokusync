/**
 * Migration: Add notice_day column to users table
 * This column is applicable only for tenant users
 */

async function up(queryInterface, Sequelize) {
  console.log('\n[Migration] Adding notice_day column to users table...');

  try {
    // Add notice_day column to users table (check if exists first)
    try {
      await queryInterface.addColumn('users', 'notice_day', {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
        comment: 'Notice day for tenant users (1-31)'
      });
      console.log('✓ Added notice_day column to users table');
    } catch (error) {
      if (error.message && error.message.includes('Duplicate column')) {
        console.log('ℹ️  notice_day column already exists in users table');
      } else {
        throw error;
      }
    }

    console.log('✓ Migration completed successfully\n');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  }
}

async function down(queryInterface, Sequelize) {
  console.log('\n[Migration] Removing notice_day column from users table...');

  try {
    await queryInterface.removeColumn('users', 'notice_day');
    console.log('✓ Removed notice_day column from users table');
    console.log('✓ Rollback completed successfully\n');
  } catch (error) {
    console.error('✗ Rollback failed:', error.message);
    throw error;
  }
}

module.exports = { up, down };

