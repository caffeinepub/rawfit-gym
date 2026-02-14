import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { getVersionStatus } from '../release/expectedProductionVersion';

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

  return (
    <Alert variant={variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>Version Notice</AlertTitle>
      <AlertDescription>{status.message}</AlertDescription>
    </Alert>
  );
}
