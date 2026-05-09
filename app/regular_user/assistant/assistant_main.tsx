import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { askAssistantQuestion } from "../../../lib/regular_user/assistant_api";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

export default function AssistantMainScreen() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I can help with PureDrop reports using local guidance.",
    },
  ]);
  const sendDisabled = useMemo(() => loading || input.trim().length === 0, [loading, input]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: "user",
        text: question,
      },
    ]);
    setInput("");
    setLoading(true);

    try {
      const answer = await askAssistantQuestion(question);

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: answer,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Assistant request failed.";
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/regular_user/home")}>
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Assistant</Text>
        <View style={styles.spacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 18 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.assistantBubble]}>
              <Text style={item.role === "user" ? styles.userText : styles.assistantText}>{item.text}</Text>
            </View>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about reports, status, GPS..."
            placeholderTextColor="#64748b"
            style={styles.input}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, sendDisabled && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={sendDisabled}
          >
            <Text style={styles.sendLabel}>{loading ? "..." : "Send"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5aa0f2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  backButton: {
    backgroundColor: "#1e40af",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backLabel: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 13,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  spacer: {
    width: 48,
  },
  body: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  chatList: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#1d4ed8",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#e2e8f0",
  },
  userText: {
    color: "#ffffff",
    fontSize: 13,
  },
  assistantText: {
    color: "#0f172a",
    fontSize: 13,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    minHeight: 42,
    paddingHorizontal: 10,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  sendButton: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2563eb",
  },
  sendButtonDisabled: {
    backgroundColor: "#93c5fd",
  },
  sendLabel: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
