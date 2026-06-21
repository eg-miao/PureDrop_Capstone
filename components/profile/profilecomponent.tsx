import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface ProfileViewModel {
  fullName: string;
  address: string;
  email: string;
  profileImageUrl?: string | null;
}

interface ProfileComponentProps {
  profile: ProfileViewModel | null;
  loading: boolean;
  uploadingAvatar: boolean;
  error: string | null;
  onChangeAvatar: () => void;
  onBack: () => void;
}

export default function ProfileComponent({
  profile,
  loading,
  uploadingAvatar,
  error,
  onChangeAvatar,
  onBack,
}: ProfileComponentProps) {
  const avatarSource = profile?.profileImageUrl
    ? { uri: profile.profileImageUrl }
    : require("../../assets/images/default_account.png");

  return (
    <SafeAreaView style={styles.container}>
      {/* <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={26} color="#ffffff" />
      </TouchableOpacity> */}

      <View style={styles.card}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.avatarWrap}>
          <Image
            source={avatarSource}
            style={styles.avatar}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#1e40af" style={styles.loader} />
        ) : (
          <>
            <Text style={styles.nameText}>{profile?.fullName || "User"}</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.changePhotoButton, uploadingAvatar && styles.changePhotoButtonDisabled]}
              onPress={onChangeAvatar}
              disabled={uploadingAvatar}
              activeOpacity={0.85}
            >
              <Text style={styles.changePhotoText}>
                {uploadingAvatar ? "Uploading photo..." : "Change Profile Picture"}
              </Text>
            </TouchableOpacity>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ADDRESS:</Text>
              <Text style={styles.fieldValue}>{profile?.address || "No address"}</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>YOUR EMAIL:</Text>
              <Text style={styles.fieldValue}>{profile?.email || "No email"}</Text>
              <View style={styles.line} />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5aa0f2",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 52,
    left: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1e88e5",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    marginTop: 80,
    width: "90%",
    maxWidth: 360,
    minHeight: 560,
    backgroundColor: "#d1d1d1",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3aa0ff",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 22,
  },
  title: {
    fontSize: 38,
    fontWeight: "400",
    color: "#1d1d1d",
    marginBottom: 20,
  },
  avatarWrap: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 4,
    borderColor: "#d8f0ff",
    overflow: "hidden",
    backgroundColor: "#4a5260",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  loader: {
    marginTop: 28,
  },
  nameText: {
    fontSize: 32,
    fontWeight: "400",
    color: "#1a1a1a",
    marginBottom: 24,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#a11b1b",
    marginBottom: 10,
    textAlign: "center",
  },
  changePhotoButton: {
    backgroundColor: "#1e88e5",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  changePhotoButtonDisabled: {
    opacity: 0.7,
  },
  changePhotoText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  fieldGroup: {
    width: "100%",
    marginBottom: 22,
  },
  fieldLabel: {
    fontSize: 13,
    color: "#a2a2a2",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  fieldValue: {
    fontSize: 16,
    color: "#1f1f1f",
    marginBottom: 6,
  },
  line: {
    borderBottomColor: "#7f7f7f",
    borderBottomWidth: 1,
    width: "100%",
  },
});
