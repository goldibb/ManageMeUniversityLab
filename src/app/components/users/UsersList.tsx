import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../api/client";
import type { User, UserRole } from "../../types/project";

const ROLES: UserRole[] = ["guest", "developer", "devops", "admin"];

export default function UsersList() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.fetchAllUsers();
      setUsers(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    void load();
  }, [isAdmin, navigate]);

  const handleRoleChange = async (id: number, role: UserRole) => {
    try {
      await api.updateUserRole(id, role);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd zmiany roli");
    }
  };

  const handleBlock = async (id: number, blocked: boolean) => {
    try {
      await api.setUserBlocked(id, blocked);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd blokady");
    }
  };

  if (!isAdmin) return null;

  return (
    <div style={{ padding: "1rem", maxWidth: 1200, margin: "0 auto" }}>
      <h2>Użytkownicy</h2>
      {loading && users.length === 0 && <p>Ładowanie…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
            <th style={{ padding: "0.5rem" }}>ID</th>
            <th style={{ padding: "0.5rem" }}>Email</th>
            <th style={{ padding: "0.5rem" }}>Imię</th>
            <th style={{ padding: "0.5rem" }}>Nazwisko</th>
            <th style={{ padding: "0.5rem" }}>Rola</th>
            <th style={{ padding: "0.5rem" }}>Status</th>
            <th style={{ padding: "0.5rem" }}>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.5rem" }}>{u.id}</td>
              <td style={{ padding: "0.5rem" }}>{u.email}</td>
              <td style={{ padding: "0.5rem" }}>{u.firstName}</td>
              <td style={{ padding: "0.5rem" }}>{u.lastName}</td>
              <td style={{ padding: "0.5rem" }}>
                <FormControl size="small" variant="standard">
                  <Select
                    value={u.role}
                    onChange={(e) =>
                      void handleRoleChange(u.id, e.target.value as UserRole)
                    }
                    disabled={loading}
                  >
                    {ROLES.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </td>
              <td style={{ padding: "0.5rem" }}>
                {u.blocked ? (
                  <Chip label="Zablokowany" color="error" size="small" />
                ) : (
                  <Chip label="Aktywny" color="success" size="small" />
                )}
              </td>
              <td style={{ padding: "0.5rem" }}>
                {u.blocked ? (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => void handleBlock(u.id, false)}
                    disabled={loading}
                  >
                    Odblokuj
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => void handleBlock(u.id, true)}
                    disabled={loading}
                  >
                    Zablokuj
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && !loading && <p>Brak użytkowników.</p>}
    </div>
  );
}
