import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from "../../../firebaseConfig";
import { markCurrentUserInactive } from "../status/RegularUserPresenceSync";

export default function SignOutModal() {
  const router = useRouter();

  const handleConfirm = async () => {
    try {
      await markCurrentUserInactive("manual_logout");
    } catch {
      // Keep sign-out flow non-blocking even if presence update fails.
    }
    await signOut(auth);
    router.replace("/login/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.modalCard}>
        <Text style={styles.title}>Do you want to logout?</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.button} onPress={handleConfirm}>
            <Text style={styles.buttonText}>YES</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>NO</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5aa0f2",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#e5e7eb",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 20,
  },

  actions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },

  button: {
    width: 96,
    height: 48,
    backgroundColor: "#1f44db",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d7ecff",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
});
