/**
 * Calculates the distance in meters between two GPS coordinates using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) *
      Math.cos(lat2 * rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

/**
 * Checks if current location is within allowed branch radius.
 */
export function isWithinRadius(
  userLat: number,
  userLon: number,
  branchLat: number,
  branchLon: number,
  allowedRadiusMeters: number
): { isWithin: boolean; distance: number } {
  const distance = calculateDistanceMeters(userLat, userLon, branchLat, branchLon);
  return {
    isWithin: distance <= allowedRadiusMeters,
    distance,
  };
}

/**
 * Helper to fetch browser current position asynchronously with a timeout.
 */
export function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('เบราว์เซอร์ไม่รองรับ GPS Geolocation'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMsg = 'ไม่สามารถดึงตำแหน่ง GPS ได้';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'ผู้ใช้ปฏิเสธการเข้าถึงตำแหน่ง GPS กรุณาเปิดสิทธิ์ระบุตำแหน่งในเบราว์เซอร์';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'ไม่สามารถระบุตำแหน่ง GPS ได้ในขณะนี้';
            break;
          case error.TIMEOUT:
            errorMsg = 'การเชื่อมต่อขอตำแหน่ง GPS หมดเวลา';
            break;
        }
        reject(new Error(errorMsg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}
