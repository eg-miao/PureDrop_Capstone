import { Ionicons } from "@expo/vector-icons";
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
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push("/regular_user/profile/profileview")}
            activeOpacity={0.7}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="person-outline" size={22} color="#0EA5E9" style={styles.actionIcon} />
              <Text style={styles.actionText}>Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/regular_user/about")}
            activeOpacity={0.7}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="information-circle-outline" size={22} color="#0EA5E9" style={styles.actionIcon} />
              <Text style={styles.actionText}>About</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/regular_user/signout/signout_modal")}
            activeOpacity={0.7}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" style={styles.actionIcon} />
              <Text style={[styles.actionText, { color: "#EF4444" }]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  animatedScreen: {
    flex: 1,
    width: "100%",
  },

  avatarWrap: {
    marginTop: 48,
    marginBottom: 40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },

  buttonStack: {
    width: "100%",
    paddingHorizontal: 24,
    gap: 16,
  },

  actionButton: {
    width: "100%",
    height: 64,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionIcon: {
    marginRight: 12,
  },

  actionText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "600",
  },
});
