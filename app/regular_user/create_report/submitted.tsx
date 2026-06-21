import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SubmittedReportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image source={require("../../../assets/images/logo.png")} style={styles.logo} />

        <View style={styles.iconWrap}>
          <Ionicons name="checkmark" size={88} color="#ffffff" />
        </View>

        <Text style={styles.message}>
          Your report has been submitted, we will notify your email.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/regular_user/reports-list")}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Check Reports</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5a9ae6",
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 30,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: "contain",
    marginBottom: 24,
  },
  iconWrap: {
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor: "#26d07c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
  },
  message: {
    color: "#ffffff",
    fontSize: 20,
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  button: {
    width: "92%",
    height: 48,
    borderRadius: 10,
    backgroundColor: "#89e2bb",
    borderWidth: 2,
    borderColor: "#d7f7e8",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#0b1f1a",
    fontSize: 30,
    fontWeight: "400",
  },
});
