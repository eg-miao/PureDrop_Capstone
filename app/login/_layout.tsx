import { Stack } from "expo-router";

export default function LoginLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="address_select"
        options={{
          headerShown: true,
          title: "Address",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
