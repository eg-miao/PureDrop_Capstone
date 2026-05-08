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
    backgroundColor: "#dbeafe",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  card: {
    flex: 1,
    backgroundColor: "#d8ecf6",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  line: {
    color: "#111827",
    fontSize: 16,
    marginBottom: 2,
  },
  status: {
    color: "#111827",
    fontSize: 16,
    alignSelf: "flex-end",
  },
});

