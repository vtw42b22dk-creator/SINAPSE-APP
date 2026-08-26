import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import * as focusStore from "../lib/focusStore";
import * as focusTimer from "../lib/focusTimer";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { MICRO_CSS } from "../lib/microUi";

var CYAN = "#E6E6E9";
var AMBER = "#C4A57C";
var PURPLE = "#E6E6E9";

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
  MICRO_CSS,
  "@keyframes fxIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}",
  "@keyframes fxSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}",
  "@keyframes fxGlow{0%,100%{opacity:.25}50%{opacity:.55}}",
  "@keyframes fxTick{0%,48%{opacity:1}50%,98%{opacity:.2}}",
  ".fx-root{height:100vh;max-height:100dvh;overflow:hidden;display:flex;flex-direction:column;background:#070708;color:#EDEDEF;font-family:'IBM Plex Sans',sans-serif;position:relative}",
  ".fx-ambient{position:absolute;border-radius:50%;pointer-events:none;filter:blur(80px);animation:fxGlow 7s ease-in-out infinite}",
  ".fx-ambient--a{width:420px;height:420px;top:-8%;left:-6%;background:rgba(255,255,255,.04)}",
  ".fx-ambient--b{width:320px;height:320px;bottom:10%;right:-4%;background:rgba(196,165,124,.06);animation-delay:-2.5s}",
  ".fx-head{flex-shrink:0;display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(7,7,8,.88);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);z-index:20}",
  ".fx-hbtn{padding:6px 2px;border:none;border-bottom:1px solid rgba(255,255,255,.14);background:transparent;color:#A0A0A8;cursor:pointer;font-size:12px;line-height:1.4;font-family:'JetBrains Mono',monospace;letter-spacing:.3px;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fx-hbtn:hover{color:#EDEDEF;border-bottom-color:#EDEDEF}",
  ".fx-hbtn:active{transform:translateY(1px)}",
  ".fx-shell{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}",
  ".fx-dock{flex-shrink:0;display:flex;align-items:stretch;justify-content:space-around;gap:2px;padding:8px 12px max(8px,env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,.06);background:rgba(7,7,8,.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);order:2;position:relative;z-index:25}",
  ".fx-main{flex:1;min-width:0;min-height:0;overflow-y:auto;padding:16px 16px 12px;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;order:1}",
  ".fx-nav{position:relative;flex:1;max-width:88px;height:52px;border:none;background:transparent;color:#6E6E76;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:15px;transition:color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fx-nav::before{content:'';position:absolute;left:50%;bottom:2px;transform:translateX(-50%);width:0;height:2px;background:#EDEDEF;transition:width var(--dur) var(--ease),opacity var(--dur) var(--ease);opacity:0}",
  ".fx-nav span{font-size:8px;font-family:'JetBrains Mono',monospace;letter-spacing:.7px;line-height:1;text-transform:uppercase}",
  ".fx-nav:hover{color:#A0A0A8}",
  ".fx-nav:active{transform:scale(.94)}",
  ".fx-nav.on{color:#EDEDEF}",
  ".fx-nav.on::before{width:22px;opacity:1}",
  ".fx-panel-stage{flex:1;width:100%;min-height:0;display:flex;flex-direction:column}",
  ".fx-immersive{position:fixed;inset:0;z-index:200;background:#070708;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;cursor:pointer;animation:fxIn var(--dur-slow) var(--ease) both}",
  ".fx-immersive-inner{display:flex;flex-direction:column;align-items:center;gap:28px;width:100%;max-width:640px;pointer-events:none}",
  ".fx-immersive-phase{margin:0;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#6E6E76}",
  ".fx-immersive .fx-digital{font-size:clamp(96px,22vw,168px)!important}",
  ".fx-immersive-hint{margin:0;font-size:10px;color:#6E6E76;font-family:'JetBrains Mono',monospace;letter-spacing:.4px;opacity:.7}",
  ".fx-immersive-bar{position:fixed;bottom:0;left:0;right:0;padding:20px 24px max(20px,env(safe-area-inset-bottom));background:linear-gradient(transparent,rgba(7,7,8,.95));display:flex;gap:16px;justify-content:center;pointer-events:auto}",
  ".fx-phase-flash{position:fixed;inset:0;z-index:190;pointer-events:none;animation:uiFlash .85s var(--ease) both}",
  ".fx-phase-flash--focus{background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.08),transparent 65%)}",
  ".fx-phase-flash--break{background:radial-gradient(circle at 50% 40%,rgba(196,165,124,.12),transparent 65%)}",
  ".fx-proj-go{margin-top:14px;padding:8px 4px;border:none;border-bottom:1px solid rgba(255,255,255,.2);background:transparent;color:#EDEDEF;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.5px;cursor:pointer;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fx-proj-go:hover{border-bottom-color:#EDEDEF;transform:translateY(-1px)}",
  ".fx-proj-go:active{transform:scale(.96)}",
  ".fx-panel{flex:1;width:100%;min-height:0;border:none;background:transparent;padding:12px 8px 24px;animation:fxIn var(--dur-slow) var(--ease) both;box-sizing:border-box;display:flex;flex-direction:column}",
  ".fx-panel--clock{justify-content:center;align-items:center;min-height:calc(100vh - 118px);padding:32px 24px}",
  ".fx-panel--clock .fx-modes{justify-content:center;max-width:720px;width:100%}",
  ".fx-panel--clock .fx-clock-wrap{flex:0 0 auto;width:100%;max-width:720px}",
  ".fx-title{margin:0 0 20px;font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:500;letter-spacing:.4px;line-height:1.4;display:flex;align-items:center;gap:8px}",
  ".fx-input{width:100%;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,0.12);color:#EDEDEF;padding:11px 0;font-size:14px;line-height:1.5;outline:none;box-sizing:border-box;font-family:inherit}",
  ".fx-input:hover:not(:focus):not(:disabled){border-color:rgba(255,255,255,0.14)}",
  ".fx-input:focus{border-bottom-color:rgba(255,255,255,0.4);background:transparent}",
  ".fx-label{display:block;font-size:10px;font-family:'JetBrains Mono',monospace;color:#6E6E76;margin-bottom:8px;letter-spacing:1.6px;line-height:1.4;text-transform:uppercase}",
  ".fx-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 4px;border:none;border-bottom:1px solid;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;line-height:1.2;cursor:pointer;background:transparent;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease),opacity var(--dur-fast) var(--ease)}",
  ".fx-btn:hover:not(:disabled){transform:translateY(-1px)}",
  ".fx-btn:active:not(:disabled){transform:translateY(1px);opacity:.75}",
  ".fx-btn:disabled{opacity:.35;cursor:not-allowed}",
  ".fx-grid-pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;width:100%;flex:1;align-content:start}",
  ".fx-proj{position:relative;border:none;border-bottom:1px solid rgba(255,255,255,0.08);background:transparent;padding:22px 0;min-height:120px;cursor:pointer;animation:fxIn var(--dur-slow) var(--ease) both}",
  ".fx-proj:hover{background:transparent}",
  ".fx-proj::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--pc)}",
  ".fx-proj-del{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:10px;border:1px solid rgba(255,255,255,0.07);background:#1A1A1D;color:#6E6E76;cursor:pointer;font-size:15px;line-height:1;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity var(--dur) var(--ease),background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease);z-index:2}",
  ".fx-proj:hover .fx-proj-del{opacity:1}",
  ".fx-proj-del:hover{background:rgba(192,140,140,0.14);color:#C08C8C;border-color:rgba(192,140,140,0.35)}",
  ".fx-addcard{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:8px;min-height:88px;border:none;border-bottom:1px dashed rgba(255,255,255,0.18);background:transparent;cursor:pointer;color:#6E6E76}",
  ".fx-addcard:hover{border-color:rgba(255,255,255,0.14);color:#EDEDEF;background:#1A1A1D}",
  ".fx-modal-bg{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,0.72);display:flex;align-items:center;justify-content:center;padding:16px;animation:fxIn var(--dur-fast) var(--ease) both}",
  ".fx-modal{width:min(440px,100%);border:none;border-top:1px solid rgba(255,255,255,0.16);background:#070708;padding:24px 4px;animation:fxIn var(--dur) var(--ease) both}",
  ".fx-modes{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}",
  ".fx-mode{min-height:36px;padding:8px 4px;border:none;border-bottom:1px solid rgba(255,255,255,.1);background:transparent;color:#6E6E76;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.5px;cursor:pointer;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fx-mode:hover{color:#A0A0A8;border-bottom-color:rgba(255,255,255,.22)}",
  ".fx-mode.on{color:#EDEDEF;border-bottom-color:#EDEDEF}",
  ".fx-mode:active{transform:scale(.97)}",
  ".fx-clock-wrap{display:flex;flex-direction:column;align-items:center;gap:32px;padding:28px 0 16px;width:100%}",
  ".fx-digital{font-family:'JetBrains Mono',monospace;font-weight:300;font-size:clamp(80px,18vw,148px);line-height:.88;letter-spacing:-0.05em;color:#EDEDEF;font-variant-numeric:tabular-nums;transition:opacity var(--dur-slow) var(--ease),text-shadow var(--dur-slow) var(--ease)}",
  ".fx-digital.is-run{text-shadow:0 0 40px rgba(255,255,255,.12)}",
  ".fx-prog{width:100%;max-width:560px;height:2px;background:rgba(255,255,255,.08);overflow:hidden}",
  ".fx-prog i{display:block;height:100%;background:#EDEDEF;transition:width 1s linear}",
  ".fx-tcontrols{display:flex;gap:20px;width:100%;max-width:560px;align-items:center;justify-content:center}",
  ".fx-tbtn{flex:0 1 auto;min-width:120px;min-height:52px;padding:14px 24px;border:none;border-bottom:2px solid;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;letter-spacing:.8px;cursor:pointer;background:transparent;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease),opacity var(--dur-fast) var(--ease)}",
  ".fx-tbtn:hover:not(:disabled){transform:translateY(-2px)}",
  ".fx-tbtn:active:not(:disabled){transform:scale(.96)}",
  ".fx-styletog{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}",
  ".fx-stybtn{min-height:34px;padding:8px 6px;border:none;border-bottom:1px solid rgba(255,255,255,.1);background:transparent;color:#6E6E76;font-size:10px;letter-spacing:.5px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fx-stybtn:hover{color:#A0A0A8;border-bottom-color:rgba(255,255,255,.25)}",
  ".fx-stybtn.on{color:#EDEDEF;border-bottom-color:#EDEDEF}",
  ".fx-stybtn:active{transform:scale(.95)}",
  ".fx-analog{width:min(360px,52vw);height:min(360px,52vw);position:relative}",
  ".fx-analog-face{width:100%;height:100%;border-radius:50%;border:1px solid rgba(255,255,255,0.12);background:transparent;position:relative;}",
  ".fx-hand{position:absolute;bottom:50%;left:50%;transform-origin:bottom center;border-radius:999px;background:#E6E6E9;transition:opacity var(--dur) var(--ease);}",
  ".fx-ring{width:min(360px,52vw);height:min(360px,52vw);position:relative;display:flex;align-items:center;justify-content:center;overflow:visible}",
  ".fx-ring svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);overflow:visible}",
  ".fx-ring-track{fill:none;stroke:rgba(255,255,255,0.08);stroke-width:3}",
  ".fx-ring-progress{fill:none;stroke:#E6E6E9;stroke-width:3;stroke-linecap:round;transition:stroke-dashoffset .9s linear}",
  ".fx-blocks{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center}",
  ".fx-block{width:clamp(36px,7vw,56px);height:clamp(60px,12vw,88px);border:none;border-bottom:2px solid rgba(255,255,255,.08);background:transparent;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:clamp(24px,6vw,40px);font-weight:300;font-variant-numeric:tabular-nums;letter-spacing:-0.02em;color:#6E6E76;transition:color var(--dur-slow) var(--ease),border-color var(--dur-slow) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fx-block.on{color:#EDEDEF;border-bottom-color:#EDEDEF;transform:translateY(-2px)}",
  ".fx-statgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px}",
  ".fx-stat{padding:16px 0;border:none;border-bottom:1px solid rgba(255,255,255,0.08);background:transparent}",
  ".fx-stat:hover{border-color:rgba(255,255,255,0.14)}",
  ".fx-stat p{margin:0;font-size:10px;font-family:'JetBrains Mono',monospace;color:#6E6E76;letter-spacing:1.6px;line-height:1.4;text-transform:uppercase}",
  ".fx-stat strong{display:block;margin-top:8px;font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:400;letter-spacing:-0.01em;font-variant-numeric:tabular-nums}",
  ".fx-goal{margin:20px 0;padding:16px 0;border:none;border-bottom:1px solid rgba(255,255,255,.08);background:transparent}",
  ".fx-goal-bar{height:2px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:12px}",
  ".fx-goal-bar i{display:block;height:100%;background:#E6E6E9;transition:width var(--dur-slow) var(--ease)}",
  ".fx-chart{display:flex;gap:10px;align-items:flex-end;height:min(220px,28vh);margin:16px 0;flex:1;min-height:160px}",
  ".fx-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;height:100%;justify-content:flex-end}",
  ".fx-bar{width:100%;max-width:40px;border-radius:6px 6px 0 0;min-height:4px;background:var(--ac);transition:height var(--dur-slow) var(--ease),opacity var(--dur) var(--ease)}",
  ".fx-table{width:100%;border-collapse:collapse;font-size:12px}",
  ".fx-table th,.fx-table td{padding:10px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.07);font-family:'JetBrains Mono',monospace}",
  ".fx-table td{font-size:12px;line-height:1.5;font-variant-numeric:tabular-nums}",
  ".fx-table th{font-size:10px;color:#6E6E76;letter-spacing:1.6px;line-height:1.4;text-transform:uppercase;font-weight:500}",
  ".fx-table tbody tr{transition:background var(--dur) var(--ease)}",
  ".fx-table tbody tr:hover{background:#1A1A1D}",
  ".fx-idea{padding:14px 40px 14px 0;border:none;border-bottom:1px solid rgba(255,255,255,.08);background:transparent;font-size:13px;line-height:1.55;white-space:pre-wrap;position:relative;transition:border-color var(--dur) var(--ease),padding-left var(--dur) var(--ease)}",
  ".fx-idea:hover{border-bottom-color:rgba(255,255,255,.18);padding-left:4px}",
  ".fx-idea button{position:absolute;top:10px;right:0;width:28px;height:28px;border:none;background:transparent;color:#6E6E76;cursor:pointer;transition:color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fx-idea button:hover{color:#C08C8C;transform:scale(1.08)}",
  ".fx-task{display:flex;align-items:center;gap:12px;padding:14px 0;border:none;border-bottom:1px solid rgba(255,255,255,.07);background:transparent;transition:border-color var(--dur) var(--ease),opacity var(--dur) var(--ease),padding-left var(--dur) var(--ease)}",
  ".fx-task:hover{border-bottom-color:rgba(255,255,255,.16);padding-left:4px}",
  ".fx-task.done{opacity:.42}",
  ".fx-task-check{width:22px;height:22px;border:1px solid rgba(255,255,255,.22);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fx-task-check:hover{border-color:rgba(255,255,255,.55);transform:scale(1.06)}",
  ".fx-task-check.on{border-color:#E6E6E9;background:#E6E6E9;color:#070708;animation:uiPop .38s var(--ease)}",
  ".fx-tabs{display:flex;gap:8px;margin-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.07)}",
  ".fx-tab{padding:10px 14px;border:none;background:none;color:#6E6E76;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500;letter-spacing:.3px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".fx-tab:hover{color:#A0A0A8}",
  ".fx-tab.on{color:#EDEDEF}",
  ".fx-area{width:100%;min-height:min(360px,42vh);background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.1);color:#EDEDEF;padding:16px 4px;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.7;outline:none;resize:vertical;box-sizing:border-box;flex:1;transition:border-color var(--dur) var(--ease),padding-left var(--dur) var(--ease)}",
  ".fx-area:hover:not(:focus):not(:disabled){border-bottom-color:rgba(255,255,255,.16)}",
  ".fx-area:focus{border-bottom-color:rgba(255,255,255,.4);padding-left:6px}",
  ".fx-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font-size:10px;letter-spacing:.4px;line-height:1.2;font-family:'JetBrains Mono',monospace}",
  ".fx-pal{display:flex;gap:8px;flex-wrap:wrap}",
  ".fx-pal button{width:30px;height:30px;border-radius:8px;border:2px solid transparent;cursor:pointer;padding:2px;transition:border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fx-pal button:hover{transform:translateY(-1px)}",
  "@media(max-width:720px){.fx-main{padding:12px 12px 8px}.fx-proj-del{opacity:1}.fx-panel--clock{min-height:calc(100vh - 200px);padding:20px 16px}.fx-clock-wrap{gap:24px}.fx-title{font-size:14px!important}.fx-input,.fx-area{font-size:16px!important}.fx-dock{padding:6px 8px max(6px,env(safe-area-inset-bottom))}.fx-nav{max-width:none;height:48px;font-size:14px}}",
  "@media(pointer:coarse){.fx-hbtn{min-height:44px}.fx-mode{min-height:44px}.fx-stybtn{min-height:44px}.fx-task-check{width:26px;height:26px}.fx-proj-del{width:36px;height:36px}.fx-idea button{width:32px;height:32px}}",
  "@media(hover:none){.fx-proj:hover{transform:none;box-shadow:none}.fx-btn:hover:not(:disabled){transform:none}.fx-tbtn:hover:not(:disabled){transform:none}.fx-pal button:hover{transform:none}}",
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
    <div className={"fx-digital" + (props.running ? " is-run" : "")}>
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
      <div className="fx-analog-face">
        {Array.from({ length: 12 }, function(_, i) {
          var a = (i / 12) * 360;
          return <span key={i} style={{ position: "absolute", width: 2, height: i % 3 === 0 ? 10 : 6, background: "rgba(255,255,255,0.14)", left: "50%", top: 8, transform: "translateX(-50%) rotate(" + a + "deg)", transformOrigin: "50% 130px" }} />;
        })}
        <div className="fx-hand" style={{ width: 4, height: "32%", transform: "translateX(-50%) rotate(" + minAngle + "deg)" }} />
        <div className="fx-hand" style={{ width: 2, height: "42%", transform: "translateX(-50%) rotate(" + secAngle + "deg)", opacity: 0.7 }} />
        <div className="fx-analog-dot" style={{ position: "absolute", inset: "42%", background: "#E6E6E9" }} />
      </div>
    </div>
  );
}

