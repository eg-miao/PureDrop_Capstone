import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { auth } from "../../firebaseConfig";

export default function RegularUserLayout() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/login/login");
      }
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, [router]);

  if (!authChecked) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1e88e5" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="home-outline"
              size={26}
              color="#1e88e5"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="notifications-outline"
              size={26}
              color="#1e88e5"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: () => (
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.avatar}
            />
          ),
        }}
      />

      {/* Hidden routes (still navigable) */}
      <Tabs.Screen name="report" options={{ href: null }} />
      <Tabs.Screen
        name="create_report/submitted"
        options={{ href: null, tabBarStyle: { display: "none" } }}
      />
      <Tabs.Screen name="view-reports" options={{ href: null }} />
      <Tabs.Screen name="create_report/createreport" options={{ href: null }} />
      <Tabs.Screen name="profile/profileview" options={{ href: null }} />
      <Tabs.Screen name="reports-list" options={{ href: null }} />
      <Tabs.Screen name="view_reportuser" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="directory" options={{ href: null }} />
      <Tabs.Screen name="about" options={{ href: null }} />
      <Tabs.Screen
        name="signout"
        options={{ href: null, tabBarStyle: { display: "none" } }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 65,
    backgroundColor: "#e0f2fe",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,

    // 🔥 IMPORTANT FIXES
    position: "absolute",
    paddingBottom: 8,
    paddingTop: 8,
    paddingHorizontal: 10,
  },

  tabItem: {
    justifyContent: "center",
    alignItems: "center",
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0f2fe",
  },
});
