import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import { useLocation, useNavigate } from 'react-router-dom';
import { potholeApi, Pothole } from '../services/potholeApi';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { ensureArray, isValidPotholeForMap } from '../utils/potholeUtils';
import { PotholeMarker } from '../components/PotholeMarker';
import { toast } from 'sonner';
import {
  usePotholeSelection,
  SelectedPothole,
} from '../context/PotholeSelectionContext';

// Default center: Bangalore, India
const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];

type SelectionNavState = {
  selectionMode?: boolean;
  preselect?: string[];
  focus?: { lat: number; lng: number; zoom?: number };
} | null;

const getSegmentLabel = (p: Pick<Pothole, 'latitude' | 'longitude'>) => {
  const zones = ['North BLR', 'South BLR', 'East BLR', 'West BLR'];
  const zoneIndex = Math.abs(Math.round(p.longitude * 10)) % zones.length;
  const sector = Math.abs(Math.round(p.latitude * 100)) % 50;
  return `${zones[zoneIndex]} • Sector ${sector}`;
};

const buildSelectionSummary = (items: SelectedPothole[]) => {
  if (items.length === 0) return '';
  if (items.length === 1) {
    return items[0].segmentLabel || items[0].description || `Pothole #${items[0]._id.slice(-6)}`;
  }
  const anchor = items[0];
  return `${items.length} potholes near ${anchor.segmentLabel || anchor.description || 'selected area'}`;
};

