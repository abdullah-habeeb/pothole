import { FormEvent, ChangeEvent, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  potholeApi,
  MLPotholeDetection,
  ParsedGpsPoint,
  UploadDetectionsResponse,
} from '../services/potholeApi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { ensureArray } from '../utils/potholeUtils';

type MlResponse = {
  severity?: 'high' | 'medium' | 'none';
  potholes: MLPotholeDetection[];
  preview_image: string | null;
};

const splitPattern = /[,;\t\s]+/;

const parseTimestamp = (value: string | number | null | undefined) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value.trim());
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
  }
  return undefined;
};

const parseDelimitedGps = (text: string): ParsedGpsPoint[] => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];

  const headerTokens = lines[0].toLowerCase().split(splitPattern);
  const latIndex = headerTokens.findIndex((token) => token.includes('lat'));
  const lonIndex =
    headerTokens.findIndex((token) => token.includes('lon')) ??
    headerTokens.findIndex((token) => token.includes('lng'));
  const tsIndex = headerTokens.findIndex((token) => token.includes('time'));
  const hasHeader = latIndex !== -1 && lonIndex !== -1;

  const getValue = (tokens: string[], index: number) =>
    index >= 0 && index < tokens.length ? tokens[index] : undefined;

  const startIndex = hasHeader ? 1 : 0;
  const data: ParsedGpsPoint[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const tokens = lines[i].split(splitPattern).map((token) => token.trim()).filter(Boolean);
    if (tokens.length < 2) continue;

    const latToken = getValue(tokens, hasHeader ? latIndex : 0);
    const lonToken = getValue(tokens, hasHeader ? lonIndex : 1);
    const tsToken = getValue(tokens, hasHeader ? tsIndex : 2);

    const latitude = latToken ? Number(latToken) : NaN;
    const longitude = lonToken ? Number(lonToken) : NaN;

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      continue;
    }

    data.push({
      latitude,
      longitude,
      timestamp: tsToken ? parseTimestamp(tsToken) ?? undefined : undefined,
    });
  }

  return data;
};

const parseGpx = (text: string): ParsedGpsPoint[] => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'application/xml');
  const points = Array.from(xml.getElementsByTagName('trkpt'));

  return points
    .map((point) => {
      const lat = Number(point.getAttribute('lat'));
      const lon = Number(point.getAttribute('lon'));
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return null;
      }
      const timeNode = point.getElementsByTagName('time')[0];
      return {
        latitude: lat,
        longitude: lon,
        timestamp: timeNode ? parseTimestamp(timeNode.textContent) : undefined,
      };
    })
    .filter(Boolean) as ParsedGpsPoint[];
};

const parseGpsFile = async (file: File): Promise<ParsedGpsPoint[]> => {
  const text = await file.text();
  if (file.name.toLowerCase().endsWith('.gpx')) {
    return parseGpx(text);
  }
  return parseDelimitedGps(text);
};

