import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Download, RefreshCw, Clock } from 'lucide-react';
import { generateGymQRCodeData, generateQRCodeSVG } from '../../lib/qrCodeUtils';

export default function GymQRCodeGenerator() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<number>(30);

  const generateQRCode = () => {
    const gymId = 'RAWFIT_GYM_001'; // Static gym identifier
    const timestamp = Date.now();
    const qrData = generateGymQRCodeData(gymId, timestamp);
    const qrUrl = generateQRCodeSVG(qrData);
    setQrCodeUrl(qrUrl);
    setLastGenerated(new Date());
    setTimeUntilRefresh(30);
    console.log('[GymQRCode] Generated new QR code with timestamp:', timestamp);
    console.log('[GymQRCode] QR data:', qrData);
  };

  // Generate QR code on mount
  useEffect(() => {
    generateQRCode();
  }, []);

  // Auto-refresh QR code every 30 minutes for security
  useEffect(() => {
    const interval = setInterval(() => {
      generateQRCode();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilRefresh((prev) => {
        if (prev <= 1) {
          return 30;
        }
        return prev - 1;
      });
    }, 60 * 1000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleDownload = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `rawfit-gym-qr-code-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 dark:bg-purple-950 rounded-full p-2">
            <QrCode className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <CardTitle>Gym QR Code Scanner</CardTitle>
            <CardDescription>
              Display this QR code for members to scan for attendance
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Clock className="mr-1 h-3 w-3" />
            {timeUntilRefresh}m
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrCodeUrl && (
          <div className="space-y-4">
            <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-dashed">
              <img
                src={qrCodeUrl}
                alt="Gym QR Code for Attendance"
                className="w-64 h-64"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-center font-medium text-primary">
                Members should scan this QR code to check in/out
              </p>
              {lastGenerated && (
                <p className="text-xs text-center text-muted-foreground">
                  Generated: {lastGenerated.toLocaleString()}
                </p>
              )}
              <p className="text-xs text-center text-muted-foreground">
                Auto-refreshes in {timeUntilRefresh} minutes
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={generateQRCode}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Code
              </Button>
              <Button
                onClick={handleDownload}
                variant="default"
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-semibold">Instructions:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Display this QR code at the gym entrance or reception</li>
            <li>Members will scan this code with their phone camera</li>
            <li>The system automatically checks them in or out based on their current status</li>
            <li>QR code includes security checksum and timestamp validation</li>
            <li>Code refreshes every 30 minutes for enhanced security</li>
            <li>Download and print for physical display if needed</li>
          </ul>
        </div>

        <div className="pt-4 border-t">
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 space-y-2">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Security Features:</h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>Unique checksum prevents QR code spoofing</li>
              <li>Timestamp validation ensures code freshness (60-minute validity)</li>
              <li>GPS location verification required for all check-ins</li>
              <li>Auto check-out after 4 hours if member forgets</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
