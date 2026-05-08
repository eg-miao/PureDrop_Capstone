import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
  collectionGroup,
  doc,
  getDoc,
  onSnapshot,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AllRepComponent, { type AllReportListItem } from "../../../components/all_reports/all_repcomponent";
import { auth, db } from "../../../firebaseConfig";

type UserProfileCache = Record<
  string,
  {
    fullName?: string;
    profileImageUrl?: string;
  }
>;

type RawReport = {
  reportId?: unknown;
  userId?: unknown;
  category?: unknown;
  status?: unknown;
  submittedAt?: unknown;
  createdAt?: unknown;
  reporterName?: unknown;
  reporterAvatarUrl?: unknown;
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

const toEpoch = (value: unknown) => {
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (value && typeof value === "object" && "toDate" in (value as Record<string, unknown>)) {
    try {
      const dateValue = (value as { toDate: () => Date }).toDate();
      return dateValue.getTime();
    } catch {
      return 0;
    }
  }
  return 0;
};

export default function AllReportListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<AllReportListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeReports: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (unsubscribeReports) {
        unsubscribeReports();
        unsubscribeReports = null;
      }

      if (!currentUser) {
        setReports([]);
        setLoading(false);
        router.replace("/login/login");
        return;
      }

      const profileCache: UserProfileCache = {};
      const reportsRef = collectionGroup(db, "reports");

      unsubscribeReports = onSnapshot(
        reportsRef,
        async (snapshot: QuerySnapshot<DocumentData>) => {
          const docs = snapshot.docs.map((docSnap) => {
            const data = (docSnap.data() ?? {}) as RawReport;
            return {
              fallbackReportId: docSnap.id,
              reportId: typeof data.reportId === "string" && data.reportId.length > 0 ? data.reportId : docSnap.id,
              userId: typeof data.userId === "string" ? data.userId : "",
              category: typeof data.category === "string" ? data.category : "Uncategorized",
              status: normalizeStatus(data.status),
              submittedAt:
                typeof data.submittedAt === "string"
                  ? data.submittedAt
                  : "",
              createdAt: data.createdAt,
              reporterName: typeof data.reporterName === "string" ? data.reporterName : "",
              reporterAvatarUrl:
                typeof data.reporterAvatarUrl === "string" && data.reporterAvatarUrl.length > 0
                  ? data.reporterAvatarUrl
                  : null,
            };
          });

          const uniqueUserIds = Array.from(
            new Set(docs.map((item) => item.userId).filter((id) => typeof id === "string" && id.length > 0))
          );

          await Promise.all(
            uniqueUserIds.map(async (uid) => {
              if (profileCache[uid]) {
                return;
              }
              try {
                const userRef = doc(db, "regular_user", uid);
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) {
                  profileCache[uid] = {};
                  return;
                }
                const userData = userSnap.data() as { fullName?: unknown; profileImageUrl?: unknown };
                profileCache[uid] = {
                  fullName: typeof userData.fullName === "string" ? userData.fullName : undefined,
                  profileImageUrl:
                    typeof userData.profileImageUrl === "string" ? userData.profileImageUrl : undefined,
                };
              } catch {
                profileCache[uid] = {};
              }
            })
          );

          const normalized = docs
            .map((item) => {
              const profile = item.userId ? profileCache[item.userId] : undefined;
              return {
                reportId: item.reportId,
                userId: item.userId,
                category: item.category,
                status: item.status,
                submittedAt: item.submittedAt,
                reporterName:
                  item.reporterName
                  || profile?.fullName
                  || (item.userId ? `User ${item.userId.slice(0, 6)}` : "Unknown User"),
                reporterAvatarUrl: item.reporterAvatarUrl || profile?.profileImageUrl || null,
              } satisfies AllReportListItem;
            })
            .sort((a, b) => {
              const aMs = toEpoch(a.submittedAt);
              const bMs = toEpoch(b.submittedAt);
              return bMs - aMs;
            });

          setReports(normalized);
          setError(null);
          setLoading(false);
        },
        (snapshotError) => {
          const err = snapshotError as { code?: string; message?: string };
          const rawMessage = err.message || "Failed to load community reports.";
          const rawCode = err.code || "unknown";
          const isPermissionError =
            rawMessage.toLowerCase().includes("permission") ||
            rawMessage.toLowerCase().includes("insufficient") ||
            rawCode.toLowerCase().includes("permission-denied");

          setReports([]);
          setLoading(false);
          setError(
            isPermissionError
              ? `Missing permissions (${rawCode}). ${rawMessage}`
              : `${rawCode}: ${rawMessage}`
          );
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeReports) {
        unsubscribeReports();
      }
    };
  }, [router]);

  const monthLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/regular_user/home")}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Report Lists</Text>
      </View>

      <Text style={styles.monthText}>{monthLabel}</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={reports}
        keyExtractor={(item) => `${item.userId}-${item.reportId}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No reports yet.</Text>}
        renderItem={({ item }) => (
          <AllRepComponent
            item={item}
            onPress={() =>
              router.push({
                pathname: "/regular_user/view_allrep/viewallreports",
                params: { reportId: item.reportId, userId: item.userId },
              })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5a9ae6",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#1e88e5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: {
    color: "#ffffff",
    fontSize: 40,
    fontWeight: "500",
  },
  monthText: {
    color: "#cfe6ff",
    fontSize: 24,
    marginBottom: 12,
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 16,
    marginTop: 30,
  },
  errorText: {
    color: "#fee2e2",
    fontSize: 13,
    marginBottom: 10,
  },
});

