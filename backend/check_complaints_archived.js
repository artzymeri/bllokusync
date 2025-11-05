const { Complaint } = require('./models');
const { Op } = require('sequelize');

(async () => {
  try {
    // Check all complaints with their archived status
    const complaints = await Complaint.findAll({
      attributes: ['id', 'title', 'status', 'archived'],
      order: [['id', 'DESC']],
      limit: 20
    });
    
    console.log('Recent complaints:');
    console.log('================');
    complaints.forEach(c => {
      console.log(`ID: ${c.id}, Title: ${c.title}, Status: ${c.status}, Archived: ${c.archived}`);
    });
    
    // Count pending non-archived
    const pendingCount = await Complaint.count({
      where: {
        status: 'pending',
        archived: false
      }
    });
    
    console.log(`\n📊 Pending non-archived complaints: ${pendingCount}`);
    
    // Count all pending (including archived)
    const allPendingCount = await Complaint.count({
      where: {
        status: 'pending'
      }
    });
    
    console.log(`📊 All pending complaints (incl archived): ${allPendingCount}`);
    
    // Count archived pending
    const archivedPendingCount = await Complaint.count({
      where: {
        status: 'pending',
        archived: true
      }
    });
    
    console.log(`📊 Archived pending complaints: ${archivedPendingCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();

