-- Add customer_name column to upload_records table
ALTER TABLE public.upload_records
ADD COLUMN customer_name TEXT;