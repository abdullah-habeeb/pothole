import { useState, FormEvent, ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { potholeApi, Pothole } from '../services/potholeApi';
import { toast } from 'sonner';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { ensureArray } from '../utils/potholeUtils';

// Mock processing function - generates dummy potholes
const mockProcessVideo = async (videoFile: File, gpsFile: File | null): Promise<Pothole[]> => {
  // Simulate processing delay (2-4 seconds)
  const delay = 2000 + Math.random() * 2000;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Generate random potholes within a test bounding box (Bangalore area)
  const baseLat = 12.9716;
  const baseLng = 77.5946;
  const count = Math.floor(Math.random() * 5) + 3; // 3-7 potholes

  const potholes: Pothole[] = [];
  const severities: Pothole['severity'][] = ['low', 'medium', 'high'];
  const statuses: Pothole['status'][] = ['open', 'in_progress'];

  for (let i = 0; i < count; i++) {
    const lat = baseLat + (Math.random() - 0.5) * 0.1;
    const lng = baseLng + (Math.random() - 0.5) * 0.1;
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const depth = severity === 'high' 
      ? 5 + Math.random() * 7 
      : severity === 'medium' 
      ? 2 + Math.random() * 4 
      : 0.5 + Math.random() * 2.5;

    potholes.push({
      id: Date.now() + i,
      latitude: lat,
      longitude: lng,
      severity,
      status,
      depth_estimation: depth,
      thumbnail: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return potholes;
};

const UploadVideo = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [gpsFile, setGpsFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const processMutation = useMutation({
    mutationFn: async () => {
      if (!videoFile) throw new Error('Video file is required');
      setProcessing(true);
      
      try {
        // Mock processing
        const potholes = await mockProcessVideo(videoFile, gpsFile);
        
        // Update React Query cache to include new potholes
        queryClient.setQueryData(['potholes'], (oldData: Pothole[] | undefined) => {
          const existing = ensureArray(oldData, []);
          return [...existing, ...potholes];
        });
        
        return { potholes };
      } finally {
        setProcessing(false);
      }
    },
    onSuccess: (data) => {
      const potholesArray = ensureArray(data?.potholes, []);
      toast.success(`Processing complete! Found ${potholesArray.length} potholes.`);
      setVideoFile(null);
      setGpsFile(null);
      
      // Redirect to map after short delay
      setTimeout(() => {
        navigate('/map');
      }, 1500);
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to process video. Please try again.'
      );
    },
  });

  const handleVideoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['video/mp4', 'video/quicktime'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a .mp4 or .mov file');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error('File size must be less than 100MB');
        return;
      }
      setVideoFile(file);
    }
  };

  const handleGpsFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validExtensions = ['.gpx', '.txt', '.csv'];
      const fileName = file.name.toLowerCase();
      const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (!hasValidExtension) {
        toast.error('Please upload a .gpx, .txt, or .csv file');
        return;
      }
      setGpsFile(file);
    }
  };

  const handleProcess = async (e: FormEvent) => {
    e.preventDefault();

    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }

    processMutation.mutate();
  };

  const getSeverityColor = (severity: Pothole['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // ALWAYS ensure detectedPotholes is an array
  const detectedPotholes = ensureArray(processMutation.data?.potholes, []);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Video</h1>

        <form onSubmit={handleProcess} className="space-y-6">
          <div>
            <label
              htmlFor="video"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Upload Video File (.mp4)
            </label>
            <input
              id="video"
              type="file"
              accept=".mp4,.mov,video/mp4,video/quicktime"
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
            <label
              htmlFor="gps"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Upload GPS File (.gpx, .txt, or .csv)
            </label>
            <input
              id="gps"
              type="file"
              accept=".gpx,.txt,.csv"
              onChange={handleGpsFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {gpsFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {gpsFile.name} ({(gpsFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Optional: Upload GPS coordinates from your dashcam
            </p>
          </div>

          {processing && (
            <div className="w-full">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Processing video and analyzing frames...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-primary-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={processMutation.isPending || !videoFile || processing}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing Videos...
              </div>
            ) : (
              'Process Videos'
            )}
          </button>
        </form>

        {/* How it works section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>ℹ️</span> How it works
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Upload your dashcam video files (MP4 recommended)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Upload corresponding GPS files from your dashcam</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>The system analyses video frames using AI to detect potholes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>GPS coordinates are matched with detections</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Results are added to the pothole database automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>You will be redirected to the map to view detected potholes</span>
            </li>
          </ul>
        </div>
      </div>

      {processMutation.isPending && <CardSkeleton />}

      {processMutation.data && ensureArray(processMutation.data.potholes, []).length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Detected Potholes ({detectedPotholes.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {detectedPotholes.map((pothole) => (
              <div
                key={pothole.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {pothole.thumbnail && (
                  <img
                    src={pothole.thumbnail}
                    alt={`Pothole ${pothole.id}`}
                    className="w-full h-32 object-cover rounded-md mb-3"
                  />
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getSeverityColor(pothole.severity)}`}>
                      {pothole.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{pothole.status}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>📍 {pothole.latitude.toFixed(6)}, {pothole.longitude.toFixed(6)}</p>
                    {pothole.depth_estimation && (
                      <p>📏 Depth: {pothole.depth_estimation.toFixed(2)} cm</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadVideo;

