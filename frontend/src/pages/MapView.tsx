import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { potholeApi } from '../services/potholeApi';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';
import { ensureArray, isValidPotholeForMap } from '../utils/potholeUtils';
import { generateUserPotholes } from '../utils/userDataGenerator';
import { PotholeMarker } from '../components/PotholeMarker';

// Toggle for fake data - set to true to use test data
const USE_FAKE_DATA = true;

// Default center: Bangalore, India
const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];

// Component to track map center and zoom
const MapLocationTracker = ({ onLocationChange }: { onLocationChange: (lat: number, lng: number, zoom: number) => void }) => {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onLocationChange(center.lat, center.lng, zoom);
    },
    zoomend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onLocationChange(center.lat, center.lng, zoom);
    },
  });

  useEffect(() => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    onLocationChange(center.lat, center.lng, zoom);
  }, [map, onLocationChange]);

  return null;
};

const MapView = () => {
  const { user } = useAuth();
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('osm');
  const [showMajorRoads, setShowMajorRoads] = useState(false);
  const [mapLocation, setMapLocation] = useState({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1], zoom: 13 });

  const { data: apiPotholes, isLoading, error } = useQuery({
    queryKey: ['potholes'],
    queryFn: () => potholeApi.getAllPotholes(),
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !USE_FAKE_DATA, // Only fetch if not using fake data
  });

  // Generate user-specific demo data
  const userPotholes = useMemo(() => {
    if (user && USE_FAKE_DATA) {
      return generateUserPotholes(user.id, user.email);
    }
    return [];
  }, [user]);

  // ALWAYS ensure potholes is an array
  const rawPotholes = USE_FAKE_DATA ? userPotholes : apiPotholes;
  const potholes = ensureArray(rawPotholes, []);

  // Filter out invalid potholes for map rendering
  const validPotholes = potholes.filter(isValidPotholeForMap);

  // Calculate center - use first valid pothole or default
  const center: [number, number] =
    validPotholes.length > 0
      ? [validPotholes[0].latitude, validPotholes[0].longitude]
      : DEFAULT_CENTER;

  const osmTileLayer = (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  );

  const satelliteTileLayer = (
    <TileLayer
      attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    />
  );

  const majorRoadsLayer = showMajorRoads ? (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      opacity={0.5}
    />
  ) : null;

  return (
    <div className="space-y-4">
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Map View</h1>

          {USE_FAKE_DATA && (
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium">
              🧪 Using Fake Test Data
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMapType('osm')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mapType === 'osm'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                OpenStreetMap
              </button>
              <button
                onClick={() => setMapType('satellite')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  mapType === 'satellite'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Satellite
              </button>
            </div>

            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showMajorRoads}
                onChange={(e) => setShowMajorRoads(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                Highlight Major Roads
              </span>
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>High Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span>Medium Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Low Severity</span>
          </div>
        </div>
      </div>

      {/* ALWAYS render map - even with empty data */}
      <div className="bg-white shadow rounded-lg overflow-hidden relative" style={{ height: '600px' }}>
        {isLoading && !USE_FAKE_DATA ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="relative h-full w-full">
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              {mapType === 'osm' ? osmTileLayer : satelliteTileLayer}
              {majorRoadsLayer}

              {/* Track map location */}
              <MapLocationTracker onLocationChange={(lat, lng, zoom) => setMapLocation({ lat, lng, zoom })} />

              {/* Safe marker rendering - only valid potholes are rendered */}
              {validPotholes.map((pothole) => (
                <PotholeMarker key={pothole.id} pothole={pothole} />
              ))}
            </MapContainer>

            {/* Live Location Box */}
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000] border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📍</span>
                <span className="text-sm font-semibold text-gray-900">Location</span>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Lat: {mapLocation.lat.toFixed(5)}</div>
                <div>Lng: {mapLocation.lng.toFixed(5)}</div>
                <div>Zoom: {mapLocation.zoom}</div>
              </div>
            </div>

            {/* Empty state overlay - only show if no valid potholes */}
            {validPotholes.length === 0 && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-95 rounded-lg shadow-lg p-6 text-center max-w-md z-[1000]">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-gray-700 text-lg font-semibold mb-2">
                  No potholes detected yet
                </p>
                <p className="text-gray-600 text-sm">
                  {USE_FAKE_DATA
                    ? 'Toggle USE_FAKE_DATA to false to connect to backend.'
                    : error
                    ? 'Backend server is not available. Enable USE_FAKE_DATA to see test data.'
                    : 'Upload a video to detect and view potholes on the map.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
