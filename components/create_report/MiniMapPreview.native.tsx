import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
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
    <View style={styles.miniMapContainer}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.miniMap}
        region={{
          latitude: selectedPin.latitude,
          longitude: selectedPin.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Marker coordinate={selectedPin} />
      </MapView>
      <View style={styles.miniMapOverlay}>
        <Ionicons name="location" size={14} color="#0EA5E9" />
        <Text style={styles.miniMapAddressText} numberOfLines={1}>
          {gpsLocation}
        </Text>
      </View>
    </View>
  );
}
