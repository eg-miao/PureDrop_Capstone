import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { supabase } from "../../api/supabase";

type PasswordResetErrorLike = {
  code?: string;
  message?: string;
};

export function getPasswordResetErrorMessage(err: unknown): string {
  const fallback = "Unable to send reset email";

  if (!err || typeof err !== "object") {
    return fallback;
  }

  const { code, message } = err as PasswordResetErrorLike;

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address";
    case "auth/user-not-found":
      return "No account found for that email";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later";
    case "auth/network-request-failed":
      return "Network error. Check your connection";
    default:
      break;
  }

  if (message && message.trim().length > 0) {
    return message;
  }

  return fallback;
}

export async function requestPasswordReset(email: string): Promise<void> {
  const formattedEmail = email.trim();

  if (!formattedEmail) {
    throw new Error("Please enter your email address");
  }

  await sendPasswordResetEmail(auth, formattedEmail);
}

/**
 * Directly resets the user's password via a Supabase Edge Function
 * that calls the Firebase Auth Admin REST API.
 * Called AFTER the user verifies their email via OTP in the forgot password flow.
 */
export async function directPasswordReset(
  email: string,
  newPassword: string,
): Promise<void> {
  const formattedEmail = email.trim();

  if (!formattedEmail) {
    throw new Error("Please enter your email address");
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const { error } = await supabase.functions.invoke(
    "direct-password-reset",
    {
      body: {
        email: formattedEmail,
        newPassword,
      },
    },
  );

  if (error) {
    let message = "Could not reset password. Please try again.";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "object" && error !== null) {
      const errObj = error as Record<string, unknown>;
      if (typeof errObj.message === "string") {
        message = errObj.message;
      }
    }
    throw new Error(message);
  }
}
