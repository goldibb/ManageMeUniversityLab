import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

export default function LoginPage() {
  const { login, loginWithPassword, register, error } = useAuth();
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    setFormError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError("Wypełnij wszystkie pola");
      return;
    }
    setSubmitting(true);
    try {
      await loginWithPassword({ email: email.trim(), password });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Błąd logowania");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) {
      setFormError("Wypełnij wszystkie pola");
      return;
    }
    if (password.length < 6) {
      setFormError("Hasło musi mieć co najmniej 6 znaków");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Błąd rejestracji");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 2,
        px: 2,
      }}
    >
      <Typography variant="h3" component="h1">
        ManageMe
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Zaloguj się lub utwórz konto, aby kontynuować.
      </Typography>

      <Box sx={{ width: "100%", maxWidth: 360 }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label="Logowanie" />
          <Tab label="Rejestracja" />
        </Tabs>

        {(error || formError) && (
          <Typography color="error" sx={{ mb: 2 }}>
            {formError || error}
          </Typography>
        )}

        {tab === 0 && (
          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Hasło"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
            >
              {submitting ? "Logowanie…" : "Zaloguj się"}
            </Button>
          </Box>
        )}

        {tab === 1 && (
          <Box
            component="form"
            onSubmit={handleRegister}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              label="Imię"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Nazwisko"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Hasło"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              helperText="Minimum 6 znaków"
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
            >
              {submitting ? "Rejestracja…" : "Zarejestruj się"}
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 3 }}>lub</Divider>

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                await login(credentialResponse.credential);
              }
            }}
            onError={() => {
              alert("Logowanie przez Google nie powiodło się");
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
