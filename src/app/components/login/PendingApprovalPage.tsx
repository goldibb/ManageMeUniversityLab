import { useAuth } from "../../context/AuthContext";

export default function PendingApprovalPage() {
  const { logout } = useAuth();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1>Oczekiwanie na zatwierdzenie</h1>
      <p>Twoje konto oczekuje na akceptację przez administratora.</p>
      <p style={{ color: "gray" }}>
        Masz dostęp jedynie do tego widoku. Po zatwierdzeniu otrzymasz pełen
        dostęp do aplikacji.
      </p>
      <button
        onClick={() => void logout()}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}
      >
        Wyloguj
      </button>
    </div>
  );
}
