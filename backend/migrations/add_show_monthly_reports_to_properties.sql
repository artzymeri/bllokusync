-- Migration: Add show_monthly_reports_to_tenants column to properties table
-- This allows property managers to control whether tenants can view monthly reports

ALTER TABLE properties
ADD COLUMN show_monthly_reports_to_tenants BOOLEAN DEFAULT TRUE NOT NULL
COMMENT 'Controls whether tenants of this property can view monthly reports';

