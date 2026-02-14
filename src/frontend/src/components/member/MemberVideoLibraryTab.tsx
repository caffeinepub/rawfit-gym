import { useState, useEffect } from 'react';
import { useMemberAuth } from '../../hooks/useMemberAuth';
import { useGetVideoLibrary, useGetGymLocation } from '../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Video, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { calculateDistance, getCurrentLocation } from '../../lib/locationUtils';
import type { VideoMetadata } from '../../backend';

export default function MemberVideoLibraryTab() {
  const { memberId } = useMemberAuth();
  const { data: gymLocationData } = useGetGymLocation();
  const { data: videos, isLoading: videosLoading } = useGetVideoLibrary(memberId || undefined);
  
  const [locationStatus, setLocationStatus] = useState<'checking' | 'allowed' | 'denied' | 'error'>('checking');
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const checkLocation = async () => {
      if (!gymLocationData) {
        setLocationStatus('checking');
        return;
      }

      try {
        const userLocation = await getCurrentLocation();
        const gymLocation = {
          latitude: gymLocationData.location.latitude,
          longitude: gymLocationData.location.longitude,
        };
        const radiusMeters = Number(gymLocationData.radius);

        const distance = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          gymLocation.latitude,
          gymLocation.longitude
        );

        const withinRange = distance <= radiusMeters;
        
        if (withinRange) {
          setLocationStatus('allowed');
          setLocationError(null);
        } else {
          setLocationStatus('denied');
          setLocationError(`You must be within ${radiusMeters} meters of the gym to access videos. You are currently ${Math.round(distance)} meters away.`);
        }
      } catch (error) {
        console.error('Location check error:', error);
        setLocationStatus('error');
        setLocationError(error instanceof Error ? error.message : 'Failed to verify location');
      }
    };

    checkLocation();
  }, [gymLocationData]);

  if (!memberId) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Video Library</h2>
          <p className="text-sm md:text-base text-muted-foreground">Access workout reference videos</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to be logged in as a member to access the video library.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (locationStatus === 'checking') {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Video Library</h2>
          <p className="text-sm md:text-base text-muted-foreground">Access workout reference videos</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Verifying your location...</p>
            <p className="text-sm text-muted-foreground">Please allow location access when prompted</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (locationStatus === 'denied') {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Video Library</h2>
          <p className="text-sm md:text-base text-muted-foreground">Access workout reference videos</p>
        </div>
        <Alert variant="destructive">
          <MapPin className="h-4 w-4" />
          <AlertTitle>Location Verification Failed</AlertTitle>
          <AlertDescription>
            {locationError || 'You must be at the gym to access workout videos.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (locationStatus === 'error') {
    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Video Library</h2>
          <p className="text-sm md:text-base text-muted-foreground">Access workout reference videos</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Location Error</AlertTitle>
          <AlertDescription>
            {locationError || 'Unable to verify your location. Please enable location services and try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Video Library</h2>
        <p className="text-sm md:text-base text-muted-foreground">Access workout reference videos</p>
      </div>

      <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
        <MapPin className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800 dark:text-green-200">Location Verified</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          You are within gym range. Enjoy your workout videos!
        </AlertDescription>
      </Alert>

      {videosLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : videos && videos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {videos.map((video) => (
            <Card key={video.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-950 rounded-full p-2">
                    <Video className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base md:text-lg line-clamp-1">{video.title}</CardTitle>
                    <CardDescription className="text-xs">
                      <Badge variant="secondary" className="mt-1 text-[10px] md:text-xs">{video.category}</Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <video
                    src={video.blob.getDirectURL()}
                    className="w-full h-full object-cover rounded-lg"
                    controls
                    playsInline
                  />
                </div>
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{video.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-base md:text-lg font-medium">No videos available</p>
            <p className="text-xs md:text-sm text-muted-foreground">
              Videos will appear here once your trainer assigns a workout plan
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
