import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  type NotificationItem,
  useReportNotifications,
} from "../../../components/notifications/notif_func";

const getStatusColor = (status: string) => {
  if (status === "Approved") return "#166534";
  if (status === "Rejected") return "#991b1b";
  if (status === "Resolved") return "#1d4ed8";
  if (status === "Submitted") return "#0f766e";
  return "#1f2937";
};

const renderItem = ({ item }: { item: NotificationItem }) => (
  <View style={styles.card}>
    <View style={styles.rowBetween}>
      <Text style={styles.reportId}>Report #{item.reportId}</Text>
      <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status}</Text>
    </View>

    <Text style={styles.message}>{item.message}</Text>
    <Text style={styles.date}>{item.createdLabel}</Text>
  </View>
);

export default function NotificationScreen() {
  const router = useRouter();
  const { items, loading, unreadCount } = useReportNotifications();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.animatedScreen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.navigate("/regular_user/home")}>
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.title}>Notifications</Text>
          <View style={styles.badgeWrap}>
            {unreadCount > 0 ? <Text style={styles.badge}>{unreadCount}</Text> : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1e88e5" />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>Your report updates will appear here.</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={renderItem}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5aa0f2",
  },
  animatedScreen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  badgeWrap: {
    width: 34,
    alignItems: "flex-end",
  },
  badge: {
    minWidth: 22,
    textAlign: "center",
    color: "#ffffff",
    backgroundColor: "#ef4444",
    fontWeight: "700",
    borderRadius: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: "hidden",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffffff",
    padding: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reportId: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
  },
  status: {
    fontSize: 12,
    fontWeight: "700",
  },
  message: {
    color: "#1f2937",
    fontSize: 13,
    marginBottom: 6,
  },
  date: {
    color: "#6b7280",
    fontSize: 11,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySub: {
    color: "#e5efff",
    fontSize: 13,
    textAlign: "center",
  },
});
