import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { ProjectsIcon } from "./Projects";
import { COLORS, MODULE_COLORS, moduleGlow } from "../lib/theme";
import { MICRO_CSS, trackSpotlight } from "../lib/microUi";

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="6" y="10" width="36" height="32" stroke="currentColor" strokeWidth="2"/>
      <line x1="6" y1="20" x2="42" y2="20" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
function TasksIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M14 24 L21 31 L36 14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
    </svg>
  );
}
function WishlistIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M14 12H34L32 30H16L14 12Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
function FinanceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M10 34 L20 22 L28 28 L38 14" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
function JournalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M12 8H36V40H12Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M18 16H30M18 24H30" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  );
}
function FocusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="26" r="14" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 26 L24 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square"/>
    </svg>
  );
}

var MODULES = [
  { id: "calendar", name: "Calendário", desc: "Visualiza e organiza o teu tempo", Icon: CalendarIcon, path: "/calendar", color: MODULE_COLORS.calendar },
  { id: "focus", name: "Estúdio de Foco", desc: "Sessões de estudo, ideias e métricas diárias", Icon: FocusIcon, path: "/focus", color: MODULE_COLORS.focus },
  { id: "tasks", name: "Tarefas", desc: "Captura, prioriza, conquista", Icon: TasksIcon, path: "/tasks", color: MODULE_COLORS.tasks },
  { id: "journal", name: "Diário", desc: "Blocos de escrita para tudo o que vem à cabeça", Icon: JournalIcon, path: "/journal", color: MODULE_COLORS.journal },
  { id: "projects", name: "Projetos", desc: "Workspaces modulares com finanças, notas e sinapses", Icon: ProjectsIcon, path: "/projects", color: MODULE_COLORS.projects },
  { id: "wishlist", name: "Wishlist", desc: "Lista o que queres comprar ou fazer", Icon: WishlistIcon, path: "/wishlist", color: MODULE_COLORS.wishlist },
  { id: "finance", name: "Financeiro", desc: "Gastos, recursos e orçamento mensal", Icon: FinanceIcon, path: "/finance", color: MODULE_COLORS.finance },
];

