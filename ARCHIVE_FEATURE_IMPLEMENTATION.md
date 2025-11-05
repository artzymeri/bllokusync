# Archive Feature Implementation for Reports, Complaints, and Suggestions

**Date:** November 5, 2025  
**Feature:** Archive functionality for Property Manager dashboard

## Overview

This implementation adds the ability for Property Managers to archive single or multiple reports, complaints, and suggestions in both the frontend web app and mobile app. Archived items are hidden from the main view but remain in the database for record-keeping.

## Database Changes

### 1. Model Updates

Added `archived` field to three models:

- **reports** table - Added `archived` BOOLEAN field (default: false)
- **complaints** table - Added `archived` BOOLEAN field (default: false)
- **suggestions** table - Added `archived` BOOLEAN field (default: false)

### 2. Migration Script

Created migration script: `backend/migrations/add_archived_to_reports_complaints_suggestions.js`

To run the migration:
```bash
cd backend
node migrations/add_archived_to_reports_complaints_suggestions.js
```

## Backend Changes

### 1. Controllers Updated

**Report Controller** (`backend/controllers/report.controller.js`):
- Updated `getPropertyManagerReports` to exclude archived reports by default
- Added `archiveReports` method - archives multiple reports by IDs
- Added `unarchiveReports` method - unarchives multiple reports by IDs

**Complaint Controller** (`backend/controllers/complaint.controller.js`):
- Updated `getPropertyManagerComplaints` to exclude archived complaints by default
- Added `archiveComplaints` method - archives multiple complaints by IDs
- Added `unarchiveComplaints` method - unarchives multiple complaints by IDs

**Suggestion Controller** (`backend/controllers/suggestion.controller.js`):
- Updated `getPropertyManagerSuggestions` to exclude archived suggestions by default
- Added `archiveSuggestions` method - archives multiple suggestions by IDs
- Added `unarchiveSuggestions` method - unarchives multiple suggestions by IDs

### 2. Routes Added

**Report Routes** (`backend/routes/report.routes.js`):
- `POST /api/reports/archive` - Archive multiple reports
- `POST /api/reports/unarchive` - Unarchive multiple reports

**Complaint Routes** (`backend/routes/complaint.routes.js`):
- `POST /api/complaints/archive` - Archive multiple complaints
- `POST /api/complaints/unarchive` - Unarchive multiple complaints

**Suggestion Routes** (`backend/routes/suggestion.routes.js`):
- `POST /api/suggestions/archive` - Archive multiple suggestions
- `POST /api/suggestions/unarchive` - Unarchive multiple suggestions

## Frontend Changes

### 1. Reports Page (`frontend/app/property_manager/reports/page.tsx`)

**Added:**
- Checkbox column in the table for bulk selection
- "Select all" checkbox in table header
- Archive button that appears when items are selected
- Archive confirmation dialog (optional, currently disabled)
- `handleArchiveReports` function with API call
- State management for selected IDs

**User Experience:**
- Property managers can select individual reports using checkboxes
- "Select all" checkbox selects/deselects all visible reports
- Archive button shows count of selected items: "Arkivo (3)"
- After archiving, items are removed from the view
- Success toast notification displayed
- Query cache invalidated to refresh sidebar counts

### 2. Complaints Page (`frontend/app/property_manager/complaints/page.tsx`)

**Added:**
- Same checkbox selection system as reports
- Archive button with count display
- `handleArchiveComplaints` function
- State management for bulk operations

### 3. Suggestions Page (`frontend/app/property_manager/suggestions/page.tsx`)

**Added:**
- Checkbox selection for bulk operations
- Archive button integrated into table header
- `handleArchiveSuggestions` function
- Proper state management and UI updates

## Mobile App Changes (To Be Implemented)

The mobile app screens would need similar updates:

### Files to Update:
1. `mobile/src/screens/pm/PMReportsScreen.js`
2. `mobile/src/screens/pm/PMComplaintsScreen.js`
3. `mobile/src/screens/pm/PMSuggestionsScreen.js`

### Implementation Approach for Mobile:
1. Add checkbox selection UI (React Native checkboxes)
2. Add floating action button (FAB) or header button for archive action
3. Implement `handleArchive` functions with API calls
4. Update state after successful archiving
5. Show toast notifications using React Native Toast library

## Features Implemented

