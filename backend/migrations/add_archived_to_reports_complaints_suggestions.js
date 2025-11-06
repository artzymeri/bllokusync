/**
 * Migration: Add archived column to reports, complaints, and suggestions tables
 */

async function up(queryInterface, Sequelize) {
  console.log('\n[Migration] Adding archived columns...');

  try {
    // Add archived column to reports table (check if exists first)
    try {
      await queryInterface.addColumn('reports', 'archived', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('✓ Added archived column to reports table');
    } catch (error) {
      if (error.message && error.message.includes('Duplicate column')) {
        console.log('ℹ️  archived column already exists in reports table');
      } else {
        throw error;
      }
    }

    // Add archived column to complaints table (check if exists first)
    try {
      await queryInterface.addColumn('complaints', 'archived', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('✓ Added archived column to complaints table');
    } catch (error) {
      if (error.message && error.message.includes('Duplicate column')) {
        console.log('ℹ️  archived column already exists in complaints table');
      } else {
        throw error;
      }
    }

    // Add archived column to suggestions table (check if exists first)
    try {
      await queryInterface.addColumn('suggestions', 'archived', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
      console.log('✓ Added archived column to suggestions table');
    } catch (error) {
      if (error.message && error.message.includes('Duplicate column')) {
        console.log('ℹ️  archived column already exists in suggestions table');
      } else {
        throw error;
      }
    }

    console.log('[Migration] Archived columns migration completed!\n');
  } catch (error) {
    console.error('[Migration] Error adding archived columns:', error);
    throw error;
  }
}

async function down(queryInterface, Sequelize) {
  console.log('\n[Migration] Removing archived columns...');

  await queryInterface.removeColumn('reports', 'archived');
  await queryInterface.removeColumn('complaints', 'archived');
  await queryInterface.removeColumn('suggestions', 'archived');

  console.log('[Migration] Archived columns removed!\n');
}

module.exports = { up, down };
