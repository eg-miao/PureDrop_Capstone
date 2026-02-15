import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native";
import { CreateReportFormContent } from "../../../components/create_report/CreateReportFormContent";
import { GpsMapModal } from "../../../components/create_report/GpsMapModal";
import { styles } from "../../../components/create_report/createReportStyles";
import { useCreateReportForm } from "../../../components/create_report/useCreateReportForm";

export default function CreateReportScreen() {
  const form = useCreateReportForm();
  const router = useRouter();

  const handleSubmitPress = async () => {
    const didSubmit = await form.handleSubmit();
    if (didSubmit) {
      router.replace("/regular_user/create_report/submitted");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CreateReportFormContent
        attachments={form.attachments}
        category={form.category}
        gpsLoading={form.gpsLoading}
        gpsLocation={form.gpsLocation}
        issue={form.issue}
        location={form.location}
        submitLoading={form.submitLoading}
        waterMeter={form.waterMeter}
        onCategoryChange={form.setCategory}
        onIssueChange={form.setIssue}
        onLocationChange={form.setLocation}
        onPickAttachment={form.handlePickAttachment}
        onRemoveAttachment={form.handleRemoveAttachment}
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
