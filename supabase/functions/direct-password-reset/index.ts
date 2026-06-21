// @ts-nocheck — Deno runtime globals (Deno, jsr: imports) are not available in VSCode
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

// Firebase project config
const FIREBASE_WEB_API_KEY = "AIzaSyClsR7XWwvYHQtRfFQTiw9Ob41fMD9elbA";
const FIREBASE_LOOKUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:lookup";
const FIREBASE_UPDATE_URL = "https://identitytoolkit.googleapis.com/v1/accounts:update";
const OAUTH2_TOKEN_URL = "https://oauth2.googleapis.com/token";

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: corsHeaders,
    status,
  });

/**
 * Parse a Firebase service account JSON string from env.
 */
const getServiceAccount = (): Record<string, string> | null => {
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_KEY")?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return null;
  }
};

/**
 * Decode a PEM-encoded private key to DER bytes.
 */
const pemToDerBytes = (pem: string): Uint8Array => {
  const lines = pem.split("\n");
  const base64Lines: string[] = [];
  let inKey = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("-----BEGIN ")) {
      inKey = true;
      continue;
    }
    if (trimmed.startsWith("-----END ")) {
      inKey = false;
      continue;
    }
    if (inKey && trimmed) {
      base64Lines.push(trimmed);
    }
  }
  const base64 = base64Lines.join("");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

/**
 * Create a JWT assertion signed with the service account's private key
 * to exchange for a Google OAuth2 access token.
 */
const createJwtAssertion = async (
  serviceAccount: Record<string, string>,
): Promise<string> => {
  const { client_email, private_key } = serviceAccount;
  if (!client_email || !private_key) {
    throw new Error("Service account is missing client_email or private_key.");
  }

  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: client_email,
    scope: "https://www.googleapis.com/auth/identitytoolkit",
    aud: OAUTH2_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const headerB64 = btoa(JSON.stringify(header));
  const payloadB64 = btoa(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const derBytes = pemToDerBytes(private_key);

  const pemKey = await crypto.subtle.importKey(
    "pkcs8",
    derBytes.buffer as ArrayBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    pemKey,
    new TextEncoder().encode(signingInput),
  );

  const signatureB64 = btoa(
    String.fromCharCode(...new Uint8Array(signature)),
  );

  return `${signingInput}.${signatureB64}`;
};

/**
 * Exchange a signed JWT assertion for a Google OAuth2 access token.
 */
const getAccessToken = async (
  serviceAccount: Record<string, string>,
): Promise<string> => {
  const jwtAssertion = await createJwtAssertion(serviceAccount);

  const response = await fetch(OAUTH2_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      assertion: jwtAssertion,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to get OAuth2 token: ${response.status} ${body}`);
  }

  const data = await response.json() as { access_token?: string };
  if (!data.access_token) {
    throw new Error("OAuth2 response missing access_token.");
  }

  return data.access_token;
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  let body: { email?: string; newPassword?: string };
  try {
    body = await request.json() as { email?: string; newPassword?: string };
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!email) {
    return jsonResponse({ error: "Email is required." }, 400);
  }

  if (newPassword.length < 6) {
    return jsonResponse({ error: "Password must be at least 6 characters." }, 400);
  }

  // Get service account credentials
  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    return jsonResponse({
      error:
        "Firebase service account is not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY in Supabase Edge Function secrets.",
    }, 500);
  }

  try {
    // Step 1: Get OAuth2 access token
    const accessToken = await getAccessToken(serviceAccount);

    // Step 2: Look up user by email to get their localId (UID)
    const lookupResponse = await fetch(
      `${FIREBASE_LOOKUP_URL}?key=${FIREBASE_WEB_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email: [email] }),
      },
    );

    const lookupData = await lookupResponse.json() as {
      error?: { message?: string };
      users?: Array<{ localId?: string }>;
    };

    if (!lookupResponse.ok || lookupData.error) {
      const msg = lookupData.error?.message || "User not found.";
      return jsonResponse({ error: msg }, lookupData.error ? 400 : 404);
    }

    const users = lookupData.users;
    if (!users || users.length === 0) {
      return jsonResponse({ error: "No account found for that email." }, 404);
    }

    const localId = users[0].localId;
    if (!localId) {
      return jsonResponse({ error: "Could not identify the user account." }, 500);
    }

    // Step 3: Update the password using Admin REST API
    const updateResponse = await fetch(
      `${FIREBASE_UPDATE_URL}?key=${FIREBASE_WEB_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          localId,
          password: newPassword,
          returnSecureToken: false,
        }),
      },
    );

    const updateData = await updateResponse.json() as {
      error?: { message?: string };
      localId?: string;
    };

    if (!updateResponse.ok || updateData.error) {
      const msg = updateData.error?.message || "Could not update password.";
      return jsonResponse({ error: msg }, 500);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    const message = error instanceof Error && error.message.trim()
      ? error.message.trim()
      : "Could not reset password. Please try again.";

    return jsonResponse({ error: message }, 500);
  }
});
