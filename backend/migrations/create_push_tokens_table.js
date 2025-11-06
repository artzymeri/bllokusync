/**
 * Migration: Create push_tokens table for mobile notifications
 */

async function up(queryInterface, Sequelize) {
  console.log('\n[Migration] Creating push_tokens table...');

  try {
    await queryInterface.createTable('push_tokens', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      push_token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      device_type: {
        type: Sequelize.ENUM('ios', 'android'),
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      last_used_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    console.log('✓ Created push_tokens table');

    // Create index on user_id for faster lookups
    await queryInterface.addIndex('push_tokens', ['user_id'], {
      name: 'idx_push_tokens_user_id'
    });
    console.log('✓ Added index on user_id');

    // Create index on push_token for faster lookups
    await queryInterface.addIndex('push_tokens', ['push_token'], {
      name: 'idx_push_tokens_token'
    });
    console.log('✓ Added index on push_token');

    console.log('✓ Migration completed successfully\n');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  }
}

async function down(queryInterface, Sequelize) {
  console.log('\n[Migration] Dropping push_tokens table...');

  try {
    await queryInterface.dropTable('push_tokens');
    console.log('✓ Dropped push_tokens table');
    console.log('✓ Rollback completed successfully\n');
  } catch (error) {
    console.error('✗ Rollback failed:', error.message);
    throw error;
  }
}

module.exports = { up, down };

