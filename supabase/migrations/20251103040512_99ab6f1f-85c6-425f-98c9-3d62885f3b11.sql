-- Add description field to upload_records table
ALTER TABLE public.upload_records 
ADD COLUMN description TEXT;