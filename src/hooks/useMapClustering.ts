import { useMemo } from 'react';
import Supercluster from 'supercluster';

interface ClusterPoint {
  type: 'Feature';
  properties: {
    cluster?: boolean;
    point_count?: number;
    [key: string]: any;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export function useMapClustering<T extends { id: string; latitude: number; longitude: number }>(
  locations: T[],
  zoom: number,
  bounds?: [[number, number], [number, number]]
) {
  const supercluster = useMemo(() => {
    const cluster = new Supercluster({
      radius: 60,
      maxZoom: 16,
      minZoom: 0,
    });

    const points: ClusterPoint[] = locations.map((loc) => ({
      type: 'Feature',
      properties: { ...loc },
      geometry: {
        type: 'Point',
        coordinates: [loc.longitude, loc.latitude],
      },
    }));

    cluster.load(points);
    return cluster;
  }, [locations]);

  const clusters = useMemo(() => {
    if (!bounds) return [];
    const [west, south, east, north] = [
      bounds[0][1],
      bounds[0][0],
      bounds[1][1],
      bounds[1][0],
    ];
    return supercluster.getClusters([west, south, east, north], Math.floor(zoom));
  }, [supercluster, zoom, bounds]);

  return { clusters, supercluster };
}
