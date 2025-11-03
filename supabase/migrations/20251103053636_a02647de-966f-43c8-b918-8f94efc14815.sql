-- Add file_hash column to photo_metadata for duplicate detection
ALTER TABLE photo_metadata 
ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- Create index on file_hash for faster duplicate lookups
CREATE INDEX IF NOT EXISTS idx_photo_metadata_file_hash 
ON photo_metadata(file_hash);

-- Add version tracking to upload_records
ALTER TABLE upload_records 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES upload_records(id),
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create index for version queries
CREATE INDEX IF NOT EXISTS idx_upload_records_parent_version 
ON upload_records(parent_version_id);

CREATE INDEX IF NOT EXISTS idx_upload_records_archived 
ON upload_records(is_archived);