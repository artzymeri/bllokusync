/**
 * Check for duplicate payment records in the database
 */

require('dotenv').config();
const { sequelize } = require('./config/database');

async function checkDuplicates() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Check for duplicates
    const [duplicates] = await sequelize.query(`
      SELECT 
        tenant_id, 
        property_id, 
        payment_month, 
        COUNT(*) as duplicate_count,
        GROUP_CONCAT(id ORDER BY status='paid' DESC, created_at DESC) as payment_ids,
        GROUP_CONCAT(status ORDER BY status='paid' DESC, created_at DESC) as statuses
      FROM tenant_payments
      GROUP BY tenant_id, property_id, payment_month
      HAVING duplicate_count > 1
      ORDER BY tenant_id, property_id, payment_month
    `);

    console.log(`Found ${duplicates.length} duplicate groups:\n`);

    if (duplicates.length > 0) {
      duplicates.forEach((dup, idx) => {
        console.log(`${idx + 1}. Tenant ${dup.tenant_id}, Property ${dup.property_id}, Month ${dup.payment_month}`);
        console.log(`   Count: ${dup.duplicate_count}`);
        console.log(`   IDs: ${dup.payment_ids}`);
        console.log(`   Statuses: ${dup.statuses}\n`);
      });
    } else {
      console.log('✅ No duplicates found! Database is clean.\n');
    }

    // Check if migration was recorded
    const [migrations] = await sequelize.query(`
      SELECT filename, executed_at 
      FROM migrations 
      WHERE filename LIKE '%duplicate%' OR filename LIKE '%20250106%'
      ORDER BY executed_at DESC
    `);

    console.log('Migration history:');
    if (migrations.length > 0) {
      migrations.forEach(m => {
        console.log(`  - ${m.filename} (executed: ${m.executed_at})`);
      });
    } else {
      console.log('  ⚠️  No duplicate cleanup migration found in history!');
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDuplicates();

