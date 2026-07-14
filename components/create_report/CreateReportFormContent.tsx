import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  AttachmentMachineLearning,
  type AttachmentMachineLearningStatus,
} from "./AttachmentMachineLearning";
import { LightboxCreateReport } from "./LightboxCreateReport";
import { styles } from "./createReportStyles";
import type { Attachment } from "./useCreateReportForm";

type CreateReportFormContentProps = {
  address: string;
  attachments: Attachment[];
  category: string;
  gpsLoading: boolean;
  gpsLocation: string;
  selectedPin?: { latitude: number; longitude: number } | null;
  issue: string;
  location: string;
  submitLoading: boolean;
  waterMeter: string;
  onAddressChange: (value: string) => void;
  onBack: () => void;
  onCategoryChange: (value: string) => void;
  onIssueChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onPickAttachment: () => void;
  onAttachmentReviewChange?: (status: any) => void;
  onRemoveAttachment: (index: number) => void;
  onSubmit: () => void;
  onUseGps: () => void;
  onWaterMeterChange: (value: string) => void;
};

const CATEGORY_OPTIONS = ["No water", "Dirty water", "Water leaking"];

export function CreateReportFormContent({
  address,
  attachments,
  category,
  gpsLoading,
  gpsLocation,
  selectedPin,
  issue,
  location,
  submitLoading,
  waterMeter,
  onAddressChange,
  onBack,
  onCategoryChange,
  onIssueChange,
  onLocationChange,
  onPickAttachment,
  onAttachmentReviewChange,
  onRemoveAttachment,
  onSubmit,
  onUseGps,
  onWaterMeterChange,
}: CreateReportFormContentProps) {
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

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
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(22, insets.top + 10) },
        ]}
        keyboardShouldPersistTaps="handled"
        {...mobileScrollProps}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.85}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Report a Problem</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.sectionTitle}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORY_OPTIONS.map((option) => {
            const isSelected = category === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                onPress={() => onCategoryChange(option)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Issue Details</Text>
          
          <Text style={styles.label}>Describe the issue</Text>
          <TextInput
            value={issue}
            onChangeText={onIssueChange}
            style={styles.textArea}
            multiline
            textAlignVertical="top"
            placeholder="Please provide details about the problem..."
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.label}>Water Meter (Optional)</Text>
          <TextInput
            value={waterMeter}
            onChangeText={onWaterMeterChange}
            style={styles.input}
            placeholder="Enter meter reading"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location Information</Text>

          <Text style={styles.label}>Barangay</Text>
          <TouchableOpacity
            style={[styles.input, styles.addressPickerTrigger]}
            activeOpacity={0.85}
            onPress={() => setAddressModalVisible(true)}
          >
            <Text style={address ? styles.addressPickerValue : styles.addressPickerPlaceholder}>
              {address || "Select barangay in Toledo City"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <Text style={styles.label}>Landmark / Specific Location</Text>
          <TextInput
            value={location}
            onChangeText={onLocationChange}
            style={styles.input}
            placeholder="e.g. In front of the chapel"
            placeholderTextColor="#94A3B8"
          />

          <View style={styles.gpsHeader}>
            <Text style={styles.label}>Pin Location on Map</Text>
            {gpsLocation ? (
              <TouchableOpacity onPress={onUseGps} activeOpacity={0.7}>
                <Text style={styles.repickText}>Change Pin</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {selectedPin ? (
            <View style={styles.miniMapContainer}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.miniMap}
                region={{
                  latitude: selectedPin.latitude,
                  longitude: selectedPin.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker coordinate={selectedPin} />
              </MapView>
              <View style={styles.miniMapOverlay}>
                <Ionicons name="location" size={14} color="#0EA5E9" />
                <Text style={styles.miniMapAddressText} numberOfLines={1}>
                  {gpsLocation}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.featureButton, gpsLoading && styles.featureButtonLoading]}
              onPress={onUseGps}
              disabled={gpsLoading}
              activeOpacity={0.85}
            >
              <Ionicons name="map-outline" size={20} color="#0EA5E9" />
              <Text style={styles.featureButtonText}>
                {gpsLoading ? "Loading map..." : "Open Map to Pin Location"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Attachments</Text>
          <Text style={styles.attachmentsText}>Upload up to 2 photos to help us identify the issue.</Text>

          <View style={styles.attachmentRow}>
            {attachments.map((item, index) => (
              <View key={`${item.uri}-${index}`} style={styles.attachmentCard}>
                <Image source={{ uri: item.uri }} style={styles.attachmentPreview} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => onRemoveAttachment(index)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}

            {attachments.length < 2 && (
              <TouchableOpacity style={styles.uploadButton} onPress={onPickAttachment} activeOpacity={0.7}>
                <Ionicons name="image-outline" size={32} color="#94A3B8" />
                <Text style={styles.uploadButtonText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          <AttachmentMachineLearning
            attachments={attachments}
            category={category}
            onStatusChange={onAttachmentReviewChange}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={onSubmit} disabled={submitLoading} activeOpacity={0.85}>
          <Text style={styles.submitText}>{submitLoading ? "Submitting..." : "Submit Report"}</Text>
          {!submitLoading && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
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
