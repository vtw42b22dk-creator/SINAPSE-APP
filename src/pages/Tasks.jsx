import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "../lib/AuthContext";
import * as taskStore from "../lib/tasksStore";
import { PageLoader } from "../components/PageLoader";
import { HubBack, HUB_BACK_CSS } from "../components/HubBack";
import { fs, hasTouchPrimary } from "../lib/mobileUi";
import { MICRO_CSS } from "../lib/microUi";
import { moduleColor, moduleGlow, MODULE_GLOW_CSS } from "../lib/theme";
import { supabase } from "../lib/supabase";
import { onSync } from "../lib/syncEvents";
import { isCloudPullPaused } from "../lib/cloudSyncGuard";

var ACCENT = moduleColor("tasks");
var COLUMNS = [
  { id: "inbox", label: "Inbox", icon: "◎", hint: "Captura rápida" },
  { id: "today", label: "Hoje", icon: "◉", hint: "Foco do dia" },
  { id: "done", label: "Concluído", icon: "✓", hint: "Vitórias" },
];
var MOBILE_VIEWS = [
  { id: "inbox", label: "Inbox", icon: "◎", hint: "Captura rápida", columns: ["inbox"] },
  { id: "today", label: "Hoje", icon: "◉", hint: "Foco e progresso", columns: ["today"] },
  { id: "done", label: "Concluídas", icon: "✓", hint: "Vitórias", columns: ["done"] },
];
var PRIORITIES = [
  { id: "low", label: "Baixa", color: "rgba(255,255,255,0.35)" },
  { id: "med", label: "Média", color: "#C4A57C" },
  { id: "high", label: "Alta", color: "#E6E6E9" },
];

var SAVE_DEBOUNCE_MS = 900;