const UploadVideo = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [gpsFile, setGpsFile] = useState<File | null>(null);
  const [gpsPoints, setGpsPoints] = useState<ParsedGpsPoint[]>([]);
  const [gpsParsing, setGpsParsing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mlResult, setMlResult] = useState<MlResponse | null>(null);
  const [backendResult, setBackendResult] = useState<UploadDetectionsResponse | null>(null);
  const queryClient = useQueryClient();

  const handleVideoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['video/mp4', 'video/quicktime'].includes(file.type)) {
      toast.error('Please upload a .mp4 or .mov file');
      return;
    }
    if (file.size > 250 * 1024 * 1024) {
      toast.error('Video must be smaller than 250MB');
      return;
    }
    setVideoFile(file);
    setMlResult(null);
    setBackendResult(null);
  };

  const handleGpsFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validExtensions = ['.gpx', '.txt', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));
    if (!isValid) {
      toast.error('GPS file must be .gpx, .txt, or .csv');
      return;
    }
    setGpsFile(file);
    setGpsParsing(true);
    setBackendResult(null);
    try {
      const parsed = await parseGpsFile(file);
      setGpsPoints(parsed);
      toast.success(`Loaded ${parsed.length} GPS points`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to parse GPS file. Please verify the format.'
      );
      setGpsPoints([]);
    } finally {
      setGpsParsing(false);
    }
  };

  const handleAnalyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!videoFile) {
      toast.error('Please select a video file before analyzing');
      return;
    }
    setProcessing(true);
    setBackendResult(null);
    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      const response = await fetch('http://127.0.0.1:8000/analyze-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || 'FastAPI server returned an error');
      }

      const result: MlResponse = await response.json();
      const detections = ensureArray(result.potholes, []);
      
      // Compute overall severity from potholes if not provided
      let overallSeverity: 'high' | 'medium' | 'none' = 'none';
      if (detections.length > 0) {
        // Check if any pothole has severity field (from backend)
        const severities = detections
          .map((p: any) => p.severity)
          .filter((s: string | undefined): s is string => typeof s === 'string');
        
        if (severities.length > 0) {
          // Determine overall severity: if any is high, overall is high; else if any is medium, overall is medium
          if (severities.some((s: string) => s.toLowerCase() === 'high')) {
            overallSeverity = 'high';
          } else if (severities.some((s: string) => s.toLowerCase() === 'medium')) {
            overallSeverity = 'medium';
          } else {
            overallSeverity = 'none';
          }
        } else {
          // Fallback: compute from confidence if severity not available
          const maxConfidence = Math.max(...detections.map((p: any) => p.confidence || 0));
          if (maxConfidence >= 0.77) {
            overallSeverity = 'high';
          } else if (maxConfidence >= 0.50) {
            overallSeverity = 'medium';
          } else {
            overallSeverity = 'none';
          }
        }
      }
      
      // Ensure severity is set
      const resultWithSeverity: MlResponse = {
        ...result,
        severity: result.severity || overallSeverity,
      };
      
      if (!detections.length) {
        toast.info('No potholes detected in this video');
      } else {
        toast.success(`Detected ${detections.length} pothole(s)`);
      }
      setMlResult(resultWithSeverity);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Unable to reach the FastAPI server. Is it running on port 8000?'
      );
      setMlResult(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveToBackend = async () => {
    if (!mlResult) {
      toast.error('Run analysis before saving');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        severity: mlResult.severity || 'none',
        previewImage: mlResult.preview_image,
        potholes: ensureArray(mlResult.potholes, []),
        gps: gpsPoints,
      };
      const response = await potholeApi.saveDetections(payload);
      setBackendResult(response);
      toast.success(`Saved ${response.video.pothole_count} potholes to the backend`);
      queryClient.invalidateQueries({ queryKey: ['potholes'] });
      setVideoFile(null);
      setGpsFile(null);
      setGpsPoints([]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save detections. Ensure the Node backend is running on port 5000.'
      );
    } finally {
      setSaving(false);
    }
  };

  const severityBadge = (severity: MlResponse['severity'] | 'none') => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const gpsSummary = useMemo(() => {
    if (!gpsPoints.length) return 'No GPS data attached';
    const first = gpsPoints[0];
    const last = gpsPoints[gpsPoints.length - 1];
    return `Loaded ${gpsPoints.length} points (start: ${first.latitude.toFixed(5)},${first.longitude.toFixed(
      5
    )} · end: ${last.latitude.toFixed(5)},${last.longitude.toFixed(5)})`;
  }, [gpsPoints]);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload & Analyze Video</h1>

        <form onSubmit={handleAnalyze} className="space-y-6">
          <div>
            <label htmlFor="video" className="block text-sm font-medium text-gray-700 mb-2">
              Dashcam Video (.mp4)
            </label>
            <input
              id="video"
              type="file"
              accept=".mp4,video/mp4,video/quicktime"
              onChange={handleVideoFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {videoFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <label htmlFor="gps" className="block text-sm font-medium text-gray-700 mb-2">
              GPS Track (.gpx / .csv / .txt) — optional
            </label>
            <input
              id="gps"
              type="file"
              accept=".gpx,.csv,.txt"
              onChange={handleGpsFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {gpsFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {gpsFile.name} ({(gpsFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">{gpsParsing ? 'Parsing GPS points…' : gpsSummary}</p>
          </div>

          {processing && (
            <div className="w-full">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Analyzing video with YOLOv11…</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-primary-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!videoFile || processing || gpsParsing}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Processing…
              </div>
            ) : (
              'Analyze Video'
            )}
          </button>
        </form>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>ℹ️</span> Workflow
          </h3>
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>Upload your dashcam `.mp4` video.</li>
            <li>Optionally attach the GPS track exported from your dashcam.</li>
            <li>The FastAPI service samples every 20th frame and runs the Roboflow YOLOv11 model.</li>
            <li>Detections (max 5) show up with preview thumbnails.</li>
            <li>Click “Save detections” to sync everything with MongoDB.</li>
          </ol>
        </div>
      </div>

      {processing && <CardSkeleton />}

      {mlResult && (
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">ML Results</h2>
              <p className="text-sm text-gray-500">
                {mlResult.potholes.length
                  ? `Detected ${mlResult.potholes.length} pothole${mlResult.potholes.length > 1 ? 's' : ''}.`
                  : 'No potholes were detected.'}
              </p>
            </div>
            <div className={`px-3 py-1 border rounded-full text-sm font-semibold ${severityBadge(mlResult.severity || 'none')}`}>
              Severity: {(mlResult.severity || 'none').toUpperCase()}
            </div>
          </div>

          {mlResult.preview_image && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Preview frame</p>
              <img
                src={`data:image/jpeg;base64,${mlResult.preview_image}`}
                alt="Preview"
                className="w-full max-w-2xl rounded-lg border"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mlResult.potholes.map((pothole, index) => (
              <div
                key={`${pothole.x}-${pothole.y}-${index}`}
                className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3"
              >
                {pothole.preview_image && (
                  <img
                    src={`data:image/jpeg;base64,${pothole.preview_image}`}
                    alt={`Detection ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                  />
                )}
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Confidence:</strong> {(pothole.confidence * 100).toFixed(1)}%
                  </p>
                  <p>
                    <strong>Bounding box:</strong> {pothole.width.toFixed(0)} × {pothole.height.toFixed(0)} px
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSaveToBackend}
              disabled={saving || !mlResult.potholes.length || Boolean(backendResult)}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {backendResult
                ? 'Detections saved'
                : saving
                ? 'Saving to backend…'
                : 'Save detections to MongoDB'}
            </button>
            {backendResult && (
              <p className="text-sm text-gray-600">
                Video ID <span className="font-mono">{backendResult.video.video_id}</span> saved with{' '}
                {backendResult.video.pothole_count} pothole(s).
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadVideo;

