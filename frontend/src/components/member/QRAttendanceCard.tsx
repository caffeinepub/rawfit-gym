import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { QrCode, MapPin, CheckCircle, XCircle, Clock, RefreshCw, Camera, AlertTriangle } from 'lucide-react';
import { useGetGymLocation, useGetCurrentCheckInStatus, useRecordQRAttendance } from '../../hooks/useQueries';
import { verifyLocation } from '../../lib/locationUtils';
import { parseQRCodeData, validateGymQRCode } from '../../lib/qrCodeUtils';
import { useQRScanner } from '../../qr-code/useQRScanner';
import { toast } from 'sonner';

interface QRAttendanceCardProps {
  memberId: string;
}

export default function QRAttendanceCard({ memberId }: QRAttendanceCardProps) {
  const [locationStatus, setLocationStatus] = useState<'checking' | 'valid' | 'invalid' | 'error'>('checking');
  const [locationError, setLocationError] = useState<string>('');
  const [distance, setDistance] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: gymLocationData, isLoading: gymLocationLoading } = useGetGymLocation();
  const { data: checkInStatus, isLoading: statusLoading, refetch: refetchStatus } = useGetCurrentCheckInStatus(memberId);
  const recordQRAttendance = useRecordQRAttendance();

  const isCheckedIn = checkInStatus?.isCheckedIn || false;

  // Initialize QR scanner
  const {
    qrResults,
    isScanning: scannerActive,
    isActive: cameraActive,
    error: scannerError,
    canStartScanning,
    startScanning,
    stopScanning,
    clearResults,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: 'environment',
    scanInterval: 100,
    maxResults: 1,
  });

  // Check location
  const checkLocation = async (): Promise<boolean> => {
    if (!gymLocationData) return false;

    setLocationStatus('checking');
    setLocationError('');

    try {
      const result = await verifyLocation(
        gymLocationData.location,
        Number(gymLocationData.radius)
      );

      if (result.error) {
        setLocationStatus('error');
        setLocationError(result.error);
        return false;
      }

      setDistance(result.distance || null);

      if (result.isWithinRange) {
        setLocationStatus('valid');
        return true;
      } else {
        setLocationStatus('invalid');
        setLocationError(
          `You are ${result.distance}m away from the gym. You must be within ${Number(gymLocationData.radius)}m to use QR attendance.`
        );
        return false;
      }
    } catch (error) {
      setLocationStatus('error');
      setLocationError(error instanceof Error ? error.message : 'Location verification failed');
      return false;
    }
  };

  // Initial location check
  useEffect(() => {
    if (gymLocationData && !gymLocationLoading) {
      checkLocation();
    }
  }, [gymLocationData, gymLocationLoading]);

  // Process scanned QR codes
  useEffect(() => {
    if (qrResults.length > 0 && !isProcessing) {
      const latestResult = qrResults[0];
      handleQRCodeScanned(latestResult.data);
      clearResults();
    }
  }, [qrResults, isProcessing]);

  const handleQRCodeScanned = async (qrData: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      console.log('[QRAttendance] Scanned QR data:', qrData);
      
      // Parse QR code data
      const parsed = parseQRCodeData(qrData);
      
      if (!parsed) {
        toast.error('Invalid QR code. Please scan the gym\'s QR code.');
        setIsProcessing(false);
        return;
      }

      console.log('[QRAttendance] Parsed QR data:', parsed);

      // Validate gym QR code with checksum
      if (!validateGymQRCode(parsed)) {
        toast.error('Invalid or expired gym QR code. Please scan a fresh code.');
        setIsProcessing(false);
        return;
      }

      console.log('[QRAttendance] QR code validated successfully');

      // Stop scanning
      await stopScanning();
      setIsScanning(false);

      // Verify location before recording attendance
      console.log('[QRAttendance] Verifying location...');
      const locationValid = await checkLocation();
      
      if (!locationValid) {
        toast.error('Location verification failed. You must be at the gym to check in/out.');
        setIsProcessing(false);
        return;
      }

      console.log('[QRAttendance] Location verified, recording attendance...');

      // Record attendance with backend
      await recordQRAttendance.mutateAsync({
        memberId,
        isCheckIn: !isCheckedIn,
      });

      console.log('[QRAttendance] Attendance recorded successfully');

      // Refetch status immediately
      await refetchStatus();

      // Show success message with icon
      const action = !isCheckedIn ? 'checked in' : 'checked out';
      toast.success(
        <div className="flex items-center gap-2">
          <img src="/assets/generated/qr-scan-success-transparent.dim_32x32.png" alt="Success" className="w-5 h-5" />
          <span>Successfully {action}!</span>
        </div>
      );

    } catch (error) {
      console.error('[QRAttendance] Error processing QR code:', error);
      
      // Show error with icon
      toast.error(
        <div className="flex items-center gap-2">
          <img src="/assets/generated/qr-scan-error-transparent.dim_32x32.png" alt="Error" className="w-5 h-5" />
          <span>{error instanceof Error ? error.message : 'Failed to process QR code'}</span>
        </div>
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartScanning = async () => {
    // Check location first
    console.log('[QRAttendance] Starting scan, checking location...');
    const locationValid = await checkLocation();
    
    if (!locationValid) {
      toast.error('You must be at the gym to use QR attendance');
      return;
    }

    console.log('[QRAttendance] Location valid, starting camera...');
    setIsScanning(true);
    const success = await startScanning();
    if (!success) {
      setIsScanning(false);
      toast.error('Failed to start camera. Please check permissions.');
    } else {
      console.log('[QRAttendance] Camera started successfully');
    }
  };

  const handleStopScanning = async () => {
    console.log('[QRAttendance] Stopping scan...');
    await stopScanning();
    setIsScanning(false);
  };

  const handleTryAgain = () => {
    console.log('[QRAttendance] Retrying scan...');
    setIsProcessing(false);
    clearResults();
  };

  const formatTime = (time: bigint | null) => {
    if (!time) return '';
    const date = new Date(Number(time) / 1000000);
    return date.toLocaleTimeString();
  };

  const getStatusBadge = () => {
    if (!checkInStatus) return null;

    if (checkInStatus.isCheckedIn) {
      return (
        <Badge variant="default" className="text-xs bg-green-600">
          <CheckCircle className="mr-1 h-3 w-3" />
          Checked In
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="text-xs">
        <XCircle className="mr-1 h-3 w-3" />
        Checked Out
      </Badge>
    );
  };

  if (gymLocationLoading || statusLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 dark:bg-purple-950 rounded-full p-2">
            <QrCode className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg md:text-xl">QR Attendance</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Scan the gym's QR code to check in/out
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Status */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Location Status:</span>
          {locationStatus === 'checking' && (
            <Badge variant="secondary" className="text-xs">
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              Checking...
            </Badge>
          )}
          {locationStatus === 'valid' && (
            <Badge variant="default" className="text-xs bg-green-600">
              <CheckCircle className="mr-1 h-3 w-3" />
              At Gym {distance !== null && `(${distance}m)`}
            </Badge>
          )}
          {locationStatus === 'invalid' && (
            <Badge variant="destructive" className="text-xs">
              <XCircle className="mr-1 h-3 w-3" />
              Too Far
            </Badge>
          )}
          {locationStatus === 'error' && (
            <Badge variant="destructive" className="text-xs">
              <XCircle className="mr-1 h-3 w-3" />
              Error
            </Badge>
          )}
        </div>

        {/* Current Status */}
        {isCheckedIn && checkInStatus?.checkInTime && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Checked in at:</span>
            <span className="font-medium">{formatTime(checkInStatus.checkInTime)}</span>
          </div>
        )}

        {/* QR Scanner or Location Error */}
        {locationStatus === 'valid' ? (
          <div className="space-y-4">
            {isScanning && cameraActive ? (
              <div className="space-y-3">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-64 md:h-80 object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-4 border-white/50 rounded-lg w-48 h-48 md:w-64 md:h-64" />
                  </div>

                  {/* Processing indicator */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm font-medium">Processing...</span>
                      </div>
                    </div>
                  )}
                </div>

                {scannerError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs md:text-sm">
                      {scannerError.message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <p className="text-xs md:text-sm text-center text-muted-foreground">
                    Position the gym's QR code within the frame
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleStopScanning}
                      variant="outline"
                      className="flex-1"
                      disabled={isProcessing}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    {isProcessing && (
                      <Button
                        onClick={handleTryAgain}
                        variant="secondary"
                        className="flex-1"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center p-8 bg-muted rounded-lg">
                  <div className="text-center space-y-3">
                    <div className="bg-primary/10 rounded-full p-4 inline-block">
                      <Camera className="h-12 w-12 text-primary" />
                    </div>
                    <p className="text-sm font-medium">
                      {isCheckedIn ? 'Ready to Check Out' : 'Ready to Check In'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Scan the gym's QR code to {isCheckedIn ? 'check out' : 'check in'}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleStartScanning}
                  disabled={!canStartScanning || isProcessing}
                  className="w-full"
                  variant={isCheckedIn ? 'outline' : 'default'}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Scan Gym QR Code
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Alert variant={locationStatus === 'error' ? 'destructive' : 'default'}>
            <AlertDescription className="text-xs md:text-sm">
              {locationStatus === 'checking' && 'Verifying your location...'}
              {locationStatus === 'invalid' && locationError}
              {locationStatus === 'error' && (
                <div className="space-y-2">
                  <p>{locationError}</p>
                  <Button
                    onClick={checkLocation}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Location Check
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-semibold">How to use QR Attendance:</h4>
          <ol className="text-xs md:text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Ensure you are at the gym (within 100 meters)</li>
            <li>Allow location and camera access when prompted</li>
            <li>Tap "Scan Gym QR Code" button</li>
            <li>Point your camera at the gym's QR code</li>
            <li>The system will automatically check you in or out</li>
            <li>If you forget to check out, you'll be auto-checked out after 4 hours</li>
          </ol>
        </div>

        {/* Membership ID Display */}
        <div className="pt-2 border-t">
          <p className="text-xs text-center text-muted-foreground">
            Your Membership ID: <span className="font-mono font-semibold">{memberId}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
