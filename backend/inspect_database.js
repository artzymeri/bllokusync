/**
 * Direct database inspection to find duplicates
 */

require('dotenv').config();
const { sequelize } = require('./config/database');

async function inspectDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    // Get all October 2025 payments
    console.log('=== ALL OCTOBER 2025 PAYMENTS ===\n');
    const [octoberPayments] = await sequelize.query(`
      SELECT 
        id,
        tenant_id,
        property_id,
        payment_month,
        amount,
        status,
        payment_date,
        created_at
      FROM tenant_payments
      WHERE payment_month LIKE '2025-10%'
      ORDER BY tenant_id, property_id, id
    `);

    console.log(`Total October 2025 payments: ${octoberPayments.length}\n`);
    
    octoberPayments.forEach(p => {
      console.log(`ID: ${p.id} | Tenant: ${p.tenant_id} | Property: ${p.property_id} | Month: ${p.payment_month} | Status: ${p.status} | Amount: €${p.amount}`);
    });

    // Check for duplicates with simple query
    console.log('\n\n=== DUPLICATE CHECK ===\n');
    const [duplicates] = await sequelize.query(`
      SELECT 
        tenant_id,
        property_id,
        payment_month,
        COUNT(*) as count
      FROM tenant_payments
      WHERE payment_month LIKE '2025-10%'
      GROUP BY tenant_id, property_id, payment_month
      HAVING count > 1
    `);

    console.log(`Duplicate groups found: ${duplicates.length}\n`);
    duplicates.forEach(dup => {
      console.log(`Tenant ${dup.tenant_id} + Property ${dup.property_id} + Month ${dup.payment_month} = ${dup.count} records`);
    });

    // Get tenant names
    console.log('\n\n=== TENANT INFO ===\n');
    const [tenants] = await sequelize.query(`
      SELECT id, name, surname, apartment_label
      FROM users
      WHERE role = 'tenant'
      ORDER BY id
    `);

    tenants.forEach(t => {
      console.log(`ID: ${t.id} | Name: ${t.name} ${t.surname} | Apartment: ${t.apartment_label || 'N/A'}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

inspectDatabase();

