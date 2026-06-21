import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function ProfileScreen() {
  const router = useRouter();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!currentUser) {
        setProfileImageUrl(null);
        return;
      }

      const userRef = doc(db, "regular_user", currentUser.uid);
      unsubscribeProfile = onSnapshot(
        userRef,
        (snap) => {
          if (!snap.exists()) {
            setProfileImageUrl(null);
            return;
          }

          const data = snap.data() as { profileImageUrl?: unknown };
          setProfileImageUrl(
            typeof data.profileImageUrl === "string" && data.profileImageUrl.length > 0
              ? data.profileImageUrl
              : null,
          );
        },
        () => {
          setProfileImageUrl(null);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const avatarSource = profileImageUrl
    ? { uri: profileImageUrl }
    : require("../../assets/images/default_account.png");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.animatedScreen}>
        <View style={styles.avatarWrap}>
          <Image
            source={avatarSource}
            style={styles.avatar}
          />
        </View>

        <View style={styles.buttonStack}>
          <TouchableOpacity style={styles.actionButton}
          onPress={() => router.push("/regular_user/profile/profileview")}>
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/regular_user/about")}
          >
            <Text style={styles.actionText}>About</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/regular_user/signout/signout_modal")}
          >
            <Text style={styles.actionText}>Logout</Text>
          </TouchableOpacity>
        </View>
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

  animatedScreen: {
    flex: 1,
    width: "100%",
  },

  avatarWrap: {
    marginTop: 40,
    marginBottom: 30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#bfe0ff",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },

  buttonStack: {
    width: "100%",
    alignItems: "center",
    gap: 22,
  },

  actionButton: {
   width: "48%",
    height: 90,
    backgroundColor: "#1e40af",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  actionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
