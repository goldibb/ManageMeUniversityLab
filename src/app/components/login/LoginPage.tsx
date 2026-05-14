import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login, error } = useAuth();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: "1.5rem",
      }}
    >
      <h1>ManageMe</h1>
      <p>Zaloguj się przez Google, aby kontynuować.</p>
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : null}
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          if (credentialResponse.credential) {
            await login(credentialResponse.credential);
          }
        }}
        onError={() => {
          alert("Logowanie nie powiodło się");
        }}
      />
    </div>
  );
}
