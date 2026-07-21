import { useCallback, useEffect, useRef } from "react";
import {
  Keyboard,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";

export type CreateReportFieldKey = "issue" | "waterMeter" | "location";

const isMobile = Platform.OS !== "web";
const inputScrollOffset = 120;
const keyboardFollowDelayMs = 250;
const nextFieldByField: Partial<Record<CreateReportFieldKey, CreateReportFieldKey>> = {
  issue: "waterMeter",
  waterMeter: "location",
};

export function useCreateReportKeyboardScroll() {
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<Partial<Record<CreateReportFieldKey, TextInput | null>>>({});
  const currentScrollYRef = useRef(0);
  const fieldYRef = useRef<Partial<Record<CreateReportFieldKey, number>>>({});
  const activeFieldRef = useRef<CreateReportFieldKey | null>(null);
  const returnYRef = useRef(0);
  const userScrolledRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearScrollTimeout = useCallback((): void => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, []);

  const createReportInputRef = useCallback(
    (field: CreateReportFieldKey) =>
      (input: TextInput | null): void => {
        inputRef.current[field] = input;
      },
    [],
  );

  const scrollActiveFieldAboveKeyboard = useCallback((): void => {
    const activeField = activeFieldRef.current;

    if (!activeField) {
      return;
    }

    const fieldY = fieldYRef.current[activeField] ?? 0;
    const targetY = Math.max(fieldY - inputScrollOffset, 0);

    scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
  }, []);

  const followFocusedField = useCallback(
    (field: CreateReportFieldKey): void => {
      if (!isMobile) {
        return;
      }

      const previousActiveField = activeFieldRef.current;

      if (!previousActiveField) {
        returnYRef.current = currentScrollYRef.current;
      }

      if (previousActiveField !== field) {
        activeFieldRef.current = field;
        userScrolledRef.current = false;
      }

      clearScrollTimeout();

      scrollTimeoutRef.current = setTimeout(() => {
        if (activeFieldRef.current === field && !userScrolledRef.current) {
          scrollActiveFieldAboveKeyboard();
        }
      }, keyboardFollowDelayMs);
    },
    [clearScrollTimeout, scrollActiveFieldAboveKeyboard],
  );

  const restoreScrollPosition = useCallback((): void => {
    clearScrollTimeout();

    if (!activeFieldRef.current) {
      return;
    }

    activeFieldRef.current = null;

    if (userScrolledRef.current) {
      userScrolledRef.current = false;
      return;
    }

    scrollViewRef.current?.scrollTo({
      y: returnYRef.current,
      animated: true,
    });
  }, [clearScrollTimeout]);

  const createReportFieldLayout = useCallback(
    (field: CreateReportFieldKey) =>
      (event: LayoutChangeEvent): void => {
        fieldYRef.current[field] = event.nativeEvent.layout.y;
      },
    [],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
      currentScrollYRef.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  const handleScrollBeginDrag = useCallback((): void => {
    if (activeFieldRef.current) {
      userScrolledRef.current = true;
      clearScrollTimeout();
    }
  }, [clearScrollTimeout]);

  const focusNextField = useCallback((field: CreateReportFieldKey): void => {
    const nextField = nextFieldByField[field];

    if (!nextField) {
      Keyboard.dismiss();
      return;
    }

    inputRef.current[nextField]?.focus();
  }, []);

  useEffect(() => {
    if (!isMobile) {
      return undefined;
    }

    const keyboardShowSubscription = Keyboard.addListener("keyboardDidShow", () => {
      if (activeFieldRef.current && !userScrolledRef.current) {
        scrollActiveFieldAboveKeyboard();
      }
    });
    const keyboardHideSubscription = Keyboard.addListener(
      "keyboardDidHide",
      restoreScrollPosition,
    );

    return () => {
      keyboardShowSubscription.remove();
      keyboardHideSubscription.remove();
      clearScrollTimeout();
    };
  }, [clearScrollTimeout, restoreScrollPosition, scrollActiveFieldAboveKeyboard]);

  return {
    scrollViewRef,
    createReportInputRef,
    createReportFieldLayout,
    followFocusedField,
    focusNextField,
    handleScroll,
    handleScrollBeginDrag,
  };
}
