import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../../firebaseConfig";

export type NotificationItem = {
  id: string;
  reportId: string;
  status: string;
  message: string;
  createdLabel: string;
};

const normalizeStatus = (value: unknown): string => {
  if (typeof value !== "string") {
    return "Pending";
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "resolved") return "Resolved";
  if (normalized === "submitted") return "Submitted";
  if (normalized === "pending") return "Pending";

  return "Pending";
};

const formatTimestampLabel = (value: unknown): string => {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString();
    }
  }

  const maybeTimestamp = value as Timestamp | undefined;
  if (maybeTimestamp && typeof maybeTimestamp.toDate === "function") {
    return maybeTimestamp.toDate().toLocaleString();
  }

  return "Date unavailable";
};

const buildMessage = (status: string, reportId: string) => {
  if (status === "Approved") {
    return `Your report #${reportId} has been approved.`;
  }

  if (status === "Rejected") {
    return `Your report #${reportId} has been rejected.`;
  }

  if (status === "Resolved") {
    return `Your report #${reportId} has been resolved.`;
  }

  if (status === "Submitted") {
    return `Your report #${reportId} was submitted successfully.`;
  }

  return `Your report #${reportId} is still pending.`;
};

const mapReportToNotification = (
  snap: QueryDocumentSnapshot<DocumentData>,
): NotificationItem => {
  const data = snap.data();
  const reportId =
    typeof data.reportId === "string" && data.reportId.length > 0
      ? data.reportId
      : snap.id;
  const status = normalizeStatus(data.status);

  return {
    id: snap.id,
    reportId,
    status,
    message: buildMessage(status, reportId),
    createdLabel: formatTimestampLabel(data.submittedAt ?? data.createdAt),
  };
};

export function useReportNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeReports: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (unsubscribeReports) {
        unsubscribeReports();
        unsubscribeReports = null;
      }

      if (!currentUser) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const reportsRef = collection(db, "regular_user", currentUser.uid, "reports");
      const reportsQuery = query(reportsRef, orderBy("createdAt", "desc"));

      unsubscribeReports = onSnapshot(
        reportsQuery,
        (snap) => {
          setItems(snap.docs.map(mapReportToNotification));
          setLoading(false);
        },
        () => {
          setItems([]);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeReports) {
        unsubscribeReports();
      }
    };
  }, []);

  const unreadCount = useMemo(
    () => items.filter((item) => item.status !== "Pending").length,
    [items],
  );

  return {
    items,
    loading,
    unreadCount,
  };
}
