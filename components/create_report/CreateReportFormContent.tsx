import { Ionicons } from "@expo/vector-icons";
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "./createReportStyles";
import type { Attachment } from "./useCreateReportForm";

type CreateReportFormContentProps = {
  attachments: Attachment[];
  category: string;
  gpsLoading: boolean;
  gpsLocation: string;
  issue: string;
  location: string;
  submitLoading: boolean;
  waterMeter: string;
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
  attachments,
  category,
  gpsLoading,
  gpsLocation,
  issue,
  location,
  submitLoading,
  waterMeter,
  onCategoryChange,
  onIssueChange,
  onLocationChange,
  onPickAttachment,
  onRemoveAttachment,
  onSubmit,
  onUseGps,
  onWaterMeterChange,
}: CreateReportFormContentProps) {
  return (
    <ScrollView
      style={styles.formScroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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

      <Text style={styles.label}>Location</Text>
      <TextInput
        value={location}
        onChangeText={onLocationChange}
        style={styles.input}
        placeholder="Street / barangay / landmark"
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

      <TextInput
        value={waterMeter}
        onChangeText={onWaterMeterChange}
        style={styles.input}
        placeholder="Meter reading"
        placeholderTextColor="#7da8d8"
        keyboardType="numeric"
      />


      <Text style={[styles.label, styles.issueLabel]}>Describe an Issue</Text>
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
  );
}
