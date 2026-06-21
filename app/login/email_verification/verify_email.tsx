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
            style={[styles.button, secondsLeft > 0 && styles.buttonDisabled]}
            onPress={handleResend}
            activeOpacity={0.8}
            disabled={secondsLeft > 0 || isResending}
          >
            <Text style={styles.buttonText}>
              {isResending
                ? "Sending..."
                : secondsLeft > 0
                  ? `Resend Email\n(${secondsLeft}s)`
                  : "Resend Email"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isVerifying && styles.buttonDisabled]}
            onPress={handleVerify}
            activeOpacity={0.8}
            disabled={isVerifying}
          >
            <Text style={styles.buttonText}>{isVerifying ? "Verifying..." : "Verify"}</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 72,
  },

  headerGroup: {
    alignItems: "center",
    marginBottom: 32,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "400",
    textAlign: "center",
    marginBottom: 18,
  },

  subtitle: {
    color: "#000000",
    fontSize: 14,
    textAlign: "center",
  },

  pinRow: {
    width: "100%",
    maxWidth: 288,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 70,
  },

  pinBox: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9FAFF",
    borderRadius: 9,
  },

  pinBoxFilled: {
    borderWidth: 2,
    borderColor: "#A8F0C6",
  },

  pinDigit: {
    color: "#102A43",
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
    gap: 30,
  },

  button: {
    width: 208,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#A8F0C6",
    borderWidth: 2,
    borderColor: "#E9FAFF",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },

  buttonDisabled: {
    opacity: 0.95,
  },

  buttonText: {
    color: "#000000",
    fontSize: 16,
    lineHeight: 18,
    textAlign: "center",
  },
});
