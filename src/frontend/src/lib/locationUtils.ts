import type { LocationCoordinates } from '../backend';

export interface LocationVerificationResult {
  isWithinRange: boolean;
  distance?: number;
  error?: string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get user's current location using browser Geolocation API
 */
export async function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please check your device settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Verify if user is within authorized range of gym location
 */
export async function verifyLocation(
  gymLocation: LocationCoordinates,
  authorizedRadius: number
): Promise<LocationVerificationResult> {
  try {
    const position = await getCurrentLocation();
    const userLat = position.coords.latitude;
    const userLon = position.coords.longitude;

    const distance = calculateDistance(
      userLat,
      userLon,
      gymLocation.latitude,
      gymLocation.longitude
    );

    return {
      isWithinRange: distance <= authorizedRadius,
      distance: Math.round(distance),
    };
  } catch (error) {
    return {
      isWithinRange: false,
      error: error instanceof Error ? error.message : 'Location verification failed',
    };
  }
}
