const { Complaint } = require('./models');

(async () => {
  try {
    console.log('🔧 Fixing archived field for all complaints...\n');
    
    // Find all complaints where archived is null or undefined
    const complaintsWithNullArchived = await Complaint.findAll({
      where: {
        archived: null
      }
    });
    
    console.log(`Found ${complaintsWithNullArchived.length} complaints with archived = null`);
    
    if (complaintsWithNullArchived.length > 0) {
      // Update them to false
      await Complaint.update(
        { archived: false },
        {
          where: {
            archived: null
          }
        }
      );
      
      console.log(`✅ Updated ${complaintsWithNullArchived.length} complaints: set archived = false`);
    }
    
    // Verify the fix
    console.log('\n📊 Verification:');
    
    const pendingNotArchived = await Complaint.count({
      where: {
        status: 'pending',
        archived: false
      }
    });
    
    const pendingArchived = await Complaint.count({
      where: {
        status: 'pending',
        archived: true
      }
    });
    
    console.log(`Pending non-archived: ${pendingNotArchived}`);
    console.log(`Pending archived: ${pendingArchived}`);
    
    console.log('\n✅ Done! The archived field has been normalized.');
    console.log('   Please refresh your frontend to see the updated badge count.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();

