import { useState, useEffect } from 'react';
import { MapStorageService } from '../services/MapStorageService';
import { calculateBoundingBox } from '../utils/mapUtils';
import { BoundingBox, Route } from '../types/map';

interface UseOfflineMapProps {
  route?: Route;
  bufferRadius?: number; // in kilometers
}

export const useOfflineMap = ({ route, bufferRadius = 1 }: UseOfflineMapProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mapStorage = MapStorageService.getInstance();

  const downloadRouteArea = async () => {
    if (!route) return;

    try {
      setIsLoading(true);
      setError(null);

      // Calculate bounding box for the route with buffer
      const bounds = calculateBoundingBox(route.coordinates, bufferRadius);

      await mapStorage.downloadRegion({
        id: `route-${route.id}`,
        name: `Route ${route.id}`,
        bounds,
        minZoom: 12,
        maxZoom: 16,
        metadata: {
          type: 'route',
          expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        },
      }, (progress) => {
        setProgress(progress);
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    progress,
    error,
    downloadRouteArea,
  };
}; 