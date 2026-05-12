import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Notification } from "../types/notification";
import * as api from "../api/client";

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  currentDialog: Notification | null;
  dismissDialog: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDialog, setCurrentDialog] = useState<Notification | null>(null);
  const shownDialogIds = useRef<Set<number>>(new Set());
  const prevIds = useRef<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, count] = await Promise.all([
        api.fetchNotifications(),
        api.fetchUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);

      // Wykryj nowe powiadomienia (medium/high) do pokazania w dialogu
      const newNotifications = list.filter(
        (n) => !prevIds.current.has(n.id) && (n.priority === "medium" || n.priority === "high"),
      );
      if (newNotifications.length > 0) {
        const toShow = newNotifications.find(
          (n) => !shownDialogIds.current.has(n.id),
        );
        if (toShow) {
          shownDialogIds.current.add(toShow.id);
          setCurrentDialog(toShow);
        }
      }
      prevIds.current = new Set(list.map((n) => n.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd powiadomień");
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await api.markNotificationAsRead(id);
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Błąd oznaczania");
      }
    },
    [refresh],
  );

  const dismissDialog = useCallback(() => {
    setCurrentDialog(null);
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refresh,
        markAsRead,
        currentDialog,
        dismissDialog,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
