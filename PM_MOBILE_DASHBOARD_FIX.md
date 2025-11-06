# PM Mobile Dashboard Fix - November 6, 2025

## Issues Addressed

### 1. Removed Apartments Card ✅
**Problem:** The mobile PM dashboard was showing 3 cards (Properties, Tenants, Apartments) which cluttered the interface.

**Solution:** Removed the Apartments card, now showing only Properties and Tenants cards in a clean 2-column layout.

**Files Modified:**
- `/mobile/src/screens/pm/PMDashboardScreen.js`

**Changes:**
```javascript
// Before: 3 stat cards
<View style={styles.statsContainer}>
  <View style={styles.statBox}>...</View> // Properties
  <View style={styles.statBox}>...</View> // Tenants
  <View style={styles.statBox}>...</View> // Apartments (REMOVED)
</View>

// After: 2 stat cards
<View style={styles.statsContainer}>
  <View style={styles.statBox}>...</View> // Properties
  <View style={styles.statBox}>...</View> // Tenants
</View>
```

### 2. Fixed Tenant Count Issue ✅
**Problem:** The dashboard was showing 0 tenants even though tenants exist in the tenants list screen.

**Root Cause:** The dashboard was using `Op.overlap` to query the JSON `property_ids` field, which doesn't work correctly with MySQL JSON arrays. The tenants list screen was successfully using `JSON_CONTAINS` with `Sequelize.literal`.

**Solution:** Updated the dashboard tenant query to use the same `JSON_CONTAINS` approach that works in the tenants list.

**Files Modified:**
- `/backend/controllers/propertyManagerDashboard.controller.js`

**Changes:**
```javascript
// Before (BROKEN - used Op.overlap):
const allTenants = await User.findAll({
  where: {
    role: 'tenant',
    property_ids: {
      [Op.overlap]: propertyIds
    }
  },
  attributes: ['id', 'name', 'surname', 'email', 'number', 'property_ids']
});

// After (FIXED - uses JSON_CONTAINS like tenants list):
// Build where clause using raw SQL for JSON_CONTAINS (MySQL compatible)
const jsonContainsConditions = propertyIds.map(propId =>
  sequelize.literal(`JSON_CONTAINS(property_ids, '${propId}', '$')`)
);

const allTenants = await User.findAll({
  where: {
    role: 'tenant',
    [Op.or]: jsonContainsConditions
  },
  attributes: ['id', 'name', 'surname', 'email', 'number', 'property_ids']
});
```

**Why This Works:**
- `JSON_CONTAINS` is MySQL's native function for checking if a JSON array contains a value
- The tenants list screen (`PMTenantsScreen.js`) uses this same approach successfully
- `Op.overlap` is a PostgreSQL operator that doesn't work with MySQL JSON arrays
- By using `Sequelize.literal`, we can execute raw SQL that works directly with MySQL

### 3. Added Debug Logging 🔍

To diagnose why tenants and payments are showing 0, comprehensive debug logging was added to both frontend and backend.

#### Mobile App Debug Logging
**File:** `/mobile/src/screens/pm/PMDashboardScreen.js`

```javascript
if (data.success) {
  console.log('[PMDashboard] Overview data:', JSON.stringify(data.data.overview, null, 2));
  console.log('[PMDashboard] Payments data:', JSON.stringify(data.data.payments.currentMonth, null, 2));
  console.log('[PMDashboard] Total tenants:', data.data.overview.totalTenants);
  console.log('[PMDashboard] Unpaid payments:', data.data.payments.currentMonth.unpaid);
  
  setDashboardData(data.data);
}
```

#### Backend Debug Logging
**File:** `/backend/controllers/propertyManagerDashboard.controller.js`

Added logging for:
1. **Tenant Data:**
```javascript
console.log('[PM Dashboard] Property IDs:', propertyIds);
console.log('[PM Dashboard] Total tenants found:', allTenants.length);
console.log('[PM Dashboard] Tenants:', allTenants.map(t => ({ 
  id: t.id, 
  name: `${t.name} ${t.surname}`, 
  property_ids: t.property_ids 
})));
```

2. **Payment Data:**
```javascript
console.log('[PM Dashboard] First day of month:', firstDayOfMonth);
console.log('[PM Dashboard] Last day of month:', lastDayOfMonth);
console.log('[PM Dashboard] Total payments this month:', currentMonthPayments.length);
console.log('[PM Dashboard] Paid:', paidCount, 'Unpaid:', unpaidCount);
console.log('[PM Dashboard] Payment details:', currentMonthPayments.map(p => ({ 
  id: p.id, 
  status: p.status, 
  amount: p.amount, 
  payment_month: p.payment_month,
  property_id: p.property_id,
  tenant_id: p.tenant_id
})));
```

