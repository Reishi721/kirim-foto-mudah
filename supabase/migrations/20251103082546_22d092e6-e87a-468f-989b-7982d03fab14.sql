-- Drop the existing restrictive SELECT policies
DROP POLICY IF EXISTS "Users can view their own upload records" ON public.upload_records;
DROP POLICY IF EXISTS "Users can view their own photo metadata" ON public.photo_metadata;

-- Create new public SELECT policies
CREATE POLICY "Everyone can view all upload records"
ON public.upload_records
FOR SELECT
USING (true);

CREATE POLICY "Everyone can view all photo metadata"
ON public.photo_metadata
FOR SELECT
USING (true);

-- Keep the admin policies as they are
-- Keep the insert/update policies requiring user ownership