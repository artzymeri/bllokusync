-- Remove the duplicate cleanup migration from tracking so it runs again with the fix
DELETE FROM migrations WHERE filename = '20250106_cleanup_duplicate_payments.js';

