import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Platform } from "react-native";
import { collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getPublicFileUrl, uploadFile } from "../../api/storage";
import { getCurrentGpsLocation, getLocationFromCoordinates } from "../../app/regular_user/create_report/creategps";
import { auth, db } from "../../firebaseConfig";
import type { Coordinate, Region } from "./MapPicker";

export type Attachment = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

export function useCreateReportForm() {
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [gpsLocation, setGpsLocation] = useState("");
  const [issue, setIssue] = useState("");
  const [waterMeter, setWaterMeter] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 10.3775,
    longitude: 123.6388,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [selectedPin, setSelectedPin] = useState<Coordinate | null>(null);

  const getFileExtension = (attachment: Attachment) => {
    const cleanUri = attachment.uri.split("?")[0];
    const parts = cleanUri.split(".");

    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }

    const mime = attachment.mimeType?.toLowerCase() ?? "";
    if (mime.includes("png")) return "png";
    if (mime.includes("webp")) return "webp";
    if (mime.includes("heic")) return "heic";
    return "jpg";
  };

  const getContentType = (extension: string) => {
    switch (extension) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      case "heic":
        return "image/heic";
      default:
        return "application/octet-stream";
    }
  };

  const resolveUploadedFileUrl = (uploadedPath: string, fallbackPath: string) => {
    const resolved = getPublicFileUrl(uploadedPath || fallbackPath);
    if (!resolved || typeof resolved !== "string") {
      throw new Error("Failed to resolve uploaded image URL.");
    }
    return resolved;
  };

  const handleUseGps = async () => {
    try {
      setGpsLoading(true);
      const gpsResult = await getCurrentGpsLocation();
      const region: Region = {
        latitude: gpsResult.latitude,
        longitude: gpsResult.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(region);
      setSelectedPin({
        latitude: gpsResult.latitude,
        longitude: gpsResult.longitude,
      });

      if (Platform.OS === "web") {
        const pickedLocation = await getLocationFromCoordinates(
          gpsResult.latitude,
          gpsResult.longitude
        );
        if (pickedLocation.isOutsideToledo) {
          Alert.alert("Outside Toledo", "Your current location does not appear to be in Toledo City.");
          return;
        }
        setGpsLocation(pickedLocation.formattedLocation);
      } else {
        setMapVisible(true);
      }
    } catch (error) {
      if (error instanceof Error && error.message === "LOCATION_PERMISSION_DENIED") {
        Alert.alert("Permission needed", "Please allow location access to use GPS.");
        return;
      }

      Alert.alert("GPS error", "Could not fetch current location. Please try again.");
    } finally {
      setGpsLoading(false);
    }
  };

  const handleMapPress = (coordinate: Coordinate) => {
    setSelectedPin(coordinate);
  };

  const handleConfirmMapLocation = async () => {
    if (!selectedPin) {
      Alert.alert("Select location", "Tap on the map to choose your location.");
      return;
    }

    try {
      setGpsLoading(true);
      const pickedLocation = await getLocationFromCoordinates(
        selectedPin.latitude,
        selectedPin.longitude
      );
      if (pickedLocation.isOutsideToledo) {
        Alert.alert("Outside Toledo", "The selected location does not appear to be in Toledo City.");
        return;
      }

      setGpsLocation(pickedLocation.formattedLocation);
      setMapVisible(false);
    } catch {
      Alert.alert("GPS error", "Could not resolve selected map location.");
    } finally {
      setGpsLoading(false);
    }
  };

  const handlePickAttachment = async () => {
    if (attachments.length >= 2) {
      Alert.alert("Attachment limit", "Only 2 attachments are allowed.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const picked = result.assets[0];
      setAttachments((prev) => [
        ...prev,
        {
          uri: picked.uri,
          mimeType: picked.mimeType,
          fileName: picked.fileName,
        },
      ]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const trimmedCategory = category.trim();
    const trimmedIssue = issue.trim();
    const trimmedLocation = location.trim();
    const trimmedGpsLocation = gpsLocation.trim();
    const trimmedWaterMeter = waterMeter.trim();

    if (!trimmedCategory || !trimmedIssue || (!trimmedLocation && !trimmedGpsLocation)) {
      Alert.alert("Missing fields", "Please fill category, issue details, and either location or GPS.");
      return false;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Not signed in", "Please log in again before submitting a report.");
      return false;
    }

    try {
      setSubmitLoading(true);
      const reportId = `report-${Date.now()}`;
      const uploadedUrls: string[] = [];

      for (let i = 0; i < attachments.length; i += 1) {
        const attachment = attachments[i];
        const extension = getFileExtension(attachment);
        // Bucket is already "reports"; do not prefix object path with "reports/" again.
        const destinationPath = `${currentUser.uid}/${reportId}-${i}.${extension}`;

        const uploaded = await uploadFile(attachment.uri, destinationPath, {
          contentType: attachment.mimeType || getContentType(extension),
        });

        const uploadedPath =
          typeof uploaded?.path === "string" && uploaded.path.length > 0
            ? uploaded.path
            : destinationPath;

        const publicUrl = resolveUploadedFileUrl(uploadedPath, destinationPath);
        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.some((url) => !url || typeof url !== "string")) {
        throw new Error("One or more attachment URLs are invalid.");
      }

      const userDocRef = doc(db, "regular_user", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        Alert.alert("Profile missing", "Your user profile was not found. Please contact support.");
        return false;
      }

      const reportDocRef = doc(collection(db, "regular_user", currentUser.uid, "reports"), reportId);

      await setDoc(reportDocRef, {
        reportId,
        userId: currentUser.uid,
        category: trimmedCategory,
        issue: trimmedIssue,
        location: trimmedLocation || null,
        gpsLocation: trimmedGpsLocation || null,
        waterMeter: trimmedWaterMeter || null,
        attachments: uploadedUrls,
        submittedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
        status: "Pending",
      });

      await updateDoc(userDocRef, {
        lastReportAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setCategory("");
      setLocation("");
      setGpsLocation("");
      setIssue("");
      setWaterMeter("");
      setAttachments([]);
      setSelectedPin(null);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit report.";
      Alert.alert("Submit error", message);
      return false;
    } finally {
      setSubmitLoading(false);
    }
  };

  return {
    attachments,
    category,
    gpsLoading,
    gpsLocation,
    handleConfirmMapLocation,
    handleMapPress,
    handlePickAttachment,
    handleRemoveAttachment,
    handleSubmit,
    handleUseGps,
    issue,
    location,
    mapRegion,
    mapVisible,
    selectedPin,
    setCategory,
    setIssue,
    setLocation,
    setMapVisible,
    setWaterMeter,
    submitLoading,
    waterMeter,
  };
}
