/**
 * IMMEDIATE CLEANUP: Remove ALL duplicate payment records
 * Run this with: node cleanup_all_duplicate_payments.js
 */

require('dotenv').config();
const { sequelize } = require('./config/database');
const { TenantPayment } = require('./models');
const { Op } = require('sequelize');

async function cleanupAllDuplicates() {
  console.log('\n🚀 Starting IMMEDIATE duplicate payment cleanup...\n');
  console.log('=' .repeat(60));

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Find all payment records
    const allPayments = await TenantPayment.findAll({
      order: [
        ['tenant_id', 'ASC'],
        ['property_id', 'ASC'],
        ['payment_month', 'ASC'],
        ['status', 'DESC'], // Paid first
        ['created_at', 'DESC'] // Most recent first
      ],
      raw: true
    });

    console.log(`📊 Total payment records in database: ${allPayments.length}\n`);

    if (allPayments.length === 0) {
      console.log('ℹ️  No payment records found.');
      return { duplicatesFound: 0, duplicatesRemoved: 0 };
    }

    // Group payments by unique key (tenant + property + month)
    const paymentGroups = new Map();

    allPayments.forEach(payment => {
      const key = `${payment.tenant_id}-${payment.property_id}-${payment.payment_month}`;

      if (!paymentGroups.has(key)) {
        paymentGroups.set(key, []);
      }

      paymentGroups.get(key).push(payment);
    });

    console.log(`🔍 Found ${paymentGroups.size} unique tenant/property/month combinations\n`);

    // Find and process duplicates
    let duplicateGroups = 0;
    let totalDuplicatesFound = 0;
    const idsToDelete = [];

    for (const [key, payments] of paymentGroups.entries()) {
      if (payments.length > 1) {
        duplicateGroups++;
        totalDuplicatesFound += payments.length - 1;

        const [tenantId, propertyId, month] = key.split('-');

        console.log(`\n🔴 Duplicate Group #${duplicateGroups}: Tenant ${tenantId}, Property ${propertyId}, Month ${month}`);
        console.log(`   Found ${payments.length} records:`);

        payments.forEach((p, idx) => {
          const statusIcon = p.status === 'paid' ? '💰' : p.status === 'pending' ? '⏳' : '⚠️';
          console.log(`   ${idx + 1}. ${statusIcon} ID: ${p.id} | Status: ${p.status.padEnd(8)} | Amount: €${p.amount} | Created: ${new Date(p.created_at).toISOString().split('T')[0]}`);
        });

        // Decide which one to keep
        // Priority: paid status > most recent
        const paidPayment = payments.find(p => p.status === 'paid');
        const keepPayment = paidPayment || payments[0]; // payments[0] is most recent due to ordering

        console.log(`   ✅ KEEPING: ID ${keepPayment.id} (${keepPayment.status})`);

        // Mark all others for deletion
        payments.forEach(p => {
          if (p.id !== keepPayment.id) {
            idsToDelete.push(p.id);
            console.log(`   ❌ DELETING: ID ${p.id} (${p.status})`);
          }
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`   Duplicate groups found: ${duplicateGroups}`);
    console.log(`   Total duplicate records: ${totalDuplicatesFound}`);
    console.log(`   Records to delete: ${idsToDelete.length}`);
    console.log('='.repeat(60));

    if (idsToDelete.length > 0) {
      console.log('\n⚠️  PROCEEDING WITH DELETION...\n');

      // Delete in batches of 100 for safety
      const batchSize = 100;
      let deletedCount = 0;

      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize);

        const result = await TenantPayment.destroy({
          where: { id: { [Op.in]: batch } }
        });

        deletedCount += result;
        console.log(`   Deleted batch ${Math.floor(i / batchSize) + 1}: ${result} records`);
      }

      console.log('\n' + '='.repeat(60));
      console.log(`✅ SUCCESS! Deleted ${deletedCount} duplicate payment records!`);
      console.log('='.repeat(60));

      // Verify cleanup
      const remainingPayments = await TenantPayment.findAll({ raw: true });
      const verificationGroups = new Map();

      remainingPayments.forEach(payment => {
        const key = `${payment.tenant_id}-${payment.property_id}-${payment.payment_month}`;
        if (!verificationGroups.has(key)) {
          verificationGroups.set(key, 0);
        }
        verificationGroups.set(key, verificationGroups.get(key) + 1);
      });

      const stillHasDuplicates = Array.from(verificationGroups.values()).some(count => count > 1);

      if (stillHasDuplicates) {
        console.log('\n⚠️  WARNING: Some duplicates may still exist. Re-run this script.');
      } else {
        console.log('\n✅ VERIFICATION: No duplicates remaining in database!');
      }

      return {
        duplicatesFound: totalDuplicatesFound,
        duplicatesRemoved: deletedCount
      };
    } else {
      console.log('\n✅ No duplicates found! Database is clean.\n');
      return { duplicatesFound: 0, duplicatesRemoved: 0 };
    }

  } catch (error) {
    console.error('\n❌ ERROR during cleanup:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.\n');
  }
}

// Run immediately
if (require.main === module) {
  cleanupAllDuplicates()
    .then(result => {
      console.log('🎉 Cleanup process completed!\n');
      console.log(`   Duplicates found: ${result.duplicatesFound}`);
      console.log(`   Duplicates removed: ${result.duplicatesRemoved}\n`);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { cleanupAllDuplicates };

