import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import * as focusStore from "../lib/focusStore";
import * as focusTimer from "../lib/focusTimer";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";

var CYAN = "#00FFC8";
var PINK = "#FF3D8A";
var AMBER = "#FFB800";
var PURPLE = "#B36BFF";

var ICONS = ["◈", "◷", "✦", "◇", "⌘", "€", "▦", "◉", "✎", "◆"];
var CLOCK_STYLES = [
  { id: "digital", label: "Digital" },
  { id: "analog", label: "Analógico" },
  { id: "ring", label: "Anel" },
  { id: "blocks", label: "Blocos" },
];

var SIDEBAR = [
  { id: "clock", label: "Relógio", icon: "◷" },
  { id: "time", label: "Tempo", icon: "⏱" },
  { id: "notes", label: "Notas", icon: "✎" },
  { id: "analytics", label: "Analytics", icon: "◈" },
  { id: "tasks", label: "Tarefas", icon: "☑" },
];

var FX_CSS = [
  "@keyframes fxIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
  "@keyframes fxPulse{0%,100%{opacity:.7}50%{opacity:1}}",
  "@keyframes fxSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}",
  ".fx-root{height:100vh;max-height:100vh;overflow:hidden;display:flex;flex-direction:column;background:radial-gradient(120% 80% at 50% -10%,#0e1018 0%,#08080f 55%,#06060b 100%);color:#fff;font-family:'IBM Plex Sans',sans-serif}",
  ".fx-head{flex-shrink:0;display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(7,7,13,0.88);backdrop-filter:blur(16px);z-index:20}",
  ".fx-hbtn{height:34px;padding:0 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.55);cursor:pointer;font-size:12px;font-family:inherit}",
  ".fx-shell{flex:1;min-height:0;display:flex;overflow:hidden}",
  ".fx-side{width:68px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 8px;border-right:1px solid rgba(255,255,255,0.06);background:rgba(6,6,12,0.6)}",
  ".fx-nav{width:48px;height:48px;border-radius:14px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.4);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:14px;transition:all .18s}",
  ".fx-nav span{font-size:7px;font-family:'JetBrains Mono',monospace;letter-spacing:.3px;line-height:1}",
  ".fx-nav.on{border-color:var(--ac);background:var(--ac)14;color:var(--ac);box-shadow:0 0 18px var(--ac)33}",
  ".fx-main{flex:1;min-width:0;min-height:0;overflow-y:auto;padding:16px 18px 24px;-webkit-overflow-scrolling:touch}",
  ".fx-panel{border-radius:18px;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(155deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01));padding:18px;animation:fxIn .35s ease}",
  ".fx-title{margin:0 0 14px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;letter-spacing:.8px;display:flex;align-items:center;gap:8px}",
  ".fx-input{width:100%;background:rgba(0,0,0,0.32);border:1px solid rgba(255,255,255,0.1);border-radius:11px;color:#fff;padding:10px 12px;font-size:14px;outline:none;box-sizing:border-box;font-family:inherit}",
  ".fx-input:focus{border-color:rgba(0,255,200,0.45)}",
  ".fx-label{display:block;font-size:9px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.38);margin-bottom:5px;letter-spacing:.5px;text-transform:uppercase}",
  ".fx-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border-radius:11px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;cursor:pointer;border:1px solid;transition:transform .15s}",
  ".fx-btn:hover:not(:disabled){transform:translateY(-1px)}",
  ".fx-btn:disabled{opacity:.4;cursor:not-allowed}",
  ".fx-grid-pick{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;max-width:920px;margin:0 auto}",
  ".fx-proj{position:relative;border-radius:16px;border:1px solid rgba(255,255,255,0.08);background:linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.01));padding:16px;cursor:pointer;transition:transform .18s,box-shadow .18s,border-color .18s;animation:fxIn .4s ease both;overflow:hidden}",
  ".fx-proj:hover{transform:translateY(-3px);border-color:var(--pc);box-shadow:0 14px 36px rgba(0,0,0,0.35)}",
  ".fx-proj::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--pc)}",
  ".fx-proj-del{position:absolute;top:10px;right:10px;width:28px;height:28px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.35);color:rgba(255,255,255,0.35);cursor:pointer;font-size:15px;line-height:1;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s,background .15s,color .15s;z-index:2}",
  ".fx-proj:hover .fx-proj-del{opacity:1}",
  ".fx-proj-del:hover{background:rgba(255,61,90,0.18);color:#FF3D5A;border-color:rgba(255,61,90,0.4)}",
  ".fx-addcard{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:130px;border:1px dashed rgba(0,255,200,0.3);background:rgba(0,255,200,0.04);border-radius:16px;cursor:pointer;color:rgba(255,255,255,0.45);transition:all .18s}",
  ".fx-addcard:hover{border-color:rgba(0,255,200,0.55);color:#00FFC8;background:rgba(0,255,200,0.08)}",
  ".fx-modal-bg{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,0.65);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px}",
  ".fx-modal{width:min(440px,100%);border-radius:18px;border:1px solid rgba(0,255,200,0.28);background:linear-gradient(160deg,#11111b,#0a0a12);padding:20px;animation:fxIn .28s ease}",
  ".fx-modes{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}",
  ".fx-mode{padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.025);color:rgba(255,255,255,0.5);font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;cursor:pointer}",
  ".fx-mode.on{color:#0b0b12}",
  ".fx-clock-wrap{display:flex;flex-direction:column;align-items:center;gap:14px;padding:8px 0 16px}",
  ".fx-digital{font-family:'JetBrains Mono',monospace;font-weight:600;font-size:clamp(52px,12vw,96px);line-height:1;letter-spacing:3px;transition:color .4s,text-shadow .4s}",
  ".fx-prog{width:100%;max-width:360px;height:6px;border-radius:999px;background:rgba(255,255,255,0.07);overflow:hidden}",
  ".fx-prog i{display:block;height:100%;border-radius:999px;transition:width 1s linear}",
  ".fx-tcontrols{display:flex;gap:10px;width:100%;max-width:360px}",
  ".fx-tbtn{flex:1;padding:13px;border-radius:13px;border:1px solid;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;cursor:pointer;background:transparent}",
  ".fx-styletog{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}",
  ".fx-stybtn{padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,0.1);background:rgba(0,0,0,0.25);color:rgba(255,255,255,0.45);font-size:10px;font-family:'JetBrains Mono',monospace;cursor:pointer}",
  ".fx-stybtn.on{border-color:var(--ac);color:var(--ac);background:var(--ac)12}",
  ".fx-analog{width:min(280px,70vw);height:min(280px,70vw);position:relative}",
  ".fx-analog-face{width:100%;height:100%;border-radius:50%;border:2px solid rgba(255,255,255,0.12);background:radial-gradient(circle at 50% 35%,rgba(255,255,255,0.06),rgba(0,0,0,0.35));position:relative;box-shadow:inset 0 0 40px rgba(0,0,0,0.4),0 0 30px var(--ac)22}",
  ".fx-hand{position:absolute;bottom:50%;left:50%;transform-origin:bottom center;border-radius:999px;background:var(--ac);box-shadow:0 0 8px var(--ac)}",
  ".fx-ring{width:min(260px,65vw);height:min(260px,65vw);position:relative;display:flex;align-items:center;justify-content:center}",
  ".fx-ring svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}",
  ".fx-blocks{display:flex;gap:5px;align-items:center}",
  ".fx-block{width:clamp(28px,6vw,42px);height:clamp(48px,10vw,72px);border-radius:8px;border:1px solid rgba(255,255,255,0.12);background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:clamp(20px,5vw,32px);font-weight:600;color:var(--ac);text-shadow:0 0 12px var(--ac)88;transition:background .3s,box-shadow .3s}",
  ".fx-block.on{background:var(--ac)18;box-shadow:0 0 16px var(--ac)44,inset 0 0 12px var(--ac)22}",
  ".fx-statgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px}",
  ".fx-stat{padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,0.07);background:rgba(0,0,0,0.22)}",
  ".fx-stat p{margin:0;font-size:9px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.38);letter-spacing:.5px}",
  ".fx-stat strong{display:block;margin-top:6px;font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:600}",
  ".fx-goal{margin:16px 0;padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.2)}",
  ".fx-goal-bar{height:10px;border-radius:999px;background:rgba(255,255,255,0.07);overflow:hidden;margin-top:10px}",
  ".fx-goal-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--ac),var(--ac)cc);box-shadow:0 0 14px var(--ac)55;transition:width .6s ease}",
  ".fx-chart{display:flex;gap:8px;align-items:flex-end;height:160px;margin:12px 0}",
  ".fx-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end}",
  ".fx-bar{width:100%;max-width:28px;border-radius:6px 6px 0 0;min-height:3px;background:var(--ac);box-shadow:0 0 10px var(--ac)44;transition:height .4s}",
  ".fx-table{width:100%;border-collapse:collapse;font-size:12px}",
  ".fx-table th,.fx-table td{padding:9px 10px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.06);font-family:'JetBrains Mono',monospace}",
  ".fx-table th{font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:.5px;text-transform:uppercase}",
  ".fx-idea{padding:10px 34px 10px 12px;border-radius:11px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.022);font-size:12px;line-height:1.5;white-space:pre-wrap;position:relative}",
  ".fx-idea button{position:absolute;top:7px;right:7px;width:22px;height:22px;border:none;background:transparent;color:rgba(255,255,255,0.3);cursor:pointer}",
  ".fx-task{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);transition:border-color .15s}",
  ".fx-task.done{opacity:.45}",
  ".fx-task-check{width:22px;height:22px;border-radius:7px;border:1px solid rgba(255,255,255,0.15);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0}",
  ".fx-task-check.on{border-color:var(--ac);background:var(--ac)18;color:var(--ac)}",
  ".fx-tabs{display:flex;gap:6px;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.07)}",
  ".fx-tab{padding:9px 14px;border:none;background:none;color:rgba(255,255,255,0.4);font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}",
  ".fx-tab.on{color:#fff}",
  ".fx-area{width:100%;min-height:200px;background:rgba(0,0,0,0.28);border:1px solid rgba(255,255,255,0.09);border-radius:13px;color:#fff;padding:14px;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.7;outline:none;resize:vertical;box-sizing:border-box}",
  ".fx-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;font-size:10px;font-family:'JetBrains Mono',monospace}",
  ".fx-pal{display:flex;gap:7px;flex-wrap:wrap}",
  ".fx-pal button{width:28px;height:28px;border-radius:8px;border:2px solid transparent;cursor:pointer}",
  "@media(max-width:720px){.fx-side{width:100%;flex-direction:row;justify-content:space-around;padding:8px;border-right:none;border-top:1px solid rgba(255,255,255,0.06);order:2}.fx-shell{flex-direction:column}.fx-nav{width:auto;flex:1;height:44px;flex-direction:row;gap:6px;font-size:13px}.fx-nav span{font-size:8px}.fx-main{order:1}.fx-proj-del{opacity:1}}",
].join("");

