import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getLoginErrorMessage } from "./_errors/logerror";
import { loginUser } from "./_functions/loginfunctions";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      const user = await loginUser({ email, password });

      Alert.alert("Success", "Logged in successfully");

      // You can check role here later if needed
      router.replace("/regular_user/home");
    } catch (err: unknown) {
      Alert.alert("Error", getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.subtitle}>Login to your Account</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

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
