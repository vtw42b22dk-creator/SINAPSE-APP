import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { COLORS } from "../lib/theme";

export default function AuthGate(props) {
  var auth = useAuth();
  var eS = useState("");
  var email = eS[0], setEmail = eS[1];
  var pS = useState("");
  var password = pS[0], setPassword = pS[1];
  var mS = useState("login");
  var mode = mS[0], setMode = mS[1];
  var errS = useState("");
  var error = errS[0], setError = errS[1];
  var busyS = useState(false);
  var busy = busyS[0], setBusy = busyS[1];

  if (auth && auth.loading) {
    return (
      <div style={{
        minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center",
        justifyContent: "center", color: COLORS.faint, fontFamily: "'JetBrains Mono',monospace",
        letterSpacing: 1.4, fontSize: 12,
      }}>
        A carregar
      </div>
    );
  }

  if (auth && auth.user) return props.children;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      var res = mode === "login" ? await auth.signIn(email, password) : await auth.signUp(email, password);
      if (res.error) setError(res.error.message);
      else if (mode === "signup") setError("Conta criada. Se o Supabase pedir confirmação, confirma o email antes de entrar.");
    } catch (ex) {
      setError(ex.message || "Não foi possível autenticar.");
    }
    setBusy(false);
  }

  var ok = error && error.indexOf("Conta criada") >= 0;

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24, color: COLORS.text, fontFamily: "'IBM Plex Sans',sans-serif",
    }}>
      <form onSubmit={submit} style={{
        width: "min(400px,94vw)", border: "1px solid " + COLORS.borderSoft, borderRadius: 20,
        background: COLORS.surface, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 64px rgba(0,0,0,0.5)",
        padding: "32px 28px 28px", animation: "appearUp var(--dur-slow) var(--ease) both",
      }}>
        <p style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: 2.2,
          color: COLORS.faint, margin: "0 0 18px", textTransform: "uppercase",
        }}>Sinapse</p>
        <h1 style={{
          fontFamily: "'JetBrains Mono',monospace", fontSize: 26, margin: "0 0 8px",
          fontWeight: 400, letterSpacing: -0.6,
        }}>{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        <p style={{ fontSize: 14, color: COLORS.muted, lineHeight: 1.65, margin: "0 0 26px" }}>
          Sincroniza calendário, tarefas, sinapses e diário entre dispositivos.
        </p>
        <input value={email} onChange={function(e) { setEmail(e.target.value); }} type="email" placeholder="Email" required style={fieldStyle()} />
        <input value={password} onChange={function(e) { setPassword(e.target.value); }} type="password" placeholder="Password" required minLength={6} style={fieldStyle()} />
        {error && (
          <p style={{ fontSize: 12.5, color: ok ? COLORS.positive : COLORS.negative, lineHeight: 1.5, margin: "0 0 12px" }}>{error}</p>
        )}
        <button disabled={busy} type="submit" style={{
          width: "100%", padding: "13px 14px", borderRadius: 12, border: "none",
          background: COLORS.text, color: COLORS.bg, fontFamily: "'JetBrains Mono',monospace",
          fontSize: 13, fontWeight: 500, cursor: busy ? "default" : "pointer", marginTop: 6,
        }}>
          {busy ? "Aguarda…" : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
        <button type="button" onClick={function() { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={{
          width: "100%", background: "none", border: "none", color: COLORS.faint, fontSize: 13,
          marginTop: 16, cursor: "pointer", fontFamily: "inherit",
        }}>
          {mode === "login" ? "Ainda não tenho conta" : "Já tenho conta"}
        </button>
        {!auth.configured && (
          <p style={{ fontSize: 12, color: COLORS.warning, lineHeight: 1.5, marginTop: 16 }}>
            Supabase não está configurado no .env.
          </p>
        )}
      </form>
    </div>
  );
}

function fieldStyle() {
  return {
    width: "100%", boxSizing: "border-box", padding: "13px 14px", borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)", background: "#0E0E10", color: "#EDEDEF",
    outline: "none", fontSize: 15, marginBottom: 10, fontFamily: "inherit",
  };
}
