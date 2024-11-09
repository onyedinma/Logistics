import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

interface TrackingData {
  currentLocation: {
    lat: number;
    lng: number;
  } | null;
  status: string;
  history: Array<{
    type: 'LOCATION_UPDATE' | 'STATUS_UPDATE';
    location?: { lat: number; lng: number; };
    status?: string;
    message?: string;
    timestamp: Date;
  }>;
}

export const useOrderTracking = (orderId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.REACT_APP_WS_URL!, {
      auth: { token }
    });

    socketInstance.on('connect', () => {
      console.log('Connected to tracking server');
      socketInstance.emit('join-order-tracking', orderId);
    });

    socketInstance.on('location-update', (location) => {
      setTracking(prev => prev ? {
        ...prev,
        currentLocation: location
      } : null);
    });

    socketInstance.on('status-update', (status) => {
      setTracking(prev => prev ? {
        ...prev,
        status: status.code
      } : null);
    });

    setSocket(socketInstance);

    // Fetch initial tracking data
    fetchTrackingData();

    return () => {
      socketInstance.emit('leave-order-tracking', orderId);
      socketInstance.disconnect();
    };
  }, [orderId, token]);

  const fetchTrackingData = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/tracking/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      setTracking(data);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    }
  };

  return tracking;
}; 