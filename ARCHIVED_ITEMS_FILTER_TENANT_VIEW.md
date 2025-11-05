# Archived Items Filter - Tenant View Implementation

## Overview
Implemented filtering to hide archived items (reports, suggestions, complaints, and monthly reports) from tenant views. Tenants will now only see active (non-archived) items in their dashboard pages.

## Changes Made

### Backend Controllers Updated

#### 1. **Complaint Controller** (`backend/controllers/complaint.controller.js`)
- **Method**: `getTenantComplaints`
- **Change**: Added archived filter to exclude archived complaints
- **Filter Applied**:
  ```javascript
  where: {
    tenant_user_id,
    [Op.or]: [
      { archived: false },
      { archived: null }
    ]
  }
  ```

#### 2. **Suggestion Controller** (`backend/controllers/suggestion.controller.js`)
- **Method**: `getTenantSuggestions`
- **Change**: Added archived filter to exclude archived suggestions
- **Filter Applied**:
  ```javascript
  where: {
    tenant_user_id,
    [Op.or]: [
      { archived: false },
      { archived: null }
    ]
  }
  ```

#### 3. **Report Controller** (`backend/controllers/report.controller.js`)
- **Method**: `getTenantReports`
- **Change**: Added archived filter to exclude archived reports
- **Filter Applied**:
  ```javascript
  where: {
    tenant_user_id,
    [Op.or]: [
      { archived: false },
      { archived: null }
    ]
  }
  ```

#### 4. **Monthly Report Controller** (`backend/controllers/monthlyReport.controller.js`)
- **Method**: `getTenantPropertyReports`
- **Change**: Added archived filter to exclude archived monthly reports
- **Filter Applied**:
  ```javascript
  where: {
    property_id: { [Op.in]: propertyIds },
    [Op.or]: [
      { archived: false },
      { archived: null }
    ]
  }
  ```

## Affected Tenant Pages

### Frontend Pages (No Changes Required)
The following tenant pages will automatically reflect the filtered data:
1. **Complaints Page** (`/tenant/complaints`)
   - Section: "Ankesat e Mia" (My Complaints)
   
2. **Suggestions Page** (`/tenant/suggestions`)
   - Section: "Sugjerimet e Mia" (My Suggestions)
   
3. **Monthly Reports Page** (`/tenant/monthly-reports`)
   - Section: "Raportet për {year}" (Reports for {year})

## Behavior

### Before
- Tenants could see all their items including archived ones
- Property managers could archive items but tenants would still see them

### After
- Tenants only see active (non-archived) items
- When property managers archive items, they immediately disappear from tenant view
- Consistent with property manager view which already filters archived items

## Testing Recommendations

1. **Create Test Items**: Create reports, complaints, suggestions, and monthly reports as a tenant
2. **Archive Items**: As property manager, archive some of these items
3. **Verify Tenant View**: Switch to tenant view and confirm archived items are not visible
4. **Unarchive Items**: Unarchive items and verify they reappear in tenant view

## Database Fields
All items use the `archived` field:
- `BOOLEAN` type
- Default value: `false`
- Can be `NULL` (treated as non-archived)

## Notes
- The filter handles both `false` and `NULL` values as "non-archived" for backward compatibility
- No frontend changes were needed - filtering is handled at the API level
- Property manager views continue to function as before with their existing archived filters

