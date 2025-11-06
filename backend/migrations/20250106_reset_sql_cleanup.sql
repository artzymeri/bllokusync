-- Reset the SQL cleanup migration so it runs again with the fixed query
DELETE FROM migrations WHERE filename = '20250107_cleanup_duplicates_sql.sql';

