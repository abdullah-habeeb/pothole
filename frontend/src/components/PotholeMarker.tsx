import { Marker, Popup } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { Pothole } from '../services/potholeApi';
import { isValidPotholeForMap } from '../utils/potholeUtils';

interface PotholeMarkerProps {
  pothole: unknown;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (pothole: Pothole) => void;
}

const createCustomIcon = (color: string, selected = false) => {
  const ringColor = selected ? '#0ea5e9' : 'white';
  const size = selected ? 24 : 20;
  return new DivIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid ${ringColor};
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const iconCache = {
  high: {
    default: createCustomIcon('#ef4444'),
    selected: createCustomIcon('#ef4444', true),
  },
  medium: {
    default: createCustomIcon('#f97316'),
    selected: createCustomIcon('#f97316', true),
  },
  low: {
    default: createCustomIcon('#22c55e'),
    selected: createCustomIcon('#22c55e', true),
  },
};

const getMarkerIcon = (severity: Pothole['severity'], selected = false) => {
  const bucket = iconCache[severity] || iconCache.low;
  return selected ? bucket.selected : bucket.default;
};

export const PotholeMarker = ({
  pothole,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: PotholeMarkerProps) => {
  if (!isValidPotholeForMap(pothole)) {
    return null;
  }

  const p = pothole as Pothole;

  return (
    <Marker
      position={[p.latitude, p.longitude]}
      icon={getMarkerIcon(p.severity, isSelected)}
      eventHandlers={
        selectionMode
          ? {
              click: () => onToggleSelect?.(p),
            }
          : undefined
      }
    >
      <Popup>
        <div className="p-2 min-w-[200px]">
          {p.thumbnail && (
            <img
              src={p.thumbnail}
              alt={`Pothole ${p.id}`}
              className="w-full h-32 object-cover rounded mb-2"
              onError={(e) => {
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
              <span className="capitalize">{(p.status || 'unknown').replace('_', ' ')}</span>
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
          {selectionMode && (
            <button
              type="button"
              onClick={() => onToggleSelect?.(p)}
              className="mt-3 w-full rounded-md border border-primary-200 bg-primary-50 py-1.5 text-xs font-semibold text-primary-700"
            >
              {isSelected ? 'Remove from selection' : 'Select for assignment'}
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

