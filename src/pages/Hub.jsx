import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { ProjectsIcon } from "./Projects";
import { COLORS } from "../lib/theme";

function CalendarIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="10" width="36" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
      <line x1="6" y1="20" x2="42" y2="20" stroke="currentColor" strokeWidth="2"/>
      <line x1="16" y1="6" x2="16" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="32" y1="6" x2="32" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="16" cy="28" r="2" fill="currentColor"/>
      <circle cx="24" cy="28" r="2" fill="currentColor"/>
      <circle cx="32" cy="28" r="2" fill="currentColor"/>
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 24 L21 29 L32 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M14 10H34L32 28H16L14 10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="18" cy="36" r="2" fill="currentColor"/>
      <circle cx="30" cy="36" r="2" fill="currentColor"/>
      <path d="M20 14L24 22L28 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function FinanceIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2"/>
      <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 18H36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M13 8H33C36.3137 8 39 10.6863 39 14V40H15C11.6863 40 9 37.3137 9 34V12C9 9.79086 10.7909 8 13 8Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M15 14H33" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M15 21H31" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M15 28H27" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M33 8V40" stroke="currentColor" strokeWidth="1.3" opacity="0.35"/>
    </svg>
  );
}

function FocusIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="26" r="15" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 26 L24 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 26 L30 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M18 7H30" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/>
      <circle cx="24" cy="26" r="2" fill="currentColor"/>
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
  "@keyframes hubIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}",
  ".hub-in{animation:hubIn var(--dur-slow) var(--ease) both}",
  ".hub-orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(60px);animation:breathe 10s ease-in-out infinite}",
  ".hub-card{position:relative;display:flex;align-items:center;gap:14px;width:100%;text-align:left;padding:18px 16px 18px 16px;border-radius:16px;",
  "border:1px solid " + COLORS.borderSoft + ";background:" + COLORS.surface + ";color:" + COLORS.muted + ";",
  "cursor:pointer;font-family:inherit;overflow:hidden;",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}",
  ".hub-card::before{content:'';position:absolute;left:0;top:16px;bottom:16px;width:2px;border-radius:0 2px 2px 0;background:" + COLORS.accent + ";opacity:0;transform:scaleY(.35);transition:opacity var(--dur) var(--ease),transform var(--dur) var(--ease)}",
  ".hub-card:hover{background:" + COLORS.surfaceHi + ";border-color:" + COLORS.borderHi + "}",
  ".hub-card:hover::before{opacity:.55;transform:scaleY(1)}",
  ".hub-card:active{transform:translateY(0)!important}",
  ".hub-ic{display:flex;align-items:center;justify-content:center;width:42px;height:42px;flex-shrink:0;border-radius:12px;",
  "background:" + COLORS.bgSoft + ";border:1px solid " + COLORS.borderSoft + ";transition:border-color var(--dur) var(--ease),background var(--dur) var(--ease)}",
  ".hub-card:hover .hub-ic{border-color:" + COLORS.borderHi + ";background:" + COLORS.surfaceHi + "}",
  ".hub-card svg{width:20px;height:20px;opacity:.78;transition:opacity var(--dur) var(--ease)}",
  ".hub-card:hover svg{opacity:1}",
  ".hub-card h2{margin:0;font-family:'JetBrains Mono',monospace;font-size:14.5px;font-weight:500;letter-spacing:.15px;color:" + COLORS.text + "}",
  ".hub-card p{margin:5px 0 0;font-size:13px;line-height:1.5;color:" + COLORS.faint + "}",
  ".hub-go{flex-shrink:0;font-size:16px;color:" + COLORS.faint + ";opacity:0;transform:translateX(-8px);transition:opacity var(--dur) var(--ease),transform var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".hub-card:hover .hub-go{opacity:1;transform:none;color:" + COLORS.text + "}",
  ".hub-sec{font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:" + COLORS.faint + ";font-family:'JetBrains Mono',monospace}",
  ".hub-colon{display:inline-block;animation:blinkSoft 2s steps(1) infinite;margin:0 2px;color:" + COLORS.faint + "}",
  "@media(max-width:719px){.hub-card{padding:16px}.hub-card h2{font-size:15.5px}.hub-card p{font-size:13.5px}.hub-go{opacity:.45;transform:none}}",
].join("");

function ModuleCard(props) {
  var mod = props.module;
  return (
    <button className="hub-card" onClick={function() { if (mod.path) props.onClick(mod); }}>
      <span className="hub-ic"><mod.Icon /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
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
  var date = time.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="hub-in" style={{ animationDelay: "60ms" }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 0,
        fontFamily: "'JetBrains Mono', monospace", fontSize: props.isMobile ? 52 : 72,
        fontWeight: 300, letterSpacing: -2, color: COLORS.text, lineHeight: 0.95,
      }}>
        <span>{h}</span>
        <span className="hub-colon">:</span>
        <span>{m}</span>
        <span style={{ fontSize: props.isMobile ? 16 : 18, fontWeight: 400, color: COLORS.faint, letterSpacing: 0, marginLeft: 8 }}>{s}</span>
      </div>
        <p style={{
        margin: "14px 0 0", fontSize: 14, color: COLORS.muted,
        letterSpacing: 0.15, textTransform: "capitalize",
      }}>{weekday}, {date}</p>
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
      padding: isMobile ? "36px 18px 88px" : "72px 28px 80px",
      fontFamily: "'IBM Plex Sans', sans-serif", position: "relative", overflow: "hidden",
    }}>
      <style>{HUB_CSS}</style>
      <div className="hub-orb" style={{ width: 420, height: 420, top: -140, left: "18%", background: "rgba(255,255,255,0.04)" }} />
      <div className="hub-orb" style={{ width: 280, height: 280, bottom: -80, right: -40, background: "rgba(255,255,255,0.025)", animationDelay: "-4s" }} />
      <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", gap: isMobile ? 32 : 44, position: "relative" }}>
        <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
          <p className="hub-in hub-sec" style={{ margin: "0 0 18px" }}>{getGreeting()}, {who}</p>
            <Clock isMobile={isMobile} />
          </div>
          <button className="hub-in" onClick={function() { auth.signOut(); }} style={{
            animationDelay: "120ms",
            background: "transparent", border: "1px solid " + COLORS.borderSoft, borderRadius: 10,
            color: COLORS.faint, fontSize: 12, padding: isMobile ? "9px 13px" : "8px 13px",
            cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
          }}>Sair</button>
        </header>

        <div className="hub-in" style={{ animationDelay: "150ms" }}>
          <div style={{ height: 1, background: COLORS.borderSoft }} />
          <p className="hub-sec" style={{ margin: "18px 0 0" }}>Módulos</p>
        </div>

        <div data-stagger style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(268px,1fr))",
          gap: 12, marginTop: isMobile ? -12 : -20,
        }}>
          {MODULES.map(function(mod, i) {
            return <ModuleCard key={mod.id} module={mod} index={i} onClick={function() { navigate(mod.path); }} />;
          })}
        </div>
      </div>
    </div>
  );
}
