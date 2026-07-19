import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { styles } from "./createReportStyles";
import { OsmTileMap } from "./OsmTileMap.native";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type MiniMapPreviewProps = {
  gpsLocation: string;
  selectedPin: Coordinate;
};

export function MiniMapPreview({ gpsLocation, selectedPin }: MiniMapPreviewProps) {
  const label =
    gpsLocation || `${selectedPin.latitude.toFixed(6)}, ${selectedPin.longitude.toFixed(6)}`;

  return (
    <View style={styles.miniMapContainer}>
      <OsmTileMap
        style={styles.miniMap}
        initialRegion={{
          latitude: selectedPin.latitude,
          longitude: selectedPin.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        selectedPin={selectedPin}
      />
      <View style={styles.miniMapOverlay}>
        <Ionicons name="location" size={14} color="#0EA5E9" />
        <Text style={styles.miniMapAddressText} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}
