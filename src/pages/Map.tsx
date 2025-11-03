import { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import 'maplibre-gl/dist/maplibre-gl.css';

interface PhotoLocation {
  id: string;
  latitude: number;
  longitude: number;
  fileName: string;
  capturedAt: string | null;
  uploadRecord: {
    no_surat_jalan: string;
    supir: string;
    tipe: string;
    tanggal: string;
  };
}

export default function Map() {
  const [locations, setLocations] = useState<PhotoLocation[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [drivers, setDrivers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [dates, setDates] = useState<string[]>([]);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    loadMapData();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [106.8456, -6.2088],
      zoom: 13
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (map.current && locations.length > 0) {
      updateMarkers();
    }
  }, [locations, selectedDriver, selectedDate]);

  const loadMapData = async () => {
    setIsLoading(true);
    try {
      const { data: photos, error: photosError } = await supabase
        .from('photo_metadata')
        .select(`
          id,
          latitude,
          longitude,
          file_name,
          captured_at,
          upload_record:upload_records (
            no_surat_jalan,
            supir,
            tipe,
            tanggal
          )
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('captured_at', { ascending: false });

      if (photosError) throw photosError;

      let formattedLocations: PhotoLocation[] = (photos || []).map((photo: any) => ({
        id: photo.id,
        latitude: parseFloat(photo.latitude),
        longitude: parseFloat(photo.longitude),
        fileName: photo.file_name,
        capturedAt: photo.captured_at,
        uploadRecord: photo.upload_record
      }));

      const { data: uploads, error: uploadsError } = await supabase
        .from('upload_records')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false });

      if (uploadsError) throw uploadsError;

      const uploadLocations: PhotoLocation[] = (uploads || []).map((upload: any) => ({
        id: upload.id,
        latitude: parseFloat(upload.latitude),
        longitude: parseFloat(upload.longitude),
        fileName: `Upload: ${upload.no_surat_jalan}`,
        capturedAt: upload.location_captured_at || upload.created_at,
        uploadRecord: {
          no_surat_jalan: upload.no_surat_jalan,
          supir: upload.supir,
          tipe: upload.tipe,
          tanggal: upload.tanggal
        }
      }));

      formattedLocations = [...formattedLocations, ...uploadLocations];
      setLocations(formattedLocations);

      const uniqueDrivers = [...new Set(formattedLocations.map(loc => loc.uploadRecord.supir))];
      setDrivers(uniqueDrivers);

      const uniqueDates = [...new Set(formattedLocations.map(loc => loc.uploadRecord.tanggal))];
      setDates(uniqueDates.sort().reverse());
    } catch (error) {
      console.error('Error loading map data:', error);
      toast.error('Failed to load map data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMarkers = () => {
    if (!map.current) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Filter locations
    const filteredLocations = locations.filter(loc => {
      if (selectedDriver !== 'all' && loc.uploadRecord.supir !== selectedDriver) return false;
      if (selectedDate !== 'all' && loc.uploadRecord.tanggal !== selectedDate) return false;
      return true;
    });

    if (filteredLocations.length === 0) return;

    // Add markers with default red pins
    filteredLocations.forEach(loc => {
      const popupHTML = `
        <div style="padding: 8px; min-width: 200px;">
          <p style="font-weight: 600; margin-bottom: 4px;">${loc.fileName}</p>
          <p style="font-size: 0.875rem;">Doc: ${loc.uploadRecord.no_surat_jalan}</p>
          <p style="font-size: 0.875rem;">Driver: ${loc.uploadRecord.supir}</p>
          <p style="font-size: 0.875rem;">Type: ${loc.uploadRecord.tipe}</p>
          <p style="font-size: 0.875rem;">Date: ${format(new Date(loc.uploadRecord.tanggal), 'PPP')}</p>
          ${loc.capturedAt ? `<p style="font-size: 0.75rem; color: #6b7280;">Captured: ${format(new Date(loc.capturedAt), 'PPp')}</p>` : ''}
        </div>
      `;

      const marker = new maplibregl.Marker({ color: '#ef4444' })
        .setLngLat([loc.longitude, loc.latitude])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupHTML))
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fit bounds
    const bounds = new maplibregl.LngLatBounds();
    filteredLocations.forEach(loc => bounds.extend([loc.longitude, loc.latitude]));
    map.current.fitBounds(bounds, { padding: 50, duration: 0 });
  };

  const filteredLocations = locations.filter(loc => {
    if (selectedDriver !== 'all' && loc.uploadRecord.supir !== selectedDriver) return false;
    if (selectedDate !== 'all' && loc.uploadRecord.tanggal !== selectedDate) return false;
    return true;
  });

  const exportToGeoJSON = () => {
    const geoJSON = {
      type: 'FeatureCollection',
      features: filteredLocations.map(loc => ({
        type: 'Feature',
        properties: {
          name: loc.fileName,
          documentNo: loc.uploadRecord.no_surat_jalan,
          driver: loc.uploadRecord.supir,
          type: loc.uploadRecord.tipe,
          date: loc.uploadRecord.tanggal,
          capturedAt: loc.capturedAt
        },
        geometry: {
          type: 'Point',
          coordinates: [loc.longitude, loc.latitude]
        }
      }))
    };

    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-export-${format(new Date(), 'yyyy-MM-dd')}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('GeoJSON exported successfully');
  };

  const exportToKML = () => {
    const placemarks = filteredLocations.map(loc => 
      '<Placemark>' +
        '<name>' + loc.fileName + '</name>' +
        '<description>' +
          'Document No: ' + loc.uploadRecord.no_surat_jalan + '\n' +
          'Driver: ' + loc.uploadRecord.supir + '\n' +
          'Type: ' + loc.uploadRecord.tipe + '\n' +
          'Date: ' + loc.uploadRecord.tanggal +
        '</description>' +
        '<Point>' +
          '<coordinates>' + loc.longitude + ',' + loc.latitude + ',0</coordinates>' +
        '</Point>' +
      '</Placemark>'
    ).join('\n');

    const kml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<kml xmlns="http://www.opengis.net/kml/2.2">\n' +
      '  <Document>\n' +
      '    <name>Route Export</name>\n' +
      placemarks +
      '\n  </Document>\n' +
      '</kml>';

    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `route-export-${format(new Date(), 'yyyy-MM-dd')}.kml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('KML exported successfully');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card mb-6"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary opacity-60" />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-display font-bold">Route Visualization</h1>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                {drivers.map(driver => (
                  <SelectItem key={driver} value={driver}>{driver}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                {dates.map(date => (
                  <SelectItem key={date} value={date}>{format(new Date(date), 'PPP')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={exportToGeoJSON} variant="outline" className="hover-lift">
              <Download className="mr-2 h-4 w-4" />
              Export GeoJSON
            </Button>

            <Button onClick={exportToKML} variant="outline" className="hover-lift">
              <Download className="mr-2 h-4 w-4" />
              Export KML
            </Button>
          </div>

          <div className="flex gap-4 mt-4">
            <Badge variant="secondary">
              <Navigation className="mr-1 h-3 w-3" />
              {filteredLocations.length} locations
            </Badge>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 pb-8">
        <Card className="p-0 overflow-hidden" style={{ height: '70vh' }}>
          {locations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <MapPin className="h-16 w-16 mb-4 opacity-50" />
              <p>No GPS data available</p>
              <p className="text-sm">Upload photos with GPS coordinates to see them here</p>
            </div>
          ) : (
            <div ref={mapContainer} className="h-full w-full" />
          )}
        </Card>
      </div>
    </div>
  );
}
