import { supabase } from "../../api/supabase";

type SendEmailVerificationOtpResponse = {
  expiresInSeconds: number;
  resendAfterSeconds: number;
  sent: boolean;
};

type VerifyEmailVerificationOtpResponse = {
  verified: boolean;
};

type EmailVerificationOtpResponse =
  | SendEmailVerificationOtpResponse
  | VerifyEmailVerificationOtpResponse;

type EmailVerificationAction = "send" | "verify";

type EmailVerificationErrorPayload = {
  error?: {
    message?: string;
  };
};

const EMAIL_VERIFICATION_FUNCTION = "email-verification-otp";

const getSupabaseFunctionErrorMessage = async (error: unknown, response?: Response) => {
  if (response) {
    try {
      const payload = (await response.clone().json()) as EmailVerificationErrorPayload;
      const message = payload.error?.message?.trim();
      if (message) {
        return message;
      }
    } catch {
      try {
        const message = await response.clone().text();
        if (message.trim()) {
          return message.trim();
        }
      } catch {
        // Keep looking at the Supabase error object.
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "Email verification failed.";
};

async function invokeEmailVerificationOtp<T extends EmailVerificationOtpResponse>(
  body: {
    action: EmailVerificationAction;
    code?: string;
    email: string;
  },
): Promise<T> {
  const { data, error, response } = await supabase.functions.invoke<T>(
    EMAIL_VERIFICATION_FUNCTION,
    { body },
  );

  if (error) {
    throw new Error(await getSupabaseFunctionErrorMessage(error, response));
  }

  if (!data) {
    throw new Error("Email verification service returned no data.");
  }

  return data;
}

export async function sendEmailVerificationOtp(email: string) {
  return invokeEmailVerificationOtp<SendEmailVerificationOtpResponse>({
    action: "send",
    email,
  });
}

export async function verifyEmailVerificationOtp(email: string, code: string) {
  return invokeEmailVerificationOtp<VerifyEmailVerificationOtpResponse>({
    action: "verify",
    code,
    email,
  });
}
