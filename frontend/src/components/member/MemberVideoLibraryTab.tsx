import { useState, useEffect } from 'react';
import { useMemberAuth } from '../../hooks/useMemberAuth';
import { useGetMemberVideoLibrary, useGetGymLocation } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Play, MapPin, AlertCircle, Lock, RefreshCw } from 'lucide-react';
import { getCurrentLocation, calculateDistance } from '../../lib/locationUtils';

export default function MemberVideoLibraryTab() {
  const { memberId } = useMemberAuth();
  const { data: videos, isLoading: videosLoading } = useGetMemberVideoLibrary(memberId ?? null);
  const { data: gymLocationData } = useGetGymLocation();

  const [locationStatus, setLocationStatus] = useState<'checking' | 'allowed' | 'denied' | 'error' | 'idle'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  const checkLocation = async () => {
    setLocationStatus('checking');
    setLocationError(null);

    try {
      const position = await getCurrentLocation();
      if (!gymLocationData) {
        setLocationStatus('allowed'); // If no gym location configured, allow access
        return;
      }

      const distance = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        gymLocationData.location.latitude,
        gymLocationData.location.longitude
      );

      const radiusMeters = Number(gymLocationData.radius);
      if (distance <= radiusMeters) {
        setLocationStatus('allowed');
      } else {
        setLocationStatus('denied');
        setLocationError(
          `You are ${Math.round(distance)}m away from the gym. You must be within ${radiusMeters}m to access videos.`
        );
      }
    } catch (err: any) {
      setLocationStatus('error');
      setLocationError(err?.message || 'Unable to determine your location. Please enable location access.');
    }
  };

  useEffect(() => {
    checkLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymLocationData]);

  if (!memberId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Please log in to access the video library.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Video Library</h2>
        <p className="text-sm text-muted-foreground">Workout videos assigned to your plan</p>
      </div>

      {/* Location Status */}
      {locationStatus === 'checking' && (
        <Alert>
          <MapPin className="h-4 w-4 animate-pulse" />
          <AlertTitle>Checking Location</AlertTitle>
          <AlertDescription className="text-xs">
            Verifying you are at the gym to allow video access…
          </AlertDescription>
        </Alert>
      )}

      {locationStatus === 'denied' && (
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Location Restricted</AlertTitle>
          <AlertDescription className="text-xs">
            {locationError}
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={checkLocation}
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Retry Location Check
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {locationStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Location Error</AlertTitle>
          <AlertDescription className="text-xs">
            {locationError}
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={checkLocation}
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Video Grid */}
      {locationStatus === 'allowed' && (
        <>
          {videosLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : videos && videos.length > 0 ? (
            <div className="space-y-3">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm truncate">{video.title}</CardTitle>
                        <CardDescription className="text-xs mt-0.5 line-clamp-2">
                          {video.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {video.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {selectedVideoUrl === video.blob.getDirectURL() ? (
                      <video
                        src={video.blob.getDirectURL()}
                        controls
                        className="w-full rounded-lg max-h-48"
                        autoPlay
                      />
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedVideoUrl(video.blob.getDirectURL())}
                      >
                        <Play className="w-3 h-3 mr-2" />
                        Play Video
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                No videos assigned to your workout plan yet. Contact your trainer.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
