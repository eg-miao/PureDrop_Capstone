import { Ionicons } from "@expo/vector-icons";
import { type Href, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LOGIN_ROUTE = "/login" as Href;

export default function EmailVerificationSuccessScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={86} color="#FFFFFF" />
          <View style={styles.checkShadow} />
        </View>

        <Text style={styles.title}>Success, your email{"\n"}has been verified.</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace(LOGIN_ROUTE)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#55A3F0",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 34,
    paddingBottom: 130,
  },

  checkCircle: {
    width: 142,
    height: 142,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27D77B",
    borderRadius: 71,
    marginBottom: 46,
    overflow: "hidden",
  },

  checkShadow: {
    position: "absolute",
    right: -22,
    bottom: -26,
    width: 96,
    height: 96,
    backgroundColor: "rgba(0, 145, 85, 0.26)",
    transform: [{ rotate: "45deg" }],
  },

  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "400",
    lineHeight: 28,
    textAlign: "center",
    marginBottom: 36,
  },

  button: {
    backgroundColor: "#A8F0C6",
    width: 240,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 50,
  },


  buttonText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
});
