import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { styles } from "./createReportStyles";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type MiniMapPreviewProps = {
  gpsLocation: string;
  selectedPin: Coordinate;
};

export function MiniMapPreview({ gpsLocation, selectedPin }: MiniMapPreviewProps) {
  return (
    <View style={[styles.miniMapContainer, styles.miniMapFallback]}>
      <Ionicons name="location" size={28} color="#0EA5E9" />
      <Text style={styles.miniMapFallbackTitle}>Pinned location</Text>
      <Text style={styles.miniMapFallbackText} numberOfLines={1}>
        {gpsLocation || `${selectedPin.latitude.toFixed(6)}, ${selectedPin.longitude.toFixed(6)}`}
      </Text>
      <View style={styles.miniMapOverlay}>
        <Ionicons name="navigate" size={14} color="#0EA5E9" />
        <Text style={styles.miniMapAddressText} numberOfLines={1}>
          {selectedPin.latitude.toFixed(6)}, {selectedPin.longitude.toFixed(6)}
        </Text>
      </View>
    </View>
  );
}
