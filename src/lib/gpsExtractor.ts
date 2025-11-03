import EXIF from 'exif-js';

export interface GPSData {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  capturedAt: Date | null;
}

/**
 * Convert GPS coordinates from degrees/minutes/seconds to decimal
 */
function convertDMSToDD(degrees: number, minutes: number, seconds: number, direction: string): number {
  let dd = degrees + minutes / 60 + seconds / 3600;
  if (direction === 'S' || direction === 'W') {
    dd = dd * -1;
  }
  return dd;
}

/**
 * Extract GPS data from image file
 */
export async function extractGPSFromImage(file: File): Promise<GPSData> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        EXIF.getData(img as any, function(this: any) {
          const lat = EXIF.getTag(this, 'GPSLatitude');
          const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
          const lon = EXIF.getTag(this, 'GPSLongitude');
          const lonRef = EXIF.getTag(this, 'GPSLongitudeRef');
          const alt = EXIF.getTag(this, 'GPSAltitude');
          const dateTime = EXIF.getTag(this, 'DateTimeOriginal');

          let latitude = null;
          let longitude = null;
          let altitude = null;
          let capturedAt = null;

          // Convert GPS coordinates
          if (lat && latRef && lon && lonRef) {
            latitude = convertDMSToDD(lat[0], lat[1], lat[2], latRef);
            longitude = convertDMSToDD(lon[0], lon[1], lon[2], lonRef);
          }

          // Parse altitude
          if (alt) {
            altitude = typeof alt === 'number' ? alt : parseFloat(alt);
          }

          // Parse capture date
          if (dateTime) {
            // EXIF date format: "YYYY:MM:DD HH:mm:ss"
            const dateStr = dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
            capturedAt = new Date(dateStr);
          }

          resolve({
            latitude,
            longitude,
            altitude,
            capturedAt
          });
        });
      };

      img.onerror = () => {
        resolve({ latitude: null, longitude: null, altitude: null, capturedAt: null });
      };
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get device location using Geolocation API
 */
export async function getDeviceLocation(): Promise<{ latitude: number; longitude: number; accuracy: number } | null> {
  if (!navigator.geolocation) {
    console.warn('Geolocation is not supported');
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.warn('Failed to get device location:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Calculate distance between two coordinates in meters using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if coordinates are within a geofence
 */
export function isWithinGeofence(
  latitude: number,
  longitude: number,
  centerLat: number,
  centerLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(latitude, longitude, centerLat, centerLon);
  return distance <= radiusMeters;
}
