import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>About</Text>

        <View style={styles.card}>
          <Text style={styles.body}>
            PureDrop is a community-based reporting platform created to help residents
            of Toledo City easily report and monitor water-related problems in their
            area. The app empowers citizens to take an active role in improving local
            water services by providing a simple and accessible way to raise concerns.
          </Text>

          <Text style={styles.body}>
            With PureDrop, users can report issues such as no water supply, dirty or
            discolored water, and water leaks in just a few steps. Residents simply
            enter a short description of the problem, select their barangay, and
            optionally upload a photo as supporting evidence. This makes reports
            clearer, more accurate, and easier for authorities to verify.
          </Text>

          <Text style={styles.body}>
            All submitted reports are displayed in an organized list that shows the
            type of problem, location, date reported, and current status, allowing
            users to stay informed about ongoing issues in their community.
          </Text>

          <Text style={styles.body}>
            On the administrative side, PureDrop includes an admin panel where
            authorized personnel can review, manage, and update reports efficiently.
            This helps ensure that water-related concerns are addressed faster and in
            a more organized manner.
          </Text>

          <Text style={styles.body}>
            By connecting residents and local authorities, PureDrop promotes
            transparency, faster response times, and stronger community involvement in
            maintaining safe and reliable water services.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5aa0f2",
  },

  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 30,
  },

  title: {
    fontSize: 24,
    color: "#ffffff",
    fontWeight: "600",
    marginBottom: 16,
  },

  card: {
    width: "100%",
    backgroundColor: "#e5e7eb",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#cbd5f5",
  },

  body: {
    color: "#1f2937",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 10,
  },
});
