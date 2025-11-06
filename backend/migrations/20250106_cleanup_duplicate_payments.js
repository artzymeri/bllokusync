/**
 * Migration: Cleanup duplicate payment records
 * Removes duplicate payment records keeping the most appropriate one (prefers paid status)
 * Ensures unique constraint on tenant_id + property_id + payment_month
 */

async function up(queryInterface, Sequelize) {
  console.log('\n🔍 [Migration] Starting duplicate payment cleanup...');

  try {
    // Find all duplicate groups using raw SQL
    const [duplicateGroups] = await queryInterface.sequelize.query(`
      SELECT 
        tenant_id, 
        property_id, 
        payment_month, 
        COUNT(*) as duplicate_count,
        GROUP_CONCAT(id ORDER BY 
          CASE WHEN status = 'paid' THEN 0 ELSE 1 END,
          created_at DESC
          SEPARATOR ',') as all_ids
      FROM tenant_payments
      GROUP BY tenant_id, property_id, payment_month
      HAVING duplicate_count > 1
      ORDER BY tenant_id, property_id, payment_month
    `);

    console.log(`📊 [Migration] Found ${duplicateGroups.length} duplicate groups`);

    if (duplicateGroups.length === 0) {
      console.log('✅ [Migration] No duplicates found. Database is clean!');
      return;
    }

    let totalDuplicatesDeleted = 0;

    // Process each duplicate group
    for (const group of duplicateGroups) {
      const ids = group.all_ids.split(',').map(id => parseInt(id));
      const keepId = ids[0]; // First ID is the one to keep (paid status or most recent)
      const deleteIds = ids.slice(1); // Rest should be deleted

      console.log(`\n🔴 [Migration] Duplicate: Tenant ${group.tenant_id}, Property ${group.property_id}, Month ${group.payment_month}`);
      console.log(`   Found ${group.duplicate_count} records`);
      console.log(`   ✅ Keeping ID: ${keepId}`);
      console.log(`   ❌ Deleting IDs: ${deleteIds.join(', ')}`);

      // Delete the duplicate records
      await queryInterface.sequelize.query(`
        DELETE FROM tenant_payments 
        WHERE id IN (${deleteIds.join(',')})
      `);

      totalDuplicatesDeleted += deleteIds.length;
    }

    console.log(`\n✅ [Migration] Successfully deleted ${totalDuplicatesDeleted} duplicate payment records!`);

    // Verify cleanup
    const [remainingDuplicates] = await queryInterface.sequelize.query(`
      SELECT COUNT(*) as count
      FROM (
        SELECT tenant_id, property_id, payment_month, COUNT(*) as dup_count
        FROM tenant_payments
        GROUP BY tenant_id, property_id, payment_month
        HAVING dup_count > 1
      ) as duplicates
    `);

    if (remainingDuplicates[0].count > 0) {
      console.log(`⚠️  [Migration] Warning: ${remainingDuplicates[0].count} duplicate groups still exist!`);
    } else {
      console.log('✅ [Migration] Verification: No duplicates remaining!');
    }

    // Ensure the unique index exists
    console.log('\n🔧 [Migration] Ensuring unique constraint exists...');
    
    try {
      await queryInterface.addIndex('tenant_payments', 
        ['tenant_id', 'property_id', 'payment_month'],
        {
          unique: true,
          name: 'unique_tenant_property_month',
          type: 'UNIQUE'
        }
      );
      console.log('✅ [Migration] Unique constraint created successfully!');
    } catch (indexError) {
      if (indexError.message && indexError.message.includes('Duplicate key name')) {
        console.log('ℹ️  [Migration] Unique constraint already exists.');
      } else {
        console.log('⚠️  [Migration] Could not create unique constraint:', indexError.message);
      }
    }

    console.log('🎉 [Migration] Duplicate payment cleanup completed successfully!\n');

  } catch (error) {
    console.error('❌ [Migration] Error during duplicate payment cleanup:', error);
    throw error;
  }
}

async function down(queryInterface, Sequelize) {
  // This migration is a cleanup operation, so there's no meaningful rollback
  console.log('ℹ️  [Migration] Rollback not applicable for cleanup migration.');
}

module.exports = { up, down };
