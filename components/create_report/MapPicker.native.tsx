import MapView, { type Region as MapRegion } from "react-native-maps";
import type { StyleProp, ViewStyle } from "react-native";

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type Region = Coordinate & {
  latitudeDelta: number;
  longitudeDelta: number;
};

type MapPickerProps = {
  style?: StyleProp<ViewStyle>;
  initialRegion: Region;
  onRegionChangeComplete: (region: Region) => void;
};

export function MapPicker({ style, initialRegion, onRegionChangeComplete }: MapPickerProps) {
  const handleRegionChangeComplete = (region: MapRegion) => {
    onRegionChangeComplete(region);
  };

  return (
    <MapView 
      style={style} 
      initialRegion={initialRegion} 
      onRegionChangeComplete={handleRegionChangeComplete}
      showsUserLocation={true}
      showsMyLocationButton={true}
    />
  );
}
