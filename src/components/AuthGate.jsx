import { useEffect, useState } from "react";
import { emailLembrado, lembrarEmail, useAuth } from "../lib/AuthContext";
import { COLORS, MODULE_COLORS, moduleGlow, MODULE_GLOW_CSS } from "../lib/theme";
import { PageLoader } from "./PageLoader";

export default function AuthGate(props) {
  var auth = useAuth();
  var eS = useState(emailLembrado);
  var email = eS[0], setEmail = eS[1];
  var pS = useState("");
  var password = pS[0], setPassword = pS[1];
  var mS = useState("login");
  var mode = mS[0], setMode = mS[1];
  var errS = useState("");
  var error = errS[0], setError = errS[1];
  var busyS = useState(false);
  var busy = busyS[0], setBusy = busyS[1];
  var esperaS = useState(lerEspera);
  var esperaAte = esperaS[0], setEsperaAte = esperaS[1];
  var agoraS = useState(Date.now());
  var agora = agoraS[0], setAgora = agoraS[1];
  var falta = Math.max(0, Math.ceil((esperaAte - agora) / 1000));

  useEffect(function() {
    if (esperaAte <= Date.now()) return;
    var id = setInterval(function() { setAgora(Date.now()); }, 1000);
    return function() { clearInterval(id); };
  }, [esperaAte, setAgora]);

  if (auth && auth.loading) {
    return (
      <div style={{
        minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center",
        justifyContent: "center", position: "relative", overflow: "hidden",
        "--mc": MODULE_COLORS.auth,
      }}>
        <style>{MODULE_GLOW_CSS}</style>
        <div className="mod-glow" style={{ top: -80, right: "10%", background: moduleGlow(MODULE_COLORS.auth) }} aria-hidden="true" />
        <PageLoader accent={MODULE_COLORS.auth} label="Sinapse" />
      </div>
    );
  }

  if (auth && auth.user) return props.children;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (lerEspera() > Date.now()) {
        setEsperaAte(lerEspera());
        setError("O servidor ainda está a bloquear entradas. Espera o tempo do botão e carrega uma vez.");
        setBusy(false);
        return;
      }
      var res = mode === "login" ? await auth.signIn(email, password) : await auth.signUp(email, password);
      if (res.error) {
        var seg = segundosDeEspera(res.error.message);
        if (seg) {
          var ate = Date.now() + seg * 1000;
          try { localStorage.setItem(ESPERA_KEY, String(ate)); } catch (e) {}
          setEsperaAte(ate);
        }
        setError(erroLogin(res.error.message, seg));
      }
      else if (mode === "signup" && !(res.data && res.data.session)) {
        lembrarEmail(email);
        setMode("login");
        setError("Conta criada. Abre o email de confirmação (vê também o spam) e depois entra aqui com a mesma password.");
      } else {
        lembrarEmail(email);
      }
    } catch (ex) {
      setError(ex.message || "Não foi possível autenticar.");
    }
    setBusy(false);
  }

  var ok = error && error.indexOf("Conta criada") >= 0;

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg, color: COLORS.text,
      fontFamily: "'Manrope',sans-serif", position: "relative", overflow: "hidden",
      display: "flex", alignItems: "stretch", "--mc": MODULE_COLORS.auth,
    }}>
      <style>{AUTH_CSS + MODULE_GLOW_CSS}</style>
      <div className="mod-glow" style={{ top: -120, right: "5%", background: moduleGlow(MODULE_COLORS.auth) }} aria-hidden="true" />
      <div className="mod-glow" style={{ bottom: -80, left: "-5%", background: moduleGlow(MODULE_COLORS.journal, "14"), opacity: 0.4 }} aria-hidden="true" />
      <aside className="ag-aside" aria-hidden="true">
        <p className="ag-aside-k">Ecossistema</p>
        <p className="ag-aside-t">Sinapse</p>
        <p className="ag-aside-d">Calendário, tarefas, notas, foco e o resto — no mesmo sítio.</p>
      </aside>
      <form className="ag-form" onSubmit={submit}>
        <p className="ag-kicker">Conta</p>
        <h1 className="ag-title">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        <p className="ag-lead">
          Sincroniza calendário, tarefas, sinapses e notas entre dispositivos.
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
        <button disabled={busy || falta > 0} type="submit" className="ag-go">
          {falta > 0 ? ("Tenta em " + formatarEspera(falta)) : busy ? "Aguarda…" : mode === "login" ? "Entrar" : "Criar conta"}
          {falta > 0 ? null : <span aria-hidden="true"> →</span>}
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

