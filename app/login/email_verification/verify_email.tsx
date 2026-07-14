import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  clearPendingRegistration,
  getPendingRegistration,
} from "@/lib/login/pendingRegistrationStore";
import {
  sendEmailVerificationOtp,
  verifyEmailVerificationOtp,
} from "@/lib/login/emailVerificationOtp";
import { registerUser } from "@/lib/login/registerfunctions";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, "").slice(0, CODE_LENGTH));
  };

  const handleResend = async () => {
    if (secondsLeft > 0) {
      return;
    }

    const pendingRegistration = getPendingRegistration();
    const targetEmail = pendingRegistration?.email ?? email;

    if (!targetEmail) {
      Alert.alert("Registration Expired", "Please register again before requesting a new code.");
      router.replace("/login/register");
      return;
    }

    try {
      setIsResending(true);
      await sendEmailVerificationOtp(targetEmail);
      setSecondsLeft(RESEND_SECONDS);
      Alert.alert("Code Sent", "A new verification code has been sent to your email.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Resend Failed", message);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH) {
      Alert.alert("Invalid Code", "Please enter the 6-digit code sent to your email.");
      return;
    }

    Keyboard.dismiss();

    const pendingRegistration = getPendingRegistration();
    if (!pendingRegistration) {
      Alert.alert(
        "Registration Expired",
        "Please register again before verifying your email.",
      );
      router.replace("/login/register");
      return;
    }

    try {
      setIsVerifying(true);
      await verifyEmailVerificationOtp(pendingRegistration.email, code);
      await registerUser(pendingRegistration);
      clearPendingRegistration();
      router.replace("/login/email_verification/success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Verification Failed", message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerGroup}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            {email ? `Enter the 6-digit code sent to ${email}.` : "Enter the 6-digit code sent to your email."}
          </Text>
        </View>

        <Pressable
          style={styles.pinRow}
          onPress={() => inputRef.current?.focus()}
          accessibilityRole="button"
          accessibilityLabel="Enter verification code"
        >
          {Array.from({ length: CODE_LENGTH }).map((_, index) => (
            <View key={index} style={[styles.pinBox, code[index] ? styles.pinBoxFilled : null]}>
              <Text style={styles.pinDigit}>{code[index] ?? ""}</Text>
            </View>
          ))}
        </Pressable>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleCodeChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={CODE_LENGTH}
          style={styles.hiddenInput}
        />

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.resendButton, secondsLeft > 0 && styles.buttonDisabled]}
            onPress={handleResend}
            activeOpacity={0.8}
            disabled={secondsLeft > 0 || isResending}
          >
            <Text style={[styles.buttonText, styles.resendButtonText]}>
              {isResending
                ? "Sending..."
                : secondsLeft > 0
                  ? `Resend Email (${secondsLeft}s)`
                  : "Resend Email"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.verifyButton, isVerifying && styles.buttonDisabled]}
            onPress={handleVerify}
            activeOpacity={0.8}
            disabled={isVerifying}
          >
            <Text style={[styles.buttonText, styles.verifyButtonText]}>{isVerifying ? "Verifying..." : "Verify"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f9ff",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 34,
    paddingBottom: 72,
  },

  headerGroup: {
    alignItems: "center",
    marginBottom: 32,
  },

  title: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },

  subtitle: {
    color: "#475569",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  pinRow: {
    width: "100%",
    maxWidth: 260,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 70,
  },

  pinBox: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
  },

  pinBoxFilled: {
    borderWidth: 2,
    borderColor: "#0284c7",
  },

  pinDigit: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "600",
  },

  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },

  actions: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },

  button: {
    width: 240,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  resendButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#0284c7",
  },

  verifyButton: {
    backgroundColor: "#0284c7",
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },

  resendButtonText: {
    color: "#0284c7",
  },

  verifyButtonText: {
    color: "#ffffff",
  },
});
