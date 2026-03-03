import { onAuthStateChanged } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { auth, db } from "../../../firebaseConfig";

const USERS_COLLECTION = "regular_user";
const ACTIVE_STATUS = "Active";
const INACTIVE_STATUS = "Inactive";

const writePresence = async (uid: string, status: string, source: string): Promise<void> => {
  const isActive = status === ACTIVE_STATUS;

  await setDoc(
    doc(db, USERS_COLLECTION, uid),
    {
      uid,
      status,
      presenceStatus: status,
      presenceSource: source,
      presenceUpdatedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      ...(isActive ? { lastActiveAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export async function markCurrentUserActive(source = "manual"): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return;
  }
  await writePresence(uid, ACTIVE_STATUS, source);
}

export async function markUserActiveByUid(uid: string, source = "manual"): Promise<void> {
  if (!uid) {
    return;
  }
  await writePresence(uid, ACTIVE_STATUS, source);
}

export async function markCurrentUserInactive(source = "manual"): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return;
  }
  await writePresence(uid, INACTIVE_STATUS, source);
}

export default function RegularUserPresenceSync() {
  const currentUidRef = useRef<string | null>(auth.currentUser?.uid ?? null);
  const lastStatusRef = useRef<string>("");

  const writeIfChanged = (status: string, source: string): void => {
    const uid = currentUidRef.current || auth.currentUser?.uid || null;
    if (!uid) {
      return;
    }
    if (lastStatusRef.current === status) {
      return;
    }

    lastStatusRef.current = status;
    void writePresence(uid, status, source);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      currentUidRef.current = currentUser?.uid ?? null;

      if (!currentUser) {
        lastStatusRef.current = "";
        return;
      }

      writeIfChanged(ACTIVE_STATUS, "auth_state_change");
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        writeIfChanged(ACTIVE_STATUS, "app_state_active");
        return;
      }

      writeIfChanged(INACTIVE_STATUS, "app_state_background");
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
