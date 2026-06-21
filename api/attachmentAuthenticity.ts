import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Attachment } from "../components/create_report/useCreateReportForm";

type AttachmentAuthenticityResponse = {
  requestId: string | null;
  text: {
    has_artificial?: number;
    has_natural?: number;
  } | null;
  type: {
    ai_generated?: number;
    deepfake?: number;
    illustration?: number;
    photo?: number;
  } | null;
};

type EdgeFunctionErrorPayload = {
  error?: {
    message?: string;
    status?: number;
  };
};

type LegacyAttachmentAuthenticityRequest = {
  base64: string;
  fileName: string;
  mimeType: string;
};

const REVIEW_ATTACHMENT_FUNCTION = "review-report-attachment";

const getAttachmentExtension = (attachment: Attachment) => {
  const cleanFileName = attachment.fileName?.split("?")[0] ?? "";
  const cleanUri = attachment.uri.split("?")[0];
  const source = cleanFileName || cleanUri;
  const parts = source.split(".");

  if (parts.length > 1) {
    return parts[parts.length - 1].toLowerCase();
  }

  const mimeType = attachment.mimeType?.toLowerCase() ?? "";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("heic")) return "heic";

  return "jpg";
};

const getAttachmentMimeType = (attachment: Attachment) => {
  const mimeType = attachment.mimeType?.trim();
  if (mimeType) {
    return mimeType;
  }

  switch (getAttachmentExtension(attachment)) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "jpeg":
    case "jpg":
    default:
      return "image/jpeg";
  }
};

const getAttachmentFileName = (attachment: Attachment) =>
  attachment.fileName?.trim() || `report-attachment.${getAttachmentExtension(attachment)}`;

const buildInvokeBody = async (attachment: Attachment) => {
  const formData = new FormData();
  const fileName = getAttachmentFileName(attachment);
  const mimeType = getAttachmentMimeType(attachment);

  if (Platform.OS === "web") {
    const response = await fetch(attachment.uri);
    if (!response.ok) {
      throw new Error(`Unable to read the selected attachment (${response.status}).`);
    }

    const blob = await response.blob();
    formData.append("media", blob, fileName);
    return formData;
  }

  formData.append(
    "media",
    {
      name: fileName,
      type: mimeType,
      uri: attachment.uri,
    } as any,
  );

  return formData;
};

const buildLegacyInvokeBody = async (
  attachment: Attachment,
): Promise<LegacyAttachmentAuthenticityRequest> => {
  const fileName = getAttachmentFileName(attachment);
  const mimeType = getAttachmentMimeType(attachment);

  if (Platform.OS === "web") {
    const response = await fetch(attachment.uri);
    if (!response.ok) {
      throw new Error(`Unable to read the selected attachment (${response.status}).`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      base64: Buffer.from(arrayBuffer).toString("base64"),
      fileName,
      mimeType,
    };
  }

  const base64 = await FileSystem.readAsStringAsync(attachment.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return {
    base64,
    fileName,
    mimeType,
  };
};

const readResponseMessage = async (response?: Response) => {
  if (!response) {
    return "";
  }

  try {
    const responseBody = (await response.clone().json()) as EdgeFunctionErrorPayload;
    const message = responseBody.error?.message?.trim();
    return message ?? "";
  } catch {
    try {
      const text = await response.clone().text();
      return text.trim();
    } catch {
      return "";
    }
  }
};

const getSupabaseFunctionErrorMessage = async (error: unknown, response?: Response) => {
  const responseMessage = await readResponseMessage(response);
  if (responseMessage) {
    if (responseMessage.toLowerCase() === "incorrect api user or api secret") {
      return "The Supabase Edge Function is using the wrong Sightengine credentials. Update SIGHTENGINE_API_USER and SIGHTENGINE_API_SECRET in Supabase secrets.";
    }

    return responseMessage;
  }

  if (error instanceof FunctionsHttpError) {
    return "The Supabase Edge Function returned an error response.";
  }

  if (error instanceof FunctionsRelayError) {
    return "Supabase could not route the request to the Edge Function.";
  }

  if (error instanceof FunctionsFetchError) {
    return "Could not reach the Supabase Edge Function.";
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "Authenticity review failed.";
};

const shouldRetryWithLegacyJson = (message: string) => {
  const normalized = message.trim().toLowerCase();
  return normalized.includes("valid json");
};

const invokeReviewAttachment = async (
  body: FormData | LegacyAttachmentAuthenticityRequest,
) =>
  supabase.functions.invoke<AttachmentAuthenticityResponse>(REVIEW_ATTACHMENT_FUNCTION, {
    body,
  });

export async function reviewAttachmentAuthenticity(
  attachment: Attachment,
): Promise<AttachmentAuthenticityResponse> {
  if (!attachment.uri.trim()) {
    throw new Error("Selected attachment is missing a file URI for authenticity review.");
  }

  const body = await buildInvokeBody(attachment);
  let { data, error, response } = await invokeReviewAttachment(body);

  if (error) {
    const message = await getSupabaseFunctionErrorMessage(error, response);

    if (shouldRetryWithLegacyJson(message)) {
      const legacyBody = await buildLegacyInvokeBody(attachment);
      const legacyResult = await invokeReviewAttachment(legacyBody);
      data = legacyResult.data;
      error = legacyResult.error;
      response = legacyResult.response;

      if (error) {
        throw new Error(await getSupabaseFunctionErrorMessage(error, response));
      }
    } else {
      throw new Error(message);
    }
  }

  if (!data) {
    throw new Error("Supabase Edge Function returned no data.");
  }

  return data;
}
