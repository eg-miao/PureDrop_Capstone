import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { AttachmentMachineLearningStatus } from "../../../components/create_report/AttachmentMachineLearning";
import { CreateReportFormContent } from "../../../components/create_report/CreateReportFormContent";
import { GpsMapModal } from "../../../components/create_report/GpsMapModal";
import { styles } from "../../../components/create_report/createReportStyles";
import { useCreateReportForm } from "../../../components/create_report/useCreateReportForm";

export default function CreateReportScreen() {
  const form = useCreateReportForm();
  const router = useRouter();
  const [attachmentReview, setAttachmentReview] = useState<AttachmentMachineLearningStatus | null>(
    null,
  );

  const handleSubmitPress = async () => {
    if (attachmentReview && !attachmentReview.canSubmit) {
      Alert.alert("Attachment check", attachmentReview.summary);
      return;
    }

    const didSubmit = await form.handleSubmit();
    if (didSubmit) {
      router.replace("/regular_user/create_report/submitted");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <CreateReportFormContent
        address={form.address}
        attachments={form.attachments}
        category={form.category}
        gpsLoading={form.gpsLoading}
        gpsLocation={form.gpsLocation}
        issue={form.issue}
        location={form.location}
        submitLoading={form.submitLoading}
        waterMeter={form.waterMeter}
        onAddressChange={form.setAddress}
        onCategoryChange={form.setCategory}
        onIssueChange={form.setIssue}
        onLocationChange={form.setLocation}
        onAttachmentReviewChange={setAttachmentReview}
        onPickAttachment={form.handlePickAttachment}
        onRemoveAttachment={form.handleRemoveAttachment}
        onBack={() => router.replace("/regular_user/home")}
        onSubmit={handleSubmitPress}
        onUseGps={form.handleUseGps}
        onWaterMeterChange={form.setWaterMeter}
      />

      <GpsMapModal
        gpsLoading={form.gpsLoading}
        initialRegion={form.mapRegion}
        selectedPin={form.selectedPin}
        visible={form.mapVisible}
        onCancel={() => form.setMapVisible(false)}
        onConfirm={form.handleConfirmMapLocation}
        onMapPress={form.handleMapPress}
      />
    </SafeAreaView>
  );
}
