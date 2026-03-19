import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

const SIGHTENGINE_API_URL = "https://api.sightengine.com/1.0/check.json";
const SIGHTENGINE_MODELS = "genai,deepfake,type,text";
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

type ReviewAttachmentPayload = {
  base64?: unknown;
  fileName?: unknown;
  mimeType?: unknown;
};

type SightenginePayload = {
  error?: {
    code?: number;
    message?: string;
    type?: string;
  };
  request?: {
    id?: string;
    operations?: number;
    timestamp?: number;
  };
  status?: string;
  text?: {
    has_artificial?: number;
    has_natural?: number;
  };
  type?: {
    ai_generated?: number;
    deepfake?: number;
    illustration?: number;
    photo?: number;
  };
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: corsHeaders,
    status,
  });

const normalizeBase64 = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.includes(",") ? (trimmed.split(",").pop() ?? "") : trimmed;
};

const normalizeMimeType = (value: unknown) => {
  if (typeof value !== "string") {
    return "image/jpeg";
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed || "image/jpeg";
};

const normalizeFileName = (value: unknown, mimeType: string) => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (mimeType.includes("png")) {
    return "attachment.png";
  }

  if (mimeType.includes("webp")) {
    return "attachment.webp";
  }

  if (mimeType.includes("heic")) {
    return "attachment.heic";
  }

  return "attachment.jpg";
};

const getSightengineErrorMessage = (
  status: number,
  payload: SightenginePayload | null,
  responseText: string,
) => {
  const apiMessage = payload?.error?.message;
  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage.trim();
  }

  const trimmedText = responseText.trim();
  if (trimmedText) {
    return trimmedText;
  }

  return `Sightengine request failed (${status}).`;
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: { message: "Method not allowed." } }, 405);
  }

  const sightengineApiUser = Deno.env.get("SIGHTENGINE_API_USER")?.trim() ?? "";
  const sightengineApiSecret = Deno.env.get("SIGHTENGINE_API_SECRET")?.trim() ?? "";

  if (!sightengineApiUser || !sightengineApiSecret) {
    return jsonResponse(
      { error: { message: "Sightengine secrets are not configured in Supabase Edge Functions." } },
      500,
    );
  }

  let payload: ReviewAttachmentPayload;
  try {
    payload = (await request.json()) as ReviewAttachmentPayload;
  } catch {
    return jsonResponse({ error: { message: "Request body must be valid JSON." } }, 400);
  }

  const base64 = normalizeBase64(payload.base64);
  if (!base64) {
    return jsonResponse({ error: { message: "Attachment image data is missing." } }, 400);
  }

  const mimeType = normalizeMimeType(payload.mimeType);
  const fileName = normalizeFileName(payload.fileName, mimeType);

  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  } catch {
    return jsonResponse({ error: { message: "Attachment image data is not valid base64." } }, 400);
  }

  if (!bytes.length) {
    return jsonResponse({ error: { message: "Attachment image data is empty." } }, 400);
  }

  if (bytes.length > MAX_ATTACHMENT_BYTES) {
    return jsonResponse(
      {
        error: {
          message: "Attachment is too large for authenticity review. Please choose a smaller image.",
        },
      },
      400,
    );
  }

  const arrayBuffer = new ArrayBuffer(bytes.length);
  new Uint8Array(arrayBuffer).set(bytes);

  const formData = new FormData();
  formData.append("models", SIGHTENGINE_MODELS);
  formData.append("api_user", sightengineApiUser);
  formData.append("api_secret", sightengineApiSecret);
  formData.append("media", new Blob([arrayBuffer], { type: mimeType }), fileName);

  let sightengineResponse: Response;
  try {
    sightengineResponse = await fetch(SIGHTENGINE_API_URL, {
      body: formData,
      method: "POST",
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : "Could not reach Sightengine from Supabase Edge Functions.";

    return jsonResponse({ error: { message } }, 502);
  }

  const responseText = await sightengineResponse.text();
  let sightenginePayload: SightenginePayload | null = null;

  try {
    sightenginePayload = JSON.parse(responseText) as SightenginePayload;
  } catch {
    sightenginePayload = null;
  }

  if (!sightengineResponse.ok) {
    return jsonResponse(
      {
        error: {
          message: getSightengineErrorMessage(
            sightengineResponse.status,
            sightenginePayload,
            responseText,
          ),
          status: sightengineResponse.status,
        },
      },
      sightengineResponse.status,
    );
  }

  if (sightenginePayload?.status !== "success") {
    return jsonResponse(
      {
        error: {
          message:
            getSightengineErrorMessage(sightengineResponse.status, sightenginePayload, responseText) ||
            "Sightengine review failed.",
        },
      },
      500,
    );
  }

  return jsonResponse({
    requestId: typeof sightenginePayload.request?.id === "string" ? sightenginePayload.request.id : null,
    text: sightenginePayload.text ?? null,
    type: sightenginePayload.type ?? null,
  });
});
