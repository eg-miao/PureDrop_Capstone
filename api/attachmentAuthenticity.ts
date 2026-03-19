import { supabase } from "./supabase";
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";
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

type ReviewAttachmentPayload = {
  base64: string;
  fileName?: string | null;
  mimeType?: string | null;
};

type EdgeFunctionErrorPayload = {
  error?: {
    message?: string;
    status?: number;
  };
};

const REVIEW_ATTACHMENT_FUNCTION = "review-report-attachment";

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

export async function reviewAttachmentAuthenticity(
  attachment: Attachment,
): Promise<AttachmentAuthenticityResponse> {
  const base64 = attachment.base64?.trim();

  if (!base64) {
    throw new Error("Selected attachment is missing base64 data for authenticity review.");
  }

  const { data, error, response } = await supabase.functions.invoke<AttachmentAuthenticityResponse>(
    REVIEW_ATTACHMENT_FUNCTION,
    {
      body: {
        base64,
        fileName: attachment.fileName ?? null,
        mimeType: attachment.mimeType ?? null,
      },
    },
  );

  if (error) {
    throw new Error(await getSupabaseFunctionErrorMessage(error, response));
  }

  if (!data) {
    throw new Error("Supabase Edge Function returned no data.");
  }

  return data;
}
