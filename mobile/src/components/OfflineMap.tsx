import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapboxGL from '@react-native-mapbox-gl/maps';
import { useOfflineMap } from '../hooks/useOfflineMap';
import { ProgressBar } from './ProgressBar';
import { Route } from '../types/map';
import NetInfo from '@react-native-community/netinfo';

interface Props {
  route: Route;
  showUserLocation?: boolean;
}

export const OfflineMap: React.FC<Props> = ({ route, showUserLocation = true }) => {
  const [isOnline, setIsOnline] = useState(true);
  const { isLoading, progress, error, downloadRouteArea } = useOfflineMap({
    route,
    bufferRadius: 2, // 2km buffer around route
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    // Download map data if not already downloaded
    checkAndDownloadMap();

    return () => {
      unsubscribe();
    };
  }, []);

  const checkAndDownloadMap = async () => {
    if (!isOnline) {
      Alert.alert(
        'Offline Mode',
        'Using offline map data. Some features may be limited.'
      );
    } else {
      try {
        await downloadRouteArea();
      } catch (err) {
        Alert.alert('Error', 'Failed to download offline map data');
      }
    }
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        zoomEnabled={true}
        rotateEnabled={true}
      >
        <MapboxGL.Camera
          zoomLevel={14}
          centerCoordinate={route.coordinates[0]}
        />

        {showUserLocation && (
          <MapboxGL.UserLocation
            renderMode="normal"
            visible={true}
          />
        )}

        <MapboxGL.ShapeSource
          id="routeSource"
          shape={{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route.coordinates,
            },
          }}
        >
          <MapboxGL.LineLayer
            id="routeLine"
            style={{
              lineColor: '#2196F3',
              lineWidth: 3,
            }}
          />
        </MapboxGL.ShapeSource>
      </MapboxGL.MapView>

      {isLoading && (
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  progressContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 