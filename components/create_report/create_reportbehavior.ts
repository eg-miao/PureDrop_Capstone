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
export type CreateReportSectionKey = "details" | "location";

const isMobile = Platform.OS !== "web";
const inputScrollOffset = 120;
const keyboardFollowDelayMs = 250;
const nextFieldFollowDelayMs = 80;
const nextFieldByField: Partial<Record<CreateReportFieldKey, CreateReportFieldKey>> = {
  issue: "waterMeter",
  waterMeter: "location",
};
const sectionByField: Record<CreateReportFieldKey, CreateReportSectionKey> = {
  issue: "details",
  waterMeter: "details",
  location: "location",
};

export function useCreateReportKeyboardScroll() {
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<Partial<Record<CreateReportFieldKey, TextInput | null>>>({});
  const currentScrollYRef = useRef(0);
  const sectionYRef = useRef<Partial<Record<CreateReportSectionKey, number>>>({});
  const fieldLocalYRef = useRef<Partial<Record<CreateReportFieldKey, number>>>({});
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

  const activateField = useCallback((field: CreateReportFieldKey): void => {
    const previousActiveField = activeFieldRef.current;

    if (!previousActiveField) {
      returnYRef.current = currentScrollYRef.current;
    }

    if (previousActiveField !== field) {
      activeFieldRef.current = field;
      userScrolledRef.current = false;
    }
  }, []);

  const updateFieldContentY = useCallback((field: CreateReportFieldKey): void => {
    const fieldLocalY = fieldLocalYRef.current[field];

    if (fieldLocalY === undefined) {
      return;
    }

    const section = sectionByField[field];
    const sectionY = sectionYRef.current[section] ?? 0;

    fieldYRef.current[field] = sectionY + fieldLocalY;
  }, []);

  const scrollFieldAboveKeyboard = useCallback((field: CreateReportFieldKey): void => {
    const fieldY = fieldYRef.current[field] ?? 0;
    const targetY = Math.max(fieldY - inputScrollOffset, 0);

    scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
  }, []);

  const scrollActiveFieldAboveKeyboard = useCallback((): void => {
    const activeField = activeFieldRef.current;

    if (activeField) {
      scrollFieldAboveKeyboard(activeField);
    }
  }, [scrollFieldAboveKeyboard]);

  const followFocusedField = useCallback(
    (field: CreateReportFieldKey): void => {
      activateField(field);

      clearScrollTimeout();

      scrollTimeoutRef.current = setTimeout(() => {
        if (activeFieldRef.current === field && !userScrolledRef.current) {
          scrollActiveFieldAboveKeyboard();
        }
      }, keyboardFollowDelayMs);
    },
    [activateField, clearScrollTimeout, scrollActiveFieldAboveKeyboard],
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
        fieldLocalYRef.current[field] = event.nativeEvent.layout.y;
        updateFieldContentY(field);
      },
    [updateFieldContentY],
  );

  const createReportSectionLayout = useCallback(
    (section: CreateReportSectionKey) =>
      (event: LayoutChangeEvent): void => {
        sectionYRef.current[section] = event.nativeEvent.layout.y;

        (Object.keys(sectionByField) as CreateReportFieldKey[]).forEach((field) => {
          if (sectionByField[field] === section) {
            updateFieldContentY(field);
          }
        });
      },
    [updateFieldContentY],
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

  const focusNextField = useCallback(
    (field: CreateReportFieldKey): void => {
      const nextField = nextFieldByField[field];

      if (!nextField) {
        clearScrollTimeout();
        activeFieldRef.current = null;
        userScrolledRef.current = false;
        Keyboard.dismiss();
        return;
      }

      const nextInput = inputRef.current[nextField];

      if (!nextInput) {
        return;
      }

      activateField(nextField);
      nextInput.focus();

      clearScrollTimeout();
      scrollTimeoutRef.current = setTimeout(() => {
        if (activeFieldRef.current === nextField && !userScrolledRef.current) {
          scrollActiveFieldAboveKeyboard();
        }
      }, nextFieldFollowDelayMs);
    },
    [activateField, clearScrollTimeout, scrollActiveFieldAboveKeyboard],
  );

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
    createReportSectionLayout,
    followFocusedField,
    focusNextField,
    handleScroll,
    handleScrollBeginDrag,
  };
}
