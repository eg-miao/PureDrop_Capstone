import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5a9ae6",
  },

  formScroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 110,
  },

  logo: {
    width: 98,
    height: 98,
    alignSelf: "center",
    resizeMode: "contain",
    marginBottom: 14,
  },

  label: {
    color: "#cfe6ff",
    fontSize: 11,
    marginBottom: 6,
  },

  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },

  categoryOption: {
    borderRadius: 7,
    backgroundColor: "#d8ecf6",
    borderWidth: 1,
    borderColor: "#b9d8ef",
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  categoryOptionSelected: {
    backgroundColor: "#1e40af",
    borderColor: "#dbeafe",
  },

  categoryOptionText: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "600",
  },

  categoryOptionTextSelected: {
    color: "#ffffff",
  },

  input: {
    height: 36,
    borderRadius: 7,
    backgroundColor: "#d8ecf6",
    marginBottom: 14,
    paddingHorizontal: 10,
    color: "#0f172a",
  },

  addressPickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  addressPickerValue: {
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },

  addressPickerPlaceholder: {
    color: "#7da8d8",
    flex: 1,
    marginRight: 8,
  },

  gpsInput: {
    opacity: 0.85,
    marginBottom: 8,
  },

  featuresTitle: {
    color: "#e2f0ff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  featureRow: {
    marginBottom: 12,
  },

  featureItem: {
    color: "#e2f0ff",
    fontSize: 11,
    marginTop: 3,
    marginBottom: 4,
  },

  featureButton: {
    height: 42,
    borderRadius: 9,
    backgroundColor: "#d8ecf6",
    borderWidth: 1,
    borderColor: "#b9d8ef",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  featureButtonLoading: {
    opacity: 0.7,
  },

  featureButtonText: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  issueLabel: {
    marginTop: 2,
  },

  issueHeaderRow: {
    marginTop: 2,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  autoCategoryButton: {
    height: 30,
    borderRadius: 7,
    backgroundColor: "#d8ecf6",
    borderWidth: 1,
    borderColor: "#b9d8ef",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  autoCategoryButtonText: {
    color: "#0f172a",
    fontSize: 11,
    fontWeight: "700",
  },

  textArea: {
    height: 112,
    borderRadius: 7,
    backgroundColor: "#d8ecf6",
    paddingHorizontal: 10,
    paddingTop: 10,
    color: "#0f172a",
  },

  uploadButton: {
    marginTop: 8,
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },

  attachmentRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    minHeight: 52,
  },

  attachmentCard: {
    position: "relative",
  },

  attachmentPreview: {
    width: 48,
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#cfe6ff",
  },

  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },

  removeButtonText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 10,
  },

  attachmentsText: {
    color: "#d6e8ff",
    fontSize: 11,
    marginTop: 10,
  },

  attachmentMlCard: {
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: "#d8ecf6",
    borderWidth: 1,
    borderColor: "#b9d8ef",
    padding: 12,
    gap: 8,
  },

  attachmentMlHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  attachmentMlTitle: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "700",
  },

  attachmentMlLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  attachmentMlSummary: {
    color: "#334155",
    fontSize: 11,
    lineHeight: 16,
  },

  attachmentMlItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  attachmentMlItemPassed: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
  },

  attachmentMlItemWarning: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },

  attachmentMlItemBlocked: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },

  attachmentMlItemText: {
    flex: 1,
    color: "#334155",
    fontSize: 11,
    lineHeight: 16,
  },

  submitButton: {
    marginTop: 24,
    marginBottom: 8,
    alignSelf: "center",
    width: "92%",
    height: 48,
    borderRadius: 10,
    backgroundColor: "#89e2bb",
    borderWidth: 2,
    borderColor: "#d7f7e8",
    alignItems: "center",
    justifyContent: "center",
  },

  submitText: {
    color: "#0b1f1a",
    fontSize: 28,
    fontWeight: "400",
  },

  mapContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  mapHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  mapTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },

  map: {
    flex: 1,
  },

  mapActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },

  mapCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },

  mapCancelText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
  },

  mapConfirmButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#86efac",
    alignItems: "center",
    justifyContent: "center",
  },

  mapConfirmText: {
    color: "#0b1f1a",
    fontSize: 14,
    fontWeight: "700",
  },
});
