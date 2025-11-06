/**
 * Migration: Final cleanup of all duplicate payment records
 * This runs automatically on server start via npm run start
 */

async function up(queryInterface, Sequelize) {
  console.log('\n🔥 [Migration] Starting FINAL duplicate payment cleanup...\n');

  try {
    // Step 1: Check for duplicates
    const [duplicates] = await queryInterface.sequelize.query(`
      SELECT 
        tenant_id,
        property_id,
        payment_month,
        COUNT(*) as duplicate_count,
        GROUP_CONCAT(id ORDER BY 
          CASE WHEN status = 'paid' THEN 0 ELSE 1 END,
          id ASC
          SEPARATOR ',') as all_ids
      FROM tenant_payments
      GROUP BY tenant_id, property_id, payment_month
      HAVING duplicate_count > 1
      ORDER BY payment_month DESC, tenant_id
    `);

    console.log(`📊 [Migration] Found ${duplicates.length} duplicate groups\n`);

    if (duplicates.length === 0) {
      console.log('✅ [Migration] No duplicates found. Database is clean!\n');
      return;
    }

    let totalDeleted = 0;

    // Step 2: Process each duplicate group
    for (const dup of duplicates) {
      const ids = dup.all_ids.split(',').map(id => parseInt(id));
      const keepId = ids[0]; // First ID is the one to keep (paid or lowest ID)
      const deleteIds = ids.slice(1); // Rest will be deleted

      console.log(`🔴 [Migration] Duplicate: Tenant ${dup.tenant_id}, Property ${dup.property_id}, Month ${dup.payment_month}`);
      console.log(`   Records: ${dup.duplicate_count} | Keeping ID: ${keepId} | Deleting: ${deleteIds.join(', ')}`);

      // Delete the duplicates
      if (deleteIds.length > 0) {
        const [result] = await queryInterface.sequelize.query(`
          DELETE FROM tenant_payments WHERE id IN (${deleteIds.join(',')})
        `);
        totalDeleted += deleteIds.length;
      }
    }

    console.log(`\n✅ [Migration] Deleted ${totalDeleted} duplicate payment records!\n`);

    // Step 3: Verify cleanup
    const [remaining] = await queryInterface.sequelize.query(`
      SELECT COUNT(*) as count
      FROM (
        SELECT tenant_id, property_id, payment_month, COUNT(*) as dup_count
        FROM tenant_payments
        GROUP BY tenant_id, property_id, payment_month
        HAVING dup_count > 1
      ) as dups
    `);

    if (remaining[0].count === 0) {
      console.log('✅ [Migration] VERIFICATION: No duplicates remaining!\n');
    } else {
      console.log(`⚠️  [Migration] WARNING: ${remaining[0].count} duplicate groups still exist!\n`);
    }

    // Step 4: Ensure unique index exists
    console.log('🔧 [Migration] Ensuring unique constraint...');
    try {
      await queryInterface.addIndex('tenant_payments', 
        ['tenant_id', 'property_id', 'payment_month'],
        {
          unique: true,
          name: 'unique_tenant_property_month',
          type: 'UNIQUE'
        }
      );
      console.log('✅ [Migration] Unique constraint created!\n');
    } catch (indexError) {
      if (indexError.message && (indexError.message.includes('Duplicate key name') || indexError.message.includes('already exists'))) {
        console.log('ℹ️  [Migration] Unique constraint already exists.\n');
      } else {
        console.log('⚠️  [Migration] Could not create unique constraint:', indexError.message, '\n');
      }
    }

    console.log('🎉 [Migration] Duplicate payment cleanup completed successfully!\n');

  } catch (error) {
    console.error('❌ [Migration] Error during cleanup:', error);
    throw error;
  }
}

async function down(queryInterface, Sequelize) {
  console.log('ℹ️  [Migration] Rollback not applicable for cleanup migration.');
}

module.exports = { up, down };

