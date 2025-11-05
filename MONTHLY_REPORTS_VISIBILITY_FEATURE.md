# Monthly Reports Visibility Feature

## Overview
This feature allows Property Managers to control whether tenants of a specific property can view monthly reports. By default, all properties have monthly reports enabled for tenants, but PMs can disable this on a per-property basis.

## Implementation Summary

### Backend Changes

#### 1. Database Migration
**File:** `backend/migrations/add_show_monthly_reports_to_properties.sql`
- Added `show_monthly_reports_to_tenants` BOOLEAN column to `properties` table
- Default value: `TRUE` (enabled for all existing properties)
- NOT NULL constraint

**Migration Script:** `backend/run_show_monthly_reports_migration.js`
- Checks if column already exists before adding
- Sets default value to TRUE for all existing properties

**To run the migration:**
```bash
cd backend
node run_show_monthly_reports_migration.js
```

#### 2. Property Model
**File:** `backend/models/property.model.js`
- Added `show_monthly_reports_to_tenants` field to the Property model
- Type: BOOLEAN
- Default: true

#### 3. Property Controller
**File:** `backend/controllers/property.controller.js`
- Updated `createProperty()` to accept `show_monthly_reports_to_tenants` parameter
- Updated `updateProperty()` to accept `show_monthly_reports_to_tenants` parameter
- Field defaults to `true` if not provided

#### 4. Tenant Dashboard Controller
**File:** `backend/controllers/tenantDashboard.controller.js`
- Modified monthly reports query to filter based on `show_monthly_reports_to_tenants`
- Only returns monthly reports from properties where the flag is `true`
- Uses `required: true` in the include to enforce the filter

### Frontend Changes

#### 1. Property API Types
**File:** `frontend/lib/property-api.ts`
- Added `show_monthly_reports_to_tenants?: boolean` to Property interface
- Updated `createProperty()` method signature
- Updated `updateProperty()` method signature

#### 2. Property Hooks
**File:** `frontend/hooks/useProperties.ts`
- Updated `useCreateProperty()` mutation types
- Updated `useUpdateProperty()` mutation types

#### 3. Property Create Form
**File:** `frontend/app/property_manager/properties/create/page.tsx`
- Added Switch component for "Raportet Mujore për Banorët"
- Default state: `true`
- Sends `show_monthly_reports_to_tenants` to API on form submission

#### 4. Property Edit Form
**File:** `frontend/app/property_manager/properties/edit/[id]/page.tsx`
- Added Switch component for "Raportet Mujore për Banorët"
- Loads current value from property data
- Sends updated value to API on form submission

#### 5. Tenant Access Hook
**File:** `frontend/hooks/useTenantMonthlyReportsAccess.ts`
- New custom hook to check if tenant has access to monthly reports
- Returns `hasAccess` boolean based on dashboard data
- Returns `true` only if tenant has at least one monthly report available

#### 6. Tenant Layout
**File:** `frontend/components/layouts/TenantLayout.tsx`
- Conditionally shows "Raportet Mujore" menu item
- Uses `useTenantMonthlyReportsAccess()` hook
- Menu item only appears if tenant has access

#### 7. Tenant Monthly Reports Page
**File:** `frontend/app/tenant/monthly-reports/page.tsx`
- Added access control check at page level
- Shows "Access Restricted" message if tenant has no access
- Prevents route access even if tenant navigates directly to URL

## User Experience

### Property Manager Flow
1. When creating a new property, PM sees a toggle switch labeled "Raportet Mujore për Banorët"
2. Toggle is ON by default (tenants can see reports)
3. PM can disable it to hide monthly reports from tenants of that property
4. When editing a property, PM can change this setting at any time

### Tenant Flow
1. **When Access is Enabled:**
   - "Raportet Mujore" appears in the sidebar navigation
   - Tenant can access `/tenant/monthly-reports` route
   - Can view and download all monthly reports for their property

2. **When Access is Disabled:**
   - "Raportet Mujore" does NOT appear in sidebar navigation
   - If tenant manually navigates to `/tenant/monthly-reports`, they see a friendly "Access Restricted" message
   - Message explains that the property manager has disabled this feature
   - No monthly reports are returned from the API

## Technical Details

### Database Schema
```sql
ALTER TABLE properties
ADD COLUMN show_monthly_reports_to_tenants BOOLEAN DEFAULT TRUE NOT NULL
COMMENT 'Controls whether tenants of this property can view monthly reports';
```

### API Endpoints Modified
- `POST /api/properties` - accepts `show_monthly_reports_to_tenants`
- `PUT /api/properties/:id` - accepts `show_monthly_reports_to_tenants`
- `GET /api/tenant/dashboard` - filters monthly reports based on property setting

### Security
- Backend enforces the restriction at the query level
- Frontend hides UI elements but also blocks access at the route level
- Tenants cannot bypass the restriction by manipulating the frontend

## Testing Checklist

### Backend
- [ ] Run migration script successfully
- [ ] Verify column exists in properties table
- [ ] Create new property with flag = false
- [ ] Update existing property to change flag
- [ ] Verify tenant dashboard returns filtered monthly reports

### Frontend
- [ ] Create new property - toggle should be ON by default
- [ ] Toggle OFF and verify data is saved
- [ ] Edit property - verify toggle reflects saved state
- [ ] Login as tenant with access disabled - verify no sidebar item
- [ ] Login as tenant with access disabled - verify blocked access page
- [ ] Login as tenant with access enabled - verify normal functionality

## Notes
- All existing properties will have monthly reports enabled by default after migration
- The feature is backward compatible - no breaking changes
- Property managers can enable/disable this at any time
- Changes take effect immediately for tenants

