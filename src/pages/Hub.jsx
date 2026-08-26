import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { ProjectsIcon } from "./Projects";
import { COLORS } from "../lib/theme";

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="10" width="36" height="32" rx="0" stroke="currentColor" strokeWidth="2"/>
      <line x1="6" y1="20" x2="42" y2="20" stroke="currentColor" strokeWidth="2"/>
      <line x1="16" y1="6" x2="16" y2="14" stroke="currentColor" strokeWidth="2"/>
      <line x1="32" y1="6" x2="32" y2="14" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
      <path d="M14 24 L21 31 L36 14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" strokeLinejoin="miter"/>
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
      <path d="M14 12H34L32 30H16L14 12Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M18 36H20M28 36H30" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
    </svg>
  );
}

function FinanceIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
      <path d="M10 34 L20 22 L28 28 L38 14" stroke="currentColor" strokeWidth="2"/>
      <path d="M30 14H38V22" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
      <path d="M12 8H36V40H12Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M18 16H30M18 24H30M18 32H26" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  );
}

function FocusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="26" r="14" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 26 L24 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
      <path d="M18 8H30" stroke="currentColor" strokeWidth="2.4"/>
    </svg>
  );
}

var MODULES = [
  { id: "calendar", name: "Calendário", desc: "Visualiza e organiza o teu tempo", Icon: CalendarIcon, path: "/calendar" },
  { id: "focus", name: "Estúdio de Foco", desc: "Sessões de estudo, ideias e métricas diárias", Icon: FocusIcon, path: "/focus" },
  { id: "tasks", name: "Tarefas", desc: "Captura, prioriza, conquista", Icon: TasksIcon, path: "/tasks" },
  { id: "journal", name: "Diário", desc: "Blocos de escrita para tudo o que vem à cabeça", Icon: JournalIcon, path: "/journal" },
  { id: "projects", name: "Projetos", desc: "Workspaces modulares com finanças, notas e sinapses", Icon: ProjectsIcon, path: "/projects" },
  { id: "wishlist", name: "Wishlist", desc: "Lista o que queres comprar ou fazer", Icon: WishlistIcon, path: "/wishlist" },
  { id: "finance", name: "Financeiro", desc: "Gastos, recursos e orçamento mensal", Icon: FinanceIcon, path: "/finance" },
];

var HUB_CSS = [
  "@keyframes hubIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}",
  ".hub-in{animation:hubIn var(--dur-slow) var(--ease) both}",
  ".hub-mark{position:absolute;right:-4%;top:8%;font-family:'JetBrains Mono',monospace;font-size:clamp(72px,18vw,220px);",
  "font-weight:300;letter-spacing:-0.08em;color:rgba(255,255,255,0.03);line-height:.8;pointer-events:none;user-select:none;",
  "writing-mode:horizontal-tb;transform:rotate(-12deg);white-space:nowrap}",
  ".hub-sec{font-size:10px;letter-spacing:2.4px;text-transform:uppercase;color:" + COLORS.faint + ";font-family:'JetBrains Mono',monospace}",
  ".hub-colon{display:inline-block;animation:blinkSoft 2s steps(1) infinite;margin:0 1px;color:" + COLORS.faint + "}",
  ".hub-rule{height:1px;background:linear-gradient(90deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04) 70%,transparent)}",
  ".hub-out{background:none;border:none;border-bottom:1px solid rgba(255,255,255,0.18);color:" + COLORS.faint + ";",
  "font-size:11px;letter-spacing:1.6px;text-transform:uppercase;padding:6px 0;cursor:pointer;font-family:'JetBrains Mono',monospace}",
  ".hub-out:hover{color:" + COLORS.text + ";border-bottom-color:" + COLORS.text + "}",
  ".hub-row{position:relative;display:grid;grid-template-columns:48px 22px 1fr auto;align-items:center;gap:16px;",
  "width:100%;text-align:left;padding:22px 0;background:none;border:none;border-bottom:1px solid rgba(255,255,255,0.07);",
  "color:" + COLORS.muted + ";cursor:pointer;font-family:inherit;overflow:visible}",
  ".hub-row::before{content:'';position:absolute;left:0;bottom:-1px;height:1px;width:0;background:" + COLORS.text + ";",
  "transition:width var(--dur) var(--ease)}",
  ".hub-row:hover::before,.hub-row:focus-visible::before{width:100%}",
  ".hub-row:hover{color:" + COLORS.text + "}",
  ".hub-idx{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:1.4px;color:" + COLORS.faint + ";",
  "transition:color var(--dur) var(--ease),transform var(--dur) var(--ease)}",
  ".hub-row:hover .hub-idx{color:" + COLORS.text + ";transform:translateX(2px)}",
  ".hub-row svg{width:18px;height:18px;opacity:.4;transition:opacity var(--dur) var(--ease)}",
  ".hub-row:hover svg{opacity:1}",
  ".hub-row h2{margin:0;font-family:'JetBrains Mono',monospace;font-size:clamp(18px,2.4vw,26px);font-weight:400;",
  "letter-spacing:-0.03em;color:" + COLORS.text + ";line-height:1.15}",
  ".hub-row p{margin:6px 0 0;font-size:13px;line-height:1.5;color:" + COLORS.faint + ";max-width:42ch}",
  ".hub-go{font-size:18px;color:" + COLORS.faint + ";opacity:0;transform:translateX(-10px);",
  "transition:opacity var(--dur) var(--ease),transform var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".hub-row:hover .hub-go{opacity:1;transform:none;color:" + COLORS.text + "}",
  "@media(max-width:719px){",
  ".hub-row{grid-template-columns:36px 1fr auto;gap:12px;padding:20px 0}",
  ".hub-row svg{display:none}",
  ".hub-row h2{font-size:20px}",
  ".hub-go{opacity:.35;transform:none}",
  "}",
].join("");

