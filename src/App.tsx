import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useState } from "react";
import Board from "./app/components/board/board";
import NotificationList from "./app/components/notifications/NotificationList";
import NotificationDetail from "./app/components/notifications/NotificationDetail";
import NotificationBadge from "./app/components/notifications/NotificationBadge";
import NotificationDialog from "./app/components/notifications/NotificationDialog";
import LoginPage from "./app/components/login/LoginPage";
import PendingApprovalPage from "./app/components/login/PendingApprovalPage";
import UsersList from "./app/components/users/UsersList";
import {
  ActiveProjectProvider,
  useActiveProject,
} from "./app/context/ActiveProjectContext";
import { useThemeMode } from "./app/context/ThemeModeContext";
import { useAuth } from "./app/context/AuthContext";
import { styled } from "@mui/material/styles";
import Switch from "@mui/material/Switch";
import Button from "@mui/material/Button";
import * as api from "./app/api/client";
import "./App.css";

const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    transform: "translateX(6px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(22px)",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          "#fff",
        )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: "#aab4be",
        ...theme.applyStyles("dark", {
          backgroundColor: "#8796A5",
        }),
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: "#001e3c",
    width: 32,
    height: 32,
    "&::before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
        "#fff",
      )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
    },
    ...theme.applyStyles("dark", {
      backgroundColor: "#003892",
    }),
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    backgroundColor: "#aab4be",
    borderRadius: 20 / 2,
    ...theme.applyStyles("dark", {
      backgroundColor: "#8796A5",
    }),
  },
}));

function AppHeader() {
  const { user, logout, isAdmin } = useAuth();
  const { projects, activeProjectId, setActiveProject, loading, error, refresh } =
    useActiveProject();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const handleCreateProject = async () => {
    const name = window.prompt("Nazwa nowego projektu:");
    if (!name || !name.trim()) return;
    setCreating(true);
    try {
      await api.createProject(name.trim());
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Błąd tworzenia projektu");
    } finally {
      setCreating(false);
    }
  };

  const handleEditProject = async () => {
    if (activeProjectId == null) return;
    const current = projects.find((p) => p.id === activeProjectId);
    const name = window.prompt(
      "Nowa nazwa projektu:",
      current?.name ?? "",
    );
    if (!name || !name.trim()) return;
    setCreating(true);
    try {
      await api.updateProject(activeProjectId, name.trim());
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Błąd edycji projektu");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async () => {
    if (activeProjectId == null) return;
    if (!window.confirm("Czy na pewno usunąć ten projekt?")) return;
    setCreating(true);
    try {
      await api.deleteProject(activeProjectId);
      await setActiveProject(null);
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Błąd usuwania projektu");
    } finally {
      setCreating(false);
    }
  };

  return (
    <header className="app-header">
      <span className="app-header__user">
        {user ? `${user.firstName} ${user.lastName} (${user.email})` : "Gość"}
      </span>
      <nav
        className="app-header__nav"
        style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
      >
        <Button color="inherit" onClick={() => navigate("/")}>
          Board
        </Button>
        <Button color="inherit" onClick={() => navigate("/notifications")}>
          Powiadomienia
        </Button>
        {isAdmin && (
          <Button color="inherit" onClick={() => navigate("/users")}>
            Użytkownicy
          </Button>
        )}
      </nav>
      <label className="app-header__project-label">
        <select
          value={activeProjectId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            void setActiveProject(v === "" ? null : Number(v));
          }}
          disabled={loading}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <Button
        variant="outlined"
        size="small"
        onClick={() => void handleCreateProject()}
        disabled={creating || loading}
      >
        + Nowy projekt
      </Button>
      {activeProjectId != null && (
        <>
          <Button
            variant="outlined"
            size="small"
            onClick={() => void handleEditProject()}
            disabled={creating || loading}
          >
            Edytuj
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={() => void handleDeleteProject()}
            disabled={creating || loading}
          >
            Usuń
          </Button>
        </>
      )}
      {error ? <span className="app-header__error">{error}</span> : null}
      <NotificationBadge />
      <Button
        variant="outlined"
        size="small"
        color="inherit"
        onClick={logout}
      >
        Wyloguj
      </Button>
      <ThemeToggle />
    </header>
  );
}

function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();
  return (
    <div className="app-header__theme-toggle">
      <MaterialUISwitch checked={mode === "light"} onChange={toggleMode} />
    </div>
  );
}

function AppRoutes() {
  const { user, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>Ładowanie…</div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (user.blocked) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h1>Konto zablokowane</h1>
        <p>Skontaktuj się z administratorem.</p>
      </div>
    );
  }

  if (isGuest) {
    return <PendingApprovalPage />;
  }

  return (
    <ActiveProjectProvider>
      <div className="app-shell">
        <AppHeader />
        <main>
          <Routes>
            <Route path="/" element={<Board />} />
            <Route path="/notifications" element={<NotificationList />} />
            <Route path="/notifications/:id" element={<NotificationDetail />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <NotificationDialog />
      </div>
    </ActiveProjectProvider>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;