function RingClock(props) {
  var r = 52;
  var c = 2 * Math.PI * r;
  var pct = props.total > 0 ? props.secs / props.total : 0;
  return (
    <div className="fx-ring">
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <circle className="fx-ring-track" cx="70" cy="70" r={r} />
        <circle
          className="fx-ring-progress"
          cx="70"
          cy="70"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="fx-digital" style={{ fontSize: "clamp(40px,9vw,64px)" }}>
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
        if (ch === ":") return <span key={i} style={{ color: "#6E6E76", fontSize: 32 }}>:</span>;
        return <div key={i} className={"fx-block" + (props.running ? " on" : "")}>{ch}</div>;
      })}
    </div>
  );
}

function ClockDisplay(props) {
  var common = { secs: props.secs, total: props.total, running: props.running };
  if (props.style === "analog") return <AnalogClock {...common} />;
  if (props.style === "ring") return <RingClock {...common} />;
  if (props.style === "blocks") return <BlocksClock {...common} />;
  return <DigitalClock {...common} />;
}

function ImmersiveSession(props) {
  if (!props.active) return null;
  return (
    <div className="fx-immersive" onClick={props.onToggleControls} role="presentation">
      <div className="fx-immersive-inner">
        <p className="fx-immersive-phase" style={{ color: props.phaseColor }}>{props.phase === "focus" ? "Sessão de foco" : "Pausa"}</p>
        <ClockDisplay style={props.clockStyle} secs={props.secsLeft} total={props.phaseTotal} running={props.running} />
        <div className="fx-prog" style={{ maxWidth: 480, width: "100%" }}>
          <i style={{ width: props.progress + "%", background: props.phaseColor }} />
        </div>
        <p className="fx-immersive-hint">Toca para controlos · Barra de espaço pausa/continua</p>
      </div>
      {props.showControls ? (
        <div className="fx-immersive-bar" onClick={function(e) { e.stopPropagation(); }}>
          <button type="button" className="fx-tbtn ui-tap" onClick={props.onPause}
            style={{ borderColor: (props.running ? AMBER : "#8FB39B") + "88", color: props.running ? AMBER : "#8FB39B" }}>
            {props.running ? "❚❚ Pausa" : "▶ Continuar"}
          </button>
          <button type="button" className="fx-tbtn ui-tap" onClick={props.onReset}
            style={{ borderColor: "rgba(255,255,255,.2)", color: "#A0A0A8" }}>↺ Reset</button>
          <button type="button" className="fx-tbtn ui-tap" onClick={props.onExitImmersive}
            style={{ borderColor: "rgba(255,255,255,.14)", color: "#6E6E76" }}>Sair</button>
        </div>
      ) : null}
    </div>
  );
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
      <style>{MODULE_ENTRY_CSS + FX_CSS}</style>
      <div className="fx-ambient fx-ambient--a" aria-hidden="true" />
      <div className="fx-ambient fx-ambient--b" aria-hidden="true" />
      <header className="fx-head">
        <button type="button" className="fx-hbtn" onClick={function() { navigate("/"); }}>← Hub</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 500, color: CYAN, letterSpacing: 1.2 }}>ESTÚDIO DE FOCO</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, lineHeight: 1.5, color: "#A0A0A8" }}>Escolhe ou cria um projeto de estudo</p>
        </div>
      </header>
      <main className="fx-main">
        <div className="fx-grid-pick">
          {props.projects.map(function(p, idx) {
            var prog = focusStore.goalProgress(p, props.metricsByProject[p.id] || []);
            return (
              <article key={p.id} className="fx-proj" style={{ "--pc": p.color, animationDelay: (idx * 0.04) + "s" }} onClick={function() { props.onSelect(p); }}>
                <button type="button" className="fx-proj-del" title="Eliminar projeto" aria-label="Eliminar projeto" onClick={function(e) { removeProject(e, p); }}>×</button>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingRight: 32 }}>
                  <span style={{ fontSize: 28, color: p.color, lineHeight: 1 }}>{p.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h2>
                    <p style={{ margin: "6px 0 0", fontSize: 11, lineHeight: 1.5, color: "#A0A0A8", fontFamily: "'JetBrains Mono',monospace" }}>{fmtHours(prog.studied)} estudados</p>
                  </div>
                </div>
                {prog.goalMin > 0 ? (
                  <div style={{ height: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{ width: prog.pct + "%", height: "100%", background: p.color, transition: "width var(--dur-slow) var(--ease)" }} />
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 10, letterSpacing: 1.6, textTransform: "uppercase", color: "#6E6E76", fontFamily: "'JetBrains Mono',monospace" }}>Sem meta definida</p>
                )}
                <button type="button" className="fx-proj-go ui-tap" onClick={function(e) { e.stopPropagation(); if (props.onQuickStart) props.onQuickStart(p); }}>▶ Iniciar sessão agora</button>
              </article>
            );
          })}
          <button type="button" className="fx-addcard" onClick={openCreate}>
            <span style={{ fontSize: 26, lineHeight: 1, color: CYAN }}>+</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, letterSpacing: 0.4 }}>Novo projeto</span>
          </button>
        </div>
      </main>

      {modalOpen && (
        <div className="fx-modal-bg" onClick={function(e) { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="fx-modal" onClick={function(e) { e.stopPropagation(); }}>
            <p style={{ margin: "0 0 20px", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#6E6E76", letterSpacing: 1.6 }}>NOVO PROJETO DE FOCO</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="fx-label">Nome</label>
                <input className="fx-input" value={name} onChange={function(e) { setName(e.target.value); }} placeholder="Ex: Estudar exame, Investimentos…" autoFocus />
              </div>
              <div>
                <label className="fx-label">Ícone</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ICONS.map(function(ic) {
                    return <button key={ic} type="button" onClick={function() { setIcon(ic); }} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid " + (icon === ic ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)"), background: icon === ic ? "#1A1A1D" : "transparent", color: icon === ic ? "#EDEDEF" : "#A0A0A8", cursor: "pointer", fontSize: 16 }}>{ic}</button>;
                  })}
                </div>
              </div>
              <div>
                <label className="fx-label">Cor</label>
                <div className="fx-pal">
                  {focusStore.PROJECT_COLORS.map(function(c) {
                    return <button key={c} type="button" onClick={function() { setColor(c); }} style={{ background: "#1A1A1D", borderColor: color === c ? "rgba(255,255,255,0.55)" : "transparent" }}><span style={{ display: "block", width: "100%", height: "100%", borderRadius: 5, background: c }} /></button>;
                  })}
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, lineHeight: 1.5, color: "#A0A0A8", cursor: "pointer" }}>
                <input type="checkbox" checked={hasGoal} onChange={function(e) { setHasGoal(e.target.checked); }} />
                Definir meta de horas até uma data
              </label>
              {hasGoal ? (
                <div style={{ display: "flex", gap: 12 }}>
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
                <button type="button" className="fx-btn" onClick={create} style={{ flex: 1, minHeight: 44, borderColor: "#EDEDEF", color: "#0A0A0B", background: "#EDEDEF" }}>Criar e abrir</button>
                <button type="button" className="fx-hbtn" onClick={function() { setModalOpen(false); }} style={{ minHeight: 44, padding: "0 16px" }}>Cancelar</button>
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
  var immersiveCtrlS = useState(false);
  var immersiveControls = immersiveCtrlS[0], setImmersiveControls = immersiveCtrlS[1];
  var immersiveDismissS = useState(false);
  var immersiveDismissed = immersiveDismissS[0], setImmersiveDismissed = immersiveDismissS[1];
  var phaseFlashS = useState(null);
  var phaseFlash = phaseFlashS[0], setPhaseFlash = phaseFlashS[1];
  var prevPhaseRef = useRef(focusTimer.getState().phase);

  var today = focusStore.dayKey();
  var accent = activeProject ? activeProject.color : CYAN;
  var phaseColor = timer.phase === "focus" ? accent : AMBER;

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
      setImmersiveControls(false);
    } else {
      setImmersiveDismissed(false);
      focusTimer.startTimer();
    }
  }

  function handleReset() {
    var credit = focusTimer.resetTimer();
    if (credit > 0) creditMinutes(credit);
    setImmersiveControls(false);
    setImmersiveDismissed(false);
  }

  function quickStartProject(p) {
    setActiveProject(p);
    focusTimer.bindProject(p.id);
    focusTimer.configureTimer({ modeId: "pomodoro", phase: "focus", running: false, secsLeft: 25 * 60 });
    setSidebarTab("clock");
    setImmersiveDismissed(false);
    setTimeout(function() {
      focusTimer.startTimer();
    }, 80);
  }

  useEffect(function() {
    if (prevPhaseRef.current !== timer.phase) {
      setPhaseFlash(timer.phase);
      var t = setTimeout(function() { setPhaseFlash(null); }, 900);
      prevPhaseRef.current = timer.phase;
      return function() { clearTimeout(t); };
    }
  }, [timer.phase]);

  useEffect(function() {
    if (!activeProject) return;
    function onKey(e) {
      var tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (timer.running) {
          var credit = focusTimer.pauseTimer();
          if (credit > 0) creditMinutes(credit);
          setImmersiveControls(false);
        } else {
          setImmersiveDismissed(false);
          focusTimer.startTimer();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return function() { window.removeEventListener("keydown", onKey); };
  }, [activeProject, timer.running, creditMinutes]);

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
      <div style={{ minHeight: "100vh", background: "#0A0A0B", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", color: "#6E6E76" }}>A carregar estúdio…</p>
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
        onQuickStart={quickStartProject}
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
  var showImmersive = timer.running && !immersiveDismissed;

  return (
    <div className="fx-root" style={{ "--ac": accent }}>
      <style>{MODULE_ENTRY_CSS + FX_CSS}</style>
      <div className="fx-ambient fx-ambient--a" aria-hidden="true" />
      <div className="fx-ambient fx-ambient--b" aria-hidden="true" />
      {phaseFlash ? <div className={"fx-phase-flash fx-phase-flash--" + phaseFlash} aria-hidden="true" /> : null}

      <ImmersiveSession
        active={showImmersive}
        running={timer.running}
        phase={timer.phase}
        phaseColor={phaseColor}
        clockStyle={timer.clockStyle}
        secsLeft={timer.secsLeft}
        phaseTotal={phaseTotal}
        progress={progress}
        showControls={immersiveControls}
        onToggleControls={function() { setImmersiveControls(function(v) { return !v; }); }}
        onPause={handlePause}
        onReset={handleReset}
        onExitImmersive={function() { setImmersiveDismissed(true); setImmersiveControls(false); }}
      />

      <header className="fx-head">
        <button type="button" className="fx-hbtn" onClick={exitProject} title="Trocar projeto">← Projetos</button>
        <button type="button" className="fx-hbtn" onClick={function() { navigate("/"); }}>Hub</button>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22, color: accent, lineHeight: 1 }}>{activeProject.icon}</span>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#EDEDEF", letterSpacing: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeProject.name}</h1>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: "#6E6E76", fontFamily: "'JetBrains Mono',monospace" }}>
              {timer.running ? "● Sessão activa" : "Estúdio de Foco"} · hoje {todayMetric.minutes} min
            </p>
          </div>
        </div>
        <span className="fx-badge" style={{ color: timer.running ? "#8FB39B" : "#A0A0A8", background: timer.running ? "rgba(143,179,155,0.14)" : "#1A1A1D" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: timer.running ? "#8FB39B" : "#6E6E76" }} />
          {timer.running ? "A contar" : (auth.user ? "Sync" : "Local")}
        </span>
        <button type="button" className="fx-hbtn" title="Eliminar este projeto"
          onClick={function() {
            if (!window.confirm("Eliminar \"" + activeProject.name + "\" e todos os dados associados?")) return;
            removeProject(activeProject);
          }}
          style={{ color: "rgba(192,140,140,0.75)", borderColor: "rgba(192,140,140,0.25)" }}>×</button>
      </header>

      <div className="fx-shell">
        <main className="fx-main" data-scrollable>
          <div key={sidebarTab} className="fx-panel-stage ui-fade-in">
          {sidebarTab === "clock" && (
            <section className="fx-panel fx-panel--clock">
              <h3 className="fx-title" style={{ color: phaseColor, alignSelf: "flex-start", width: "100%", maxWidth: 720 }}><span>◷</span> Relógio · {timer.phase === "focus" ? "Foco" : "Pausa"}</h3>
              <div className="fx-modes">
                {presets.map(function(m) {
                  var on = timer.modeId === m.id;
                  return (
                    <button key={m.id} type="button" className={"fx-mode" + (on ? " on" : "")} onClick={function() { selectMode(m.id); }}
                      style={on ? { background: "#E6E6E9", borderColor: "#E6E6E9" } : null}>{m.label}</button>
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
                      <button key={st.id} type="button" className={"fx-stybtn" + (timer.clockStyle === st.id ? " on" : "")}
                        onClick={function() { focusTimer.setClockStyle(st.id); }}>{st.label}</button>
                    );
                  })}
                </div>
                <ClockDisplay style={timer.clockStyle} secs={timer.secsLeft} total={phaseTotal} running={timer.running} />
                <p style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: phaseColor, letterSpacing: 2, textTransform: "uppercase" }}>
                  {timer.phase === "focus" ? "● Foco" : "❚❚ Pausa"} · {timer.phase === "focus" ? focusMin : breakMin} min
                </p>
                <div className="fx-prog"><i style={{ width: progress + "%", background: "#E6E6E9" }} /></div>
                <div className="fx-tcontrols">
                  <button type="button" className="fx-tbtn" disabled={dis} onClick={handlePause}
                    style={{ borderColor: (timer.running ? AMBER : "#8FB39B") + "55", color: timer.running ? AMBER : "#8FB39B", background: "#1A1A1D" }}>
                    {timer.running ? "❚❚ Pausa" : "▶ Iniciar"}
                  </button>
                  <button type="button" className="fx-tbtn" disabled={dis} onClick={handleReset}
                    style={{ borderColor: "rgba(255,255,255,0.14)", color: "#A0A0A8", background: "#1A1A1D" }}>↺ Reset</button>
                </div>
                <p style={{ margin: 0, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#6E6E76", textAlign: "center", lineHeight: 1.5, maxWidth: 520 }}>
                  O cronómetro continua ao mudares de aba ou módulo.<br />Só conta tempo com o cronómetro a correr — pausas não entram no total.
                </p>
              </div>
            </section>
          )}

          {sidebarTab === "time" && (
            <section className="fx-panel" style={{ minHeight: "calc(100vh - 118px)" }}>
              <h3 className="fx-title" style={{ color: accent }}><span>⏱</span> Tempo Estudado</h3>
              <div className="fx-statgrid">
                <div className="fx-stat"><p>Hoje</p><strong style={{ color: accent }}>{todayMetric.minutes} min</strong></div>
                <div className="fx-stat"><p>Total projeto</p><strong style={{ color: AMBER }}>{fmtHours(goal.studied)}</strong></div>
                <div className="fx-stat"><p>Páginas hoje</p><strong>{todayMetric.pages}</strong></div>
                <div className="fx-stat"><p>Sessão actual</p><strong style={{ color: timer.phase === "focus" ? accent : "#6E6E76" }}>{timer.phase === "focus" ? focusTimer.elapsedFocusMinutes(timer) + " min" : "—"}</strong></div>
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
              <p style={{ margin: "14px 0 0", fontSize: 10, color: "#6E6E76", fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.5 }}>
                Cada minuto creditado corresponde só ao tempo com o cronómetro em foco a correr (pausas não contam).
              </p>
            </section>
          )}

          {sidebarTab === "notes" && (
            <section className="fx-panel" style={{ minHeight: "calc(100vh - 118px)" }}>
              <div className="fx-tabs">
                <button type="button" className={"fx-tab" + (notesTab === "ideas" ? " on" : "")} onClick={function() { setNotesTab("ideas"); }}
                  style={notesTab === "ideas" ? { borderBottomColor: "#E6E6E9", color: "#EDEDEF" } : null}>Ideias espontâneas</button>
                <button type="button" className={"fx-tab" + (notesTab === "review" ? " on" : "")} onClick={function() { setNotesTab("review"); }}
                  style={notesTab === "review" ? { borderBottomColor: "#E6E6E9", color: "#EDEDEF" } : null}>Notas de revisão</button>
              </div>
              {notesTab === "ideas" ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <input className="fx-input" value={ideaInput} disabled={dis} placeholder="Captura rápida sem perder o foco…"
                      onChange={function(e) { setIdeaInput(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") addIdea("idea"); }} />
                    <button type="button" className="fx-btn" disabled={dis || !ideaInput.trim()} onClick={function() { addIdea("idea"); }}
                      style={{ borderColor: "rgba(255,255,255,0.14)", color: "#EDEDEF", background: "#1A1A1D" }}>+</button>
                  </div>
                  {ideasOnly.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#6E6E76", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", padding: 24 }}>Sem ideias ainda.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {ideasOnly.map(function(it) {
                        return (
                          <div key={it.id} className="fx-idea">
                            <button type="button" onClick={function() { removeIdea(it.id); }}>×</button>
                            {it.content}
                            <time style={{ display: "block", marginTop: 5, fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: "#6E6E76" }}>{it.day_key}</time>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <textarea className="fx-area" value={reviewText} disabled={dis}
                    placeholder={"Resumo importante da matéria…\n\nEnvia para o Diário quando estiveres pronto."}
                    onChange={function(e) { onReviewChange(e.target.value); }} />
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <button type="button" className="fx-btn" disabled={!reviewText.trim() || syncStatus === "sending" || !auth.user} onClick={syncToDiary}
                      style={{ borderColor: "rgba(255,255,255,0.14)", color: "#EDEDEF", background: "#1A1A1D" }}>
                      {syncStatus === "sending" ? "A enviar…" : "↗ Sincronizar com Diário"}
                    </button>
                    {syncStatus === "sent" && <span className="fx-badge" style={{ color: "#8FB39B", background: "rgba(143,179,155,0.14)" }}>Enviado ✓</span>}
                  </div>
                </div>
              )}
            </section>
          )}

          {sidebarTab === "analytics" && (
            <section className="fx-panel" style={{ minHeight: "calc(100vh - 118px)" }}>
              <h3 className="fx-title" style={{ color: PURPLE }}><span>◈</span> Analytics · {activeProject.name}</h3>
              <div className="fx-statgrid">
                <div className="fx-stat"><p>Total estudado</p><strong style={{ color: accent }}>{fmtHours(goal.studied)}</strong></div>
                <div className="fx-stat"><p>Média 7 dias</p><strong>{Math.round(week.reduce(function(s, d) { return s + d.minutes; }, 0) / 7)} min/d</strong></div>
                <div className="fx-stat"><p>Melhor dia</p><strong style={{ color: AMBER }}>{Math.max.apply(null, week.map(function(d) { return d.minutes; }))} min</strong></div>
                <div className="fx-stat"><p>Tarefas</p><strong>{projectTasks.filter(function(t) { return t.done; }).length}/{projectTasks.length}</strong></div>
              </div>

              {goal.goalMin > 0 ? (
                <div className="fx-goal">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <p style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#A0A0A8" }}>Meta: {activeProject.goal_hours}h até {activeProject.deadline ? new Date(activeProject.deadline).toLocaleDateString("pt-PT") : "—"}</p>
                    <strong style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: accent }}>{goal.pct}%</strong>
                  </div>
                  <div className="fx-goal-bar"><i style={{ width: goal.pct + "%" }} /></div>
                  <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#A0A0A8" }}>
                    <span>Faltam <strong style={{ color: accent }}>{fmtHours(goal.remaining)}</strong></span>
                    {goal.daysLeft != null ? <span><strong style={{ color: AMBER }}>{goal.daysLeft}</strong> dias restantes</span> : null}
                    {goal.daysLeft != null && goal.daysLeft > 0 ? (
                      <span>Ritmo: <strong>{Math.ceil(goal.remaining / goal.daysLeft)} min/dia</strong></span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <p style={{ margin: "16px 0 6px", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "#6E6E76", letterSpacing: 0.6 }}>ÚLTIMOS 7 DIAS</p>
              <div className="fx-chart">
                {week.map(function(d) {
                  var h = Math.round((d.minutes / maxMin) * 100);
                  var isToday = d.day_key === today;
                  return (
                    <div key={d.day_key} className="fx-col" title={d.minutes + " min"}>
                      <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: isToday ? accent : "#6E6E76" }}>{d.minutes || "·"}</span>
                      <div className="fx-bar" style={{ height: (d.minutes > 0 ? Math.max(6, h) : 3) + "%", background: isToday ? accent : "rgba(255,255,255,0.24)", opacity: d.minutes ? 1 : 0.2 }} />
                      <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: isToday ? accent : "#6E6E76" }}>{weekdayShort(d.day_key)}</span>
                    </div>
                  );
                })}
              </div>

              <p style={{ margin: "20px 0 8px", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "#6E6E76", letterSpacing: 0.6 }}>REGISTO DIÁRIO</p>
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
                          <td style={{ color: "#A0A0A8", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subject || "—"}</td>
                        </tr>
                      );
                    })}
                    {!projectMetrics.length ? <tr><td colSpan={4} style={{ color: "#6E6E76", textAlign: "center" }}>Sem registos ainda</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {sidebarTab === "tasks" && (
            <section className="fx-panel" style={{ minHeight: "calc(100vh - 118px)" }}>
              <h3 className="fx-title" style={{ color: accent }}><span>☑</span> Tarefas</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input className="fx-input" value={taskInput} disabled={dis} placeholder="Nova tarefa…"
                  onChange={function(e) { setTaskInput(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") addTask(); }} />
                <button type="button" className="fx-btn" disabled={dis || !taskInput.trim()} onClick={addTask}
                  style={{ borderColor: "rgba(255,255,255,0.14)", color: "#EDEDEF", background: "#1A1A1D" }}>+</button>
              </div>
              {projectTasks.length === 0 ? (
                <p style={{ textAlign: "center", color: "#6E6E76", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", padding: 24 }}>Lista vazia. Adiciona tarefas para este projeto.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {projectTasks.map(function(t) {
                    return (
                      <div key={t.id} className={"fx-task" + (t.done ? " done" : "")}>
                        <button type="button" className={"fx-task-check" + (t.done ? " on" : "")}
                          onClick={function() { toggleTask(t.id); }}>{t.done ? "✓" : ""}</button>
                        <span style={{ flex: 1, fontSize: 13, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#6E6E76" : "#EDEDEF" }}>{t.text}</span>
                        <button type="button" onClick={function() { removeTask(t.id); }} style={{ background: "none", border: "none", color: "#6E6E76", cursor: "pointer", fontSize: 14 }}>×</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
          </div>
        </main>

        <nav className="fx-dock" aria-label="Secções do estúdio">
          {SIDEBAR.map(function(item) {
            var on = sidebarTab === item.id;
            return (
              <button key={item.id} type="button" className={"fx-nav ui-tap" + (on ? " on" : "")}
                onClick={function() { setSidebarTab(item.id); }} title={item.label}>
                {item.icon}<span>{item.label}</span>
              </button>
            );
          })}
        </nav>
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
