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
import { registerUser } from "./_functions/registerfunctions";

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [waterMeter, setWaterMeter] = useState<string>("0"); // ✅ new input
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async (): Promise<void> => {
    try {
      setLoading(true);

      // Parse waterMeter as number
      const waterMeterValue = parseFloat(waterMeter);
      if (isNaN(waterMeterValue) || waterMeterValue < 0) {
        throw new Error("Water meter must be a valid non-negative number");
      }

      await registerUser({
        fullName,
        address,
        email,
        password,
        confirmPassword,
        waterMeter: waterMeterValue,
      });

      Alert.alert("Success", "Account created successfully");
      router.replace("/login/login"); // or "/regular_user/home"
    } catch (err: unknown) {
      let message = "Something went wrong";

      if (err instanceof Error) {
        message = err.message;
      }

      Alert.alert("Registration Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Full Name (eg. Juan Dela Cruz)</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
        />

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

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {/* ✅ Water Meter Input */}
        <Text style={styles.label}>Water Meter (m³)</Text>
        <TextInput
          style={styles.input}
          value={waterMeter}
          onChangeText={setWaterMeter}
          keyboardType="numeric"
        />
      </View>

      {/* Register Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Registering..." : "Register"}
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>Register your Account</Text>
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
    marginBottom: 20,
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
    height: 38,
    width: "100%",
    alignSelf: "center",
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
