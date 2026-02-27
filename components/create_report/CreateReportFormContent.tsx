import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LightboxCreateReport } from "./LightboxCreateReport";
import { styles } from "./createReportStyles";
import type { Attachment } from "./useCreateReportForm";

type CreateReportFormContentProps = {
  address: string;
  aiCategorizing: boolean;
  attachments: Attachment[];
  category: string;
  gpsLoading: boolean;
  gpsLocation: string;
  issue: string;
  location: string;
  submitLoading: boolean;
  waterMeter: string;
  onAddressChange: (value: string) => void;
  onAutoCategorizeIssue: () => void;
  onCategoryChange: (value: string) => void;
  onIssueChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onPickAttachment: () => void;
  onRemoveAttachment: (index: number) => void;
  onSubmit: () => void;
  onUseGps: () => void;
  onWaterMeterChange: (value: string) => void;
};

const CATEGORY_OPTIONS = ["No water", "Dirty water", "Water leaking"];

export function CreateReportFormContent({
  address,
  aiCategorizing,
  attachments,
  category,
  gpsLoading,
  gpsLocation,
  issue,
  location,
  submitLoading,
  waterMeter,
  onAddressChange,
  onAutoCategorizeIssue,
  onCategoryChange,
  onIssueChange,
  onLocationChange,
  onPickAttachment,
  onRemoveAttachment,
  onSubmit,
  onUseGps,
  onWaterMeterChange,
}: CreateReportFormContentProps) {
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const mobileScrollProps = useMemo(() => {
    if (Platform.OS === "web") {
      return {};
    }

    return {
      showsVerticalScrollIndicator: true,
      ...(Platform.OS === "android" ? { persistentScrollbar: true } : {}),
    };
  }, []);

  return (
    <>
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        {...mobileScrollProps}
      >
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryRow}>
          {CATEGORY_OPTIONS.map((option) => {
            const isSelected = category === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.categoryOption, isSelected && styles.categoryOptionSelected]}
                onPress={() => onCategoryChange(option)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    isSelected && styles.categoryOptionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Address (Optional)</Text>
        <TouchableOpacity
          style={[styles.input, styles.addressPickerTrigger]}
          activeOpacity={0.85}
          onPress={() => setAddressModalVisible(true)}
        >
          <Text style={address ? styles.addressPickerValue : styles.addressPickerPlaceholder}>
            {address || "Select barangay in Toledo City"}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#0f172a" />
        </TouchableOpacity>

        <Text style={styles.label}>Location / Landmark (Optional)</Text>
        <TextInput
          value={location}
          onChangeText={onLocationChange}
          style={styles.input}
          placeholder="e.g. Atbang sa may Magdugo"
          placeholderTextColor="#7da8d8"
        />

        <Text style={styles.label}>GPS [Toledo City Only]</Text>
        <TextInput
          value={gpsLocation}
          editable={false}
          style={[styles.input, styles.gpsInput]}
          placeholder="Use GPS / map picker"
          placeholderTextColor="#7da8d8"
        />

        <View style={styles.featureRow}>
          <TouchableOpacity
            style={[styles.featureButton, gpsLoading && styles.featureButtonLoading]}
            onPress={onUseGps}
            disabled={gpsLoading}
            activeOpacity={0.85}
          >
            <Ionicons name="map-outline" size={16} color="#0f172a" />
            <Text style={styles.featureButtonText}>
              {gpsLoading ? "Loading map..." : "Pick on Map"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Water Meter (Optional)</Text>
        <TextInput
          value={waterMeter}
          onChangeText={onWaterMeterChange}
          style={styles.input}
          placeholder="Meter reading"
          placeholderTextColor="#7da8d8"
          keyboardType="numeric"
        />

        <View style={styles.issueHeaderRow}>
          <Text style={[styles.label, styles.issueLabel]}>Describe an Issue</Text>
          <TouchableOpacity
            style={[styles.autoCategoryButton, aiCategorizing && styles.featureButtonLoading]}
            onPress={onAutoCategorizeIssue}
            disabled={aiCategorizing || submitLoading}
            activeOpacity={0.85}
          >
            <Ionicons name="sparkles-outline" size={14} color="#0f172a" />
            <Text style={styles.autoCategoryButtonText}>
              {aiCategorizing ? "Analyzing..." : "AI Category"}
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          value={issue}
          onChangeText={onIssueChange}
          style={styles.textArea}
          multiline
          textAlignVertical="top"
          placeholder=""
          placeholderTextColor="#7da8d8"
        />

        <Text style={styles.label}>Upload [2 pictures max]</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={onPickAttachment}>
          <Ionicons name="add" size={26} color="#111827" />
        </TouchableOpacity>

        <View style={styles.attachmentRow}>
          {attachments.map((item, index) => (
            <View key={`${item.uri}-${index}`} style={styles.attachmentCard}>
              <Image source={{ uri: item.uri }} style={styles.attachmentPreview} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemoveAttachment(index)}
              >
                <Text style={styles.removeButtonText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={styles.attachmentsText}>Attachments: {attachments.length}/2</Text>

        <TouchableOpacity style={styles.submitButton} onPress={onSubmit} disabled={submitLoading}>
          <Text style={styles.submitText}>{submitLoading ? "Uploading..." : "Submit"}</Text>
        </TouchableOpacity>
      </ScrollView>

      <LightboxCreateReport
        selectedAddress={address}
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onSelectAddress={onAddressChange}
      />
    </>
  );
}
