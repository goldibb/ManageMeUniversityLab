import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";

const PRIORITY_COLORS = {
  low: "default" as const,
  medium: "warning" as const,
  high: "error" as const,
};

export default function NotificationList() {
  const { notifications, loading, markAsRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="notification-list" style={{ padding: "1rem", maxWidth: 800, margin: "0 auto" }}>
      <h2>Powiadomienia</h2>
      {loading && notifications.length === 0 && <p>Ładowanie…</p>}

      {notifications.length === 0 && !loading && (
        <p>Brak powiadomień.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => navigate(`/notifications/${n.id}`)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: n.seen ? "transparent" : "rgba(100,108,255,0.08)",
              cursor: "pointer",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: n.seen ? 400 : 600 }}>{n.title}</div>
              <div style={{ fontSize: "0.8rem", color: "gray", marginTop: 4 }}>
                {new Date(n.created).toLocaleString("pl-PL")}
              </div>
            </div>
            <Chip
              label={n.priority}
              color={PRIORITY_COLORS[n.priority]}
              size="small"
            />
            {!n.seen && (
              <Button
                variant="outlined"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  void markAsRead(n.id);
                }}
              >
                Oznacz jako przeczytane
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
