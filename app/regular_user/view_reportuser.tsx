import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

type DetailedReport = {
  reportId: string;
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
  if (normalized === "pending" || normalized === "submitted") return "Pending";
  return "Pending";
};

const normalizeReport = (value: unknown, fallbackId: string): DetailedReport => {
  const item = (value ?? {}) as Partial<DetailedReport>;
  return {
    reportId: typeof item.reportId === "string" && item.reportId.length > 0 ? item.reportId : fallbackId,
    category: typeof item.category === "string" ? item.category : "Uncategorized",
    issue: typeof item.issue === "string" ? item.issue : "",
    location: typeof item.location === "string" ? item.location : null,
    gpsLocation: typeof item.gpsLocation === "string" ? item.gpsLocation : null,
    status: normalizeStatus(item.status),
    waterMeter: typeof item.waterMeter === "string" ? item.waterMeter : null,
    attachments: Array.isArray(item.attachments)
      ? item.attachments.filter((url): url is string => typeof url === "string" && url.length > 0)
      : [],
  };
};

export default function ViewReportUserScreen() {
  const router = useRouter();
  const { reportId, userId } = useLocalSearchParams<{ reportId?: string; userId?: string }>();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<DetailedReport | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setReport(null);
        setLoading(false);
        return;
      }

      const selectedReportId = typeof reportId === "string" ? reportId : "";
      const selectedUserId = typeof userId === "string" ? userId : "";
      if (!selectedReportId) {
        setReport(null);
        setLoading(false);
        return;
      }

      try {
        const ownerUserId = selectedUserId || currentUser.uid;
        const subReportRef = doc(collection(db, "regular_user", ownerUserId, "reports"), selectedReportId);
        const subReportSnap = await getDoc(subReportRef);

        if (subReportSnap.exists()) {
          setReport(normalizeReport(subReportSnap.data(), subReportSnap.id));
          setLoading(false);
          return;
        }

        if (selectedUserId) {
          setReport(null);
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, "regular_user", currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
          setReport(null);
          setLoading(false);
          return;
        }

        const legacyReports = Array.isArray(userSnap.data().reports) ? userSnap.data().reports : [];
        const foundLegacy = legacyReports.find(
          (item: unknown) =>
            typeof item === "object" &&
            item !== null &&
            "reportId" in (item as Record<string, unknown>) &&
            (item as Record<string, unknown>).reportId === selectedReportId
        );

        setReport(foundLegacy ? normalizeReport(foundLegacy, selectedReportId) : null);
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.topBack} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="arrow-back" size={26} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.heading}>Problem Summary</Text>

          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{report.category}</Text>

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
                      pathname: "/regular_user/attachment_lightbox_user",
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
    borderRadius: 12,
    backgroundColor: "#d1d5db",
    padding: 18,
    minHeight: 500,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  heading: {
    fontSize: 40,
    textAlign: "center",
    color: "#111827",
    marginBottom: 18,
  },
  label: {
    color: "#111827",
    fontSize: 26,
    marginTop: 8,
  },
  value: {
    color: "#111827",
    fontSize: 22,
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
