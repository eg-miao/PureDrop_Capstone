import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MapPicker, type Region } from "./MapPicker";
import { styles } from "./createReportStyles";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type GpsMapModalProps = {
  gpsLoading: boolean;
  initialRegion: Region;
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onRegionChangeComplete: (region: Region) => void;
};

export function GpsMapModal({
  gpsLoading,
  initialRegion,
  visible,
  onCancel,
  onConfirm,
  onRegionChangeComplete,
}: GpsMapModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.fullScreenMapContainer}>
        <MapPicker
          style={styles.fullScreenMap}
          initialRegion={initialRegion}
          onRegionChangeComplete={onRegionChangeComplete}
        />

        {/* Fixed Center Pin */}
        <View style={styles.centerPinContainer} pointerEvents="none">
          <View style={styles.centerPinIconWrap}>
            <Ionicons name="location" size={40} color="#EF4444" />
          </View>
          <View style={styles.centerPinShadow} />
        </View>

        {/* Floating Top Bar */}
        <View style={[styles.floatingTopBar, { top: Math.max(20, insets.top + 10) }]}>
          <TouchableOpacity style={styles.floatingCloseButton} onPress={onCancel} activeOpacity={0.8}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Floating Bottom Bar */}
        <View style={[styles.floatingBottomBar, { paddingBottom: Math.max(24, insets.bottom + 12) }]}>
          <View style={styles.floatingConfirmPanel}>
            <Text style={styles.floatingInstructionText}>
              {"Drag the map to perfectly align the pin with your issue's location."}
            </Text>
            <TouchableOpacity style={styles.floatingConfirmButton} onPress={onConfirm} activeOpacity={0.85}>
              {gpsLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.floatingConfirmText}>Confirm Location</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
