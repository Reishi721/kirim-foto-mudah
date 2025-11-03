-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'surat-jalan-uploads',
  'surat-jalan-uploads',
  false,
  10485760, -- 10MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'surat-jalan-uploads');

-- Allow authenticated users to read their uploaded files
CREATE POLICY "Authenticated users can view uploaded files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'surat-jalan-uploads');

-- Allow authenticated users to delete their uploaded files
CREATE POLICY "Authenticated users can delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'surat-jalan-uploads');

-- Create table to store upload metadata
CREATE TABLE IF NOT EXISTS public.upload_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no_surat_jalan TEXT NOT NULL,
  tanggal DATE NOT NULL,
  tipe TEXT NOT NULL DEFAULT 'Pengiriman',
  supir TEXT NOT NULL,
  helper1 TEXT,
  helper2 TEXT,
  folder_path TEXT NOT NULL,
  file_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on upload_records
ALTER TABLE public.upload_records ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own records
CREATE POLICY "Users can create upload records"
ON public.upload_records
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view their own records
CREATE POLICY "Users can view their own upload records"
ON public.upload_records
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to update their own records
CREATE POLICY "Users can update their own upload records"
ON public.upload_records
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_upload_records_user_id ON public.upload_records(user_id);
CREATE INDEX idx_upload_records_no_surat_jalan ON public.upload_records(no_surat_jalan);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_upload_records_updated_at
BEFORE UPDATE ON public.upload_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();