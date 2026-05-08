import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../../firebaseConfig";

type DetailedCommunityReport = {
  reportId: string;
  reporterName: string;
  reporterAvatarUrl: string | null;
  category: string;
  issue: string;
  location: string | null;
  gpsLocation: string | null;
  status: string;
  waterMeter: string | null;
  attachments: string[];
};

const normalizeStatus = (value: unknown) => {
  if (typeof value !== "string") return "Pending";
  const normalized = value.trim().toLowerCase();
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "resolved") return "Resolved";
  if (normalized === "pending" || normalized === "submitted") return "Pending";
  return "Pending";
};

export default function ViewAllReportsScreen() {
  const router = useRouter();
  const { reportId, userId } = useLocalSearchParams<{ reportId?: string; userId?: string }>();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<DetailedCommunityReport | null>(null);
  const goToReportList = useCallback(() => {
    router.replace("/regular_user/all_reports/all_reportlist");
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        goToReportList();
        return true;
      });

      return () => subscription.remove();
    }, [goToReportList])
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setReport(null);
        setLoading(false);
        return;
      }

      const selectedReportId = typeof reportId === "string" ? reportId : "";
      const selectedUserId = typeof userId === "string" ? userId : "";

      if (!selectedReportId || !selectedUserId) {
        setReport(null);
        setLoading(false);
        return;
      }

      try {
        const reportRef = doc(collection(db, "regular_user", selectedUserId, "reports"), selectedReportId);
        const reportSnap = await getDoc(reportRef);
        if (!reportSnap.exists()) {
          setReport(null);
          setLoading(false);
          return;
        }

        const data = reportSnap.data() as Record<string, unknown>;

        const userRef = doc(db, "regular_user", selectedUserId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? (userSnap.data() as Record<string, unknown>) : {};

        const fallbackName =
          typeof userData.fullName === "string" && userData.fullName.length > 0
            ? userData.fullName
            : `User ${selectedUserId.slice(0, 6)}`;
        const fallbackAvatar =
          typeof userData.profileImageUrl === "string" && userData.profileImageUrl.length > 0
            ? userData.profileImageUrl
            : null;

        setReport({
          reportId:
            typeof data.reportId === "string" && data.reportId.length > 0
              ? data.reportId
              : selectedReportId,
          reporterName:
            typeof data.reporterName === "string" && data.reporterName.length > 0
              ? data.reporterName
              : fallbackName,
          reporterAvatarUrl:
            typeof data.reporterAvatarUrl === "string" && data.reporterAvatarUrl.length > 0
              ? data.reporterAvatarUrl
              : fallbackAvatar,
          category: typeof data.category === "string" ? data.category : "Uncategorized",
          issue: typeof data.issue === "string" ? data.issue : "",
          location: typeof data.location === "string" ? data.location : null,
          gpsLocation: typeof data.gpsLocation === "string" ? data.gpsLocation : null,
          status: normalizeStatus(data.status),
          waterMeter: typeof data.waterMeter === "string" ? data.waterMeter : null,
          attachments: Array.isArray(data.attachments)
            ? data.attachments.filter((url): url is string => typeof url === "string" && url.length > 0)
            : [],
        });
      } catch {
        setReport(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [reportId, userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Report not found.</Text>
          <TouchableOpacity style={styles.backButton} onPress={goToReportList}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const avatarSource = report.reporterAvatarUrl
    ? { uri: report.reporterAvatarUrl }
    : require("../../../assets/images/default_account.png");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.topBack} onPress={goToReportList} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={26} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.heading}>Problem Summary</Text>
          <Image source={avatarSource} style={styles.cornerAvatar} resizeMode="cover" />

          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{report.category}</Text>

          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{report.reporterName || "N/A"}</Text>

          <Text style={styles.label}>Location (Toledo City only):</Text>
          <Text style={styles.value}>{report.location || "N/A"}</Text>

          <Text style={styles.label}>GPS Coordinates:</Text>
          <Text style={styles.value}>{report.gpsLocation || "N/A"}</Text>

          <Text style={styles.label}>Issue:</Text>
          <Text style={styles.value}>{report.issue || "N/A"}</Text>

          <Text style={styles.label}>Water Meter:</Text>
          <Text style={styles.value}>{report.waterMeter || "N/A"}</Text>

          <Text style={styles.label}>Attachments:</Text>
          {report.attachments.length === 0 ? (
            <Text style={styles.value}>No attachments</Text>
          ) : (
            <View style={styles.attachmentRow}>
              {report.attachments.map((uri, index) => (
                <TouchableOpacity
                  key={`${uri}-${index}`}
                  activeOpacity={0.86}
                  onPress={() =>
                    router.push({
                      pathname: "/regular_user/view_allrep/attachment_lightbox",
                      params: {
                        uri,
                        reportId: report.reportId,
                        userId: typeof userId === "string" ? userId : "",
                        index: String(index + 1),
                      },
                    })
                  }
                >
                  <Image source={{ uri }} style={styles.attachmentImage} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{report.status}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5a9ae6",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  topBack: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#1e88e5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  card: {
    position: "relative",
    borderRadius: 12,
    backgroundColor: "#d1d5db",
    padding: 18,
    minHeight: 500,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  heading: {
    fontSize: 24,
    textAlign: "center",
    color: "#111827",
    marginBottom: 18,
  },
  cornerAvatar: {
    position: "absolute",
    top: 46,
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#94a3b8",
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  label: {
    color: "#111827",
    fontSize: 18,
    marginTop: 8,
  },
  value: {
    color: "#111827",
    fontSize: 14,
    marginTop: 2,
    marginBottom: 8,
  },
  attachmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  attachmentImage: {
    width: 132,
    height: 132,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#94a3b8",
  },
  emptyText: {
    color: "#ffffff",
    fontSize: 18,
    marginBottom: 14,
  },
  backButton: {
    backgroundColor: "#d8ecf6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
  },
});
