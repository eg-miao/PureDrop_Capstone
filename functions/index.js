import { initializeApp } from "firebase-admin/app";
import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

initializeApp();

const SIGHTENGINE_API_USER = defineSecret("SIGHTENGINE_API_USER");
const SIGHTENGINE_API_SECRET = defineSecret("SIGHTENGINE_API_SECRET");

const REGION = "asia-southeast1";
const SIGHTENGINE_API_URL = "https://api.sightengine.com/1.0/check.json";
const SIGHTENGINE_MODELS = "genai,deepfake,type,text";
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const normalizeBase64 = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.includes(",") ? (trimmed.split(",").pop() ?? "") : trimmed;
};

const normalizeMimeType = (value) => {
  if (typeof value !== "string") {
    return "image/jpeg";
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed || "image/jpeg";
};

const normalizeFileName = (value, mimeType) => {
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

const parseSightengineResponse = async (response) => {
  const responseText = await response.text();

  let payload;
  try {
    payload = JSON.parse(responseText);
  } catch {
    payload = null;
  }

  return { payload, responseText };
};

const getSightengineErrorMessage = (status, payload, responseText) => {
  const apiMessage = payload?.error?.message;
  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage.trim();
  }

  if (typeof responseText === "string" && responseText.trim()) {
    return responseText.trim();
  }

  return `Sightengine request failed (${status}).`;
};

export const reviewReportAttachment = onCall(
  {
    region: REGION,
    secrets: [SIGHTENGINE_API_USER, SIGHTENGINE_API_SECRET],
  },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "Please sign in again before reviewing attachments.");
      }

      const base64 = normalizeBase64(request.data?.base64);
      if (!base64) {
        throw new HttpsError("invalid-argument", "Attachment image data is missing.");
      }

      const mimeType = normalizeMimeType(request.data?.mimeType);
      const fileName = normalizeFileName(request.data?.fileName, mimeType);
      const apiUser = SIGHTENGINE_API_USER.value().trim();
      const apiSecret = SIGHTENGINE_API_SECRET.value().trim();

      if (!apiUser || !apiSecret) {
        throw new HttpsError(
          "failed-precondition",
          "Sightengine server secrets are not configured on Firebase Functions.",
        );
      }

      let bytes;
      try {
        bytes = Buffer.from(base64, "base64");
      } catch {
        throw new HttpsError("invalid-argument", "Attachment image data is not valid base64.");
      }

      if (!bytes.length) {
        throw new HttpsError("invalid-argument", "Attachment image data is empty.");
      }

      if (bytes.length > MAX_ATTACHMENT_BYTES) {
        throw new HttpsError(
          "invalid-argument",
          "Attachment is too large for authenticity review. Please choose a smaller image.",
        );
      }

      const formData = new FormData();
      formData.append("models", SIGHTENGINE_MODELS);
      formData.append("api_user", apiUser);
      formData.append("api_secret", apiSecret);
      formData.append("media", new Blob([bytes], { type: mimeType }), fileName);

      const response = await fetch(SIGHTENGINE_API_URL, {
        body: formData,
        method: "POST",
      });

      const { payload, responseText } = await parseSightengineResponse(response);

      if (!response.ok) {
        const message = getSightengineErrorMessage(response.status, payload, responseText);
        throw new HttpsError("internal", message, { message, status: response.status });
      }

      if (payload?.status !== "success") {
        const message =
          getSightengineErrorMessage(response.status, payload, responseText) || "Sightengine review failed.";
        throw new HttpsError("internal", message, { message, status: response.status });
      }

      return {
        requestId: typeof payload?.request?.id === "string" ? payload.request.id : null,
        text: payload?.text ?? null,
        type: payload?.type ?? null,
      };
    } catch (error) {
      logger.error("reviewReportAttachment failed", {
        authUid: request.auth?.uid ?? null,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : typeof error,
      });

      if (error instanceof HttpsError) {
        throw error;
      }

      const message =
        error instanceof Error && error.message.trim()
          ? error.message.trim()
          : "Unexpected server error during attachment authenticity review.";

      throw new HttpsError("internal", message, { message });
    }
  },
);