function playBeep(freq) {
  try {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    var ctx = new Ctx();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq || 760;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
    osc.onended = function() { try { ctx.close(); } catch (e) {} };
  } catch (e) {}
}

function weekdayShort(dayKey) {
  var p = dayKey.split("-");
  var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return d.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", "");
}

function fmtHours(min) {
  var h = Math.floor(min / 60);
  var m = min % 60;
  if (!h) return m + " min";
  if (!m) return h + "h";
  return h + "h " + m + "m";
}

function reviewDraftKey(projectId) {
  return "focus-review-draft:" + projectId;
}

/* --------------------------- VISUALIZAÇÕES RELÓGIO --------------------------- */

function DigitalClock(props) {
  return (
    <div className="fx-digital" style={{ color: props.color, textShadow: "0 0 24px " + props.color + "88, 0 0 8px " + props.color + "55" }}>
      {focusTimer.fmtClock(props.secs)}
    </div>
  );
}

function AnalogClock(props) {
  var total = props.total || 1;
  var elapsed = total - props.secs;
  var pct = total > 0 ? elapsed / total : 0;
  var minAngle = pct * 360;
  var secAngle = (props.secs % 60) / 60 * 360;
  return (
    <div className="fx-analog">
      <div className="fx-analog-face" style={{ "--ac": props.color }}>
        {Array.from({ length: 12 }, function(_, i) {
          var a = (i / 12) * 360;
          return <span key={i} style={{ position: "absolute", width: 2, height: i % 3 === 0 ? 10 : 6, background: "rgba(255,255,255,0.2)", left: "50%", top: 8, transform: "translateX(-50%) rotate(" + a + "deg)", transformOrigin: "50% 130px" }} />;
        })}
        <div className="fx-hand" style={{ width: 4, height: "32%", transform: "translateX(-50%) rotate(" + minAngle + "deg)", "--ac": props.color }} />
        <div className="fx-hand" style={{ width: 2, height: "42%", transform: "translateX(-50%) rotate(" + secAngle + "deg)", opacity: 0.7, "--ac": props.color }} />
        <div style={{ position: "absolute", inset: "42%", borderRadius: "50%", background: props.color, boxShadow: "0 0 10px " + props.color }} />
      </div>
    </div>
  );
}

