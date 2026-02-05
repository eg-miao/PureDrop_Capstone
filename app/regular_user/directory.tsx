import { useRouter } from "expo-router";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DirectoryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Directory</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Address</Text>

        <Text style={styles.label}>Main Office</Text>
        <Text style={styles.value}>S. Osmeña St. Brgy. Sangi, Toledo City, Cebu</Text>

        <Text style={styles.label}>Costumer Interaction Center</Text>
        <Text style={styles.value}>CEBECO II Compound, Sipaway, Luray II, Toledo City, Cebu</Text>

        <Text style={styles.sectionTitle}>Office Hours</Text>
        <Text style={styles.value}>Monday through Friday</Text>
        <Text style={styles.value}>8:00 AM - 5:00 PM</Text>

        <Text style={styles.sectionTitle}>Telephone Numbers</Text>
        <Text style={styles.value}>Sangi Office: (032) 427-3574</Text>
        <Text style={styles.value}>CIC Office: (032) 436-6547</Text>
        <Text style={styles.value}>Hotline: 0917 621 6566</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "700",
  },

  headerSpacer: {
    width: 36,
    height: 36,
  },

  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },

  card: {
    marginHorizontal: 20,
    backgroundColor: "#e5e7eb",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#ffffff",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 6,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 6,
  },

  value: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 6,
  },
});
