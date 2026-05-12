import { useNavigate } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useNotifications } from "../../context/NotificationContext";

export default function NotificationDialog() {
  const { currentDialog, dismissDialog } = useNotifications();
  const navigate = useNavigate();

  if (!currentDialog) return null;

  const handleOpenDetail = () => {
    dismissDialog();
    navigate(`/notifications/${currentDialog.id}`);
  };

  return (
    <Dialog open onClose={dismissDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Nowe powiadomienie</DialogTitle>
      <DialogContent>
        <p style={{ margin: 0, fontWeight: 600 }}>{currentDialog.title}</p>
        <p style={{ margin: "8px 0 0", fontSize: "0.875rem", color: "gray" }}>
          Priorytet: {currentDialog.priority}
        </p>
      </DialogContent>
      <DialogActions>
        <Button onClick={dismissDialog} color="inherit">
          Zamknij
        </Button>
        <Button onClick={handleOpenDetail} variant="contained">
          Zobacz szczegóły
        </Button>
      </DialogActions>
    </Dialog>
  );
}