var TASKS_CSS = [
  MICRO_CSS,
  MODULE_GLOW_CSS,
  "@keyframes taskIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}",
  ".tk-page{min-height:100vh;background:transparent;color:#F4F2EF;font-family:'Manrope',sans-serif;position:relative;overflow-x:hidden}",
  ".tk-head{position:sticky;top:0;z-index:20;padding:14px 20px;background:rgba(255,255,255,.08);backdrop-filter:blur(40px) saturate(1.85);-webkit-backdrop-filter:blur(40px) saturate(1.85);box-shadow:inset 0 1px 0 rgba(255,255,255,.4);border-bottom:1px solid rgba(255,255,255,.12);border-radius:0 0 24px 24px}",
  ".tk-head-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}",
  ".tk-head-inner--mob{flex-direction:column;align-items:stretch;padding:12px}",
  ".tk-back{padding:6px 2px;border:none;border-bottom:1px solid rgba(255,255,255,.14);background:transparent;color:#A0A0A8;font-size:12px;cursor:pointer;font-family:'Manrope',sans-serif;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-back:hover{color:#EDEDEF;border-bottom-color:#EDEDEF}",
  ".tk-back:active{transform:translateY(1px)}",
  ".tk-search-row{display:flex;align-items:center;gap:10px;flex:1;max-width:380px;min-width:180px}",
  ".tk-search-row--full{max-width:none}",
  ".tk-focus-btn{padding:8px 4px;border:none;border-bottom:1px solid rgba(255,255,255,.12);background:transparent;color:#6E6E76;font-size:11px;font-family:'Manrope',sans-serif;cursor:pointer;white-space:nowrap;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-focus-btn.is-on{color:var(--mc);border-bottom-color:var(--mc)}",
  ".tk-focus-btn:active{transform:scale(.96)}",
  ".tk-zone-btn{padding:8px 4px;border:none;border-bottom:1px solid rgba(255,255,255,.2);background:transparent;color:#A0A0A8;font-size:11px;font-family:'Manrope',sans-serif;cursor:pointer;white-space:nowrap;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-zone-btn:hover{color:var(--mc);border-bottom-color:var(--mc)}",
  ".tk-zone-btn:active{transform:scale(.96)}",
  ".tk-zone-entry{display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%;margin:0 0 22px;padding:14px 16px;border:none;border-radius:18px;background:linear-gradient(168deg,rgba(255,255,255,.1),rgba(8,8,14,.32));backdrop-filter:blur(24px);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),inset 0 -1px 1px rgba(0,0,0,.32);color:rgba(255,255,255,.7);cursor:pointer;text-align:left;font-family:inherit}",
  ".tk-zone-entry strong{font-family:'Manrope',sans-serif;font-weight:600;font-size:14px;color:#fff}",
  ".tk-zone-entry span{font-size:12px;color:rgba(255,255,255,.55)}",
  ".tk-zone-entry:hover{background:rgba(255,255,255,.18)}",
  ".tk-switch{display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;padding:12px 14px;border:none;border-radius:16px;background:linear-gradient(168deg,rgba(255,255,255,.1),rgba(8,8,14,.3));box-shadow:inset 0 1px 0 rgba(255,255,255,.5),inset 0 -1px 1px rgba(0,0,0,.3);color:#fff;cursor:pointer;text-align:left;font-family:'Manrope',sans-serif}",
  ".tk-switch b{display:block;font-weight:600;font-size:14px;color:#fff}",
  ".tk-switch span span{display:block;margin-top:2px;font-size:12px;color:rgba(255,255,255,.55);font-weight:400}",
  ".tk-switch i{position:relative;flex-shrink:0;width:46px;height:28px;border-radius:999px;background:rgba(255,255,255,.18)}",
  ".tk-switch i::after{content:'';position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s ease}",
  ".tk-switch.is-on{background:rgba(255,255,255,.2)}",
  ".tk-switch.is-on i{background:rgba(255,255,255,.85)}",
  ".tk-switch.is-on i::after{transform:translateX(18px);background:#1a1c28}",
  ".tk-horizon-hint{margin:8px 0 0;font-size:12px;line-height:1.5;color:rgba(255,255,255,.55)}",
  ".tk-long-lead{margin:0 0 18px;max-width:56ch;font-size:13.5px;line-height:1.55;color:#A0A0A8}",
  ".tk-long-list{display:flex;flex-direction:column;gap:10px;max-width:720px}",
  ".tk-release{background:none;border:none;border-bottom:1px solid rgba(255,255,255,.16);color:#A0A0A8;cursor:pointer;font-size:10px;font-family:'Manrope',sans-serif;letter-spacing:.3px;padding:6px 2px;white-space:nowrap}",
  ".tk-release:hover{color:var(--mc);border-bottom-color:var(--mc)}",
  ".tk-new-btn{background:transparent;border:none;border-bottom:2px solid var(--mc);color:var(--mc);font-size:12px;padding:10px 4px;cursor:pointer;font-family:'Manrope',sans-serif;font-weight:500;transition:opacity var(--dur-fast) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-new-btn:hover{opacity:.85}",
  ".tk-new-btn:active{transform:scale(.96);opacity:.7}",
  ".tk-body{max-width:1200px;margin:0 auto;padding:16px 20px 80px}",
  ".tk-body--mob{padding:14px 12px 80px}",
  ".tk-progress-wrap{display:flex;align-items:center;gap:16px;margin-bottom:24px;flex-wrap:wrap}",
  ".tk-progress{flex:1;min-width:200px;height:4px;background:rgba(255,255,255,.08);overflow:hidden;border-radius:var(--radius-pill)}",
  ".tk-progress i{display:block;height:100%;background:var(--mc);transition:width var(--dur-slow) var(--ease)}",
  ".tk-stats{margin:0;font-size:11px;font-family:'Manrope',sans-serif;color:#6E6E76;letter-spacing:.3px}",
  ".tk-form{margin-bottom:28px;padding:0 0 24px;border-bottom:1px solid rgba(255,255,255,.1);animation:taskIn var(--dur) var(--ease)}",
  ".tk-form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}",
  ".tk-form-grid--mob{grid-template-columns:1fr}",
  ".tk-form-actions{display:flex;align-items:center;gap:12px;margin-top:20px;flex-wrap:wrap}",
  ".tk-save{padding:10px 4px;border:none;border-bottom:2px solid #EDEDEF;background:transparent;color:#EDEDEF;font-size:12px;font-weight:500;cursor:pointer;font-family:'Manrope',sans-serif;transition:transform var(--dur-fast) var(--ease),opacity var(--dur-fast) var(--ease)}",
  ".tk-save:active{transform:scale(.96);opacity:.75}",
  ".tk-cancel,.tk-quick-save{padding:10px 4px;border:none;border-bottom:1px solid rgba(255,255,255,.12);background:transparent;color:#A0A0A8;font-size:12px;cursor:pointer;font-family:inherit;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".tk-cancel:hover{color:#EDEDEF;border-bottom-color:rgba(255,255,255,.3)}",
  ".tk-quick-save{margin-left:auto;color:#6E6E76;border:none}",
  ".tk-quick-save:hover{color:#A0A0A8}",
  ".tk-warn{margin:0 0 14px;padding:10px 0;border-bottom:1px solid rgba(196,165,124,.35);color:#C4A57C;font-size:11px;font-family:'Manrope',sans-serif;line-height:1.5}",
  ".task-col{animation:taskIn var(--dur-slow) var(--ease) both}",
  ".tk-card{position:relative;isolation:isolate;padding:14px 14px;background:linear-gradient(168deg,rgba(255,255,255,.12),rgba(255,255,255,.03) 42%,rgba(8,8,14,.4));border:1px solid transparent;border-radius:18px;margin-bottom:10px;backdrop-filter:blur(32px) saturate(1.7);-webkit-backdrop-filter:blur(32px) saturate(1.7);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -1px 1px rgba(0,0,0,.38),0 10px 28px rgba(0,0,0,.28);overflow:hidden;transition:opacity var(--dur) var(--ease),background var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-card:hover{background:rgba(255,255,255,.04);border-color:color-mix(in srgb,var(--mc) 30%,rgba(255,255,255,.1));transform:translateY(-2px)}",
  ".tk-card:hover{padding-left:4px;border-bottom-color:rgba(255,255,255,.14)}",
  ".tk-card:active{transform:scale(.995)}",
  ".tk-card.is-done{opacity:.48}",
  ".tk-card.is-late{border-bottom-color:rgba(192,140,140,.45)}",
  ".tk-check{display:flex;align-items:center;justify-content:center;width:22px;height:22px;flex-shrink:0;margin-top:2px;border:1.5px solid rgba(255,255,255,.35);border-radius:50%;background:transparent;color:transparent;font-size:12px;line-height:1;cursor:pointer;padding:0;transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-check:hover{border-color:rgba(255,255,255,.7);transform:scale(1.08)}",
  ".tk-check.on{background:#E6E6E9;border-color:#E6E6E9;color:#070708;animation:uiPop .38s var(--ease)}",
  ".tk-title{margin:0;line-height:1.45;color:#EDEDEF;overflow-wrap:anywhere;transition:color var(--dur) var(--ease)}",
  ".tk-card.is-done .tk-title{text-decoration:line-through;color:#6E6E76}",
  ".tk-notes{margin:7px 0 0;line-height:1.55;color:#A0A0A8;overflow-wrap:anywhere}",
  ".tk-notes.is-min{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-clamp:2}",
  ".tk-notes-tog{margin:6px 0 0;padding:0;border:none;background:none;color:#6E6E76;font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:.5px;cursor:pointer;min-height:0}",
  ".tk-notes-tog:hover{color:var(--mc)}",
  ".tk-subs{margin:10px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:7px}",
  ".tk-sub{display:flex;align-items:center;gap:9px;font-size:12.5px}",
  ".tk-sub>button{display:flex;align-items:center;justify-content:center;width:16px;height:16px;flex-shrink:0;padding:0;border:1.5px solid rgba(255,255,255,.28);border-radius:50%;background:transparent;color:transparent;font-size:10px;line-height:1;cursor:pointer;transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-sub>button:hover{transform:scale(1.1)}",
  ".tk-sub>button.on{background:#E6E6E9;border-color:#E6E6E9;color:#070708}",
  ".tk-sub>span{color:#A0A0A8;line-height:1.4}",
  ".tk-sub.on>span{color:#6E6E76;text-decoration:line-through}",
  ".tk-meta{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:11px;font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:.6px}",
  ".tk-dot{display:inline-block;width:5px;height:5px;margin-right:6px;vertical-align:middle}",
  ".tk-due{color:#6E6E76}",
  ".tk-due.late{color:#C08C8C}",
  ".tk-tag{padding:0;color:#A0A0A8;letter-spacing:.3px}",
  ".tk-move{margin-top:10px;width:100%;min-height:44px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:10px;color:#EDEDEF;font-size:14px;font-family:inherit;padding:8px 10px;color-scheme:dark}",
  ".tk-act{display:flex;flex-direction:column;gap:2px;opacity:0;transition:opacity var(--dur) var(--ease)}",
  ".tk-card:hover .tk-act,.tk-card:focus-within .tk-act{opacity:1}",
  ".tk-act>button{background:none;border:none;color:#6E6E76;cursor:pointer;font-size:12px;line-height:1;padding:5px 6px;transition:color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-act>button:hover{color:#EDEDEF;transform:scale(1.1)}",
  "@media(hover:none){.tk-act{opacity:1}}",
  ".tk-lbl{font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#6E6E76;font-family:'Manrope',sans-serif}",
  ".tk-count{font-family:'Manrope',sans-serif;font-size:11px;color:#6E6E76;padding:0}",
  ".tk-empty{margin:0;padding:22px 0;text-align:left;font-size:12px;color:#6E6E76;line-height:1.5}",
  ".tk-in{background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.12);color:#EDEDEF;outline:none;font-family:inherit;transition:border-color var(--dur) var(--ease),padding-left var(--dur) var(--ease)}",
  ".tk-in:focus{border-bottom-color:rgba(255,255,255,.4);padding-left:4px}",
  ".tk-col{padding:8px 0 18px;background:transparent;border:none}",
  ".tk-col-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding:0 2px;gap:8px;flex-wrap:wrap}",
  ".tk-col-title{display:flex;align-items:center;gap:9px}",
  ".tk-clear{padding:6px 4px;border:none;border-bottom:1px solid rgba(192,140,140,.35);background:transparent;color:#C08C8C;cursor:pointer;font-size:11px;font-family:'Manrope',sans-serif;white-space:nowrap;transition:opacity var(--dur-fast) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-clear:active{transform:scale(.96);opacity:.75}",
  ".tk-tab{display:flex;align-items:center;gap:16px;width:100%;text-align:left;padding:20px 0;cursor:pointer;font-family:inherit;border:none;border-bottom:1px solid rgba(255,255,255,.08);background:transparent;transition:color var(--dur) var(--ease),padding-left var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-tab:hover{padding-left:6px}",
  ".tk-tab:active{transform:scale(.995)}",
  ".tk-tab-icon{font-size:20px;line-height:1;color:#A0A0A8;flex-shrink:0;width:32px}",
  ".tk-tab-count{font-size:15px;font-family:'Manrope',sans-serif;color:#EDEDEF;min-width:34px;text-align:right}",
  ".tk-fab{position:fixed;z-index:40;right:18px;bottom:max(20px,env(safe-area-inset-bottom));width:58px;height:58px;border:none;border-radius:50%;background:color-mix(in srgb,var(--mc) 22%,#111);color:var(--mc);font-size:28px;font-weight:300;line-height:1;box-shadow:0 10px 28px rgba(0,0,0,.45);cursor:pointer;display:flex;align-items:center;justify-content:center}",
  ".tk-sheet-bg{position:fixed;inset:0;z-index:80;background:rgba(6,8,16,.48);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;padding:24px}",
  ".tk-sheet{position:relative;isolation:isolate;width:min(440px,100%);max-height:min(86vh,680px);overflow:auto;background:linear-gradient(168deg,rgba(255,255,255,.16),rgba(255,255,255,.04) 38%,rgba(8,8,14,.58));backdrop-filter:blur(48px) saturate(1.9);-webkit-backdrop-filter:blur(48px) saturate(1.9);border:1px solid transparent;box-shadow:inset 0 1px 0 rgba(255,255,255,.62),inset 0 -1px 1px rgba(0,0,0,.42),0 28px 70px rgba(0,0,0,.45);padding:22px 22px 18px;border-radius:28px}",
  ".tk-sheet::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;pointer-events:none;z-index:2;background:linear-gradient(155deg,rgba(255,255,255,.7),rgba(255,255,255,.12) 32%,rgba(255,255,255,.04) 55%,rgba(255,255,255,.22));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}",
  ".tk-sheet>*{position:relative;z-index:3}",
  ".tk-sheet-kicker{margin:0 0 4px;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:rgba(255,255,255,.45);font-family:'Manrope',sans-serif}",
  ".tk-sheet-h{margin:0 0 16px;font-family:'Syne',sans-serif;font-size:26px;font-weight:700;letter-spacing:-.04em;color:#fff}",
  ".tk-sheet-handle{display:none}",
  ".tk-sheet-title{width:100%;box-sizing:border-box;background:rgba(255,255,255,.12);border:none;border-radius:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.4);color:#fff;font-size:18px;font-family:'Manrope',sans-serif;outline:none;padding:14px 14px;margin-top:8px}",
  ".tk-sheet-title::placeholder{color:rgba(255,255,255,.4)}",
  ".tk-sheet .tk-in{width:100%;margin-top:10px;padding:12px 14px!important;border-radius:14px!important;background:rgba(255,255,255,.06)!important}",
  ".tk-chips{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px}",
  ".tk-chip{min-height:40px;padding:8px 14px;border-radius:999px;border:none;background:rgba(255,255,255,.1);box-shadow:inset 0 1px 0 rgba(255,255,255,.35);color:rgba(255,255,255,.7);font-family:'Manrope',sans-serif;font-size:13px;cursor:pointer}",
  ".tk-chip.is-on{color:#fff;background:rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -1px 1px rgba(0,0,0,.3)}",
  ".tk-sheet-go{width:100%;min-height:50px;margin-top:16px;border:none;border-radius:999px;background:rgba(255,255,255,.14);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -1px 1px rgba(0,0,0,.35);font-family:'Manrope',sans-serif;font-size:15px;font-weight:700;cursor:pointer;backdrop-filter:blur(20px)}",
  ".tk-sheet-cancel{width:100%;min-height:44px;margin-top:6px;border:none;background:transparent;color:rgba(255,255,255,.6);font-size:14px;cursor:pointer}",
  "@media(max-width:719px){.tk-sheet-bg{padding:16px}.tk-sheet{width:min(440px,100%);max-height:88vh;padding:18px 16px 16px}}",
  "@media(max-width:719px){",
  ".tk-head{padding:12px;padding-top:max(12px,env(safe-area-inset-top))}",
  ".tk-head-inner{flex-direction:column;align-items:stretch}",
  ".tk-check{width:20px;height:20px;margin-top:2px;border-width:1.5px;font-size:11px;flex-shrink:0}",
  ".tk-sub{gap:8px;min-height:0}",
  ".tk-sub>button{width:16px;height:16px;font-size:9px;border-width:1.5px}",
  ".tk-act{opacity:1;flex-direction:row;align-items:center}",
  ".tk-act>button{min-width:44px;min-height:44px;font-size:18px;padding:8px}",
  ".tk-card{padding:14px 12px}",
  ".tk-empty{padding:16px 0}",
  "}",
].join("");

function uid() { return "t" + Date.now() + Math.random().toString(36).slice(2, 7); }
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function todayKey() {
  var t = new Date();
  return t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate());
}
function TaskCard(props) {
  var t = props.task, p = PRIORITIES.find(function(x) { return x.id === t.priority; }) || PRIORITIES[0];
  var done = props.col === "done" || props.col === "longdone";
  var overdue = t.due && t.due < todayKey() && !done;
  var mob = props.isMobile;
  var notesOpenS = useState(false);
  var notesOpen = notesOpenS[0], setNotesOpen = notesOpenS[1];
  var overflowS = useState(false);
  var overflow = overflowS[0], setOverflow = overflowS[1];
  var notesRef = useRef(null);
  var notes = t.notes || "";

  useEffect(function() {
    setNotesOpen(false);
  }, [notes]);

  useEffect(function() {
    var el = notesRef.current;
    if (!el || !notes || notesOpen) return;
    function measure() {
      if (!notesRef.current) return;
      setOverflow(notesRef.current.scrollHeight > notesRef.current.clientHeight + 1);
    }
    var id = requestAnimationFrame(measure);
    return function() { cancelAnimationFrame(id); };
  }, [notes, notesOpen, mob]);
  return (
    <article
      className={"tk-card" + (done ? " is-done" : "") + (overdue ? " is-late" : "")}
      draggable={!props.readOnly && !props.lockDrag}
      onDragStart={function(e) { if (props.readOnly || props.lockDrag) return; e.dataTransfer.setData("text/task-id", t.id); }}
      style={{ cursor: props.readOnly || props.lockDrag ? "default" : "grab" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
        <button type="button" className={"tk-check" + (done ? " on" : "")} onClick={function() { props.onToggle(t.id); }}
          title={done ? "Reabrir" : "Concluir"}>{done ? "✕" : ""}</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="tk-title" style={{ fontSize: fs(mob, 13.5, 16) }}>{t.title}</p>
          {notes ? (
            <div>
              <p ref={notesRef} className={"tk-notes" + (!notesOpen ? " is-min" : "")} style={{ fontSize: fs(mob, 12, 14) }}>{notes}</p>
              {(overflow || notesOpen) ? (
                <button type="button" className="tk-notes-tog" onClick={function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  setNotesOpen(!notesOpen);
                }}>{notesOpen ? "Mostrar menos" : "Mostrar mais"}</button>
              ) : null}
            </div>
          ) : null}
          {(t.subtasks || []).length > 0 && (
            <ul className="tk-subs">
              {t.subtasks.map(function(st) {
                return (
                  <li key={st.id} className={"tk-sub" + (st.done ? " on" : "")}>
                    <button type="button" className={st.done ? "on" : ""}
                      onClick={function(e) { e.stopPropagation(); if (props.onToggleSubtask) props.onToggleSubtask(st.id); }}>{st.done ? "✕" : ""}</button>
                    <span>{st.title}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="tk-meta">
            <span style={{ color: p.color }}><i className="tk-dot" style={{ background: p.color }} />{p.label.toUpperCase()}</span>
            {t.due && (
              <span className={"tk-due" + (overdue ? " late" : "")}>
                {overdue ? "Atrasada · " : ""}{t.due.split("-").reverse().join("/")}
              </span>
            )}
            {(t.tags || []).map(function(tag) {
              return <span key={tag} className="tk-tag">{tag}</span>;
            })}
          </div>
          {props.onMove && props.lockDrag ? (
            <select className="tk-move" value={props.col} aria-label="Mover tarefa"
              onChange={function(e) { props.onMove(t.id, e.target.value); }}>
              {COLUMNS.map(function(c) {
                return <option key={c.id} value={c.id}>{c.label}</option>;
              })}
            </select>
          ) : null}
        </div>
        {!props.readOnly && (
          <div className="tk-act">
            {props.onRelease ? (
              <button type="button" className="tk-release" title="Voltar ao quadro" onClick={function() { props.onRelease(t.id); }}>Quadro</button>
            ) : null}
            <button type="button" title="Editar" onClick={function() { props.onEdit(t); }}>✎</button>
            <button type="button" title="Apagar" onClick={function() { props.onDelete(t.id); }}>×</button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function Tasks() {
  var auth = useAuth();
  var vwS = useState(window.innerWidth);
  var viewportW = vwS[0], setViewportW = vwS[1];
  var isMobile = viewportW < 720;
  var isTouch = hasTouchPrimary();
  var touchCreate = isMobile || isTouch;
  var tS = useState([]);
  var tasks = tS[0], setTasks = tS[1];
  var loadedS = useState(false);
  var loaded = loadedS[0], setLoaded = loadedS[1];
  var qS = useState("");
  var query = qS[0], setQuery = qS[1];
  var focusS = useState(false);
  var focusToday = focusS[0], setFocusToday = focusS[1];
  var draftS = useState({ title: "", notes: "", priority: "med", due: "", tags: "", column: "inbox", subtasks: [], horizon: false });
  var subDraftS = useState("");
  var subDraft = subDraftS[0], setSubDraft = subDraftS[1];
  var draft = draftS[0], setDraft = draftS[1];
  var editIdS = useState(null);
  var editId = editIdS[0], setEditId = editIdS[1];
  var showFormS = useState(false);
  var showForm = showFormS[0], setShowForm = showFormS[1];
  var mobileTabS = useState(null);
  var mobileTab = mobileTabS[0], setMobileTab = mobileTabS[1];
  var zoneS = useState("board");
  var zone = zoneS[0], setZone = zoneS[1];
  var showLong = zone === "long" || mobileTab === "long";

  var tasksRef = useRef([]);
  var isHydratedRef = useRef(false);
  var skipSaveRef = useRef(false);
  var saveTimerRef = useRef(null);
  var lastSaveAt = useRef(0);
  var lastDeleteAt = useRef(0);
  var dirtyRef = useRef(false);
  var syncWarnS = useState("");
  var syncWarn = syncWarnS[0], setSyncWarn = syncWarnS[1];

  function commitTasks(next) {
    tasksRef.current = next;
    setTasks(next);
  }

  function reportSave(res) {
    if (!res) return;
    if (res.emergency) {
      setSyncWarn("Sessão expirada — tarefas guardadas neste dispositivo. Inicia sessão no Hub para sincronizar.");
      return;
    }
    if (res.ok && res.cloud) {
      lastSaveAt.current = Date.now();
      setSyncWarn("");
    } else if (res.error) {
      setSyncWarn("Nuvem: " + res.error);
    }
  }

  var syncFromCloud = useCallback(function() {
    if (!isHydratedRef.current) return Promise.resolve();
    if (dirtyRef.current) return Promise.resolve();
    if (isCloudPullPaused("tasks")) return Promise.resolve();
    if (Date.now() - lastDeleteAt.current < 4000) return Promise.resolve();
    return taskStore.pullTasks().then(function(merged) {
      if (skipSaveRef.current || dirtyRef.current) return;
      skipSaveRef.current = true;
      commitTasks(merged);
      setTimeout(function() { skipSaveRef.current = false; }, 150);
    }).catch(function() {});
  }, []);

  function persistDebounced() {
    if (!isHydratedRef.current || skipSaveRef.current) return;
    dirtyRef.current = true;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(function() {
      if (skipSaveRef.current) return;
      taskStore.saveTasks(tasksRef.current).then(function(res) {
        dirtyRef.current = false;
        reportSave(res);
      });
    }, SAVE_DEBOUNCE_MS);
  }

  function persistNow(next) {
    if (!isHydratedRef.current) return Promise.resolve();
    var list = next || tasksRef.current;
    tasksRef.current = list;
    setTasks(list);
    dirtyRef.current = true;
    return taskStore.saveTasksNow(list).then(function(res) {
      dirtyRef.current = false;
      reportSave(res);
    });
  }

  useEffect(function() {
    var alive = true;
    skipSaveRef.current = true;
    isHydratedRef.current = false;
    taskStore.loadTasksLocal()
      .then(function(local) {
        if (!alive) return;
        commitTasks(local);
        return taskStore.loadTasks();
      })
      .then(function(merged) {
        if (!alive) return;
        commitTasks(merged || []);
      })
      .finally(function() {
        if (!alive) return;
        setLoaded(true);
        isHydratedRef.current = true;
        setTimeout(function() { skipSaveRef.current = false; }, 200);
      });
    return function() { alive = false; };
  }, []);

  useEffect(function() {
    if (!loaded) return;
    return onSync(function(detail) {
      var table = detail && detail.table;
      if (table && table !== "*" && table !== "tasks") return;
      syncFromCloud();
    });
  }, [loaded, syncFromCloud]);

  useEffect(function() {
    function onResize() {
      var w = window.innerWidth;
      setViewportW(w);
      if (w >= 720) setMobileTab(null);
    }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  useEffect(function() {
    if (!loaded || !isHydratedRef.current) return;
    tasksRef.current = tasks;
    persistDebounced();
    return function() { clearTimeout(saveTimerRef.current); };
  }, [tasks, loaded]);

  useEffect(function() {
    if (!loaded) return;
    function flush() {
      if (!isHydratedRef.current || !dirtyRef.current) return;
      clearTimeout(saveTimerRef.current);
      dirtyRef.current = false;
      taskStore.saveTasksNow(tasksRef.current).then(reportSave);
    }
    function onVis() {
      if (!isHydratedRef.current) return;
      if (document.visibilityState === "hidden") flush();
      else syncFromCloud();
    }
    window.addEventListener("beforeunload", flush);
    window.addEventListener("focus", syncFromCloud);
    document.addEventListener("visibilitychange", onVis);
    var timer = setInterval(function() {
      if (document.visibilityState === "visible") syncFromCloud();
    }, 12000);
    var channel = null;
    if (supabase && auth.user) {
      channel = supabase.channel("sync-tasks-" + auth.user.id.slice(0, 8));
      channel.on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, function() {
        syncFromCloud();
      });
      channel.subscribe();
    }
    return function() {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("focus", syncFromCloud);
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(timer);
      if (channel) {
        try { supabase.removeChannel(channel); } catch (e) {}
      }
    };
  }, [loaded, syncFromCloud, auth.user && auth.user.id]);

  var stats = useMemo(function() {
    var board = tasks.filter(function(t) { return !taskStore.isLongTerm(t); });
    var done = board.filter(function(t) { return t.column === "done"; }).length;
    var today = board.filter(function(t) { return t.column === "today"; }).length;
    var longDone = tasks.filter(function(t) { return t.column === "longdone"; }).length;
    var longTotal = tasks.filter(function(t) { return taskStore.isLongTerm(t); }).length;
    return {
      total: board.length,
      done: done,
      today: today,
      pct: board.length ? Math.round((done / board.length) * 100) : 0,
      longDone: longDone,
      longTotal: longTotal,
      longPct: longTotal ? Math.round((longDone / longTotal) * 100) : 0,
    };
  }, [tasks]);

  var filtered = useMemo(function() {
    var q = query.trim().toLowerCase();
    var inLong = zone === "long" || mobileTab === "long";
    return tasks.filter(function(t) {
      var long = taskStore.isLongTerm(t);
      if (inLong !== long) return false;
      if (!inLong && focusToday && t.column !== "today") return false;
      if (!q) return true;
      return (t.title && t.title.toLowerCase().indexOf(q) >= 0) || (t.notes && t.notes.toLowerCase().indexOf(q) >= 0);
    });
  }, [tasks, query, focusToday, zone, mobileTab]);

  function tasksInCol(col) {
    return filtered.filter(function(t) { return t.column === col; }).sort(function(a, b) {
      var po = { high: 0, med: 1, low: 2 };
      return (po[a.priority] || 1) - (po[b.priority] || 1);
    });
  }

  function countMobileView(viewId) {
    var v = MOBILE_VIEWS.find(function(x) { return x.id === viewId; });
    if (!v) return 0;
    return v.columns.reduce(function(n, col) { return n + tasksInCol(col).length; }, 0);
  }

  var activeMobileView = useMemo(function() {
    if (!isMobile || !mobileTab) return null;
    return MOBILE_VIEWS.find(function(v) { return v.id === mobileTab; }) || null;
  }, [isMobile, mobileTab]);

  var visibleColumns = useMemo(function() {
    if (isMobile && activeMobileView) {
      return COLUMNS.filter(function(c) { return activeMobileView.columns.indexOf(c.id) >= 0; });
    }
    if (isMobile && !mobileTab) return [];
    return COLUMNS;
  }, [isMobile, activeMobileView, mobileTab]);

  var resetDraft = useCallback(function() {
    setDraft({ title: "", notes: "", priority: "med", due: "", tags: "", column: "inbox", subtasks: [], horizon: false });
    setSubDraft("");
    setEditId(null);
    setShowForm(false);
  }, []);

  function columnForSave(d) {
    var column = d.column || "inbox";
    if (column === "doing") column = "today";
    if (d.horizon) {
      if (column === "done" || column === "longdone") return "longdone";
      return "long";
    }
    if (column === "long") return "inbox";
    if (column === "longdone") return "done";
    return column;
  }

  function setHorizon(on) {
    var next = { horizon: !!on };
    if (!on && taskStore.isLongTerm({ column: draft.column })) next.column = draft.column === "longdone" ? "done" : "inbox";
    setDraft(Object.assign({}, draft, next));
  }

  function openLong() {
    setZone("long");
    setMobileTab("long");
    resetDraft();
  }

  function closeLong() {
    setZone("board");
    setMobileTab(null);
    resetDraft();
  }

  function openComposer() {
    var horizon = zone === "long" || mobileTab === "long";
    setEditId(null);
    setSubDraft("");
    setDraft({
      title: "",
      notes: "",
      priority: "med",
      due: "",
      tags: "",
      column: horizon ? "long" : (activeMobileView && activeMobileView.id === "today" ? "today" : activeMobileView && activeMobileView.id === "done" ? "done" : "inbox"),
      subtasks: [],
      horizon: horizon,
    });
    setShowForm(true);
  }

  function saveTask(fromDraft) {
    var d = fromDraft && typeof fromDraft.title === "string" ? fromDraft : draft;
    if (!d.title || !d.title.trim()) return;
    var tags = (d.tags || "").split(",").map(function(s) { return s.trim(); }).filter(Boolean).slice(0, 4);
    var item = {
      id: editId || uid(),
      title: d.title.trim(),
      notes: (d.notes || "").trim(),
      priority: d.priority,
      due: d.due || null,
      tags: tags,
      subtasks: d.subtasks || [],
      column: columnForSave(d),
      created: editId ? undefined : Date.now(),
      updated: Date.now(),
    };
    var next;
    if (editId) {
      next = tasksRef.current.map(function(t) {
        return t.id === editId ? taskStore.touchTask(t, item) : t;
      });
    } else {
      next = tasksRef.current.concat([Object.assign({}, item, { created: Date.now() })]);
    }
    skipSaveRef.current = true;
    clearTimeout(saveTimerRef.current);
    persistNow(next).finally(function() {
      setTimeout(function() { skipSaveRef.current = false; }, 150);
    });
    resetDraft();
  }

  function startEdit(t) {
    setEditId(t.id);
    setDraft({
      title: t.title,
      notes: t.notes || "",
      priority: t.priority || "med",
      due: t.due || "",
      tags: (t.tags || []).join(", "),
      subtasks: (t.subtasks || []).slice(),
      column: t.column,
      horizon: taskStore.isLongTerm(t),
    });
    setShowForm(true);
  }

  function clearColumn(colId) {
    var list = tasksInCol(colId);
    if (!list.length) return;
    var label = colId === "inbox" ? "Inbox" : "Concluídas";
    if (!window.confirm("Apagar todas as " + list.length + " tarefas em «" + label + "»? Esta acção não pode ser desfeita.")) return;
    var ids = list.map(function(t) { return t.id; });
    var prev = tasksRef.current;
    var next = prev.filter(function(t) { return ids.indexOf(t.id) < 0; });
    skipSaveRef.current = true;
    clearTimeout(saveTimerRef.current);
    commitTasks(next);
    if (editId && ids.indexOf(editId) >= 0) resetDraft();
    taskStore.deleteTasksByIds(prev, ids).finally(function() {
      lastDeleteAt.current = Date.now();
      setTimeout(function() { skipSaveRef.current = false; }, 200);
    });
  }

  function deleteTask(id) {
    if (!window.confirm("Apagar esta tarefa?")) return;
    var prev = tasksRef.current;
    var next = prev.filter(function(t) { return t.id !== id; });
    skipSaveRef.current = true;
    clearTimeout(saveTimerRef.current);
    commitTasks(next);
    if (editId === id) resetDraft();
    taskStore.deleteTaskById(prev, id).finally(function() {
      lastDeleteAt.current = Date.now();
      setTimeout(function() { skipSaveRef.current = false; }, 200);
    });
  }

  function toggleDone(id) {
    setTasks(function(prev) {
      return prev.map(function(t) {
        if (t.id !== id) return t;
        if (t.column === "long") return taskStore.touchTask(t, { column: "longdone" });
        if (t.column === "longdone") return taskStore.touchTask(t, { column: "long" });
        if (t.column === "done") return taskStore.touchTask(t, { column: "today" });
        return taskStore.touchTask(t, { column: "done" });
      });
    });
  }

  function releaseToBoard(id) {
    setTasks(function(prev) {
      return prev.map(function(t) {
        if (t.id !== id) return t;
        var column = t.column === "longdone" ? "done" : "inbox";
        return taskStore.touchTask(t, { column: column });
      });
    });
  }

  function longTasksSorted() {
    var po = { high: 0, med: 1, low: 2 };
    return filtered.slice().sort(function(a, b) {
      var ad = a.column === "longdone" ? 1 : 0;
      var bd = b.column === "longdone" ? 1 : 0;
      if (ad !== bd) return ad - bd;
      return (po[a.priority] || 1) - (po[b.priority] || 1);
    });
  }

  function addSubtask() {
    if (!subDraft.trim()) return;
    setDraft(Object.assign({}, draft, {
      subtasks: (draft.subtasks || []).concat([{ id: uid(), title: subDraft.trim(), done: false }]),
    }));
    setSubDraft("");
  }

  function toggleSubtask(taskId, subId) {
    setTasks(function(prev) {
      return prev.map(function(t) {
        if (t.id !== taskId) return t;
        return taskStore.touchTask(t, {
          subtasks: (t.subtasks || []).map(function(s) {
            return s.id === subId ? Object.assign({}, s, { done: !s.done }) : s;
          }),
        });
      });
    });
  }

  function onDrop(col, e) {
    e.preventDefault();
    var id = e.dataTransfer.getData("text/task-id");
    if (!id) return;
    moveTask(id, col);
  }

  function moveTask(id, col) {
    if (!id || !col) return;
    setTasks(function(prev) {
      return prev.map(function(t) { return t.id === id ? taskStore.touchTask(t, { column: col }) : t; });
    });
  }

  var tk = todayKey();

  return (
    <div className="mod-main tk-page" style={{ "--mc": ACCENT }}>
      <style>{HUB_BACK_CSS + TASKS_CSS}</style>
      <div className="mod-glow" style={{ top: -100, right: "4%", background: moduleGlow(ACCENT) }} aria-hidden="true" />
      <header className={"tk-head" + (isMobile ? " tk-head--mob" : "")}>
        <div className={"tk-head-inner" + (isMobile ? " tk-head-inner--mob" : "")}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, width: isMobile ? "100%" : "auto" }}>
            {showLong ? (
              <HubBack label="Tarefas" onClick={closeLong} />
            ) : isMobile && mobileTab ? (
              <HubBack label="Listas" onClick={function() { setMobileTab(null); }} />
            ) : (
              <HubBack />
            )}
            <h1 className="mod-h1">
              {showLong ? "Longo prazo" : isMobile && activeMobileView ? activeMobileView.label : "Tarefas"}
            </h1>
          </div>
          {!(isMobile && !mobileTab) ? (
          <div className={"tk-search-row" + (isMobile ? " tk-search-row--full" : "")}>
            <input className="page-search" value={query} onChange={function(e) { setQuery(e.target.value); }} placeholder="Procurar..."
              style={{ flex: 1, padding: "10px 4px", fontSize: isMobile ? 16 : 13 }} />
            {!showLong ? (
            <button type="button" className={"tk-focus-btn ui-tap" + (focusToday ? " is-on" : "")} onClick={function() { setFocusToday(!focusToday); }}>
              Foco hoje
            </button>
            ) : null}
          </div>
          ) : null}
          {isMobile && mobileTab && !showLong ? (
          <button type="button" className="tk-zone-btn ui-tap" onClick={openLong}>
            Longo prazo{stats.longTotal ? " · " + stats.longTotal : ""}
          </button>
          ) : null}
          {!isMobile ? (
          <button type="button" className="tk-new-btn ui-tap" onClick={openComposer}>
            + Nova
          </button>
          ) : null}
        </div>
      </header>

      <div data-scrollable className={"tk-body" + (isMobile ? " tk-body--mob" : "")}>
        {!loaded ? <PageLoader accent={ACCENT} lines={6} /> : (
        <>
        {syncWarn ? (
          <p className="tk-warn">{syncWarn}</p>
        ) : null}
        {!(isMobile && !mobileTab) ? (
        <div className="tk-progress-wrap">
          <div className="tk-progress">
            <i style={{ width: (showLong ? stats.longPct : stats.pct) + "%" }} />
          </div>
          <p className="tk-stats">
            {showLong
              ? stats.longTotal + " a longo prazo · " + stats.longDone + " concluídas"
              : stats.done + "/" + stats.total + " concluídas · " + stats.today + " em foco hoje"}
          </p>
        </div>
        ) : null}

        {!isMobile && !showLong ? (
          <button type="button" className="tk-zone-entry ui-tap" onClick={openLong}>
            <strong>Longo prazo</strong>
            <span>{stats.longTotal ? stats.longTotal + " fora do quadro →" : "Abrir zona · não aparecem no quadro →"}</span>
          </button>
        ) : null}

        {isMobile && !mobileTab ? (
          <div data-stagger style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            <p style={{ margin: "0 0 4px", fontSize: 13.5, color: "#A0A0A8", lineHeight: 1.5 }}>Onde queres começar?</p>
            {MOBILE_VIEWS.map(function(v) {
              var n = countMobileView(v.id);
              return (
                <button key={v.id} type="button" className="tk-tab ui-tap" onClick={function() { setZone("board"); setMobileTab(v.id); }}>
                  <span className="tk-tab-icon">{v.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 17, fontFamily: "'Manrope',sans-serif", color: "#EDEDEF", fontWeight: 500 }}>{v.label}</p>
                    <p style={{ margin: "5px 0 0", fontSize: 13, color: "#6E6E76", lineHeight: 1.4 }}>{v.hint}</p>
                  </div>
                  <span className="tk-tab-count">{n}</span>
                </button>
              );
            })}
            <button type="button" className="tk-tab ui-tap" onClick={openLong}>
              <span className="tk-tab-icon">◷</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 17, fontFamily: "'Manrope',sans-serif", color: "#EDEDEF", fontWeight: 500 }}>Longo prazo</p>
                <p style={{ margin: "5px 0 0", fontSize: 13, color: "#6E6E76", lineHeight: 1.4 }}>Fora do quadro — não aparecem nas listas</p>
              </div>
              <span className="tk-tab-count">{stats.longTotal}</span>
            </button>
          </div>
        ) : showLong ? (
          <div>
            <p className="tk-long-lead">Estas tarefas ficam só aqui. Não entram no quadro de Inbox, Hoje ou Concluído. Podes editá-las ou devolvê-las ao quadro.</p>
            {stats.longDone > 0 ? (
              <div style={{ marginBottom: 14 }}>
                <button type="button" className="tk-clear ui-tap" onClick={function() {
                  var list = tasksRef.current.filter(function(t) { return t.column === "longdone"; });
                  if (!list.length) return;
                  if (!window.confirm("Apagar as " + list.length + " tarefas de longo prazo já concluídas?")) return;
                  var ids = list.map(function(t) { return t.id; });
                  var prev = tasksRef.current;
                  skipSaveRef.current = true;
                  clearTimeout(saveTimerRef.current);
                  commitTasks(prev.filter(function(t) { return ids.indexOf(t.id) < 0; }));
                  if (editId && ids.indexOf(editId) >= 0) resetDraft();
                  taskStore.deleteTasksByIds(prev, ids).finally(function() {
                    lastDeleteAt.current = Date.now();
                    setTimeout(function() { skipSaveRef.current = false; }, 200);
                  });
                }}>Apagar concluídas</button>
              </div>
            ) : null}
            <div className="tk-long-list" data-stagger>
              {longTasksSorted().length === 0 ? (
                <p className="tk-empty">Ainda não há tarefas a longo prazo. Cria uma e marca «Longo prazo».</p>
              ) : longTasksSorted().map(function(t) {
                return (
                  <TaskCard key={t.id} task={t} col={t.column} isMobile={isMobile} lockDrag onEdit={startEdit} onDelete={deleteTask} onToggle={toggleDone} onRelease={releaseToBoard} onToggleSubtask={function(sid) { toggleSubtask(t.id, sid); }} />
                );
              })}
            </div>
          </div>
        ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(240px,1fr))", gap: isMobile ? 18 : 16, alignItems: "start" }}>
          {visibleColumns.map(function(col, ci) {
            var list = tasksInCol(col.id);
            return (
              <div key={col.id} className="task-col tk-col" style={{ animationDelay: ci * 0.06 + "s" }}
                onDragOver={function(e) { e.preventDefault(); }}
                onDrop={function(e) { onDrop(col.id, e); }}>
                <div className="tk-col-head">
                  <div className="tk-col-title">
                    <span style={{ fontSize: fs(isMobile, 13, 15), color: "#6E6E76", lineHeight: 1 }}>{col.icon}</span>
                    <span style={{ fontSize: fs(isMobile, 13, 15), fontFamily: "'Manrope',sans-serif", color: "#EDEDEF", fontWeight: 500, letterSpacing: 0.3 }}>{col.label}</span>
                    <span className="tk-count">{list.length}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
                    {(col.id === "inbox" || col.id === "done") && list.length > 0 ? (
                      <button type="button" className="tk-clear ui-tap" onClick={function() { clearColumn(col.id); }}>
                        Apagar tudo
                      </button>
                    ) : null}
                    {!isMobile ? <span style={{ fontSize: 11, color: "#6E6E76", fontFamily: "'Manrope',sans-serif" }}>{col.hint}</span> : null}
                  </div>
                </div>
                <div data-stagger style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 80 }}>
                  {list.length === 0 ? (
                    <p className="tk-empty">
                      {isMobile ? "Ainda não há tarefas aqui." : "Arrasta tarefas para aqui"}
                    </p>
                  ) : list.map(function(t) {
                    return (
                      <TaskCard key={t.id} task={t} col={col.id} isMobile={isMobile} lockDrag={touchCreate} onEdit={startEdit} onDelete={deleteTask} onToggle={toggleDone} onMove={moveTask} onToggleSubtask={function(sid) { toggleSubtask(t.id, sid); }} />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        )}
        </>
        )}
      </div>

      {showForm ? (
        <div className="tk-sheet-bg" onClick={resetDraft}>
          <div className="tk-sheet" role="dialog" aria-modal="true" aria-label={editId ? "Editar tarefa" : "Nova tarefa"} onClick={function(e) { e.stopPropagation(); }}>
            <p className="tk-sheet-kicker">Tarefas</p>
            <h2 className="tk-sheet-h">{editId ? "Editar tarefa" : "Nova tarefa"}</h2>
            <input
              className="tk-sheet-title"
              value={draft.title}
              autoFocus
              placeholder="O que tens de fazer?"
              onChange={function(e) { setDraft(Object.assign({}, draft, { title: e.target.value })); }}
            />
            <p className="tk-lbl" style={{ margin: "16px 0 8px" }}>Onde</p>
            {!draft.horizon ? (
              <div className="tk-chips">
                {COLUMNS.map(function(c) {
                  return (
                    <button key={c.id} type="button" className={"tk-chip" + (draft.column === c.id ? " is-on" : "")}
                      onClick={function() { setDraft(Object.assign({}, draft, { column: c.id, horizon: false })); }}>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            ) : <p className="tk-horizon-hint">Esta tarefa fica só na zona de longo prazo.</p>}
            <button type="button" className={"tk-switch" + (draft.horizon ? " is-on" : "")} onClick={function() { setHorizon(!draft.horizon); }}>
              <span><b>Longo prazo</b><span>Fora do quadro diário</span></span>
              <i aria-hidden="true" />
            </button>
            <p className="tk-lbl" style={{ margin: "4px 0 0" }}>Prioridade</p>
            <div className="tk-chips">
              {PRIORITIES.map(function(p) {
                return (
                  <button key={p.id} type="button" className={"tk-chip" + (draft.priority === p.id ? " is-on" : "")}
                    onClick={function() { setDraft(Object.assign({}, draft, { priority: p.id })); }}>
                    {p.label}
                  </button>
                );
              })}
            </div>
            <input className="tk-in ui-in" type="date" value={draft.due} onChange={function(e) { setDraft(Object.assign({}, draft, { due: e.target.value })); }}
              style={{ width: "100%", padding: "12px 4px", fontSize: 16, marginTop: 4 }} />
            <textarea className="tk-in ui-in" value={draft.notes} rows={2} placeholder="Notas (opcional)"
              onChange={function(e) { setDraft(Object.assign({}, draft, { notes: e.target.value })); }}
              style={{ width: "100%", padding: "12px 4px", fontSize: 16, marginTop: 12, resize: "vertical" }} />
            <button type="button" className="tk-sheet-go" onClick={function() { saveTask(); }}>{editId ? "Guardar" : "Adicionar"}</button>
            <button type="button" className="tk-sheet-cancel" onClick={resetDraft}>Cancelar</button>
          </div>
        </div>
      ) : null}

      {touchCreate ? (
        <button type="button" className="tk-fab" aria-label="Nova tarefa" onClick={openComposer}>+</button>
      ) : null}
    </div>
  );
}
