type LoginErrorLike = {
  code?: string;
  message?: string;
};

export function getLoginErrorMessage(err: unknown): string {
  const fallback = "Login failed";

  if (!err || typeof err !== "object") {
    return fallback;
  }

  const { code, message } = err as LoginErrorLike;

  switch (code) {
    case "auth/invalid-login-credentials":
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Incorrect email or password";
    case "auth/user-not-found":
      return "No account found for that email";
    case "auth/invalid-email":
      return "Please enter a valid email address";
    case "auth/missing-password":
      return "Please enter your password";
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
