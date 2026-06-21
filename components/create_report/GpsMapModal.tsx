import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from "react-native";
import { MapPicker, type Coordinate, type Region } from "./MapPicker";
import { styles } from "./createReportStyles";

type GpsMapModalProps = {
  gpsLoading: boolean;
  initialRegion: Region;
  selectedPin: Coordinate | null;
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onMapPress: (coordinate: Coordinate) => void;
};

export function GpsMapModal({
  gpsLoading,
  initialRegion,
  selectedPin,
  visible,
  onCancel,
  onConfirm,
  onMapPress,
}: GpsMapModalProps) {
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Tap to select location</Text>
        </View>

        <MapPicker
          style={styles.map}
          initialRegion={initialRegion}
          selectedPin={selectedPin}
          onPress={onMapPress}
        />

        <View style={styles.mapActions}>
          <TouchableOpacity style={styles.mapCancelButton} onPress={onCancel}>
            <Text style={styles.mapCancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapConfirmButton} onPress={onConfirm}>
            {gpsLoading ? (
              <ActivityIndicator size="small" color="#0b1f1a" />
            ) : (
              <Text style={styles.mapConfirmText}>Use this location</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
