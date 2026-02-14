// Expected production version for Version 36
export const EXPECTED_PRODUCTION_VERSION = 'v1.2.1';

// Version comparison utility
export function isVersionMatch(reportedVersion: string | undefined): boolean {
  if (!reportedVersion) return false;
  return reportedVersion === EXPECTED_PRODUCTION_VERSION;
}

// Version status for UI display
export function getVersionStatus(reportedVersion: string | undefined): {
  isMatch: boolean;
  message: string;
  severity: 'success' | 'warning' | 'error';
} {
  if (!reportedVersion) {
    return {
      isMatch: false,
      message: 'Backend version unavailable',
      severity: 'error',
    };
  }

  const isMatch = isVersionMatch(reportedVersion);
  
  if (isMatch) {
    return {
      isMatch: true,
      message: `Version ${reportedVersion} (matches expected)`,
      severity: 'success',
    };
  }

  return {
    isMatch: false,
    message: `Version mismatch: expected ${EXPECTED_PRODUCTION_VERSION}, got ${reportedVersion}`,
    severity: 'warning',
  };
}
