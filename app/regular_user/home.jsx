import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function MainPage() {
  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />

        <Text style={styles.tagline}>
          “Report water problems in your community easily”
        </Text>

        <Text style={styles.title}>Explore</Text>
      </View>

      {/* BUTTON GRID */}
      <View style={styles.grid}>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardText}>Report a Water Problem</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardText}>View Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardText}>Reports List</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardText}>Directory</Text>
        </TouchableOpacity>
      </View>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <Ionicons name="home-outline" size={26} color="#1e88e5" />
        <Ionicons name="notifications-outline" size={26} color="#1e88e5" />

        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.avatar}
        />
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
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  logo: {
    width: 110,
    height: 110,
    resizeMode: "contain",
    marginBottom: 10,
  },

  tagline: {
    color: "#ffffff",
    fontSize: 13,
    opacity: 0.9,
    textAlign: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 36,
    color: "#ffffff",
    fontWeight: "300",
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  grid: {
    flex: 1,
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    height: 90,
    backgroundColor: "#1e40af",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  cardText: {
    color: "#ffffff",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },

  bottomNav: {
    height: 65,
    backgroundColor: "#e0f2fe",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
});
