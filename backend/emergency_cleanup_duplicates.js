/**
 * EMERGENCY CLEANUP - Run this directly to remove ALL duplicates RIGHT NOW
 * This bypasses migrations and directly cleans the database
 */

require('dotenv').config();
const { sequelize } = require('./config/database');

async function emergencyCleanup() {
  try {
    console.log('🚨 EMERGENCY DUPLICATE CLEANUP STARTING...\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Step 1: Show what we have before cleanup
    console.log('📊 BEFORE CLEANUP:');
    const [beforeDuplicates] = await sequelize.query(`
      SELECT 
        tenant_id,
        property_id,
        payment_month,
        COUNT(*) as duplicate_count
      FROM tenant_payments
      WHERE payment_month = '2025-10-01'
      GROUP BY tenant_id, property_id, payment_month
      HAVING duplicate_count > 1
    `);
    
    console.log(`Found ${beforeDuplicates.length} duplicate groups in October 2025\n`);
    beforeDuplicates.forEach(dup => {
      console.log(`  Tenant ${dup.tenant_id} + Property ${dup.property_id} = ${dup.duplicate_count} records`);
    });

    // Step 2: Delete duplicates using a reliable method
    console.log('\n🔥 DELETING DUPLICATES...\n');
    
    const [result] = await sequelize.query(`
      DELETE t1 FROM tenant_payments t1
      INNER JOIN tenant_payments t2 
      WHERE t1.tenant_id = t2.tenant_id 
        AND t1.property_id = t2.property_id 
        AND t1.payment_month = t2.payment_month
        AND (
          (t2.status = 'paid' AND t1.status != 'paid') 
          OR 
          (t1.status = t2.status AND t1.id > t2.id)
        )
    `);

    console.log(`✅ Deleted ${result.affectedRows || 0} duplicate records\n`);

    // Step 3: Verify cleanup
    console.log('📊 AFTER CLEANUP:');
    const [afterDuplicates] = await sequelize.query(`
      SELECT 
        tenant_id,
        property_id,
        payment_month,
        COUNT(*) as duplicate_count
      FROM tenant_payments
      WHERE payment_month = '2025-10-01'
      GROUP BY tenant_id, property_id, payment_month
      HAVING duplicate_count > 1
    `);

    if (afterDuplicates.length === 0) {
      console.log('✅ SUCCESS! No duplicates remaining!\n');
    } else {
      console.log(`⚠️  WARNING: Still ${afterDuplicates.length} duplicate groups remaining:\n`);
      afterDuplicates.forEach(dup => {
        console.log(`  Tenant ${dup.tenant_id} + Property ${dup.property_id} = ${dup.duplicate_count} records`);
      });
    }

    // Step 4: Show final October 2025 payments
    console.log('\n📋 FINAL OCTOBER 2025 PAYMENTS:');
    const [finalPayments] = await sequelize.query(`
      SELECT 
        tp.id,
        tp.tenant_id,
        u.name,
        u.surname,
        u.apartment_label,
        tp.property_id,
        p.name as property_name,
        tp.status,
        tp.amount
      FROM tenant_payments tp
      LEFT JOIN users u ON tp.tenant_id = u.id
      LEFT JOIN properties p ON tp.property_id = p.id
      WHERE tp.payment_month = '2025-10-01'
      ORDER BY tp.tenant_id, tp.property_id
    `);

    console.log(`Total October 2025 payments: ${finalPayments.length}\n`);
    finalPayments.forEach(p => {
      console.log(`  ID ${p.id}: ${p.name} ${p.surname} (${p.apartment_label || 'N/A'}) - ${p.property_name} - ${p.status} - €${p.amount}`);
    });

    await sequelize.close();
    console.log('\n🎉 EMERGENCY CLEANUP COMPLETED!\n');
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    process.exit(1);
  }
}

emergencyCleanup();