### ✅ Backend
- [x] Database models updated with `archived` field
- [x] Migration script created
- [x] Archive/unarchive controller methods
- [x] API routes for archive operations
- [x] Permission checks (only property managers of managed properties)
- [x] Bulk archive support (single or multiple items)
- [x] Default filtering (archived items excluded from main queries)

### ✅ Frontend Web App
- [x] Checkbox selection UI for reports
- [x] Checkbox selection UI for complaints
- [x] Checkbox selection UI for suggestions
- [x] Archive button with count display
- [x] API integration for archive operations
- [x] Toast notifications
- [x] Query cache invalidation
- [x] Responsive design (desktop & mobile views)

### ⏳ Mobile App
- [ ] Checkbox selection UI
- [ ] Archive action button
- [ ] API integration
- [ ] State management
- [ ] User feedback (toasts/alerts)

## API Request/Response Examples

### Archive Reports
```javascript
POST /api/reports/archive
Content-Type: application/json

{
  "ids": [1, 2, 3]
}

Response:
{
  "message": "3 report(s) archived successfully",
  "count": 3
}
```

### Archive Complaints
```javascript
POST /api/complaints/archive
Content-Type: application/json

{
  "ids": [5, 6]
}

Response:
{
  "message": "2 complaint(s) archived successfully",
  "count": 2
}
```

### Archive Suggestions
```javascript
POST /api/suggestions/archive
Content-Type: application/json

{
  "ids": [10]
}

Response:
{
  "message": "1 suggestion(s) archived successfully",
  "count": 1
}
```

## Security Considerations

1. **Authorization:** Only authenticated property managers can archive items
2. **Ownership Verification:** Backend verifies that the property manager manages the properties associated with the items being archived
3. **Validation:** IDs are validated and must be provided as an array
4. **Error Handling:** Proper error responses for unauthorized access attempts

## Testing Checklist

### Backend Testing
- [ ] Run database migration successfully
- [ ] Test archive single report/complaint/suggestion
- [ ] Test archive multiple items (bulk operation)
- [ ] Test unarchive functionality
- [ ] Verify archived items don't appear in main queries
- [ ] Test permission checks (unauthorized users)
- [ ] Test with items from unmanaged properties (should fail)

### Frontend Testing
- [ ] Test checkbox selection (single & multiple)
- [ ] Test "select all" functionality
- [ ] Test archive button appears/disappears correctly
- [ ] Verify items disappear after archiving
- [ ] Test toast notifications
- [ ] Test on desktop view
- [ ] Test on mobile responsive view
- [ ] Verify sidebar counts update after archiving

### Mobile Testing (When Implemented)
- [ ] Test UI rendering on iOS
- [ ] Test UI rendering on Android
- [ ] Test selection functionality
- [ ] Test archive action
- [ ] Verify state updates correctly
- [ ] Test error scenarios

## Future Enhancements

1. **Archive View Page:** Create a dedicated page to view and manage archived items
2. **Bulk Unarchive:** Add UI for unarchiving items
3. **Archive Date Tracking:** Add `archived_at` timestamp field
4. **Archive Reason:** Optional field to record why item was archived
5. **Auto-archive:** Automatically archive resolved items after X days
6. **Search Archived Items:** Add search/filter functionality for archived items
7. **Archive Statistics:** Dashboard widget showing archived item counts
8. **Restore Functionality:** Easy restore from archive view

## Deployment Steps

1. **Backup Database:** Always backup before running migrations
2. **Run Migration:** Execute the migration script
3. **Deploy Backend:** Deploy updated backend code
4. **Deploy Frontend:** Deploy updated frontend code
5. **Test in Production:** Verify functionality works as expected
6. **Monitor Logs:** Check for any errors in the first few hours

## Rollback Plan

If issues arise:
1. Revert code deployment
2. To rollback database changes:
   ```sql
   ALTER TABLE reports DROP COLUMN archived;
   ALTER TABLE complaints DROP COLUMN archived;
   ALTER TABLE suggestions DROP COLUMN archived;
   ```

## Notes

- Archived items remain in the database for audit purposes
- The default query filters exclude archived items automatically
- Property managers can only archive items from properties they manage
- The feature supports both single and bulk archive operations
- Mobile app implementation requires additional work (outlined above)

## Support

For questions or issues related to this feature, contact the development team or refer to the main project documentation.