var ESPERA_KEY = "sinapse-login-espera";

function lerEspera() {
  try { return Number(localStorage.getItem(ESPERA_KEY) || 0); } catch (e) { return 0; }
}

function segundosDeEspera(msg) {
  var texto = String(msg || "");
  var encontrado = texto.match(/(\d+)\s*second/i);
  if (encontrado) return Math.max(60, Number(encontrado[1]));
  if (/rate limit|too many requests|over_request/i.test(texto)) return 300;
  return 0;
}

function formatarEspera(seg) {
  var m = Math.floor(seg / 60);
  var s = seg % 60;
  if (m <= 0) return s + " s";
  return m + ":" + (s < 10 ? "0" : "") + s;
}

function erroLogin(msg, seg) {
  var texto = String(msg || "");
  if (/invalid login credentials/i.test(texto)) return "Email ou password errados.";
  if (/email not confirmed/i.test(texto)) return "A conta existe, mas o email ainda não foi confirmado. Abre o link que o Supabase enviou e entra outra vez.";
  if (/user already registered/i.test(texto)) return "Esta conta já existe. Entra com o email e a password.";
  if (seg) return "O servidor bloqueou entradas novas durante " + formatarEspera(seg) + ". Não carregues outra vez antes disso. No Chrome, recarrega a extensão 2.25.5 para ela deixar de pedir login sozinha.";
  return texto;
}

var AUTH_CSS = [
  ".ag-aside{position:relative;z-index:1;width:min(42vw,420px);flex-shrink:0;display:flex;flex-direction:column;justify-content:flex-end;",
  "padding:48px 36px 56px;border-right:1px solid rgba(255,255,255,.06);background:#09090B}",
  ".ag-aside-k{margin:0 0 16px;font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:2.4px;text-transform:uppercase;color:#6E6A64}",
  ".ag-aside-t{margin:0;font-family:'Syne',sans-serif;font-size:clamp(40px,5vw,64px);font-weight:700;letter-spacing:-.06em;line-height:.9}",
  ".ag-aside-d{margin:18px 0 0;max-width:28ch;font-size:15px;line-height:1.55;color:#A0988C}",
  ".ag-form{position:relative;z-index:1;width:min(420px,100%);margin:auto 0 auto clamp(28px,6vw,80px);",
  "padding:48px 24px 64px;animation:appearUp var(--dur-slow) var(--ease) both}",
  ".ag-kicker{font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:2.6px;text-transform:uppercase;",
  "color:var(--mc);margin:0 0 28px}",
  ".ag-title{font-family:'Syne',sans-serif;font-size:clamp(36px,6vw,52px);margin:0 0 12px;",
  "font-weight:700;letter-spacing:-0.05em;line-height:.95}",
  ".ag-lead{font-size:15px;color:#A0988C;line-height:1.65;margin:0 0 40px;max-width:34ch}",
  ".ag-field{display:block;margin:0 0 22px}",
  ".ag-field span{display:block;font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:1.8px;",
  "text-transform:uppercase;color:#6E6A64;margin-bottom:8px}",
  ".ag-field input{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid rgba(255,255,255,0.12);",
  "background:rgba(255,255,255,0.03);color:#EDE8DF;outline:none;font-size:16px;font-family:inherit;border-radius:var(--radius-sm)}",
  ".ag-field input:focus{border-color:var(--mc);background:rgba(255,255,255,0.05)}",
  ".ag-go{display:inline-flex;align-items:center;gap:8px;margin-top:12px;padding:11px 20px;background:color-mix(in srgb,var(--mc) 10%,transparent);border:1px solid color-mix(in srgb,var(--mc) 40%,transparent);color:var(--mc);font-family:'Manrope',sans-serif;font-size:14px;",
  "font-weight:400;letter-spacing:.4px;cursor:pointer;transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".ag-go:hover{background:color-mix(in srgb,var(--mc) 16%,transparent)}",
  ".ag-switch{display:block;margin-top:28px;background:none;border:none;color:#6E6A64;font-size:13px;",
  "cursor:pointer;font-family:inherit;padding:8px 12px}",
  ".ag-switch:hover{color:#EDE8DF}",
  "@media(max-width:719px){.ag-aside{display:none}.ag-form{margin:auto 20px 0;padding:36px 4px 80px}}",
].join("");
