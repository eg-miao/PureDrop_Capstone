import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { reviewAttachmentAuthenticity } from "../../api/attachmentAuthenticity";
import { styles } from "./createReportStyles";
import type { Attachment } from "./useCreateReportForm";

type ReviewState = "idle" | "analyzing" | "passed" | "warning" | "blocked" | "unavailable";

export type AttachmentMachineLearningItem = {
  attachmentUri: string;
  state: Exclude<ReviewState, "idle" | "analyzing" | "unavailable">;
  message: string;
};

export type AttachmentMachineLearningStatus = {
  canSubmit: boolean;
  items: AttachmentMachineLearningItem[];
  state: ReviewState;
  summary: string;
};

type AttachmentMachineLearningProps = {
  attachments: Attachment[];
  category: string;
  onStatusChange?: (status: AttachmentMachineLearningStatus) => void;
};

type AttachmentAuthenticityResponse = {
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

const initialStatus: AttachmentMachineLearningStatus = {
  canSubmit: true,
  items: [],
  state: "idle",
  summary: "Add an attachment to start the authenticity review.",
};

const formatScore = (value?: number) => `${Math.round((value ?? 0) * 100)}%`;

const buildCategoryNote = (category: string) => {
  if (!category.trim()) {
    return "This check focuses on fake or non-photo attachments only.";
  }

  return `This check helps spot fake or non-photo attachments, but it does not confirm the "${category}" category itself.`;
};

const buildAuthenticityReview = (
  attachment: Attachment,
  category: string,
  response: AttachmentAuthenticityResponse,
): AttachmentMachineLearningItem => {
  const aiGeneratedScore = response.type?.ai_generated ?? 0;
  const deepfakeScore = response.type?.deepfake ?? 0;
  const illustrationScore = response.type?.illustration ?? 0;
  const photoScore = response.type?.photo ?? 0;
  const artificialTextScore = response.text?.has_artificial ?? 0;

  if (aiGeneratedScore >= 0.7) {
    return {
      attachmentUri: attachment.uri,
      message: `Sightengine marked this attachment as likely AI-generated (${formatScore(aiGeneratedScore)}).`,
      state: "blocked",
    };
  }

  if (deepfakeScore >= 0.6) {
    return {
      attachmentUri: attachment.uri,
      message: `Sightengine marked this attachment as likely deepfake or face-manipulated (${formatScore(deepfakeScore)}).`,
      state: "blocked",
    };
  }

  if (illustrationScore >= 0.85 && photoScore <= 0.2) {
    return {
      attachmentUri: attachment.uri,
      message: `Sightengine thinks this looks like an illustration instead of a real photo (${formatScore(illustrationScore)} illustration).`,
      state: "blocked",
    };
  }

  if (aiGeneratedScore >= 0.35) {
    return {
      attachmentUri: attachment.uri,
      message: `Sightengine sees some AI-generation risk (${formatScore(aiGeneratedScore)}). ${buildCategoryNote(category)}`,
      state: "warning",
    };
  }

  if (deepfakeScore >= 0.25) {
    return {
      attachmentUri: attachment.uri,
      message: `Sightengine sees some deepfake/manipulation risk (${formatScore(deepfakeScore)}). ${buildCategoryNote(category)}`,
      state: "warning",
    };
  }

  if (illustrationScore >= 0.55 && photoScore < 0.45) {
    return {
      attachmentUri: attachment.uri,
      message: `This attachment may be artwork, a screenshot, or a designed image rather than a camera photo. ${buildCategoryNote(category)}`,
      state: "warning",
    };
  }

  if (artificialTextScore >= 0.8) {
    return {
      attachmentUri: attachment.uri,
      message: `This attachment contains a lot of artificial text or UI elements (${formatScore(artificialTextScore)}), so it may be a screenshot instead of report evidence.`,
      state: "warning",
    };
  }

  return {
    attachmentUri: attachment.uri,
    message: `Sightengine says this looks like a real photo (${formatScore(photoScore)} photo). ${buildCategoryNote(category)}`,
    state: "passed",
  };
};

const buildItemReview = async (
  attachment: Attachment,
  category: string,
): Promise<AttachmentMachineLearningItem> => {
  const response = await reviewAttachmentAuthenticity(attachment);
  return buildAuthenticityReview(attachment, category, response);
};

const buildSummary = (items: AttachmentMachineLearningItem[], category: string) => {
  if (items.some((item) => item.state === "blocked")) {
    return "One or more attachments were blocked because they look AI-generated, face-manipulated, or non-photographic.";
  }

  if (items.some((item) => item.state === "warning")) {
    return `${buildCategoryNote(category)} Review the warning before submitting.`;
  }

  if (!category.trim()) {
    return "The attachments look like real photos. This review does not check category relevance.";
  }

  return `The attachments look like real photos. Sightengine still does not verify whether they truly match "${category}".`;
};

const getStatusIcon = (state: AttachmentMachineLearningItem["state"]) => {
  switch (state) {
    case "blocked":
      return "close-circle";
    case "warning":
      return "alert-circle";
    default:
      return "checkmark-circle";
  }
};

const getStatusIconColor = (state: AttachmentMachineLearningItem["state"]) => {
  switch (state) {
    case "blocked":
      return "#b91c1c";
    case "warning":
      return "#9a6700";
    default:
      return "#166534";
  }
};

export function AttachmentMachineLearning({
  attachments,
  category,
  onStatusChange,
}: AttachmentMachineLearningProps) {
  const [status, setStatus] = useState<AttachmentMachineLearningStatus>(initialStatus);

  useEffect(() => {
    let cancelled = false;

    const updateStatus = (nextStatus: AttachmentMachineLearningStatus) => {
      if (!cancelled) {
        setStatus(nextStatus);
      }
    };

    if (attachments.length === 0) {
      updateStatus(initialStatus);
      return () => {
        cancelled = true;
      };
    }

    updateStatus({
      canSubmit: false,
      items: [],
      state: "analyzing",
      summary: "Checking the attachments with secure server review...",
    });

    void (async () => {
      const items: AttachmentMachineLearningItem[] = [];

      for (const attachment of attachments) {
        if (cancelled) {
          return;
        }

        items.push(await buildItemReview(attachment, category));
      }

      if (cancelled) {
        return;
      }

      const nextStatus: AttachmentMachineLearningStatus = {
        canSubmit: !items.some((item) => item.state === "blocked"),
        items,
        state: items.some((item) => item.state === "blocked")
          ? "blocked"
          : items.some((item) => item.state === "warning")
            ? "warning"
            : "passed",
        summary: buildSummary(items, category),
      };

      updateStatus(nextStatus);
    })()
      .catch((error) => {
        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Authenticity review failed.";

        updateStatus({
          canSubmit: true,
          items: [],
          state: "warning",
          summary: `Authenticity review could not finish: ${message}`,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [attachments, category]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  return (
    <View style={styles.attachmentMlCard}>
      <View style={styles.attachmentMlHeader}>
        <Ionicons
          color={
            status.state === "blocked"
              ? "#b91c1c"
              : status.state === "warning"
                ? "#9a6700"
                : status.state === "passed"
                  ? "#166534"
                  : "#1d4ed8"
          }
          name="sparkles"
          size={16}
        />
        <Text style={styles.attachmentMlTitle}>Attachment Authenticity Review</Text>
      </View>

      {status.state === "analyzing" ? (
        <View style={styles.attachmentMlLoadingRow}>
          <ActivityIndicator color="#1d4ed8" size="small" />
          <Text style={styles.attachmentMlSummary}>{status.summary}</Text>
        </View>
      ) : (
        <Text style={styles.attachmentMlSummary}>{status.summary}</Text>
      )}

      {status.items.map((item, index) => (
        <View
          key={`${item.attachmentUri}-${index}`}
          style={[
            styles.attachmentMlItem,
            item.state === "blocked"
              ? styles.attachmentMlItemBlocked
              : item.state === "warning"
                ? styles.attachmentMlItemWarning
                : styles.attachmentMlItemPassed,
          ]}
        >
          <Ionicons
            color={getStatusIconColor(item.state)}
            name={getStatusIcon(item.state)}
            size={15}
          />
          <Text style={styles.attachmentMlItemText}>{item.message}</Text>
        </View>
      ))}
    </View>
  );
}
