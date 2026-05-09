type CategorizeResult = {
  category: string | null;
  source: "fallback" | "none";
};

const CATEGORY_NO_WATER = "No water";
const CATEGORY_DIRTY_WATER = "Dirty water";
const CATEGORY_WATER_LEAKING = "Water leaking";

const normalizeCategoryFromIssueText = (issueText: string): string | null => {
  const lower = issueText.trim().toLowerCase();
  if (!lower) {
    return null;
  }

  if (
    lower.includes("brown") ||
    lower.includes("dirty") ||
    lower.includes("smell") ||
    lower.includes("murky")
  ) {
    return CATEGORY_DIRTY_WATER;
  }

  if (
    lower.includes("leak") ||
    lower.includes("flowing") ||
    lower.includes("tulo") ||
    lower.includes("nag-agas")
  ) {
    return CATEGORY_WATER_LEAKING;
  }

  if (
    lower.includes("no water") ||
    lower.includes("walay tubig") ||
    lower.includes("interruption") ||
    lower.includes("outage")
  ) {
    return CATEGORY_NO_WATER;
  }

  return null;
};

const getLocalAssistantAnswer = (question: string): string => {
  const lower = question.toLowerCase();

  if (lower.includes("report") || lower.includes("submit")) {
    return "To submit a report, open Report a Water Problem, fill category and issue details, add location/GPS, then tap Submit.";
  }

  if (lower.includes("gps") || lower.includes("location")) {
    return "Use the GPS button in report creation, then confirm your map pin to set your location.";
  }

  if (lower.includes("photo") || lower.includes("image") || lower.includes("attach")) {
    return "You can attach up to 2 images per report. Pick clear photos of the issue for faster validation.";
  }

  if (lower.includes("status") || lower.includes("pending") || lower.includes("approved")) {
    return "Open View Reports or Reports List to check your current report status.";
  }

  if (lower.includes("category") || lower.includes("no water") || lower.includes("dirty") || lower.includes("leak")) {
    return 'Categories are: "No water", "Dirty water", and "Water leaking". Choose the one that best matches the issue.';
  }

  return "Assistant is running in local mode (no external AI). Ask about report steps, GPS, attachments, status, or categories.";
};

export async function askAssistantQuestion(question: string): Promise<string> {
  const trimmed = question.trim();
  if (!trimmed) {
    throw new Error("Question is empty.");
  }

  return getLocalAssistantAnswer(trimmed);
}

export async function autoCategorizeIssue(issueText: string): Promise<CategorizeResult> {
  const trimmed = issueText.trim();
  if (!trimmed) {
    return { category: null, source: "none" };
  }

  const fallbackCategory = normalizeCategoryFromIssueText(trimmed);
  if (fallbackCategory) {
    return { category: fallbackCategory, source: "fallback" };
  }

  return { category: null, source: "none" };
}
