import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

export default function MainPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "regular_user", currentUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (!isMounted) {
            return;
          }

          if (userSnap.exists()) {
            setUser({ uid: currentUser.uid, email: currentUser.email, ...userSnap.data() });
          } else {
            setUser({ uid: currentUser.uid, email: currentUser.email });
            console.warn("User profile not found in Firestore");
          }
        } catch (error) {
          if (!isMounted) {
            return;
          }

          setUser({ uid: currentUser.uid, email: currentUser.email });
          console.warn("Failed to load user profile after login", error);
        }
      } else {
        if (isMounted) {
          setUser(null);
          router.replace("/login");
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />

        <Text style={styles.tagline}>
          Report water problems in your community easily
        </Text>

        {user && <Text style={styles.title}>Hello, {user.fullName || "User"}</Text>}
      </View>

      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/regular_user/report")}
        >
          <Text style={styles.cardText}>Report a Water Problem</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/regular_user/view-reports")}
        >
          <Text style={styles.cardText}>View Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/regular_user/all_reports/all_reportlist")}
        >
          <Text style={styles.cardText}>Reports List</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/regular_user/directory")}
        >
          <Text style={styles.cardText}>Directory</Text>
        </TouchableOpacity>
      </View>

      {/* <TouchableOpacity
        style={styles.aiFab}
        onPress={() => router.push("/regular_user/assistant/assistant_main")}
        activeOpacity={0.85}
      >
        <Text style={styles.aiFabLabel}>Help</Text>
      </TouchableOpacity> */}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5aa0f2",
  },

  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  logo: {
    width: 110,
    height: 110,
    resizeMode: "contain",
    marginBottom: 10,
  },

  tagline: {
    color: "#ffffff",
    fontSize: 13,
    opacity: 0.9,
    textAlign: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    color: "#ffffff",
    fontWeight: "500",
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  grid: {
    flex: 1,
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
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

  cardText: {
    color: "#ffffff",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },
  aiFab: {
    position: "absolute",
    right: 18,
    bottom: 86,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#0f172a",
    borderWidth: 2,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  aiFabLabel: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
});
