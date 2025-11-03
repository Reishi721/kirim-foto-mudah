import { useMemo } from 'react';

interface HeatmapLayerProps {
  locations: Array<{ latitude: number; longitude: number; intensity?: number }>;
  zoom: number;
}

export function HeatmapLayer({ locations, zoom }: HeatmapLayerProps) {
  const heatmapData = useMemo(() => {
    if (locations.length === 0) return null;

    // Calculate the density map
    const cellSize = Math.max(0.001, 0.01 / zoom); // Smaller cells at higher zoom
    const grid: Map<string, number> = new Map();

    locations.forEach((loc) => {
      const cellX = Math.floor(loc.latitude / cellSize);
      const cellY = Math.floor(loc.longitude / cellSize);
      const key = `${cellX},${cellY}`;
      grid.set(key, (grid.get(key) || 0) + (loc.intensity || 1));
    });

    // Find max intensity for normalization
    const maxIntensity = Math.max(...Array.from(grid.values()));

    return { grid, cellSize, maxIntensity };
  }, [locations, zoom]);

  if (!heatmapData || heatmapData.grid.size === 0) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <defs>
        <radialGradient id="heatGradient">
          <stop offset="0%" stopColor="rgba(255, 0, 0, 0.8)" />
          <stop offset="30%" stopColor="rgba(255, 100, 0, 0.6)" />
          <stop offset="60%" stopColor="rgba(255, 200, 0, 0.4)" />
          <stop offset="100%" stopColor="rgba(255, 255, 0, 0)" />
        </radialGradient>
      </defs>
      {Array.from(heatmapData.grid.entries()).map(([key, intensity]) => {
        const [cellX, cellY] = key.split(',').map(Number);
        const lat = cellX * heatmapData.cellSize;
        const lng = cellY * heatmapData.cellSize;
        const normalizedIntensity = intensity / heatmapData.maxIntensity;
        const radius = 30 * normalizedIntensity * Math.sqrt(zoom);

        return (
          <circle
            key={key}
            cx={`${((lng + 180) / 360) * 100}%`}
            cy={`${((90 - lat) / 180) * 100}%`}
            r={radius}
            fill="url(#heatGradient)"
            opacity={0.6}
          />
        );
      })}
    </svg>
  );
}