var HUB_CSS = [
  MICRO_CSS,
  "@keyframes hubIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}",
  "@keyframes hubTick{0%,48%{opacity:1}50%,98%{opacity:.15}}",
  "@keyframes hubDrift{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(3%,-4%) scale(1.06)}66%{transform:translate(-3%,3%) scale(0.97)}}",
  "@keyframes hubPulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.3)}}",
  ".hub-scroll{height:100vh;height:100dvh;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;position:relative;background:" + COLORS.bg + ";color:" + COLORS.text + ";font-family:'IBM Plex Sans',sans-serif}",
  ".hub-scroll::-webkit-scrollbar{width:5px}",
  ".hub-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1)}",
  ".hub-inner{max-width:920px;margin:0 auto;padding:48px 24px 120px;position:relative;z-index:1}",
  ".hub-glow{position:fixed;border-radius:50%;pointer-events:none;filter:blur(90px);animation:uiGlow 8s ease-in-out infinite,hubDrift 22s ease-in-out infinite;transition:background 1.2s var(--ease)}",
  ".hub-glow--a{width:min(520px,68vw);height:min(520px,68vw);top:-14%;left:-10%}",
  ".hub-glow--b{width:min(400px,52vw);height:min(400px,52vw);bottom:2%;right:-12%;animation-delay:-3s,-7s}",
  ".hub-glow--c{width:min(320px,42vw);height:min(320px,42vw);top:40%;left:36%;animation-delay:-5s,-14s;opacity:.4}",
  ".hub-mark{position:fixed;right:-2%;top:14%;font-family:'JetBrains Mono',monospace;font-size:clamp(80px,20vw,240px);",
  "font-weight:300;letter-spacing:-0.08em;color:rgba(255,255,255,.025);line-height:.8;pointer-events:none;user-select:none;transform:rotate(-10deg);z-index:0}",
  ".hub-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:52px}",
  ".hub-sec{font-size:10px;letter-spacing:2.6px;text-transform:uppercase;color:" + COLORS.faint + ";font-family:'JetBrains Mono',monospace;margin:0;display:flex;align-items:center;gap:8px}",
  ".hub-live{width:6px;height:6px;border-radius:50%;background:var(--mc);flex-shrink:0;animation:hubPulseDot 2s ease-in-out infinite}",
  ".hub-clock-wrap{animation:hubIn var(--dur-slow) var(--ease) both;animation-delay:40ms}",
  ".hub-time{display:flex;align-items:baseline;font-family:'JetBrains Mono',monospace;font-weight:300;letter-spacing:-0.075em;line-height:.85}",
  ".hub-time-grad{background-image:linear-gradient(100deg,#8FA8C4,#C4A57C,#8FB39B,#C08C8C,#8FA8C4);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:auroraText 16s linear infinite}",
  ".hub-colon{display:inline-block;animation:hubTick 2s steps(1) infinite;margin:0 1px;color:" + COLORS.faint + "}",
  ".hub-date{margin:20px 0 0;font-size:14px;color:" + COLORS.muted + ";letter-spacing:.15px;text-transform:capitalize}",
  ".hub-out{margin-top:4px}",
  ".hub-divider{height:1px;background:linear-gradient(90deg,color-mix(in srgb,var(--mc,#EDEDEF) 45%,transparent),rgba(255,255,255,.04) 65%,transparent);margin:0 0 20px;transition:background 1s var(--ease)}",
  ".hub-index-head{position:relative;display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;padding-top:12px;animation:hubIn var(--dur-slow) var(--ease) both;animation-delay:100ms}",
  ".hub-list{display:flex;flex-direction:column}",
  ".hub-row{position:relative;display:grid;grid-template-columns:44px 28px 1fr auto;align-items:center;gap:16px;width:100%;text-align:left;overflow:hidden;",
  "padding:24px 8px 24px 0;background:none;border:none;border-bottom:1px solid rgba(255,255,255,.06);color:" + COLORS.muted + ";cursor:pointer;font-family:inherit;",
  "transition:color var(--dur) var(--ease),padding-left var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".hub-row::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:0;border-radius:999px;background:var(--mc);",
  "transition:height var(--dur) var(--ease),opacity var(--dur) var(--ease);opacity:0;z-index:2}",
  ".hub-row::after{content:'';position:absolute;inset:0;background:radial-gradient(240px circle at var(--mx,15%) var(--my,50%),color-mix(in srgb,var(--mc,#EDEDEF) 10%,transparent),transparent 72%);opacity:0;transition:opacity .4s var(--ease);pointer-events:none;z-index:0}",
  ".hub-row:hover::after,.hub-row:focus-visible::after{opacity:1}",
  ".hub-row:hover,.hub-row:focus-visible{color:" + COLORS.text + ";padding-left:6px;border-bottom-color:color-mix(in srgb,var(--mc) 30%,transparent)}",
  ".hub-row:hover::before,.hub-row:focus-visible::before{height:32px;opacity:1}",
  ".hub-row:active{transform:scale(.995)}",
  ".hub-idx{position:relative;z-index:1;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:1.6px;color:" + COLORS.faint + ";transition:color var(--dur) var(--ease)}",
  ".hub-row:hover .hub-idx{color:var(--mc)}",
  ".hub-ic-wrap{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;color:" + COLORS.faint + "}",
  ".hub-dot{position:absolute;left:-4px;top:50%;transform:translateY(-50%);width:7px;height:7px;border-radius:50%;background:var(--mc);opacity:.45;",
  "transition:opacity var(--dur) var(--ease),transform var(--dur) var(--ease)}",
  ".hub-row:hover .hub-dot,.hub-row:focus-visible .hub-dot{opacity:1;transform:translateY(-50%) scale(1.15)}",
  ".hub-row svg{opacity:.4;transition:opacity var(--dur) var(--ease),transform var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".hub-row:hover svg,.hub-row:focus-visible svg{opacity:1;color:var(--mc);transform:translateX(2px) rotate(-4deg)}",
  ".hub-row h2{position:relative;z-index:1;margin:0;font-family:'JetBrains Mono',monospace;font-size:clamp(19px,2.6vw,28px);font-weight:400;letter-spacing:-.035em;color:" + COLORS.text + ";line-height:1.12;transition:color var(--dur) var(--ease)}",
  ".hub-row:hover h2,.hub-row:focus-visible h2{color:var(--mc)}",
  ".hub-row p{position:relative;z-index:1;margin:7px 0 0;font-size:13px;line-height:1.55;color:" + COLORS.faint + ";max-width:44ch;transition:color var(--dur) var(--ease)}",
  ".hub-row:hover p{color:" + COLORS.muted + "}",
  ".hub-go{position:relative;z-index:1;font-size:20px;color:" + COLORS.faint + ";opacity:0;transform:translateX(-12px);transition:opacity var(--dur) var(--ease),transform var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".hub-row:hover .hub-go,.hub-row:focus-visible .hub-go{opacity:1;transform:none;color:var(--mc)}",
  ".hub-foot{margin-top:48px;padding-top:24px;border-top:1px solid rgba(255,255,255,.06);animation:hubIn var(--dur-slow) var(--ease) both;animation-delay:400ms}",
  ".hub-foot p{margin:0;font-size:12px;color:" + COLORS.faint + ";font-family:'JetBrains Mono',monospace;letter-spacing:.4px}",
  "@media(max-width:719px){",
  ".hub-inner{padding:36px 18px 100px}",
  ".hub-row{grid-template-columns:36px 24px 1fr auto;gap:12px;padding:22px 0}",
  ".hub-row svg{display:block}",
  ".hub-row h2{font-size:21px}",
  ".hub-go{opacity:.4;transform:none}",
  ".hub-time{font-size:64px!important}",
  "}",
  "@media(prefers-reduced-motion:reduce){.hub-glow{animation:none}.hub-time-grad{animation:none}}",
].join("");

