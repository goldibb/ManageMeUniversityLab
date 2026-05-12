import { useNavigate } from "react-router-dom";
import Badge from "@mui/material/Badge";
import NotificationsIcon from "@mui/icons-material/Notifications";
import IconButton from "@mui/material/IconButton";
import { useNotifications } from "../../context/NotificationContext";

export default function NotificationBadge() {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  return (
    <IconButton
      color="inherit"
      onClick={() => navigate("/notifications")}
      aria-label="Powiadomienia"
    >
      <Badge badgeContent={unreadCount} color="error">
        <NotificationsIcon />
      </Badge>
    </IconButton>
  );
}
