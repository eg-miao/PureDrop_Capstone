import MapView, { Marker, type MapPressEvent } from "react-native-maps";
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
  selectedPin: Coordinate | null;
  onPress: (coordinate: Coordinate) => void;
};

export function MapPicker({ style, initialRegion, selectedPin, onPress }: MapPickerProps) {
  const handlePress = (event: MapPressEvent) => {
    onPress(event.nativeEvent.coordinate);
  };

  return (
    <MapView style={style} initialRegion={initialRegion} onPress={handlePress}>
      {selectedPin ? <Marker coordinate={selectedPin} /> : null}
    </MapView>
  );
}
