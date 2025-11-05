-- Add archived column to reports table
ALTER TABLE reports
ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Add archived column to complaints table
ALTER TABLE complaints
ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Add archived column to suggestions table
ALTER TABLE suggestions
ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE;