function ModuleRow(props) {
  var mod = props.module;
  var n = String(props.index + 1).padStart(2, "0");
  return (
    <button type="button" className="hub-row ui-tap ui-fade-in" style={{ "--mc": mod.color, animationDelay: (120 + props.index * 55) + "ms" }} onMouseMove={trackSpotlight} onClick={function() { if (mod.path) props.onClick(mod); }}>
      <span className="hub-idx">{n}</span>
      <span className="hub-ic-wrap" aria-hidden="true">
        <span className="hub-dot" />
        <mod.Icon />
      </span>
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
  return (
    <div className="hub-clock-wrap">
      <div className="hub-time hub-time-grad" style={{ fontSize: props.isMobile ? 64 : 96 }}>
        <span>{h}</span>
        <span className="hub-colon">:</span>
        <span>{m}</span>
        <span style={{ fontSize: props.isMobile ? 13 : 15, fontWeight: 400, color: COLORS.faint, letterSpacing: "0.2em", marginLeft: 12, alignSelf: "flex-end", marginBottom: 10 }}>{s}</span>
      </div>
      <p className="hub-date">
        {time.toLocaleDateString("pt-PT", { weekday: "long" })} · {time.toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}
      </p>
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
  var isMobile = vwS[0] < 720;

  useEffect(function() {
    function onResize() { vwS[1](window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  var who = auth.user && auth.user.email ? auth.user.email.split("@")[0] : "Martim";

  return (
    <div className="hub-root hub-scroll" data-scrollable>
      <style>{HUB_CSS}</style>
      <div className="hub-glow hub-glow--a" style={{ background: moduleGlow(MODULE_COLORS.calendar, "20") }} aria-hidden="true" />
      <div className="hub-glow hub-glow--b" style={{ background: moduleGlow(MODULE_COLORS.focus, "18") }} aria-hidden="true" />
      <div className="hub-glow hub-glow--c" style={{ background: moduleGlow(MODULE_COLORS.tasks, "16") }} aria-hidden="true" />
      <div className="hub-mark" aria-hidden="true">SINAPSE</div>
      <div className="hub-inner">
        <header className="hub-top">
          <div>
            <p className="hub-sec hub-clock-wrap" style={{ marginBottom: 22 }}><span className="hub-live" aria-hidden="true" />{getGreeting()} — {who}</p>
            <Clock isMobile={isMobile} />
          </div>
          <button type="button" className="ui-line-btn hub-out ui-tap" onClick={function() { auth.signOut(); }}>Sair</button>
        </header>

        <div className="hub-index-head">
          <div className="hub-divider" style={{ position: "absolute", left: 0, right: 0, top: 0 }} />
          <p className="hub-sec">Índice</p>
          <p className="hub-sec">0{MODULES.length}</p>
        </div>

        <nav className="hub-list" aria-label="Módulos">
          {MODULES.map(function(mod, i) {
            return <ModuleRow key={mod.id} module={mod} index={i} onClick={function() { navigate(mod.path); }} />;
          })}
        </nav>

        <footer className="hub-foot">
          <p>Desliza para explorar · {MODULES.length} módulos activos</p>
        </footer>
      </div>
    </div>
  );
}
