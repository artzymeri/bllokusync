const { Report, Complaint, Suggestion } = require('./models');

async function fixArchivedNulls() {
  try {
    console.log('Starting to fix archived NULL values...');

    // Fix Reports
    const reportsUpdated = await Report.update(
      { archived: false },
      {
        where: {
          archived: null
        }
      }
    );
    console.log(`✓ Updated ${reportsUpdated[0]} reports with archived: null to archived: false`);

    // Fix Complaints
    const complaintsUpdated = await Complaint.update(
      { archived: false },
      {
        where: {
          archived: null
        }
      }
    );
    console.log(`✓ Updated ${complaintsUpdated[0]} complaints with archived: null to archived: false`);

    // Fix Suggestions
    const suggestionsUpdated = await Suggestion.update(
      { archived: false },
      {
        where: {
          archived: null
        }
      }
    );
    console.log(`✓ Updated ${suggestionsUpdated[0]} suggestions with archived: null to archived: false`);

    console.log('\n✓ All archived NULL values have been fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing archived NULL values:', error);
    process.exit(1);
  }
}

fixArchivedNulls();

