import { useRouter } from "expo-router";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter(); // ✅ correct router

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Subtitle */}
      <Text style={styles.subtitle}>Login to your Account</Text>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
        />
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("../regular_user/home")}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>Login to your Account</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4DA3FF",
    alignItems: "center",
    paddingTop: 70,
  },

  logo: {
    width: 140,
    height: 140,
    marginBottom: 14,
  },

  subtitle: {
    fontSize: 14,
    color: "#1E4F7A",
    marginBottom: 18,
  },

  form: {
    width: "80%",
  },

  label: {
    color: "#EAF7FF",
    fontSize: 13,
    marginBottom: 6,
    marginLeft: 8,
    textAlign: "center",
  },

  input: {
    backgroundColor: "#E9F8FF",
    height: 42,
    borderRadius: 22,
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  button: {
    backgroundColor: "#A8F0C6",
    width: 240,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 24,
  },

  buttonText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },

  footer: {
    marginTop: 28,
    fontSize: 14,
    color: "#1E4F7A",
  },
});
