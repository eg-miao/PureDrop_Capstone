import { Ionicons } from "@expo/vector-icons";
import { type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getLoginErrorMessage } from "../../lib/login/logerror";
import { loginUser } from "../../lib/login/loginfunctions";

const FORGOT_PASSWORD_ROUTE = "/login/forgot_password" as Href;
const isMobile = Platform.OS !== "web";

/** Offset above the field to keep some label/padding visible */
const SCROLL_OFFSET = 130;

export default function LoginScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  // Layout Y positions of each field wrapper (relative to ScrollView content)
  const fieldYPositions = useRef<Record<string, number>>({});

  const scrollToField = useCallback((fieldName: string) => {
    const y = fieldYPositions.current[fieldName];
    if (y !== undefined && scrollViewRef.current) {
      const targetY = Math.max(y - SCROLL_OFFSET, 0);
      scrollViewRef.current.scrollTo({ y: targetY, animated: true });
    }
  }, []);

  // When the keyboard shows while a field is focused, re-scroll to that field
  useEffect(() => {
    if (!isMobile) return undefined;

    const sub = Keyboard.addListener("keyboardDidShow", () => {
      if (focusedField) {
        scrollToField(focusedField);
      }
    });

    return () => sub.remove();
  }, [focusedField, scrollToField]);

  const handleLogin = async () => {
    try {
      setLoading(true);

      await loginUser({ email, password });

      Alert.alert("Success", "Logged in successfully");
      router.replace("/regular_user/home");
    } catch (err: unknown) {
      Alert.alert("Error", getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /** Helper to register a field's Y position via onLayout */
  const onFieldLayout = (fieldName: string) => (event: { nativeEvent: { layout: { y: number } } }) => {
    fieldYPositions.current[fieldName] = event.nativeEvent.layout.y;
  };

  /** Focus handler that also scrolls to the field */
  const handleFieldFocus = (fieldName: string) => {
    setFocusedField(fieldName);
    scrollToField(fieldName);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to continue</Text>

        <View style={styles.form}>
          {/* Email */}
          <View onLayout={onFieldLayout("email")}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, focusedField === "email" && styles.inputFocused]}
              value={email}
              onChangeText={setEmail}
              onFocus={() => handleFieldFocus("email")}
              onBlur={() => setFocusedField(null)}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>

          {/* Password */}
          <View onLayout={onFieldLayout("password")}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.passwordWrap, focusedField === "password" && styles.inputFocused]}>
              <TextInput
                ref={passwordRef}
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                onFocus={() => handleFieldFocus("password")}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
                textContentType="password"
                autoComplete="password"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((prev) => !prev)}
                activeOpacity={0.8}
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#475569"
                />
              </TouchableOpacity>
            </View>
          </View>
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

        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() => router.push(FORGOT_PASSWORD_ROUTE)}
          activeOpacity={0.8}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Login to your Account</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 120,
    paddingHorizontal: 24,
  },

  scrollView: {
    backgroundColor: "#F8FAFC",
  },

  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 32,
  },

  form: {
    width: "100%",
  },

  label: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
    textAlign: "left",
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    color: "#0F172A",
    fontSize: 16,
  },

  inputFocused: {
    borderColor: "#0EA5E9",
    borderWidth: 1.5,
  },

  passwordWrap: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 52,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 10,
    marginBottom: 20,
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    color: "#0F172A",
    fontSize: 16,
  },

  eyeButton: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 10,
    minWidth: 38,
  },

  button: {
    backgroundColor: "#0EA5E9",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  forgotButton: {
    marginTop: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  forgotText: {
    color: "#0EA5E9",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },

  footer: {
    marginTop: "auto",
    fontSize: 14,
    color: "#94A3B8",
  },
});
