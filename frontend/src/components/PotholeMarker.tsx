import { Marker, Popup } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { Pothole } from '../services/potholeApi';
import { isValidPotholeForMap } from '../utils/potholeUtils';

interface PotholeMarkerProps {
  pothole: unknown;
}

// Create custom icons
const createCustomIcon = (color: string) => {
  return new DivIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const redIcon = createCustomIcon('#ef4444');
const orangeIcon = createCustomIcon('#f97316');
const greenIcon = createCustomIcon('#22c55e');

const getMarkerIcon = (severity: Pothole['severity']) => {
  switch (severity) {
    case 'high':
      return redIcon;
    case 'medium':
      return orangeIcon;
    case 'low':
      return greenIcon;
    default:
      return greenIcon;
  }
};

export const PotholeMarker = ({ pothole }: PotholeMarkerProps) => {
  // Safe validation - ensure pothole has all required fields
  if (!isValidPotholeForMap(pothole)) {
    return null;
  }

  const p = pothole as Pothole;

  return (
    <Marker
      position={[p.latitude, p.longitude]}
      icon={getMarkerIcon(p.severity)}
    >
      <Popup>
        <div className="p-2 min-w-[200px]">
          {p.thumbnail && (
            <img
              src={p.thumbnail}
              alt={`Pothole ${p.id}`}
              className="w-full h-32 object-cover rounded mb-2"
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <h3 className="font-semibold text-sm mb-2">Pothole #{p.id}</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <p>
              <strong>Severity:</strong>{' '}
              <span className="capitalize">{p.severity || 'unknown'}</span>
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <span className="capitalize">
                {(p.status || 'unknown').replace('_', ' ')}
              </span>
            </p>
            {p.depth_estimation && typeof p.depth_estimation === 'number' && (
              <p>
                <strong>Depth:</strong> {p.depth_estimation.toFixed(2)} cm
              </p>
            )}
            <p>
              <strong>Coordinates:</strong>
            </p>
            <p className="pl-2">
              {p.latitude.toFixed(6)}, {p.longitude.toFixed(6)}
            </p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

