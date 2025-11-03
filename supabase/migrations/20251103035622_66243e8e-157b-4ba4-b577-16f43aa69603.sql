-- Make the surat-jalan-uploads bucket public so images can be displayed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'surat-jalan-uploads';