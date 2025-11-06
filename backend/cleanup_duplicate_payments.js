/**
 * Script to find and remove duplicate payment records
 * Keeps the most recent record for each tenant/property/month combination
 */

const { TenantPayment, sequelize } = require('./models');
const { Op } = require('sequelize');

async function cleanupDuplicatePayments() {
  console.log('🔍 Starting duplicate payment cleanup...\n');

  try {
    // Find all payment records grouped by tenant_id, property_id, and payment_month
    const allPayments = await TenantPayment.findAll({
      order: [['tenant_id', 'ASC'], ['property_id', 'ASC'], ['payment_month', 'ASC'], ['created_at', 'DESC']]
    });

    console.log(`📊 Total payment records: ${allPayments.length}\n`);

    // Group payments by unique key
    const paymentGroups = {};
    allPayments.forEach(payment => {
      const key = `${payment.tenant_id}-${payment.property_id}-${payment.payment_month}`;

      if (!paymentGroups[key]) {
        paymentGroups[key] = [];
      }

      paymentGroups[key].push(payment);
    });

    // Find duplicates
    let duplicatesFound = 0;
    let duplicatesRemoved = 0;
    const paymentsToDelete = [];

    for (const key in paymentGroups) {
      const payments = paymentGroups[key];

      if (payments.length > 1) {
        duplicatesFound += payments.length - 1;

        console.log(`\n🔴 Found ${payments.length} duplicate records for key: ${key}`);
        payments.forEach((p, idx) => {
          console.log(`  ${idx + 1}. ID: ${p.id}, Status: ${p.status}, Payment Date: ${p.payment_date || 'N/A'}, Created: ${p.created_at}`);
        });

        // Keep the first one (most recent by created_at due to our ordering)
        // But prefer 'paid' status if one exists
        const paidPayment = payments.find(p => p.status === 'paid');
        const keepPayment = paidPayment || payments[0];

        console.log(`  ✅ Keeping: ID ${keepPayment.id} (Status: ${keepPayment.status})`);

        // Mark others for deletion
        payments.forEach(p => {
          if (p.id !== keepPayment.id) {
            paymentsToDelete.push(p.id);
            console.log(`  ❌ Will delete: ID ${p.id}`);
          }
        });
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Total duplicate records found: ${duplicatesFound}`);
    console.log(`   Records to be deleted: ${paymentsToDelete.length}`);

    if (paymentsToDelete.length > 0) {
      console.log('\n⚠️  Proceeding with deletion in 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Delete duplicates
      const deleteResult = await TenantPayment.destroy({
        where: {
          id: { [Op.in]: paymentsToDelete }
        }
      });

      console.log(`\n✅ Successfully deleted ${deleteResult} duplicate payment records!`);
      duplicatesRemoved = deleteResult;
    } else {
      console.log('\n✅ No duplicates to remove!');
    }

    console.log('\n🎉 Cleanup completed successfully!\n');

    return {
      duplicatesFound,
      duplicatesRemoved
    };

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup
if (require.main === module) {
  cleanupDuplicatePayments()
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDuplicatePayments };

