-- Check current state of pending complaints
SELECT id, title, status, archived, property_id, created_at
FROM complaints
WHERE status = 'pending'
ORDER BY id DESC;

-- Fix: Set archived to false for any null values
UPDATE complaints
SET archived = false
WHERE archived IS NULL;

-- Check if there are any pending complaints that should be archived
-- (These will show in the badge count)
SELECT id, title, status, archived, property_id
FROM complaints
WHERE status = 'pending' AND (archived = false OR archived IS NULL);

-- If you want to archive ALL pending complaints, uncomment the line below:
-- UPDATE complaints SET archived = true WHERE status = 'pending';

