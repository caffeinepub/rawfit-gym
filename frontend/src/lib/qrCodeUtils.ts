/**
 * Generate a validation checksum for QR code security
 * @param gymId - The gym's unique identifier
 * @param timestamp - Current timestamp
 * @returns Checksum string
 */
function generateChecksum(gymId: string, timestamp: number): string {
  // Simple checksum based on gymId and timestamp
  const combined = `${gymId}-${timestamp}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Verify QR code checksum
 * @param gymId - The gym's unique identifier
 * @param timestamp - Timestamp from QR code
 * @param checksum - Checksum from QR code
 * @returns true if checksum is valid
 */
function verifyChecksum(gymId: string, timestamp: number, checksum: string): boolean {
  const expectedChecksum = generateChecksum(gymId, timestamp);
  return expectedChecksum === checksum;
}

/**
 * Generate QR code data for gym attendance scanner
 * This generates the gym's QR code that members will scan
 * @param gymId - The gym's unique identifier
 * @param timestamp - Current timestamp for security
 * @returns Data string to encode in QR code
 */
export function generateGymQRCodeData(gymId: string, timestamp: number): string {
  const checksum = generateChecksum(gymId, timestamp);
  const data = {
    gymId,
    timestamp,
    checksum,
    type: 'gym_attendance',
    version: '1.0',
  };
  return JSON.stringify(data);
}

/**
 * Generate QR code data URL for member attendance (legacy - for display purposes)
 * @param memberId - The member's unique ID
 * @param timestamp - Current timestamp for security
 * @returns Data string to encode in QR code
 */
export function generateQRCodeData(memberId: string, timestamp: number): string {
  const data = {
    memberId,
    timestamp,
    type: 'attendance',
  };
  return JSON.stringify(data);
}

/**
 * Generate QR code as image URL using external API
 * @param data - The data to encode
 * @returns Image URL
 */
export function generateQRCodeSVG(data: string): string {
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}`;
}

/**
 * Parse QR code data
 * @param qrData - The scanned QR code data string
 * @returns Parsed data object or null if invalid
 */
export function parseQRCodeData(qrData: string): {
  memberId?: string;
  gymId?: string;
  timestamp: number;
  checksum?: string;
  type: string;
  version?: string;
} | null {
  try {
    const parsed = JSON.parse(qrData);
    if (parsed.timestamp && parsed.type) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate QR code timestamp (should be recent)
 * @param timestamp - The timestamp from QR code
 * @param maxAgeMinutes - Maximum age in minutes (default 60 for gym QR codes)
 * @returns true if timestamp is valid
 */
export function isQRCodeTimestampValid(timestamp: number, maxAgeMinutes: number = 60): boolean {
  const now = Date.now();
  const age = now - timestamp;
  const maxAge = maxAgeMinutes * 60 * 1000;
  return age >= 0 && age <= maxAge;
}

/**
 * Validate gym QR code with checksum verification
 * @param qrData - Parsed QR code data
 * @returns true if QR code is valid
 */
export function validateGymQRCode(qrData: {
  gymId?: string;
  timestamp: number;
  checksum?: string;
  type: string;
}): boolean {
  // Check type
  if (qrData.type !== 'gym_attendance') {
    return false;
  }

  // Check required fields
  if (!qrData.gymId || !qrData.checksum) {
    return false;
  }

  // Verify checksum
  if (!verifyChecksum(qrData.gymId, qrData.timestamp, qrData.checksum)) {
    return false;
  }

  // Verify timestamp (60 minutes validity)
  if (!isQRCodeTimestampValid(qrData.timestamp, 60)) {
    return false;
  }

  return true;
}
