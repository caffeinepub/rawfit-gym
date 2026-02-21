// Expected production version for Version 45 (Production Mainnet Deployment)
export const EXPECTED_PRODUCTION_VERSION = 'v1.3.0.0';

// Normalize version string for comparison (trim whitespace, handle common prefixes)
function normalizeVersion(version: string): string {
  return version
    .trim()
    .toLowerCase()
    .replace(/^version\s*/i, '')
    .replace(/^v/, '');
}

// Version comparison utility with normalization
export function isVersionMatch(reportedVersion: string | undefined): boolean {
  if (!reportedVersion) return false;
  
  const normalizedReported = normalizeVersion(reportedVersion);
  const normalizedExpected = normalizeVersion(EXPECTED_PRODUCTION_VERSION);
  
  return normalizedReported === normalizedExpected;
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
    message: `Version mismatch: expected ${EXPECTED_PRODUCTION_VERSION}, but backend reports ${reportedVersion}`,
    severity: 'warning',
  };
}
