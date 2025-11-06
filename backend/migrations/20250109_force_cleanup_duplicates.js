/**
 * Migration: Force cleanup of all duplicate payment records
 * Uses a different filename to ensure it runs even if previous cleanups were marked as complete
 */

async function up(queryInterface, Sequelize) {
  console.log('\n🚨 [Migration] FORCE CLEANUP - Removing all duplicate payment records...\n');

  try {
    // Get all payments and group by tenant/property/month
    const [allPayments] = await queryInterface.sequelize.query(`
      SELECT 
        id,
        tenant_id,
        property_id,
        payment_month,
        status,
        created_at,
        ROW_NUMBER() OVER (
          PARTITION BY tenant_id, property_id, payment_month 
          ORDER BY 
            CASE WHEN status = 'paid' THEN 0 ELSE 1 END,
            id ASC
        ) as row_num
      FROM tenant_payments
      ORDER BY payment_month DESC, tenant_id, property_id
    `);

    console.log(`📊 [Migration] Total payment records: ${allPayments.length}`);

    // Filter to get only the duplicate records (row_num > 1)
    const duplicateIds = allPayments
      .filter(p => p.row_num > 1)
      .map(p => p.id);

    console.log(`🔴 [Migration] Found ${duplicateIds.length} duplicate records to delete\n`);

    if (duplicateIds.length === 0) {
      console.log('✅ [Migration] No duplicates found. Database is clean!\n');
      return;
    }

    // Show which records will be deleted
    const duplicatesByGroup = {};
    allPayments.filter(p => p.row_num > 1).forEach(p => {
      const key = `${p.tenant_id}-${p.property_id}-${p.payment_month}`;
      if (!duplicatesByGroup[key]) {
        duplicatesByGroup[key] = [];
      }
      duplicatesByGroup[key].push(p.id);
    });

    let groupCount = 0;
    for (const key in duplicatesByGroup) {
      groupCount++;
      const [tenantId, propertyId, month] = key.split('-');
      const ids = duplicatesByGroup[key];
      console.log(`  ${groupCount}. Tenant ${tenantId}, Property ${propertyId}, Month ${month}`);
      console.log(`     Deleting IDs: ${ids.join(', ')}`);
    }

    // Delete all duplicates in one query
    console.log(`\n🔥 [Migration] Deleting ${duplicateIds.length} duplicate records...\n`);
    
    // Split into batches of 100 for safety
    const batchSize = 100;
    let totalDeleted = 0;
    
    for (let i = 0; i < duplicateIds.length; i += batchSize) {
      const batch = duplicateIds.slice(i, i + batchSize);
      const [result] = await queryInterface.sequelize.query(`
        DELETE FROM tenant_payments WHERE id IN (${batch.join(',')})
      `);
      totalDeleted += batch.length;
      console.log(`   Deleted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
    }

    console.log(`\n✅ [Migration] Successfully deleted ${totalDeleted} duplicate records!\n`);

    // Verify no duplicates remain
    const [verification] = await queryInterface.sequelize.query(`
      SELECT COUNT(*) as duplicate_count
      FROM (
        SELECT tenant_id, property_id, payment_month, COUNT(*) as cnt
        FROM tenant_payments
        GROUP BY tenant_id, property_id, payment_month
        HAVING cnt > 1
      ) as duplicates
    `);

    if (verification[0].duplicate_count === 0) {
      console.log('✅ [Migration] VERIFICATION PASSED: No duplicates remaining!\n');
    } else {
      console.log(`⚠️  [Migration] WARNING: ${verification[0].duplicate_count} duplicate groups still exist!\n`);
    }

    // Ensure unique index exists
    console.log('🔧 [Migration] Ensuring unique constraint exists...');
    try {
      await queryInterface.addIndex('tenant_payments', 
        ['tenant_id', 'property_id', 'payment_month'],
        {
          unique: true,
          name: 'unique_tenant_property_month',
          type: 'UNIQUE'
        }
      );
      console.log('✅ [Migration] Unique constraint created successfully!\n');
    } catch (indexError) {
      if (indexError.message && (indexError.message.includes('Duplicate key name') || indexError.message.includes('already exists'))) {
        console.log('ℹ️  [Migration] Unique constraint already exists.\n');
      } else {
        console.log('⚠️  [Migration] Could not create unique constraint:', indexError.message, '\n');
      }
    }

    console.log('🎉 [Migration] FORCE CLEANUP COMPLETED SUCCESSFULLY!\n');

  } catch (error) {
    console.error('❌ [Migration] ERROR during force cleanup:', error);
    throw error;
  }
}

async function down(queryInterface, Sequelize) {
  console.log('ℹ️  [Migration] Rollback not applicable for cleanup migration.');
}

module.exports = { up, down };

