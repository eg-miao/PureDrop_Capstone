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

type LegacyRequestPayload = {
  base64?: string;
  fileName?: string;
  mimeType?: string;
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

const getArrayBufferFromBase64 = (base64Value: string) => {
  const normalized = base64Value.includes(",")
    ? (base64Value.split(",").pop() ?? "")
    : base64Value;

  if (!normalized.trim()) {
    throw new Error("Attachment image data is empty.");
  }

  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
};

const getLegacyJsonMedia = async (request: Request) => {
  let payload: LegacyRequestPayload;

  try {
    payload = await request.json() as LegacyRequestPayload;
  } catch {
    return {
      errorResponse: jsonResponse(
        { error: { message: "Request body must be valid JSON or multipart form data." } },
        400,
      ),
    };
  }

  const base64 = typeof payload.base64 === "string" ? payload.base64.trim() : "";
  if (!base64) {
    return {
      errorResponse: jsonResponse({ error: { message: "Attachment image data is missing." } }, 400),
    };
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = getArrayBufferFromBase64(base64);
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : "Attachment image data is invalid.";

    return {
      errorResponse: jsonResponse({ error: { message } }, 400),
    };
  }

  if (arrayBuffer.byteLength <= 0) {
    return {
      errorResponse: jsonResponse({ error: { message: "Attachment image file is empty." } }, 400),
    };
  }

  if (arrayBuffer.byteLength > MAX_ATTACHMENT_BYTES) {
    return {
      errorResponse: jsonResponse(
        {
          error: {
            message: "Attachment is too large for authenticity review. Please choose a smaller image.",
          },
        },
        400,
      ),
    };
  }

  const mimeType = typeof payload.mimeType === "string" && payload.mimeType.trim()
    ? payload.mimeType.trim()
    : "image/jpeg";
  const fileName = typeof payload.fileName === "string" && payload.fileName.trim()
    ? payload.fileName.trim()
    : "attachment.jpg";

  return {
    fileName,
    media: new Blob([arrayBuffer], { type: mimeType }),
  };
};

const getMultipartMedia = async (request: Request) => {
  let requestFormData: FormData;
  try {
    requestFormData = await request.formData();
  } catch {
    return {
      errorResponse: jsonResponse(
        { error: { message: "Request body must be valid multipart form data." } },
        400,
      ),
    };
  }

  const media = requestFormData.get("media");
  if (!(media instanceof Blob)) {
    return {
      errorResponse: jsonResponse({ error: { message: "Attachment image file is missing." } }, 400),
    };
  }

  if (media.size <= 0) {
    return {
      errorResponse: jsonResponse({ error: { message: "Attachment image file is empty." } }, 400),
    };
  }

  if (media.size > MAX_ATTACHMENT_BYTES) {
    return {
      errorResponse: jsonResponse(
        {
          error: {
            message: "Attachment is too large for authenticity review. Please choose a smaller image.",
          },
        },
        400,
      ),
    };
  }

  const fileName = "name" in media && typeof media.name === "string" && media.name.trim()
    ? media.name.trim()
    : "attachment.jpg";

  return {
    fileName,
    media,
  };
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

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  const requestMedia = contentType.includes("multipart/form-data")
    ? await getMultipartMedia(request)
    : await getLegacyJsonMedia(request);

  if ("errorResponse" in requestMedia) {
    return requestMedia.errorResponse;
  }

  const { fileName, media } = requestMedia;

  const formData = new FormData();
  formData.append("models", SIGHTENGINE_MODELS);
  formData.append("api_user", sightengineApiUser);
  formData.append("api_secret", sightengineApiSecret);
  formData.append("media", media, fileName);

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
