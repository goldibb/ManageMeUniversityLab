export default function PendingApprovalPage() {
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
    </div>
  );
}
