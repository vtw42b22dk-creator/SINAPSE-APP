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
        minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "flex-end",
        justifyContent: "flex-start", color: COLORS.faint, fontFamily: "'JetBrains Mono',monospace",
        letterSpacing: 2.2, fontSize: 11, padding: "0 0 48px 48px",
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
      minHeight: "100vh", background: COLORS.bg, color: COLORS.text,
      fontFamily: "'IBM Plex Sans',sans-serif", position: "relative", overflow: "hidden",
      display: "flex", alignItems: "stretch",
    }}>
      <style>{AUTH_CSS}</style>
      <p className="ag-mark" aria-hidden="true">SINAPSE</p>
      <form className="ag-form" onSubmit={submit}>
        <p className="ag-kicker">Sinapse</p>
        <h1 className="ag-title">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        <p className="ag-lead">
          Sincroniza calendário, tarefas, sinapses e diário entre dispositivos.
        </p>
        <label className="ag-field">
          <span>Email</span>
          <input value={email} onChange={function(e) { setEmail(e.target.value); }} type="email" required autoComplete="email" />
        </label>
        <label className="ag-field">
          <span>Password</span>
          <input value={password} onChange={function(e) { setPassword(e.target.value); }} type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </label>
        {error && (
          <p style={{ fontSize: 13, color: ok ? COLORS.positive : COLORS.negative, lineHeight: 1.5, margin: "0 0 20px" }}>{error}</p>
        )}
        <button disabled={busy} type="submit" className="ag-go">
          {busy ? "Aguarda…" : mode === "login" ? "Entrar" : "Criar conta"}
          <span aria-hidden="true"> →</span>
        </button>
        <button type="button" className="ag-switch" onClick={function() { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
          {mode === "login" ? "Ainda não tenho conta" : "Já tenho conta"}
        </button>
        {!auth.configured && (
          <p style={{ fontSize: 12, color: COLORS.warning, lineHeight: 1.5, marginTop: 28 }}>
            Supabase não está configurado no .env.
          </p>
        )}
      </form>
    </div>
  );
}

var AUTH_CSS = [
  ".ag-mark{position:absolute;left:-4%;bottom:-8%;margin:0;font-family:'JetBrains Mono',monospace;",
  "font-size:clamp(80px,22vw,280px);font-weight:300;letter-spacing:-0.08em;color:rgba(255,255,255,0.035);",
  "line-height:.75;pointer-events:none;user-select:none;white-space:nowrap}",
  ".ag-form{position:relative;z-index:1;width:min(420px,100%);margin:auto 0 auto clamp(28px,8vw,120px);",
  "padding:48px 24px 64px;animation:appearUp var(--dur-slow) var(--ease) both}",
  ".ag-kicker{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2.6px;text-transform:uppercase;",
  "color:#6E6E76;margin:0 0 28px}",
  ".ag-title{font-family:'JetBrains Mono',monospace;font-size:clamp(36px,6vw,52px);margin:0 0 12px;",
  "font-weight:300;letter-spacing:-0.05em;line-height:.95}",
  ".ag-lead{font-size:15px;color:#A0A0A8;line-height:1.65;margin:0 0 40px;max-width:34ch}",
  ".ag-field{display:block;margin:0 0 22px}",
  ".ag-field span{display:block;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.8px;",
  "text-transform:uppercase;color:#6E6E76;margin-bottom:8px}",
  ".ag-field input{width:100%;box-sizing:border-box;padding:10px 0 12px;border:none;border-bottom:1px solid rgba(255,255,255,0.14);",
  "background:transparent;color:#EDEDEF;outline:none;font-size:16px;font-family:inherit;border-radius:0}",
  ".ag-field input:focus{border-bottom-color:#EDEDEF}",
  ".ag-go{display:inline-flex;align-items:center;gap:8px;margin-top:12px;padding:10px 0;background:none;border:none;",
  "border-bottom:1px solid #EDEDEF;color:#EDEDEF;font-family:'JetBrains Mono',monospace;font-size:14px;",
  "font-weight:400;letter-spacing:.4px;cursor:pointer}",
  ".ag-go:hover{opacity:.7}",
  ".ag-switch{display:block;margin-top:28px;background:none;border:none;color:#6E6E76;font-size:13px;",
  "cursor:pointer;font-family:inherit;padding:0}",
  ".ag-switch:hover{color:#EDEDEF}",
  "@media(max-width:719px){.ag-form{margin:auto 20px 0;padding:36px 4px 80px}}",
].join("");
