import { useRouter } from "expo-router";
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.avatarWrap}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.avatar}
        />
      </View>

      <View style={styles.buttonStack}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/regular_user/about")}
        >
          <Text style={styles.actionText}>About</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push("/regular_user/signout/signout_modal")}
        >
          <Text style={styles.actionText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5aa0f2",
    alignItems: "center",
  },

  avatarWrap: {
    marginTop: 40,
    marginBottom: 30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#bfe0ff",
    justifyContent: "center",
    alignItems: "center",
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },

  buttonStack: {
    width: "100%",
    alignItems: "center",
    gap: 22,
  },

  actionButton: {
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

  actionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
