import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const getSingleParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
};

export default function AttachmentLightboxUserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    uri?: string | string[];
    reportId?: string | string[];
    userId?: string | string[];
    index?: string | string[];
  }>();

  const imageUri = getSingleParam(params.uri);
  const reportId = getSingleParam(params.reportId);
  const userId = getSingleParam(params.userId);
  const index = getSingleParam(params.index);

  const handleClose = () => {
    if (reportId) {
      router.replace({
        pathname: "/regular_user/view_reportuser",
        params: userId ? { reportId, userId } : { reportId },
      });
      return;
    }
    router.back();
  };

  const headerText =
    reportId && index
      ? `Attachment ${index} | Report ${reportId}`
      : index
        ? `Attachment ${index}`
        : "Attachment Preview";

  if (!imageUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={handleClose} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Attachment URL is missing.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={handleClose} activeOpacity={0.85}>
          <Ionicons name="close" size={25} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerText} numberOfLines={1}>
          {headerText}
        </Text>
      </View>

      <View style={styles.imageWrap}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerText: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
  },
  imageWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  emptyText: {
    color: "#ffffff",
    fontSize: 16,
  },
});
