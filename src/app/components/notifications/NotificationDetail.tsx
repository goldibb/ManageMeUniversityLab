import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { useNotifications } from "../../context/NotificationContext";

const PRIORITY_COLORS = {
  low: "default" as const,
  medium: "warning" as const,
  high: "error" as const,
};

export default function NotificationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notifications, markAsRead } = useNotifications();

  const notification = notifications.find((n) => n.id === Number(id));

  useEffect(() => {
    if (notification && !notification.seen) {
      void markAsRead(notification.id);
    }
  }, [notification, markAsRead]);

  if (!notification) {
    return (
      <div style={{ padding: "1rem", maxWidth: 800, margin: "0 auto" }}>
        <h2>Powiadomienie nie zostało znalezione.</h2>
        <Button variant="contained" onClick={() => navigate("/notifications")}>
          Wróć do listy
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem", maxWidth: 800, margin: "0 auto" }}>
      <Button
        variant="text"
        onClick={() => navigate("/notifications")}
        style={{ marginBottom: "1rem" }}
      >
        ← Wróć do listy
      </Button>
      <h2 style={{ marginTop: 0 }}>{notification.title}</h2>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
        <Chip
          label={notification.priority}
          color={PRIORITY_COLORS[notification.priority]}
        />
        <span style={{ color: "gray", fontSize: "0.9rem" }}>
          {new Date(notification.created).toLocaleString("pl-PL")}
        </span>
        <Chip
          label={notification.seen ? "Przeczytane" : "Nieprzeczytane"}
          color={notification.seen ? "success" : "default"}
          size="small"
        />
      </div>
      {!notification.seen && (
        <Button
          variant="contained"
          onClick={() => void markAsRead(notification.id)}
        >
          Oznacz jako przeczytane
        </Button>
      )}
    </div>
  );
}