function ModuleRow(props) {
  var mod = props.module;
  var n = String(props.index + 1).padStart(2, "0");
  return (
    <button className="hub-row" onClick={function() { if (mod.path) props.onClick(mod); }}>
      <span className="hub-idx">{n}</span>
      <mod.Icon />
      <span style={{ minWidth: 0 }}>
        <h2>{mod.name}</h2>
        <p>{mod.path ? mod.desc : "Em breve"}</p>
      </span>
      <span className="hub-go" aria-hidden="true">→</span>
    </button>
  );
}

function Clock(props) {
  var tS = useState(new Date()); var time = tS[0], setTime = tS[1];
  useEffect(function() { var i = setInterval(function() { setTime(new Date()); }, 1000); return function() { clearInterval(i); }; }, []);
  var h = time.getHours().toString().padStart(2, "0");
  var m = time.getMinutes().toString().padStart(2, "0");
  var s = time.getSeconds().toString().padStart(2, "0");
  var weekday = time.toLocaleDateString("pt-PT", { weekday: "long" });
  var date = time.toLocaleDateString("pt-PT", { day: "numeric", month: "long" });
  return (
    <div className="hub-in" style={{ animationDelay: "40ms" }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 0,
        fontFamily: "'JetBrains Mono', monospace", fontSize: props.isMobile ? 64 : 96,
        fontWeight: 300, letterSpacing: "-0.07em", color: COLORS.text, lineHeight: 0.88,
      }}>
        <span>{h}</span>
        <span className="hub-colon">:</span>
        <span>{m}</span>
        <span style={{
          fontSize: props.isMobile ? 13 : 15, fontWeight: 400, color: COLORS.faint,
          letterSpacing: "0.18em", marginLeft: 14, alignSelf: "flex-end", marginBottom: 10,
        }}>{s}</span>
      </div>
      <p style={{
        margin: "18px 0 0", fontSize: 14, color: COLORS.muted,
        letterSpacing: 0.2, textTransform: "capitalize",
      }}>{weekday} · {date}</p>
    </div>
  );
}

function getGreeting() {
  var h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 20) return "Boa tarde";
  return "Boa noite";
}

export default function Hub() {
  var navigate = useNavigate();
  var auth = useAuth();
  var vwS = useState(window.innerWidth);
  var viewportW = vwS[0], setViewportW = vwS[1];
  var isMobile = viewportW < 720;

  useEffect(function() {
    function onResize() { setViewportW(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  var who = auth.user && auth.user.email ? auth.user.email.split("@")[0] : "Martim";

  return (
    <div className="hub-root" data-scrollable style={{
      minHeight: "100vh", background: COLORS.bg, color: COLORS.text,
      padding: isMobile ? "40px 20px 96px" : "64px 48px 88px",
      fontFamily: "'IBM Plex Sans', sans-serif", position: "relative", overflow: "hidden",
    }}>
      <style>{HUB_CSS}</style>
      <div className="hub-mark" aria-hidden="true">SINAPSE</div>
      <div style={{ maxWidth: 880, margin: "0 auto", position: "relative" }}>
        <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: isMobile ? 36 : 48 }}>
          <div>
            <p className="hub-in hub-sec" style={{ margin: "0 0 20px" }}>{getGreeting()} — {who}</p>
            <Clock isMobile={isMobile} />
          </div>
          <button className="hub-in hub-out" onClick={function() { auth.signOut(); }} style={{ animationDelay: "80ms" }}>
            Sair
          </button>
        </header>

        <div className="hub-in" style={{ animationDelay: "120ms", marginBottom: 8 }}>
          <div className="hub-rule" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 18 }}>
            <p className="hub-sec" style={{ margin: 0 }}>Índice</p>
            <p className="hub-sec" style={{ margin: 0 }}>0{MODULES.length}</p>
          </div>
        </div>

        <div data-stagger>
          {MODULES.map(function(mod, i) {
            return <ModuleRow key={mod.id} module={mod} index={i} onClick={function() { navigate(mod.path); }} />;
          })}
        </div>
      </div>
    </div>
  );
}
