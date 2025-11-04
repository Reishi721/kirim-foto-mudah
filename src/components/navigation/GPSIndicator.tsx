import { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GPSStatus {
  accuracy: number | null;
  isActive: boolean;
  latitude: number | null;
  longitude: number | null;
}

export function GPSIndicator() {
  const [gpsStatus, setGpsStatus] = useState<GPSStatus>({
    accuracy: null,
    isActive: false,
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      position => {
        setGpsStatus({
          accuracy: position.coords.accuracy,
          isActive: true,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => {
        console.error('GPS error:', error);
        setGpsStatus(prev => ({ ...prev, isActive: false }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const getAccuracyLevel = () => {
    if (!gpsStatus.accuracy) return { level: 'none', color: 'text-muted-foreground', text: 'No GPS' };
    if (gpsStatus.accuracy < 10) return { level: 'excellent', color: 'text-success', text: 'Excellent' };
    if (gpsStatus.accuracy < 50) return { level: 'good', color: 'text-brand', text: 'Good' };
    if (gpsStatus.accuracy < 100) return { level: 'fair', color: 'text-amber-500', text: 'Fair' };
    return { level: 'poor', color: 'text-destructive', text: 'Poor' };
  };

  const accuracy = getAccuracyLevel();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={`flex items-center gap-1.5 ${gpsStatus.isActive ? '' : 'opacity-50'}`}
        >
          {gpsStatus.isActive ? (
            <Navigation className={`h-3 w-3 ${accuracy.color}`} />
          ) : (
            <MapPin className="h-3 w-3 text-muted-foreground" />
          )}
          <span className="text-xs hidden sm:inline">{accuracy.text}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="bg-popover backdrop-blur-xl border">
        <div className="text-xs space-y-1">
          <p className="font-medium">GPS Status</p>
          {gpsStatus.accuracy ? (
            <>
              <p className="text-muted-foreground">Accuracy: ±{Math.round(gpsStatus.accuracy)}m</p>
              <p className="text-muted-foreground text-[10px]">
                {gpsStatus.latitude?.toFixed(6)}, {gpsStatus.longitude?.toFixed(6)}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">Location not available</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
