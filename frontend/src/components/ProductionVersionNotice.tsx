import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { getVersionStatus } from '../release/expectedProductionVersion';
import { Button } from '@/components/ui/button';

interface ProductionVersionNoticeProps {
  reportedVersion: string | undefined;
  className?: string;
}

export function ProductionVersionNotice({ reportedVersion, className }: ProductionVersionNoticeProps) {
  const status = getVersionStatus(reportedVersion);

  // Only show notice when there's a mismatch or error
  if (status.isMatch) {
    return null;
  }

  const Icon = status.severity === 'error' ? AlertCircle : AlertTriangle;
  const variant = status.severity === 'error' ? 'destructive' : 'default';

  const handleHardRefresh = () => {
    // Clear cache and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    window.location.reload();
  };

  return (
    <Alert variant={variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>Version Notice</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{status.message}</p>
        <p className="text-xs">
          This usually means your browser is using cached code. Try a hard refresh:
        </p>
        <ul className="text-xs list-disc list-inside space-y-1">
          <li>Windows/Linux: Ctrl + Shift + R</li>
          <li>Mac: Cmd + Shift + R</li>
        </ul>
        <Button
          variant="outline"
          size="sm"
          onClick={handleHardRefresh}
          className="mt-2"
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Clear Cache & Reload
        </Button>
      </AlertDescription>
    </Alert>
  );
}
