import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
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
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch Firestore user profile
        const userDocRef = doc(db, "regular_user", currentUser.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          setUser({ uid: currentUser.uid, email: currentUser.email, ...userSnap.data() });
        } else {
          console.warn("User profile not found in Firestore");
        }
      } else {
        // Redirect to login if no user
        router.replace("/login/login");
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login/login");
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />

        <Text style={styles.tagline}>
          “Report water problems in your community easily”
        </Text>

        {user && <Text style={styles.title}>Hello, {user.fullName || "User"}</Text>}
      </View>

      {/* BUTTON GRID */}
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

        {/* <TouchableOpacity style={[styles.card, { backgroundColor: "#f87171" }]} onPress={handleLogout}>
          <Text style={styles.cardText}>Logout</Text>
        </TouchableOpacity> */}
      </View>
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
});
