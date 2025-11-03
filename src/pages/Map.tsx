import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

interface Geofence {
  id: string;
  name: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
}

export default function Map() {
  const [locations, setLocations] = useState<PhotoLocation[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [drivers, setDrivers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [dates, setDates] = useState<string[]>([]);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const geofencesLayer = useRef<L.LayerGroup | null>(null);
  const routeLayer = useRef<L.Polyline | null>(null);

  useEffect(() => {
    loadMapData();
  }, []);

  useEffect(() => {
    // Initialize map only once
    if (mapContainer.current && !mapInstance.current) {
      mapInstance.current = L.map(mapContainer.current).setView([-6.2088, 106.8456], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapInstance.current);

      markersLayer.current = L.layerGroup().addTo(mapInstance.current);
      geofencesLayer.current = L.layerGroup().addTo(mapInstance.current);
    }

    return () => {
      // Cleanup on unmount
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Update map when filtered locations change
    if (mapInstance.current && markersLayer.current && geofencesLayer.current) {
      updateMap();
    }
  }, [locations, geofences, selectedDriver, selectedDate]);

  const loadMapData = async () => {
    setIsLoading(true);
    try {
      // Load photo locations with metadata (from EXIF data)
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

      // Also load upload records with GPS (from device location)
      const { data: uploads, error: uploadsError } = await supabase
        .from('upload_records')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false });

      if (uploadsError) throw uploadsError;

      // Add upload record locations to the map
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

      // Combine both sources
      formattedLocations = [...formattedLocations, ...uploadLocations];

      setLocations(formattedLocations);

      // Extract unique drivers
      const uniqueDrivers = [...new Set(formattedLocations.map(loc => loc.uploadRecord.supir))];
      setDrivers(uniqueDrivers);

      // Extract unique dates
      const uniqueDates = [...new Set(formattedLocations.map(loc => loc.uploadRecord.tanggal))];
      setDates(uniqueDates.sort().reverse());

      // Load geofences
      const { data: geofenceData, error: geofenceError } = await supabase
        .from('geofence_config')
        .select('*')
        .eq('is_active', true);

      if (geofenceError) throw geofenceError;

      const formattedGeofences: Geofence[] = (geofenceData || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        centerLatitude: parseFloat(g.center_latitude),
        centerLongitude: parseFloat(g.center_longitude),
        radiusMeters: g.radius_meters
      }));

      setGeofences(formattedGeofences);
    } catch (error) {
      console.error('Error loading map data:', error);
      toast.error('Failed to load map data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMap = () => {
    if (!mapInstance.current || !markersLayer.current || !geofencesLayer.current) return;

    // Clear existing layers
    markersLayer.current.clearLayers();
    geofencesLayer.current.clearLayers();
    if (routeLayer.current) {
      routeLayer.current.remove();
      routeLayer.current = null;
    }

    // Filter locations
    const filteredLocations = locations.filter(loc => {
      if (selectedDriver !== 'all' && loc.uploadRecord.supir !== selectedDriver) return false;
      if (selectedDate !== 'all' && loc.uploadRecord.tanggal !== selectedDate) return false;
      return true;
    });

    if (filteredLocations.length === 0) return;

    // Add markers
    filteredLocations.forEach(loc => {
      const marker = L.marker([loc.latitude, loc.longitude]);
      
      const popupContent = `
        <div class="space-y-1">
          <p class="font-semibold">${loc.fileName}</p>
          <p class="text-sm">Doc: ${loc.uploadRecord.no_surat_jalan}</p>
          <p class="text-sm">Driver: ${loc.uploadRecord.supir}</p>
          <p class="text-sm">Type: ${loc.uploadRecord.tipe}</p>
          <p class="text-sm">Date: ${format(new Date(loc.uploadRecord.tanggal), 'PPP')}</p>
          ${loc.capturedAt ? `<p class="text-xs text-muted-foreground">Captured: ${format(new Date(loc.capturedAt), 'PPp')}</p>` : ''}
        </div>
      `;
      
      marker.bindPopup(popupContent);
      marker.addTo(markersLayer.current!);
    });

    // Add geofences
    geofences.forEach(fence => {
      const circle = L.circle([fence.centerLatitude, fence.centerLongitude], {
        radius: fence.radiusMeters,
        color: 'blue',
        fillColor: 'blue',
        fillOpacity: 0.1
      });
      
      circle.bindPopup(`<strong>${fence.name}</strong><br/>Radius: ${fence.radiusMeters}m`);
      circle.addTo(geofencesLayer.current!);
    });

    // Add route polyline
    const sortedLocations = [...filteredLocations].sort((a, b) => {
      const dateA = a.capturedAt ? new Date(a.capturedAt).getTime() : 0;
      const dateB = b.capturedAt ? new Date(b.capturedAt).getTime() : 0;
      return dateA - dateB;
    });

    if (sortedLocations.length > 1) {
      const routeCoordinates: L.LatLngExpression[] = sortedLocations.map(loc => [loc.latitude, loc.longitude]);
      routeLayer.current = L.polyline(routeCoordinates, {
        color: 'hsl(205, 100%, 64%)',
        weight: 3
      }).addTo(mapInstance.current!);
    }

    // Fit bounds to markers
    const bounds = L.latLngBounds(filteredLocations.map(loc => [loc.latitude, loc.longitude]));
    mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
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
            {geofences.length > 0 && (
              <Badge variant="secondary">
                {geofences.length} geofence(s) active
              </Badge>
            )}
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
