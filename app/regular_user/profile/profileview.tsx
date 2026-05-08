import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { getPublicFileUrl, removeFile, uploadFile } from "../../../api/storage";
import ProfileComponent, {
  type ProfileViewModel,
} from "../../../components/profile/profilecomponent";
import { auth, db } from "../../../firebaseConfig";

interface RegularUserDoc {
  fullName?: string;
  address?: string;
  email?: string;
  profileImageUrl?: string;
  profileImagePath?: string;
}

export default function ProfileViewScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileViewModel | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profileImagePath, setProfileImagePath] = useState<string | null>(null);

  const avatarBucket = process.env.EXPO_PUBLIC_SUPABASE_AVATAR_BUCKET
    || process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET
    || "reports";
  const avatarFolder = process.env.EXPO_PUBLIC_SUPABASE_AVATAR_FOLDER || "users";

  const getFileExtension = (uri: string, mimeType?: string | null) => {
    const cleanUri = uri.split("?")[0];
    const parts = cleanUri.split(".");
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }

    const mime = (mimeType || "").toLowerCase();
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

  useEffect(() => {
    let isMounted = true;
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!currentUser) {
        if (isMounted) {
          setCurrentUserId(null);
          setProfileImagePath(null);
          router.replace("/login/login");
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setCurrentUserId(currentUser.uid);
        setError(null);
        setLoading(true);
      }

      const profileRef = doc(db, "regular_user", currentUser.uid);
      unsubscribeProfile = onSnapshot(
        profileRef,
        (profileSnap) => {
          if (!isMounted) {
            return;
          }

          if (!profileSnap.exists()) {
            setError("Profile not found.");
            setProfileImagePath(null);
            setProfile({
              fullName: "User",
              address: "No address",
              email: currentUser.email || "No email",
              profileImageUrl: null,
            });
            setLoading(false);
            return;
          }

          const data = profileSnap.data() as RegularUserDoc;
          setError(null);
          setProfileImagePath(typeof data.profileImagePath === "string" ? data.profileImagePath : null);
          setProfile({
            fullName: data.fullName || "User",
            address: data.address || "No address",
            email: data.email || currentUser.email || "No email",
            profileImageUrl:
              typeof data.profileImageUrl === "string" && data.profileImageUrl.length > 0
                ? data.profileImageUrl
                : null,
          });
          setLoading(false);
        },
        (profileError) => {
          if (!isMounted) {
            return;
          }

          console.error("Failed to subscribe to profile:", profileError);
          setError("Failed to load your profile.");
          setLoading(false);
        },
      );
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [router]);

  const handleChangeAvatar = async () => {
    if (!currentUserId) {
      Alert.alert("Not signed in", "Please sign in again before updating your profile picture.");
      return;
    }

    try {
      setUploadingAvatar(true);
      const userDocRef = doc(db, "regular_user", currentUserId);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission needed", "Please allow photo library access.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const selected = result.assets[0];
      const extension = getFileExtension(selected.uri, selected.mimeType);
      // Use a versioned object key so mobile image caches don't serve stale avatar bytes.
      const destinationPath = `${avatarFolder}/${currentUserId}/profile-image-${Date.now()}.${extension}`;

      const latestProfileSnap = await getDoc(userDocRef);
      const latestProfileData = latestProfileSnap.exists()
        ? (latestProfileSnap.data() as RegularUserDoc)
        : null;
      const previousPathFromDb =
        typeof latestProfileData?.profileImagePath === "string"
          ? latestProfileData.profileImagePath
          : null;

      const uploaded = await uploadFile(selected.uri, destinationPath, {
        bucket: avatarBucket,
        contentType: selected.mimeType || getContentType(extension),
        base64Data: selected.base64 || undefined,
      });

      const uploadedPath =
        typeof uploaded?.path === "string" && uploaded.path.length > 0
          ? uploaded.path
          : destinationPath;

      const publicUrl = getPublicFileUrl(uploadedPath, avatarBucket);
      if (!publicUrl) {
        throw new Error("Failed to resolve avatar URL.");
      }

      await updateDoc(userDocRef, {
        profileImageUrl: publicUrl,
        profileImagePath: uploadedPath,
        updatedAt: serverTimestamp(),
      });

      const previousPath = previousPathFromDb || profileImagePath;
      if (previousPath && previousPath !== uploadedPath) {
        try {
          await removeFile(previousPath, avatarBucket);
        } catch {
          // New avatar is already saved even if legacy file cleanup fails.
        }
      }

      setProfileImagePath(uploadedPath);
      setProfile((prev) => ({
        fullName: prev?.fullName || "User",
        address: prev?.address || "No address",
        email: prev?.email || "No email",
        profileImageUrl: publicUrl,
      }));
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Failed to upload profile picture.";
      Alert.alert("Upload error", message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <ProfileComponent
      profile={profile}
      loading={loading}
      error={error}
      uploadingAvatar={uploadingAvatar}
      onChangeAvatar={handleChangeAvatar}
      onBack={() => router.replace("/regular_user/home")}
    />
  );
}
