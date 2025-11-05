const { sequelize } = require('../config/database');

async function addArchivedColumns() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log('Starting migration: Adding archived column to reports, complaints, and suggestions...');

    // Add archived column to reports table
    await queryInterface.addColumn('reports', 'archived', {
      type: sequelize.Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    console.log('✓ Added archived column to reports table');

    // Add archived column to complaints table
    await queryInterface.addColumn('complaints', 'archived', {
      type: sequelize.Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    console.log('✓ Added archived column to complaints table');

    // Add archived column to suggestions table
    await queryInterface.addColumn('suggestions', 'archived', {
      type: sequelize.Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    console.log('✓ Added archived column to suggestions table');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addArchivedColumns();

