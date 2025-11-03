-- Add GPS coordinates to upload_records
ALTER TABLE public.upload_records 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN location_accuracy DECIMAL(6, 2),
ADD COLUMN location_captured_at TIMESTAMP WITH TIME ZONE;

-- Create table for individual photo coordinates
CREATE TABLE public.photo_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_record_id UUID NOT NULL REFERENCES public.upload_records(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  altitude DECIMAL(8, 2),
  bearing DECIMAL(5, 2),
  captured_at TIMESTAMP WITH TIME ZONE,
  exif_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.photo_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for photo_metadata
CREATE POLICY "Users can view their own photo metadata"
ON public.photo_metadata
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.upload_records 
    WHERE upload_records.id = photo_metadata.upload_record_id 
    AND upload_records.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own photo metadata"
ON public.photo_metadata
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.upload_records 
    WHERE upload_records.id = photo_metadata.upload_record_id 
    AND upload_records.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all photo metadata"
ON public.photo_metadata
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can delete all photo metadata"
ON public.photo_metadata
FOR DELETE
USING (is_admin());

-- Create index for geospatial queries
CREATE INDEX idx_photo_metadata_coordinates ON public.photo_metadata(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_upload_records_coordinates ON public.upload_records(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_photo_metadata_upload_record ON public.photo_metadata(upload_record_id);

-- Create geofence configuration table
CREATE TABLE public.geofence_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  center_latitude DECIMAL(10, 8) NOT NULL,
  center_longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for geofence_config
ALTER TABLE public.geofence_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage geofences
CREATE POLICY "Admins can manage geofences"
ON public.geofence_config
FOR ALL
USING (is_admin());

-- Everyone can read active geofences
CREATE POLICY "Users can view active geofences"
ON public.geofence_config
FOR SELECT
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_geofence_config_updated_at
BEFORE UPDATE ON public.geofence_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();