function RingClock(props) {
  var r = 54, c = 2 * Math.PI * r;
  var pct = props.total > 0 ? props.secs / props.total : 0;
  return (
    <div className="fx-ring" style={{ "--ac": props.color }}>
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={props.color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ filter: "drop-shadow(0 0 8px " + props.color + ")" }} />
      </svg>
      <div className="fx-digital" style={{ fontSize: "clamp(36px,8vw,52px)", color: props.color, textShadow: "0 0 16px " + props.color + "66" }}>
        {focusTimer.fmtClock(props.secs)}
      </div>
    </div>
  );
}

function BlocksClock(props) {
  var str = focusTimer.fmtClock(props.secs);
  return (
    <div className="fx-blocks">
      {str.split("").map(function(ch, i) {
        if (ch === ":") return <span key={i} style={{ color: props.color, fontSize: 32, opacity: 0.6, animation: "fxPulse 1s ease infinite" }}>:</span>;
        return <div key={i} className={"fx-block" + (props.running ? " on" : "")} style={{ "--ac": props.color }}>{ch}</div>;
      })}
    </div>
  );
}

function ClockDisplay(props) {
  var common = { secs: props.secs, total: props.total, color: props.color, running: props.running };
  if (props.style === "analog") return <AnalogClock {...common} />;
  if (props.style === "ring") return <RingClock {...common} />;
  if (props.style === "blocks") return <BlocksClock {...common} />;
  return <DigitalClock {...common} />;
}

/* ------------------------------ SELETOR PROJETOS ------------------------------ */

