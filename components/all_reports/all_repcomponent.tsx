import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type AllReportListItem = {
  reportId: string;
  userId: string;
  reporterName: string;
  reporterAvatarUrl: string | null;
  category: string;
  status: string;
  submittedAt: string;
};

type AllRepComponentProps = {
  item: AllReportListItem;
  onPress?: () => void;
};

export default function AllRepComponent({ item, onPress }: AllRepComponentProps) {
  const avatarSource = item.reporterAvatarUrl
    ? { uri: item.reporterAvatarUrl }
    : require("../../assets/images/default_account.png");

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.9}
      onPress={onPress}
      disabled={!onPress}
    >
      <Image source={avatarSource} style={styles.avatar} />

      <View style={styles.card}>
        <Text style={styles.line}>Problem ID: {item.reportId}</Text>
        <Text style={styles.line}>Name: {item.reporterName}</Text>
        <Text style={styles.line}>Category: {item.category}</Text>
        <Text style={styles.status}>Status: {item.status}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  line: {
    color: "#475569",
    fontSize: 14,
    marginBottom: 6,
  },
  status: {
    color: "#0EA5E9",
    fontSize: 14,
    fontWeight: "800",
    alignSelf: "flex-end",
    marginTop: 2,
  },
});

