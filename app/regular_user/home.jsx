import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";

export default function MainPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(14, insets.top + 10) }]}>
        <View style={styles.headerLeft}>
          <Image source={require("../../assets/images/logo.png")} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>PureDrop</Text>
        </View>
      </View>

      {/* Scrollable Dashboard Body */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Welcome Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroOverlay}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroWelcome}>Welcome back,</Text>
              <Text style={styles.heroName}>{user?.fullName || "Resident"}</Text>
              <Text style={styles.heroSubtitle}>Toledo City Community Portal</Text>
            </View>
            <View style={styles.heroIconContainer}>
              <Ionicons name="water" size={100} color="rgba(255,255,255,0.1)" />
            </View>
          </View>
        </View>

        {/* Primary Call-to-Action Card */}
        <TouchableOpacity
          style={styles.primaryActionCard}
          onPress={() => router.push("/regular_user/report")}
          activeOpacity={0.85}
        >
          <View style={styles.primaryActionIconWrap}>
            <Ionicons name="add-circle" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.primaryActionTextWrap}>
            <Text style={styles.primaryActionTitle}>Report a Problem</Text>
            <Text style={styles.primaryActionDesc}>
              Submit a report for leaks, dirty water, or supply outage.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#0EA5E9" style={{ opacity: 0.8 }} />
        </TouchableOpacity>

        {/* Dashboard Utilities Section */}
        <Text style={styles.sectionLabel}>Dashboard Utilities</Text>

        <View style={styles.utilitiesGrid}>
          {/* My Reports */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push("/regular_user/view-reports")}
            activeOpacity={0.85}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: "#E0F2FE" }]}>
              <Ionicons name="clipboard-outline" size={24} color="#0EA5E9" />
            </View>
            <Text style={styles.gridTitle}>My Reports</Text>
            <Text style={styles.gridDesc}>Track your submissions</Text>
          </TouchableOpacity>

          {/* Community Feed */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push("/regular_user/all_reports/all_reportlist")}
            activeOpacity={0.85}
          >
            <View style={[styles.gridIconWrap, { backgroundColor: "#ECFDF5" }]}>
              <Ionicons name="people-outline" size={24} color="#10B981" />
            </View>
            <Text style={styles.gridTitle}>Community</Text>
            <Text style={styles.gridDesc}>View local issues</Text>
          </TouchableOpacity>

          {/* Emergency Directory (Full width spanning 2 columns) */}
          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardFull]}
            onPress={() => router.push("/regular_user/directory")}
            activeOpacity={0.85}
          >
            <View style={styles.fullCardContent}>
              <View style={[styles.gridIconWrap, { backgroundColor: "#FEF2F2", marginBottom: 0 }]}>
                <Ionicons name="call-outline" size={24} color="#EF4444" />
              </View>
              <View style={styles.fullCardText}>
                <Text style={styles.gridTitle}>Emergency Directory</Text>
                <Text style={styles.gridDesc}>Contact numbers and hotline</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Help FAB */}
     
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerLogo: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingBottom: 160,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  heroCard: {
    backgroundColor: "#0284C7",
    borderRadius: 24,
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  heroOverlay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 28,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  heroTextContainer: {
    flex: 1,
    zIndex: 2,
  },
  heroWelcome: {
    color: "#BAE6FD",
    fontSize: 15,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroName: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: "#E0F2FE",
    fontSize: 14,
    marginTop: 8,
    fontWeight: "400",
    opacity: 0.9,
  },
  heroIconContainer: {
    position: "absolute",
    right: -20,
    bottom: -20,
    zIndex: 1,
  },
  primaryActionCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  primaryActionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0EA5E9",
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryActionTextWrap: {
    flex: 1,
    marginLeft: 16,
    marginRight: 12,
  },
  primaryActionTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  primaryActionDesc: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  utilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  gridCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    alignItems: "flex-start",
  },
  gridCardFull: {
    width: "100%",
  },
  fullCardContent: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  fullCardText: {
    flex: 1,
    marginLeft: 16,
  },
  gridIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  gridTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  gridDesc: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
  },
  aiFab: {
    position: "absolute",
    right: 24,
    bottom: 100,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0284C7",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