// Component to track map center and zoom
const MapLocationTracker = ({ onLocationChange }: { onLocationChange: (lat: number, lng: number, zoom: number) => void }) => {
  const map = useMap();
  const lastUpdateRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null);

  useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const newState = { lat: center.lat, lng: center.lng, zoom };
      
      // Only update if values actually changed (prevent infinite loop)
      if (!lastUpdateRef.current || 
          Math.abs(lastUpdateRef.current.lat - newState.lat) > 0.0001 ||
          Math.abs(lastUpdateRef.current.lng - newState.lng) > 0.0001 ||
          lastUpdateRef.current.zoom !== newState.zoom) {
        lastUpdateRef.current = newState;
        onLocationChange(newState.lat, newState.lng, newState.zoom);
      }
    },
    zoomend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const newState = { lat: center.lat, lng: center.lng, zoom };
      
      // Only update if values actually changed
      if (!lastUpdateRef.current || 
          Math.abs(lastUpdateRef.current.lat - newState.lat) > 0.0001 ||
          Math.abs(lastUpdateRef.current.lng - newState.lng) > 0.0001 ||
          lastUpdateRef.current.zoom !== newState.zoom) {
        lastUpdateRef.current = newState;
        onLocationChange(newState.lat, newState.lng, newState.zoom);
      }
    },
  });

  // Initial location set - only once
  useEffect(() => {
    if (!lastUpdateRef.current) {
      const center = map.getCenter();
      const zoom = map.getZoom();
      lastUpdateRef.current = { lat: center.lat, lng: center.lng, zoom };
      onLocationChange(center.lat, center.lng, zoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return null;
};

const SelectionFocusController = ({ focus }: { focus: { lat: number; lng: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (focus) {
      map.flyTo([focus.lat, focus.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
    }
  }, [focus, map]);
  return null;
};

const MapView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setSelection } = usePotholeSelection();
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('osm');
  const [showMajorRoads, setShowMajorRoads] = useState(false);
  const [mapLocation, setMapLocation] = useState({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1], zoom: 13 });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMap, setSelectedMap] = useState<Record<string, SelectedPothole>>({});
  const [pendingPreselect, setPendingPreselect] = useState<string[]>([]);
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lng: number } | null>(null);

  const { data: apiPotholes, isLoading, error } = useQuery({
    queryKey: ['potholes'],
    queryFn: () => potholeApi.getAllPotholes(),
    retry: false,
    refetchOnWindowFocus: false,
  });

  // ALWAYS ensure potholes is an array
  const potholes = ensureArray(apiPotholes, []);

  // Filter out invalid potholes for map rendering
  const validPotholes = potholes.filter(isValidPotholeForMap);

  // Calculate center - use first valid pothole or default
  const center: [number, number] =
    validPotholes.length > 0
      ? [validPotholes[0].latitude, validPotholes[0].longitude]
      : DEFAULT_CENTER;

  // OSM tile layer with fallback
  const osmTileLayer = (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      errorTileUrl="https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
      maxZoom={19}
    />
  );

  // Fallback OSM tile layer
  const osmFallbackLayer = (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (Fallback)'
      url="https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
      maxZoom={19}
    />
  );

  const satelliteTileLayer = (
    <TileLayer
      attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      maxZoom={19}
    />
  );

  const majorRoadsLayer = showMajorRoads ? (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      opacity={0.5}
    />
  ) : null;

  const selectionNavState = location.state as SelectionNavState;

  useEffect(() => {
    if (selectionNavState?.selectionMode) {
      setSelectionMode(true);
      if (selectionNavState.preselect?.length) {
        setPendingPreselect(selectionNavState.preselect);
      }
      if (selectionNavState.focus) {
        setFocusPoint({
          lat: selectionNavState.focus.lat,
          lng: selectionNavState.focus.lng,
        });
      }
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [selectionNavState, navigate, location.pathname]);

  useEffect(() => {
    if (!selectionMode || pendingPreselect.length === 0) return;
    setSelectedMap((prev) => {
      const next = { ...prev };
      pendingPreselect.forEach((id) => {
        const match = validPotholes.find((p) => p._id === id);
        if (match) {
          next[match._id] = {
            ...match,
            segmentLabel: getSegmentLabel(match),
            description: `Lat ${match.latitude.toFixed(3)}, Lng ${match.longitude.toFixed(3)}`,
          };
        }
      });
      return next;
    });
    setPendingPreselect([]);
  }, [selectionMode, pendingPreselect, validPotholes]);

  const selectedList = useMemo(() => Object.values(selectedMap), [selectedMap]);
  const selectedCount = selectedList.length;

  const toggleSelection = (pothole: Pothole) => {
    setSelectedMap((prev) => {
      const draft = { ...prev };
      if (draft[pothole._id]) {
        delete draft[pothole._id];
      } else {
        draft[pothole._id] = {
          _id: pothole._id,
          latitude: pothole.latitude,
          longitude: pothole.longitude,
          severity: pothole.severity,
          status: pothole.status,
          segmentLabel: getSegmentLabel(pothole),
          description: `Lat ${pothole.latitude.toFixed(3)}, Lng ${pothole.longitude.toFixed(3)}`,
        };
      }
      return draft;
    });
  };

  const removeSelection = (id: string) => {
    setSelectedMap((prev) => {
      const draft = { ...prev };
      delete draft[id];
      return draft;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedMap({});
    setPendingPreselect([]);
    setFocusPoint(null);
  };

  const handleConfirmSelection = () => {
    if (selectedCount === 0) {
      toast.error('Select at least one pothole to continue');
      return;
    }
    setSelection({
      items: selectedList,
      summary: buildSelectionSummary(selectedList),
      source: 'map',
    });
    toast.success(`Selected ${selectedCount} pothole${selectedCount > 1 ? 's' : ''}`);
    exitSelectionMode();
    navigate('/dashboard', { state: { focus: 'gov-panel' } });
  };

  const handleCancelSelection = () => {
    exitSelectionMode();
    toast('Selection mode cancelled');
  };

  const handleLocationChange = useCallback((lat: number, lng: number, zoom: number) => {
    setMapLocation({ lat, lng, zoom });
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Map View</h1>

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
          {selectionMode && (
            <div className="flex items-center gap-2 text-primary-700 font-semibold">
              <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
              Selection mode active · click markers to toggle
            </div>
          )}
        </div>
      </div>

      {/* ALWAYS render map - even with empty data */}
      <div className="bg-white shadow rounded-lg overflow-hidden relative" style={{ height: '600px' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="relative h-full w-full">
            {selectionMode && (
              <div className="absolute top-4 left-1/2 z-[1200] -translate-x-1/2">
                <div className="flex items-center gap-4 rounded-full border border-primary-100 bg-white/95 px-5 py-3 shadow-card">
                  <span className="text-sm font-semibold text-primary-700">
                    Selection mode · {selectedCount} selected
                  </span>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <button
                      type="button"
                      onClick={handleCancelSelection}
                      className="rounded-full border border-surface-200 px-3 py-1 text-ink-500 hover:border-ink-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={selectedCount === 0}
                      onClick={handleConfirmSelection}
                      className="rounded-full bg-primary-600 px-3 py-1 text-white disabled:opacity-50"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}
            <MapContainer
              center={center}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              key={`map-${mapType}`} // Force remount on map type change
            >
              {mapType === 'osm' ? (
                <>
                  {osmTileLayer}
                  {osmFallbackLayer}
                </>
              ) : (
                satelliteTileLayer
              )}
              {majorRoadsLayer}

              {/* Track map location */}
              <MapLocationTracker onLocationChange={handleLocationChange} />
              <SelectionFocusController focus={focusPoint} />

              {/* Safe marker rendering - only valid potholes are rendered */}
            {validPotholes.map((pothole) => (
                <PotholeMarker
                  key={pothole._id}
                  pothole={pothole}
                  selectionMode={selectionMode}
                  isSelected={Boolean(selectedMap[pothole._id])}
                  onToggleSelect={toggleSelection}
                />
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

            {selectionMode && selectedCount > 0 && (
              <div className="absolute bottom-4 left-4 z-[1100] w-64 rounded-xl border border-surface-200 bg-white/95 p-3 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Selected Potholes
                </p>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-ink-600">
                  {selectedList.map((item) => (
                    <li key={item._id} className="flex items-center justify-between gap-2">
                      <span className="line-clamp-2">
                        #{item._id.slice(-6)} • {item.segmentLabel || item.description}
                      </span>
                      <button
                        type="button"
                        className="text-primary-600"
                        onClick={() => removeSelection(item._id)}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Empty state overlay - only show if no valid potholes */}
            {validPotholes.length === 0 && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-95 rounded-lg shadow-lg p-6 text-center max-w-md z-[1000]">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-gray-700 text-lg font-semibold mb-2">
                  No potholes detected yet
                </p>
                <p className="text-gray-600 text-sm">
              {error
                ? 'Backend server is not available. Please start the Node backend on port 5000.'
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
