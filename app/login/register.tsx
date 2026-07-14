import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
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
import {
  getSelectedAddress,
  setSelectedAddress,
} from "../../lib/login/addressSelectionStore";
import { sendEmailVerificationOtp } from "../../lib/login/emailVerificationOtp";
import { setPendingRegistration } from "../../lib/login/pendingRegistrationStore";
import { prepareRegistrationParams } from "../../lib/login/registerfunctions";

const isMobile = Platform.OS !== "web";

export default function RegisterScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const currentScrollYRef = useRef(0);
  const waterMeterYRef = useRef(0);
  const waterMeterReturnYRef = useRef(0);
  const waterMeterFocusedRef = useRef(false);
  const waterMeterUserScrolledRef = useRef(false);
  const waterMeterScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [fullName, setFullName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [waterMeter, setWaterMeter] = useState<string>("0");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const clearWaterMeterScrollTimeout = useCallback((): void => {
    if (waterMeterScrollTimeoutRef.current) {
      clearTimeout(waterMeterScrollTimeoutRef.current);
      waterMeterScrollTimeoutRef.current = null;
    }
  }, []);

  const scrollToWaterMeterPosition = useCallback((): void => {
    const targetY = Math.max(waterMeterYRef.current - 130, 0);
    scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
  }, []);

  const scrollWaterMeterAboveKeyboard = useCallback((): void => {
    if (isMobile) {
      const wasAlreadyFocused = waterMeterFocusedRef.current;

      waterMeterFocusedRef.current = true;

      if (!wasAlreadyFocused) {
        waterMeterUserScrolledRef.current = false;
        waterMeterReturnYRef.current = currentScrollYRef.current;
      }

      clearWaterMeterScrollTimeout();

      waterMeterScrollTimeoutRef.current = setTimeout(() => {
        if (waterMeterFocusedRef.current && !waterMeterUserScrolledRef.current) {
          scrollToWaterMeterPosition();
        }
      }, 250);
    }
  }, [clearWaterMeterScrollTimeout, scrollToWaterMeterPosition]);

  const restoreWaterMeterScroll = useCallback((): void => {
    clearWaterMeterScrollTimeout();

    if (!waterMeterFocusedRef.current) {
      return;
    }

    waterMeterFocusedRef.current = false;

    if (waterMeterUserScrolledRef.current) {
      waterMeterUserScrolledRef.current = false;
      return;
    }

    scrollViewRef.current?.scrollTo({
      y: waterMeterReturnYRef.current,
      animated: true,
    });
  }, [clearWaterMeterScrollTimeout]);

  useEffect(() => {
    if (isMobile) {
      const keyboardShowSubscription = Keyboard.addListener("keyboardDidShow", () => {
        if (waterMeterFocusedRef.current && !waterMeterUserScrolledRef.current) {
          scrollToWaterMeterPosition();
        }
      });
      const keyboardHideSubscription = Keyboard.addListener(
        "keyboardDidHide",
        restoreWaterMeterScroll,
      );

      return () => {
        keyboardShowSubscription.remove();
        keyboardHideSubscription.remove();
        clearWaterMeterScrollTimeout();
      };
    }

    return undefined;
  }, [
    clearWaterMeterScrollTimeout,
    restoreWaterMeterScroll,
    scrollToWaterMeterPosition,
  ]);

  useFocusEffect(
    useCallback(() => {
      const pickedAddress = getSelectedAddress();

      if (pickedAddress) {
        setAddress(pickedAddress);
      }
    }, []),
  );

  const openAddressSelector = (): void => {
    setSelectedAddress(address);
    router.push({
      pathname: "/login/address_select",
      params: { currentAddress: address },
    });
  };

  const handleRegister = async (): Promise<void> => {
    try {
      setLoading(true);

      const waterMeterValue = parseFloat(waterMeter);
      if (isNaN(waterMeterValue) || waterMeterValue < 0) {
        throw new Error("Water meter must be a valid non-negative number");
      }

      const pendingRegistration = prepareRegistrationParams({
        fullName,
        address,
        email,
        password,
        confirmPassword,
        waterMeter: waterMeterValue,
      });

      setPendingRegistration(pendingRegistration);
      await sendEmailVerificationOtp(pendingRegistration.email);

      router.replace({
        pathname: "/login/email_verification/verify_email",
        params: { email: pendingRegistration.email },
      });
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
        onScroll={(event) => {
          currentScrollYRef.current = event.nativeEvent.contentOffset.y;
        }}
        onScrollBeginDrag={() => {
          if (waterMeterFocusedRef.current) {
            waterMeterUserScrolledRef.current = true;
            clearWaterMeterScrollTimeout();
          }
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name (eg. Juan Dela Cruz)</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Address</Text>
          <TouchableOpacity
            style={styles.input}
            activeOpacity={0.8}
            onPress={openAddressSelector}
          >
            <Text style={address ? styles.inputText : styles.placeholderText}>
              {address || "Select your barangay"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect={false}
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

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              textContentType="newPassword"
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              activeOpacity={0.8}
              accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#475569"
              />
            </TouchableOpacity>
          </View>

          <View
            style={styles.fieldGroup}
            onLayout={(event) => {
              waterMeterYRef.current = event.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.label}>Water Meter (m3)</Text>
            <TextInput
              style={styles.input}
              value={waterMeter}
              onChangeText={setWaterMeter}
              onFocus={scrollWaterMeterAboveKeyboard}
              onPressIn={scrollWaterMeterAboveKeyboard}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Sending code..." : "Register"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Register your Account</Text>
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
    paddingBottom: 140,
    paddingHorizontal: 24,
  },

  logo: {
    width: 100,
    height: 100,
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

  fieldGroup: {
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
    width: "100%",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    justifyContent: "center",
    color: "#0F172A",
    fontSize: 16,
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

  inputText: {
    color: "#0F172A",
    fontSize: 16,
  },

  placeholderText: {
    color: "#94A3B8",
    fontSize: 16,
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

  footer: {
    marginTop: 32,
    fontSize: 14,
    color: "#94A3B8",
  },
});
