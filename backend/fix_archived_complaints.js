const { Complaint } = require('./models');
const { Op } = require('sequelize');

(async () => {
  try {
    console.log('🔍 Checking for complaints with archived issues...\n');
    
    // Find all pending complaints
    const allPendingComplaints = await Complaint.findAll({
      where: {
        status: 'pending'
      },
      attributes: ['id', 'title', 'status', 'archived', 'property_id', 'created_at']
    });
    
    console.log(`Total pending complaints: ${allPendingComplaints.length}`);
    console.log('=====================================');
    
    allPendingComplaints.forEach(c => {
      console.log(`ID: ${c.id}`);
      console.log(`  Title: ${c.title}`);
      console.log(`  Status: ${c.status}`);
      console.log(`  Archived: ${c.archived} (type: ${typeof c.archived})`);
      console.log(`  Property ID: ${c.property_id}`);
      console.log(`  Created: ${c.created_at}`);
      console.log('---');
    });
    
    // Count complaints where archived is NOT true (this is what the API does)
    const countNotArchived = await Complaint.count({
      where: {
        status: 'pending',
        archived: { [Op.ne]: true }
      }
    });
    
    console.log(`\n📊 Count (archived != true): ${countNotArchived}`);
    
    // Count complaints where archived is explicitly false
    const countExplicitlyFalse = await Complaint.count({
      where: {
        status: 'pending',
        archived: false
      }
    });
    
    console.log(`📊 Count (archived = false): ${countExplicitlyFalse}`);
    
    // Count complaints where archived is null
    const countNull = await Complaint.count({
      where: {
        status: 'pending',
        archived: null
      }
    });
    
    console.log(`📊 Count (archived = null): ${countNull}`);
    
    // Count complaints where archived is true
    const countArchived = await Complaint.count({
      where: {
        status: 'pending',
        archived: true
      }
    });
    
    console.log(`📊 Count (archived = true): ${countArchived}`);
    
    // Find complaints that should be archived but aren't
    console.log('\n🔧 Looking for complaints that might need to be archived...');
    const complaintsToFix = allPendingComplaints.filter(c => c.archived !== true);
    
    if (complaintsToFix.length > 0) {
      console.log(`\nFound ${complaintsToFix.length} complaint(s) that are NOT archived:`);
      complaintsToFix.forEach(c => {
        console.log(`  - ID ${c.id}: "${c.title}" (archived value: ${c.archived})`);
      });
      
      console.log('\n⚠️  If these should be archived, you can manually archive them from the frontend');
      console.log('   or set archived=true in the database.');
    } else {
      console.log('✅ No complaints found that need fixing.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();