function ProjectPicker(props) {
  var navigate = useNavigate();
  var modalS = useState(false);
  var modalOpen = modalS[0], setModalOpen = modalS[1];
  var nameS = useState("");
  var name = nameS[0], setName = nameS[1];
  var iconS = useState("◈");
  var icon = iconS[0], setIcon = iconS[1];
  var colorS = useState(focusStore.PROJECT_COLORS[0]);
  var color = colorS[0], setColor = colorS[1];
  var goalS = useState("");
  var goal = goalS[0], setGoal = goalS[1];
  var deadlineS = useState("");
  var deadline = deadlineS[0], setDeadline = deadlineS[1];
  var hasGoalS = useState(false);
  var hasGoal = hasGoalS[0], setHasGoal = hasGoalS[1];

  function openCreate() {
    setName(""); setIcon("◈"); setColor(focusStore.PROJECT_COLORS[props.projects.length % focusStore.PROJECT_COLORS.length]);
    setGoal(""); setDeadline(""); setHasGoal(false); setModalOpen(true);
  }

  function create() {
    if (!name.trim()) return;
    var p = focusStore.newProject(name.trim(), {
      icon: icon, color: color,
      goal_hours: hasGoal ? Math.max(0, parseFloat(goal) || 0) : 0,
      deadline: hasGoal ? deadline : "",
    });
    props.onCreate(p);
    setModalOpen(false);
    props.onSelect(p);
  }

  function removeProject(e, p) {
    e.stopPropagation();
    if (!props.onDelete) return;
    var studied = fmtHours(focusStore.totalMinutes(props.metricsByProject[p.id] || []));
    var msg = "Eliminar o projeto \"" + p.name + "\"?\n\nSerão apagados também os registos de estudo (" + studied + "), notas e tarefas associados. Esta acção fica guardada.";
    if (!window.confirm(msg)) return;
    props.onDelete(p);
  }

  return (
    <div className="fx-root" data-scrollable>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{MODULE_ENTRY_CSS + FX_CSS}</style>
      <header className="fx-head">
        <button type="button" className="fx-hbtn" onClick={function() { navigate("/"); }}>← Hub</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: CYAN, letterSpacing: 1.2 }}>ESTÚDIO DE FOCO</h1>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.38)" }}>Escolhe ou cria um projeto de estudo</p>
        </div>
      </header>
      <main className="fx-main">
        <div className="fx-grid-pick">
          {props.projects.map(function(p, idx) {
            var prog = focusStore.goalProgress(p, props.metricsByProject[p.id] || []);
            return (
              <article key={p.id} className="fx-proj" style={{ "--pc": p.color, animationDelay: (idx * 0.04) + "s" }} onClick={function() { props.onSelect(p); }}>
                <button type="button" className="fx-proj-del" title="Eliminar projeto" aria-label="Eliminar projeto" onClick={function(e) { removeProject(e, p); }}>×</button>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, paddingRight: 28 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: p.color + "18", color: p.color, boxShadow: "0 0 16px " + p.color + "22" }}>{p.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h2>
                    <p style={{ margin: "4px 0 0", fontSize: 10, color: "rgba(255,255,255,0.38)", fontFamily: "'JetBrains Mono',monospace" }}>{fmtHours(prog.studied)} estudados</p>
                  </div>
                </div>
                {prog.goalMin > 0 ? (
                  <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <div style={{ width: prog.pct + "%", height: "100%", background: p.color, boxShadow: "0 0 10px " + p.color + "55", borderRadius: 999 }} />
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "'JetBrains Mono',monospace" }}>Sem meta definida</p>
                )}
              </article>
            );
          })}
          <button type="button" className="fx-addcard" onClick={openCreate}>
            <span style={{ fontSize: 28, color: CYAN }}>+</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>Novo projeto</span>
          </button>
        </div>
      </main>

      {modalOpen && (
        <div className="fx-modal-bg" onClick={function(e) { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="fx-modal" onClick={function(e) { e.stopPropagation(); }}>
            <p style={{ margin: "0 0 14px", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: CYAN, letterSpacing: 1 }}>NOVO PROJETO DE FOCO</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="fx-label">Nome</label>
                <input className="fx-input" value={name} onChange={function(e) { setName(e.target.value); }} placeholder="Ex: Estudar exame, Investimentos…" autoFocus />
              </div>
              <div>
                <label className="fx-label">Ícone</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ICONS.map(function(ic) {
                    return <button key={ic} type="button" onClick={function() { setIcon(ic); }} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid " + (icon === ic ? color : "rgba(255,255,255,0.1)"), background: icon === ic ? color + "18" : "transparent", color: icon === ic ? color : "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 16 }}>{ic}</button>;
                  })}
                </div>
              </div>
              <div>
                <label className="fx-label">Cor</label>
                <div className="fx-pal">
                  {focusStore.PROJECT_COLORS.map(function(c) {
                    return <button key={c} type="button" onClick={function() { setColor(c); }} style={{ background: c + "44", borderColor: color === c ? c : "transparent", boxShadow: color === c ? "0 0 10px " + c : "none" }}><span style={{ display: "block", width: "100%", height: "100%", borderRadius: 5, background: c }} /></button>;
                  })}
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.55)", cursor: "pointer" }}>
                <input type="checkbox" checked={hasGoal} onChange={function(e) { setHasGoal(e.target.checked); }} />
                Definir meta de horas até uma data
              </label>
              {hasGoal ? (
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label className="fx-label">Horas objetivo</label>
                    <input type="number" min={0} className="fx-input" value={goal} onChange={function(e) { setGoal(e.target.value); }} placeholder="40" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="fx-label">Data final</label>
                    <input type="date" className="fx-input" value={deadline} onChange={function(e) { setDeadline(e.target.value); }} />
                  </div>
                </div>
              ) : null}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" className="fx-btn" onClick={create} style={{ flex: 1, borderColor: CYAN + "55", color: CYAN, background: CYAN + "14" }}>Criar e abrir</button>
                <button type="button" className="fx-hbtn" onClick={function() { setModalOpen(false); }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ WORKSPACE PRINCIPAL ------------------------------ */

export default function Focus() {
  var navigate = useNavigate();
  var auth = useAuth();

  var hydratedS = useState(false);
  var isHydrated = hydratedS[0], setIsHydrated = hydratedS[1];
  var projectsS = useState([]);
  var projects = projectsS[0], setProjects = projectsS[1];
  var activeProjectS = useState(null);
  var activeProject = activeProjectS[0], setActiveProject = activeProjectS[1];

  var allMetricsS = useState([]);
  var allMetrics = allMetricsS[0], setAllMetrics = allMetricsS[1];
  var allIdeasS = useState([]);
  var allIdeas = allIdeasS[0], setAllIdeas = allIdeasS[1];
  var allTasksS = useState([]);
  var allTasks = allTasksS[0], setAllTasks = allTasksS[1];

  var metricsRef = useRef([]);
  var ideasRef = useRef([]);
  var tasksRef = useRef([]);
  var projectsRef = useRef([]);

  var sidebarTabS = useState("clock");
  var sidebarTab = sidebarTabS[0], setSidebarTab = sidebarTabS[1];
  var notesTabS = useState("ideas");
  var notesTab = notesTabS[0], setNotesTab = notesTabS[1];

  var timerS = useState(focusTimer.getState());
  var timer = timerS[0], setTimer = timerS[1];

  var ideaInputS = useState("");
  var ideaInput = ideaInputS[0], setIdeaInput = ideaInputS[1];
  var reviewS = useState("");
  var reviewText = reviewS[0], setReviewText = reviewS[1];
  var syncS = useState("idle");
  var syncStatus = syncS[0], setSyncStatus = syncS[1];
  var taskInputS = useState("");
  var taskInput = taskInputS[0], setTaskInput = taskInputS[1];

  var today = focusStore.dayKey();
  var accent = activeProject ? activeProject.color : CYAN;
  var phaseColor = timer.phase === "focus" ? accent : PINK;

  var projectMetrics = useMemo(function() {
    if (!activeProject) return [];
    return allMetrics.filter(function(m) { return m.project_id === activeProject.id; });
  }, [allMetrics, activeProject]);

  var projectIdeas = useMemo(function() {
    if (!activeProject) return [];
    return allIdeas.filter(function(i) { return i.project_id === activeProject.id; });
  }, [allIdeas, activeProject]);

  var projectTasks = useMemo(function() {
    if (!activeProject) return [];
    return allTasks.filter(function(t) { return t.project_id === activeProject.id; });
  }, [allTasks, activeProject]);

  var metricsByProject = useMemo(function() {
    var map = {};
    allMetrics.forEach(function(m) {
      if (!map[m.project_id]) map[m.project_id] = [];
      map[m.project_id].push(m);
    });
    return map;
  }, [allMetrics]);

  var creditMinutes = useCallback(function(min) {
    if (!activeProject || !min) return;
    var next = focusStore.addMinutesToDay(metricsRef.current, activeProject.id, today, min);
    metricsRef.current = next;
    setAllMetrics(next);
    focusStore.saveMetrics(next);
  }, [activeProject, today]);

  useEffect(function() {
    focusTimer.setTimerHandlers({
      onFocusCredit: function(min) { playBeep(880); creditMinutes(min); },
      onPhaseChange: function() { playBeep(520); },
    });
    return focusTimer.subscribe(function(s) { setTimer(Object.assign({}, s)); });
  }, [creditMinutes]);

  useEffect(function() {
    var alive = true;
    Promise.all([
      focusStore.loadProjects().then(focusStore.ensureDefaultProject),
      focusStore.loadMetrics(),
      focusStore.loadIdeas(),
      focusStore.loadTasks(),
    ]).then(function(res) {
      if (!alive) return;
      projectsRef.current = res[0];
      metricsRef.current = res[1];
      ideasRef.current = res[2];
      tasksRef.current = res[3];
      setProjects(res[0]);
      setAllMetrics(res[1]);
      setAllIdeas(res[2]);
      setAllTasks(res[3]);
    }).finally(function() {
      if (alive) setIsHydrated(true);
    });
    return function() { alive = false; };
  }, []);

  useEffect(function() {
    if (!activeProject) return;
    focusStore.saveActiveProjectId(activeProject.id);
    focusTimer.bindProject(activeProject.id);
    try {
      setReviewText(localStorage.getItem(reviewDraftKey(activeProject.id)) || "");
    } catch (e) { setReviewText(""); }
  }, [activeProject]);

  useEffect(function() { metricsRef.current = allMetrics; }, [allMetrics]);
  useEffect(function() { ideasRef.current = allIdeas; }, [allIdeas]);
  useEffect(function() { tasksRef.current = allTasks; }, [allTasks]);
  useEffect(function() { projectsRef.current = projects; }, [projects]);

  function selectProject(p) {
    setActiveProject(p);
    focusTimer.bindProject(p.id);
  }

  function exitProject() {
    setActiveProject(null);
    focusStore.saveActiveProjectId("");
  }

  function createProject(p) {
    var next = projectsRef.current.concat([p]);
    projectsRef.current = next;
    setProjects(next);
    focusStore.saveProjects(next);
  }

  async function removeProject(p) {
    if (!p || !p.id) return;
    var res = await focusStore.deleteProjectFull(
      p.id,
      projectsRef.current,
      ideasRef.current,
      metricsRef.current,
      tasksRef.current
    );
    projectsRef.current = res.projects;
    ideasRef.current = res.ideas;
    metricsRef.current = res.metrics;
    tasksRef.current = res.tasks;
    setProjects(res.projects);
    setAllIdeas(res.ideas);
    setAllMetrics(res.metrics);
    setAllTasks(res.tasks);
    if (activeProject && activeProject.id === p.id) {
      setActiveProject(null);
      focusStore.saveActiveProjectId("");
    }
    if (focusTimer.getState().projectId === p.id) {
      focusTimer.resetTimer();
      focusTimer.bindProject(null);
    }
  }

  function selectMode(id) {
    focusTimer.configureTimer({ modeId: id, running: false, phase: "focus" });
    var presets = focusTimer.getModePresets();
    var m = presets.find(function(x) { return x.id === id; }) || presets[0];
    var f = id === "custom" ? timer.customFocus : m.focus;
    focusTimer.configureTimer({ secsLeft: f * 60 });
  }

  function handlePause() {
    if (timer.running) {
      var credit = focusTimer.pauseTimer();
      if (credit > 0) creditMinutes(credit);
    } else {
      focusTimer.startTimer();
    }
  }

  function handleReset() {
    var credit = focusTimer.resetTimer();
    if (credit > 0) creditMinutes(credit);
  }

  function addIdea(kind) {
    if (!activeProject || !ideaInput.trim()) return;
    var n = focusStore.newIdea(ideaInput.trim(), activeProject.id, kind || "idea");
    var next = [n].concat(ideasRef.current);
    ideasRef.current = next;
    setAllIdeas(next);
    setIdeaInput("");
    focusStore.saveIdeas(next);
  }

  function removeIdea(id) {
    focusStore.deleteIdea(ideasRef.current, id).then(function(next) {
      ideasRef.current = next;
      setAllIdeas(next);
    });
  }

  function onReviewChange(val) {
    setReviewText(val);
    if (activeProject) {
      try { localStorage.setItem(reviewDraftKey(activeProject.id), val); } catch (e) {}
    }
    if (syncStatus !== "idle") setSyncStatus("idle");
  }

  function syncToDiary() {
    if (!activeProject || !reviewText.trim()) return;
    setSyncStatus("sending");
    focusStore.syncNoteToDiary(reviewText, activeProject.name).then(function(res) {
      setSyncStatus(res.ok ? "sent" : "error");
      if (!res.ok) setTimeout(function() { setSyncStatus("idle"); }, 4000);
      else setTimeout(function() { setSyncStatus("idle"); }, 3500);
    });
  }

  function updateTodayMetric(patch) {
    if (!activeProject) return;
    var prev = metricsRef.current;
    var cur = prev.find(function(m) { return m.project_id === activeProject.id && m.day_key === today; });
    var next = cur
      ? prev.map(function(m) { return m.project_id === activeProject.id && m.day_key === today ? Object.assign({}, m, patch, { updated: Date.now() }) : m; })
      : prev.concat([Object.assign(focusStore.newMetric(today, activeProject.id), patch)]);
    metricsRef.current = next;
    setAllMetrics(next);
    focusStore.saveMetrics(next);
  }

  function addTask() {
    if (!activeProject || !taskInput.trim()) return;
    var t = focusStore.newTask(taskInput.trim(), activeProject.id);
    var next = [t].concat(tasksRef.current);
    tasksRef.current = next;
    setAllTasks(next);
    setTaskInput("");
    focusStore.saveTasks(next);
  }

  function toggleTask(id) {
    var next = tasksRef.current.map(function(t) {
      return t.id === id ? Object.assign({}, t, { done: !t.done, updated: Date.now() }) : t;
    });
    tasksRef.current = next;
    setAllTasks(next);
    focusStore.saveTasks(next);
  }

  function removeTask(id) {
    focusStore.deleteTask(tasksRef.current, id).then(function(next) {
      tasksRef.current = next;
      setAllTasks(next);
    });
  }

  if (!isHydrated) {
    return (
      <div style={{ minHeight: "100vh", background: "#06060b", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", color: CYAN, opacity: 0.5 }}>A carregar estúdio…</p>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <ProjectPicker
        projects={projects}
        metricsByProject={metricsByProject}
        onSelect={selectProject}
        onCreate={createProject}
        onDelete={removeProject}
      />
    );
  }

  var presets = focusTimer.getModePresets();
  var focusMin = timer.modeId === "custom" ? Math.max(1, timer.customFocus || 1) : (presets.find(function(m) { return m.id === timer.modeId; }) || presets[0]).focus;
  var breakMin = timer.modeId === "custom" ? Math.max(1, timer.customBreak || 1) : (presets.find(function(m) { return m.id === timer.modeId; }) || presets[0]).break;
  var phaseTotal = (timer.phase === "focus" ? focusMin : breakMin) * 60;
  var progress = phaseTotal > 0 ? Math.max(0, Math.min(100, (1 - timer.secsLeft / phaseTotal) * 100)) : 0;
  var todayMetric = projectMetrics.find(function(m) { return m.day_key === today; }) || focusStore.newMetric(today, activeProject.id);
  var week = focusStore.lastDays(projectMetrics, 7);
  var maxMin = Math.max(1, Math.max.apply(null, week.map(function(d) { return d.minutes; })));
  var goal = focusStore.goalProgress(activeProject, projectMetrics);
  var ideasOnly = projectIdeas.filter(function(i) { return i.kind !== "review"; });
  var dis = !isHydrated;

  return (
    <div className="fx-root" style={{ "--ac": accent }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{MODULE_ENTRY_CSS + FX_CSS}</style>

      <header className="fx-head">
        <button type="button" className="fx-hbtn" onClick={exitProject} title="Trocar projeto">← Projetos</button>
        <button type="button" className="fx-hbtn" onClick={function() { navigate("/"); }}>Hub</button>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: accent + "18", color: accent, fontSize: 16 }}>{activeProject.icon}</span>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: accent, letterSpacing: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeProject.name}</h1>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono',monospace" }}>
              {timer.running ? "● Sessão activa" : "Estúdio de Foco"} · hoje {todayMetric.minutes} min
            </p>
          </div>
        </div>
        <span className="fx-badge" style={{ color: timer.running ? accent : "#34D399", background: (timer.running ? accent : "#34D399") + "18" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: timer.running ? accent : "#34D399", animation: timer.running ? "fxPulse 1.2s ease infinite" : "none" }} />
          {timer.running ? "A contar" : (auth.user ? "Sync" : "Local")}
        </span>
        <button type="button" className="fx-hbtn" title="Eliminar este projeto"
          onClick={function() {
            if (!window.confirm("Eliminar \"" + activeProject.name + "\" e todos os dados associados?")) return;
            removeProject(activeProject);
          }}
          style={{ color: "rgba(255,107,90,0.75)", borderColor: "rgba(255,107,90,0.25)" }}>×</button>
      </header>

      <div className="fx-shell">
        <aside className="fx-side">
          {SIDEBAR.map(function(item) {
            var on = sidebarTab === item.id;
            return (
              <button key={item.id} type="button" className={"fx-nav" + (on ? " on" : "")} style={{ "--ac": accent }}
                onClick={function() { setSidebarTab(item.id); }} title={item.label}>
                {item.icon}<span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        <main className="fx-main" data-scrollable>
          {sidebarTab === "clock" && (
            <section className="fx-panel" style={{ maxWidth: 520, margin: "0 auto", borderColor: phaseColor + "30" }}>
              <h3 className="fx-title" style={{ color: phaseColor }}><span>◷</span> Relógio · {timer.phase === "focus" ? "Foco" : "Pausa"}</h3>
              <div className="fx-modes">
                {presets.map(function(m) {
                  var on = timer.modeId === m.id;
                  return (
                    <button key={m.id} type="button" className={"fx-mode" + (on ? " on" : "")} onClick={function() { selectMode(m.id); }}
                      style={on ? { background: phaseColor, boxShadow: "0 0 12px " + phaseColor + "55" } : null}>{m.label}</button>
                  );
                })}
              </div>
              {timer.modeId === "custom" && (
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <label className="fx-label">Foco (min)</label>
                    <input type="number" min={1} max={180} className="fx-input" value={timer.customFocus} disabled={timer.running}
                      onChange={function(e) { focusTimer.configureTimer({ customFocus: Math.max(1, parseInt(e.target.value, 10) || 1) }); }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="fx-label">Pausa (min)</label>
                    <input type="number" min={1} max={180} className="fx-input" value={timer.customBreak} disabled={timer.running}
                      onChange={function(e) { focusTimer.configureTimer({ customBreak: Math.max(1, parseInt(e.target.value, 10) || 1) }); }} />
                  </div>
                </div>
              )}
              <div className="fx-clock-wrap">
                <div className="fx-styletog">
                  {CLOCK_STYLES.map(function(st) {
                    return (
                      <button key={st.id} type="button" className={"fx-stybtn" + (timer.clockStyle === st.id ? " on" : "")} style={{ "--ac": phaseColor }}
                        onClick={function() { focusTimer.setClockStyle(st.id); }}>{st.label}</button>
                    );
                  })}
                </div>
                <ClockDisplay style={timer.clockStyle} secs={timer.secsLeft} total={phaseTotal} color={phaseColor} running={timer.running} />
                <p style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: phaseColor, letterSpacing: 2, textTransform: "uppercase" }}>
                  {timer.phase === "focus" ? "● Foco" : "❚❚ Pausa"} · {timer.phase === "focus" ? focusMin : breakMin} min
                </p>
                <div className="fx-prog"><i style={{ width: progress + "%", background: phaseColor, boxShadow: "0 0 10px " + phaseColor }} /></div>
                <div className="fx-tcontrols">
                  <button type="button" className="fx-tbtn" disabled={dis} onClick={handlePause}
                    style={{ borderColor: phaseColor + "66", color: phaseColor, background: phaseColor + "12" }}>
                    {timer.running ? "❚❚ Pausa" : "▶ Iniciar"}
                  </button>
                  <button type="button" className="fx-tbtn" disabled={dis} onClick={handleReset}
                    style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>↺ Reset</button>
                </div>
                <p style={{ margin: 0, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.32)", textAlign: "center", lineHeight: 1.5 }}>
                  O cronómetro continua mesmo ao mudares de aba ou módulo.<br />Pausa/reset creditam os minutos de foco já decorridos.
                </p>
              </div>
            </section>
          )}

          {sidebarTab === "time" && (
            <section className="fx-panel" style={{ maxWidth: 560, margin: "0 auto" }}>
              <h3 className="fx-title" style={{ color: accent }}><span>⏱</span> Tempo Estudado</h3>
              <div className="fx-statgrid">
                <div className="fx-stat"><p>Hoje</p><strong style={{ color: accent }}>{todayMetric.minutes} min</strong></div>
                <div className="fx-stat"><p>Total projeto</p><strong style={{ color: AMBER }}>{fmtHours(goal.studied)}</strong></div>
                <div className="fx-stat"><p>Páginas hoje</p><strong>{todayMetric.pages}</strong></div>
                <div className="fx-stat"><p>Sessão activa</p><strong style={{ color: timer.running && timer.phase === "focus" ? accent : "rgba(255,255,255,0.4)" }}>{timer.running && timer.phase === "focus" ? focusTimer.elapsedFocusMinutes(timer) + " min" : "—"}</strong></div>
              </div>
              <label className="fx-label">Minutos hoje (ajuste manual)</label>
              <input type="number" min={0} className="fx-input" value={todayMetric.minutes} disabled={dis}
                onChange={function(e) { updateTodayMetric({ minutes: Math.max(0, parseInt(e.target.value, 10) || 0) }); }}
                style={{ fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }} />
              <label className="fx-label">Páginas lidas hoje</label>
              <input type="number" min={0} className="fx-input" value={todayMetric.pages} disabled={dis}
                onChange={function(e) { updateTodayMetric({ pages: Math.max(0, parseInt(e.target.value, 10) || 0) }); }}
                style={{ marginBottom: 12 }} />
              <label className="fx-label">Matéria / tema</label>
              <input className="fx-input" value={todayMetric.subject} disabled={dis} placeholder="Ex: Cálculo, Português…"
                onChange={function(e) { updateTodayMetric({ subject: e.target.value }); }} />
              <p style={{ margin: "14px 0 0", fontSize: 10, color: "rgba(255,255,255,0.32)", fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.5 }}>
                Cada sessão de foco concluída, pausa ou reset creditam minutos automaticamente neste projeto.
              </p>
            </section>
          )}

          {sidebarTab === "notes" && (
            <section className="fx-panel" style={{ maxWidth: 640, margin: "0 auto" }}>
              <div className="fx-tabs">
                <button type="button" className={"fx-tab" + (notesTab === "ideas" ? " on" : "")} onClick={function() { setNotesTab("ideas"); }}
                  style={notesTab === "ideas" ? { borderBottomColor: accent, color: accent } : null}>Ideias espontâneas</button>
                <button type="button" className={"fx-tab" + (notesTab === "review" ? " on" : "")} onClick={function() { setNotesTab("review"); }}
                  style={notesTab === "review" ? { borderBottomColor: PINK, color: PINK } : null}>Notas de revisão</button>
              </div>
              {notesTab === "ideas" ? (
                <div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <input className="fx-input" value={ideaInput} disabled={dis} placeholder="Captura rápida sem perder o foco…"
                      onChange={function(e) { setIdeaInput(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") addIdea("idea"); }} />
                    <button type="button" className="fx-btn" disabled={dis || !ideaInput.trim()} onClick={function() { addIdea("idea"); }}
                      style={{ borderColor: accent + "55", color: accent, background: accent + "14" }}>+</button>
                  </div>
                  {ideasOnly.length === 0 ? (
                    <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", padding: 24 }}>Sem ideias ainda.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {ideasOnly.map(function(it) {
                        return (
                          <div key={it.id} className="fx-idea">
                            <button type="button" onClick={function() { removeIdea(it.id); }}>×</button>
                            {it.content}
                            <time style={{ display: "block", marginTop: 5, fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.3)" }}>{it.day_key}</time>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <textarea className="fx-area" value={reviewText} disabled={dis}
                    placeholder={"Resumo importante da matéria…\n\nEnvia para o Diário quando estiveres pronto."}
                    onChange={function(e) { onReviewChange(e.target.value); }} />
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <button type="button" className="fx-btn" disabled={!reviewText.trim() || syncStatus === "sending" || !auth.user} onClick={syncToDiary}
                      style={{ borderColor: PINK + "55", color: PINK, background: PINK + "14" }}>
                      {syncStatus === "sending" ? "A enviar…" : "↗ Sincronizar com Diário"}
                    </button>
                    {syncStatus === "sent" && <span className="fx-badge" style={{ color: "#34D399", background: "rgba(52,211,153,0.14)" }}>Enviado ✓</span>}
                  </div>
                </div>
              )}
            </section>
          )}

          {sidebarTab === "analytics" && (
            <section className="fx-panel">
              <h3 className="fx-title" style={{ color: PURPLE }}><span>◈</span> Analytics · {activeProject.name}</h3>
              <div className="fx-statgrid">
                <div className="fx-stat"><p>Total estudado</p><strong style={{ color: accent }}>{fmtHours(goal.studied)}</strong></div>
                <div className="fx-stat"><p>Média 7 dias</p><strong>{Math.round(week.reduce(function(s, d) { return s + d.minutes; }, 0) / 7)} min/d</strong></div>
                <div className="fx-stat"><p>Melhor dia</p><strong style={{ color: AMBER }}>{Math.max.apply(null, week.map(function(d) { return d.minutes; }))} min</strong></div>
                <div className="fx-stat"><p>Tarefas</p><strong>{projectTasks.filter(function(t) { return t.done; }).length}/{projectTasks.length}</strong></div>
              </div>

              {goal.goalMin > 0 ? (
                <div className="fx-goal" style={{ "--ac": accent }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <p style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Meta: {activeProject.goal_hours}h até {activeProject.deadline ? new Date(activeProject.deadline).toLocaleDateString("pt-PT") : "—"}</p>
                    <strong style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: accent }}>{goal.pct}%</strong>
                  </div>
                  <div className="fx-goal-bar"><i style={{ width: goal.pct + "%" }} /></div>
                  <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.42)" }}>
                    <span>Faltam <strong style={{ color: accent }}>{fmtHours(goal.remaining)}</strong></span>
                    {goal.daysLeft != null ? <span><strong style={{ color: AMBER }}>{goal.daysLeft}</strong> dias restantes</span> : null}
                    {goal.daysLeft != null && goal.daysLeft > 0 ? (
                      <span>Ritmo: <strong>{Math.ceil(goal.remaining / goal.daysLeft)} min/dia</strong></span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <p style={{ margin: "16px 0 6px", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.38)", letterSpacing: 0.6 }}>ÚLTIMOS 7 DIAS</p>
              <div className="fx-chart">
                {week.map(function(d) {
                  var h = Math.round((d.minutes / maxMin) * 100);
                  var isToday = d.day_key === today;
                  return (
                    <div key={d.day_key} className="fx-col" title={d.minutes + " min"}>
                      <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: isToday ? accent : "rgba(255,255,255,0.35)" }}>{d.minutes || "·"}</span>
                      <div className="fx-bar" style={{ height: (d.minutes > 0 ? Math.max(6, h) : 3) + "%", background: isToday ? accent : accent + "88", opacity: d.minutes ? 1 : 0.2 }} />
                      <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: isToday ? accent : "rgba(255,255,255,0.35)" }}>{weekdayShort(d.day_key)}</span>
                    </div>
                  );
                })}
              </div>

              <p style={{ margin: "20px 0 8px", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.38)", letterSpacing: 0.6 }}>REGISTO DIÁRIO</p>
              <div style={{ overflowX: "auto" }}>
                <table className="fx-table">
                  <thead><tr><th>Dia</th><th>Minutos</th><th>Páginas</th><th>Matéria</th></tr></thead>
                  <tbody>
                    {projectMetrics.slice().sort(function(a, b) { return b.day_key.localeCompare(a.day_key); }).slice(0, 14).map(function(m) {
                      return (
                        <tr key={m.id}>
                          <td style={m.day_key === today ? { color: accent } : null}>{m.day_key}</td>
                          <td>{m.minutes}</td>
                          <td>{m.pages || "—"}</td>
                          <td style={{ color: "rgba(255,255,255,0.45)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subject || "—"}</td>
                        </tr>
                      );
                    })}
                    {!projectMetrics.length ? <tr><td colSpan={4} style={{ color: "rgba(255,255,255,0.3)", textAlign: "center" }}>Sem registos ainda</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {sidebarTab === "tasks" && (
            <section className="fx-panel" style={{ maxWidth: 560, margin: "0 auto" }}>
              <h3 className="fx-title" style={{ color: accent }}><span>☑</span> Tarefas</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input className="fx-input" value={taskInput} disabled={dis} placeholder="Nova tarefa…"
                  onChange={function(e) { setTaskInput(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") addTask(); }} />
                <button type="button" className="fx-btn" disabled={dis || !taskInput.trim()} onClick={addTask}
                  style={{ borderColor: accent + "55", color: accent, background: accent + "14" }}>+</button>
              </div>
              {projectTasks.length === 0 ? (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", padding: 24 }}>Lista vazia. Adiciona tarefas para este projeto.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {projectTasks.map(function(t) {
                    return (
                      <div key={t.id} className={"fx-task" + (t.done ? " done" : "")}>
                        <button type="button" className={"fx-task-check" + (t.done ? " on" : "")} style={{ "--ac": accent }}
                          onClick={function() { toggleTask(t.id); }}>{t.done ? "✓" : ""}</button>
                        <span style={{ flex: 1, fontSize: 13, textDecoration: t.done ? "line-through" : "none", color: t.done ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)" }}>{t.text}</span>
                        <button type="button" onClick={function() { removeTask(t.id); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 14 }}>×</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export function FocusIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 14v10l6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
