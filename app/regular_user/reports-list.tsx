import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

type ReportItem = {
  reportId: string;
  category: string;
  issue: string;
  location: string | null;
  gpsLocation: string | null;
  status: string;
  submittedAt: string;
};

const normalizeStatus = (value: unknown) => {
  if (typeof value !== "string") {
    return "Pending";
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "pending" || normalized === "submitted") return "Pending";
  return "Pending";
};

const normalizeReport = (value: unknown, fallbackId: string): ReportItem => {
  const item = (value ?? {}) as Partial<ReportItem>;
  return {
    reportId:
      typeof item.reportId === "string" && item.reportId.length > 0
        ? item.reportId
        : fallbackId,
    category: typeof item.category === "string" ? item.category : "Uncategorized",
    issue: typeof item.issue === "string" ? item.issue : "",
    location: typeof item.location === "string" ? item.location : null,
    gpsLocation: typeof item.gpsLocation === "string" ? item.gpsLocation : null,
    status: normalizeStatus(item.status),
    submittedAt: typeof item.submittedAt === "string" ? item.submittedAt : "",
  };
};

const toEpoch = (value: unknown) => {
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? 0 : ms;
  }
  return 0;
};

export default function ReportsListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportItem[]>([]);

  useEffect(() => {
    let unsubscribeSubcollection: (() => void) | null = null;
    let unsubscribeUserDoc: (() => void) | null = null;
    let subcollectionReports: ReportItem[] = [];
    let legacyReports: ReportItem[] = [];

    const mergeAndSetReports = () => {
      const mergedMap = new Map<string, ReportItem>();
      [...legacyReports, ...subcollectionReports].forEach((item) => {
        mergedMap.set(item.reportId, item);
      });

      const merged = Array.from(mergedMap.values()).sort(
        (a, b) => toEpoch(b.submittedAt) - toEpoch(a.submittedAt)
      );

      setReports(merged);
      setLoading(false);
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (unsubscribeSubcollection) {
        unsubscribeSubcollection();
        unsubscribeSubcollection = null;
      }
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (!currentUser) {
        subcollectionReports = [];
        legacyReports = [];
        setReports([]);
        setLoading(false);
        return;
      }

      const reportsRef = collection(db, "regular_user", currentUser.uid, "reports");
      const userDocRef = doc(db, "regular_user", currentUser.uid);

      unsubscribeSubcollection = onSnapshot(
        reportsRef,
        (snapshot) => {
          subcollectionReports = snapshot.docs.map((docSnap, index) =>
            normalizeReport(docSnap.data(), docSnap.id || `report-sub-${index}`)
          );
          mergeAndSetReports();
        },
        () => {
          subcollectionReports = [];
          mergeAndSetReports();
        }
      );

      unsubscribeUserDoc = onSnapshot(
        userDocRef,
        (userSnap) => {
          if (!userSnap.exists()) {
            legacyReports = [];
            mergeAndSetReports();
            return;
          }

          const rawReports = userSnap.data().reports;
          const legacy = Array.isArray(rawReports) ? rawReports : [];
          legacyReports = legacy.map((item, index) =>
            normalizeReport(item, `report-legacy-${index}`)
          );
          mergeAndSetReports();
        },
        () => {
          legacyReports = [];
          mergeAndSetReports();
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSubcollection) {
        unsubscribeSubcollection();
      }
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Reports</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/regular_user/home")}>
          <Text style={styles.backButtonText}>Home</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.reportId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No reports submitted yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.88}
            onPress={() =>
              router.push({
                pathname: "/regular_user/view_reportuser",
                params: { reportId: item.reportId },
              })
            }
          >
            <Text style={styles.cardTitle}>{item.category}</Text>
            <Text style={styles.cardIssue}>{item.issue}</Text>
            <Text style={styles.metaText}>Location (Toledo City only): {item.location || item.gpsLocation || "N/A"}</Text>
            <Text style={styles.metaText}>Status: {item.status}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5a9ae6",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
  },
  backButton: {
    backgroundColor: "#d8ecf6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 12,
  },
  card: {
    backgroundColor: "#d8ecf6",
    borderRadius: 10,
    padding: 14,
  },
  cardTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardIssue: {
    color: "#0f172a",
    fontSize: 14,
    marginBottom: 8,
  },
  metaText: {
    color: "#334155",
    fontSize: 12,
  },
  emptyText: {
    color: "#ffffff",
    opacity: 0.9,
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
  },
});
