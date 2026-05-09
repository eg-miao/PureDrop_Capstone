import * as Location from "expo-location";

export type GpsResult = {
  formattedLocation: string;
  city: string;
  isOutsideToledo: boolean;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

function formatLocation(city: string, latitude: number, longitude: number) {
  return city
    ? `${city} (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`
    : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

export async function getLocationFromCoordinates(
  latitude: number,
  longitude: number
): Promise<GpsResult> {
  const geocode = await Location.reverseGeocodeAsync({
    latitude,
    longitude,
  });

  const firstMatch = geocode[0];
  const city = firstMatch?.city || firstMatch?.subregion || "";
  const formattedLocation = formatLocation(city, latitude, longitude);

  return {
    formattedLocation,
    city,
    isOutsideToledo: Boolean(city && city.toLowerCase() !== "toledo"),
    latitude,
    longitude,
  };
}

export async function getCurrentGpsLocation(): Promise<GpsResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("LOCATION_PERMISSION_DENIED");
  }

  const readings: Location.LocationObject[] = [];
  for (let i = 0; i < 3; i += 1) {
    const reading = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    readings.push(reading);
  }

  const bestReading = readings.reduce((best, current) => {
    const bestAccuracy = best.coords.accuracy ?? Number.POSITIVE_INFINITY;
    const currentAccuracy = current.coords.accuracy ?? Number.POSITIVE_INFINITY;
    return currentAccuracy < bestAccuracy ? current : best;
  });

  const location = await getLocationFromCoordinates(
    bestReading.coords.latitude,
    bestReading.coords.longitude
  );

  return {
    ...location,
    accuracyMeters: bestReading.coords.accuracy ?? undefined,
  };
}
