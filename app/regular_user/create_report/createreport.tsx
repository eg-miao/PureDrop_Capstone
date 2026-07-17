import { useNavigation, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
  const navigation = useNavigation();
  const isDiscardingRef = useRef(false);
  const [attachmentReview, setAttachmentReview] = useState<AttachmentMachineLearningStatus | null>(
    null,
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormDirty =
    form.category !== "" ||
    form.issue !== "" ||
    form.address !== "" ||
    form.location !== "" ||
    form.gpsLocation !== "" ||
    form.attachments.length > 0 ||
    form.waterMeter !== "";

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // If we're submitting, or the form is clean, let the navigation happen
      if (!isFormDirty || isSubmitting || isDiscardingRef.current) {
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      Alert.alert(
        "Discard Report?",
        "You have unfinished details in your report. Are you sure you want to discard them?",
        [
          { text: "Keep Editing", style: "cancel", onPress: () => {} },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              isDiscardingRef.current = true;
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, isFormDirty, isSubmitting]);

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/regular_user/home");
    }
  };

  const handleSubmitPress = async () => {
    if (attachmentReview && !attachmentReview.canSubmit) {
      Alert.alert("Attachment check", attachmentReview.summary);
      return;
    }

    setIsSubmitting(true);
    const didSubmit = await form.handleSubmit();
    if (didSubmit) {
      router.replace("/regular_user/create_report/submitted");
    } else {
      setIsSubmitting(false);
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
        selectedPin={form.selectedPin}
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
        onBack={handleBackPress}
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
        onRegionChangeComplete={form.handleRegionChangeComplete}
      />
    </SafeAreaView>
  );
}
