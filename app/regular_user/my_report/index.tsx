import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../../../firebaseConfig";

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
  if (normalized === "resolved") return "Resolved";
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

type ReportRowProps = {
  item: ReportItem;
  onOpen: (item: ReportItem) => void;
};

function ReportRow({ item, onOpen }: ReportRowProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => onOpen(item)}
    >
      <Text style={styles.cardTitle}>{item.category}</Text>
      <Text style={styles.cardIssue}>{item.issue}</Text>
      <Text style={styles.metaText}>
        Location (Toledo City only): {item.location || item.gpsLocation || "N/A"}
      </Text>
      <Text style={styles.metaText}>Status: {item.status}</Text>
    </TouchableOpacity>
  );
}

export default function MyReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
        (a, b) => toEpoch(b.submittedAt) - toEpoch(a.submittedAt),
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
            normalizeReport(docSnap.data(), docSnap.id || `report-sub-${index}`),
          );
          mergeAndSetReports();
        },
        () => {
          subcollectionReports = [];
          mergeAndSetReports();
        },
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
            normalizeReport(item, `report-legacy-${index}`),
          );
          mergeAndSetReports();
        },
        () => {
          legacyReports = [];
          mergeAndSetReports();
        },
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

  const handleOpenReport = (item: ReportItem) => {
    router.push({
      pathname: "/regular_user/view_reportuser",
      params: { reportId: item.reportId },
    });
  };

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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.header, { paddingTop: Math.max(20, insets.top + 10) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/regular_user/home")}
          activeOpacity={0.85}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>My Reports</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.reportId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No reports submitted yet.</Text>}
        renderItem={({ item }) => (
          <ReportRow
            item={item}
            onOpen={handleOpenReport}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "800",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardIssue: {
    color: "#475569",
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  metaText: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 4,
  },
  emptyText: {
    color: "#64748B",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
});