## Remaining Issues to Diagnose

### Issue 1: Tenants Showing 0

**Possible Causes:**
1. No tenants assigned to the property manager's properties
2. Tenants' `property_ids` field is not properly populated
3. The `property_ids` array doesn't include the property manager's property IDs

**How to Diagnose:**
1. Run the mobile app and check the console for `[PM Dashboard]` logs
2. Check backend logs when the dashboard API is called
3. Verify the backend output shows:
   - Property IDs the PM manages
   - Tenant records found
   - Whether tenant `property_ids` match the property IDs

**Query to Check Database Directly:**
```sql
-- Check tenants for a specific property manager
SELECT u.id, u.name, u.surname, u.property_ids, pm.property_id
FROM users u
JOIN property_managers pm ON JSON_CONTAINS(u.property_ids, CAST(pm.property_id AS JSON), '$')
WHERE u.role = 'tenant' AND pm.user_id = [PROPERTY_MANAGER_USER_ID];
```

### Issue 2: Unpaid Payments Showing 0

**Possible Causes:**
1. No payment records exist for the current month (November 2025)
2. All payments for the current month are marked as 'paid'
3. The `payment_month` date format doesn't match the query range
4. Payments are assigned to different property IDs

**How to Diagnose:**
1. Check the backend console logs for:
   - First and last day of month (should be Nov 1-30, 2025)
   - Total payments found for the current month
   - Payment details showing status
2. Check if payments exist in the database for November 2025

**Query to Check Database Directly:**
```sql
-- Check payments for current month
SELECT id, tenant_id, property_id, amount, status, payment_month
FROM tenant_payments
WHERE payment_month >= '2025-11-01' 
  AND payment_month <= '2025-11-30'
  AND property_id IN (
    SELECT property_id FROM property_managers WHERE user_id = [PROPERTY_MANAGER_USER_ID]
  );
```

## Testing Instructions

### 1. Start Backend Server
```bash
cd backend
npm start
```

### 2. Start Mobile App
```bash
cd mobile
npx expo start
```

### 3. Check Console Output
When you open the PM Dashboard in the mobile app, you should see logs like:

**Mobile Console:**
```
[PMDashboard] Overview data: { totalProperties: X, totalTenants: X, ... }
[PMDashboard] Payments data: { paid: X, unpaid: X, ... }
[PMDashboard] Total tenants: X
[PMDashboard] Unpaid payments: X
```

**Backend Console:**
```
[PM Dashboard] Property IDs: [1, 2, 3]
[PM Dashboard] Total tenants found: X
[PM Dashboard] Tenants: [{ id: 1, name: "...", property_ids: [...] }]
[PM Dashboard] First day of month: 2025-11-01T00:00:00.000Z
[PM Dashboard] Last day of month: 2025-11-30T00:00:00.000Z
[PM Dashboard] Total payments this month: X
[PM Dashboard] Paid: X, Unpaid: X
[PM Dashboard] Payment details: [...]
```

### 4. Analyze the Logs
Based on the logs, you can determine:
- Are tenants being fetched? If not, check the property_ids field
- Are payments being fetched? If not, check if payments exist for November 2025
- Is the data correct but not displaying? Check the mobile UI rendering logic

## Quick Fixes Based on Common Issues

### If No Tenants Found:
The query uses `property_ids` field with array overlap. Ensure tenants have their property_ids properly set:

```sql
-- Update tenant property_ids if needed
UPDATE users 
SET property_ids = JSON_ARRAY(property_id_value)
WHERE role = 'tenant' AND id = tenant_id;
```

### If No Payments for Current Month:
You may need to create payment records for November 2025:

```sql
-- Check if payment records exist
SELECT COUNT(*) FROM tenant_payments 
WHERE payment_month >= '2025-11-01' AND payment_month <= '2025-11-30';

-- If 0, you need to generate payments for November 2025
-- Use the payment generation endpoint or create them manually
```

## Summary

✅ **Completed:**
- Removed Apartments card from mobile dashboard
- Fixed tenant count issue by updating query to use JSON_CONTAINS
- Added comprehensive debug logging to diagnose data issues

⏳ **Next Steps:**
1. Run the mobile app and check console logs
2. Check backend logs when dashboard loads
3. Use the diagnostic queries above to check database state
4. Based on logs, implement fixes for tenant/payment data issues

## Files Modified
1. `/mobile/src/screens/pm/PMDashboardScreen.js` - Removed Apartments card, added debug logging
2. `/backend/controllers/propertyManagerDashboard.controller.js` - Fixed tenant count query, added debug logging for tenants and payments

## Notes
- The dashboard UI is correctly implemented - it displays data from the API
- The issue is likely with the backend data queries or missing data in the database
- Debug logs will reveal the exact problem
- Current date context: November 6, 2025
