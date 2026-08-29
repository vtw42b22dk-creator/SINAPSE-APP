import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import * as focusStore from "../lib/focusStore";
import * as focusTimer from "../lib/focusTimer";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { MICRO_CSS } from "../lib/microUi";
import { moduleColor, moduleGlow, alpha } from "../lib/theme";
import { GLASS_CSS, glowFilter, segThumbStyle } from "../lib/glassUi";

var ACCENT = moduleColor("focus");
var CYAN = ACCENT;
var AMBER = "#C4A57C";
var PURPLE = ACCENT;

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
  GLASS_CSS,
  "@keyframes fxIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}",

  /* ---------- shell & ambient field ---------- */
  ".fs-root{height:100vh;max-height:100dvh;overflow:hidden;display:flex;flex-direction:column;background:#070708;color:#EDEDEF;font-family:'IBM Plex Sans',sans-serif;position:relative}",
  ".fs-field{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}",
  ".fs-orb{position:absolute;border-radius:50%;filter:blur(90px)}",
  ".fs-orb--a{width:52vw;height:52vw;max-width:560px;max-height:560px;top:-18%;left:-14%;animation:haloBreatheSlow 9s var(--ease) infinite,driftA 24s ease-in-out infinite}",
  ".fs-orb--b{width:40vw;height:40vw;max-width:420px;max-height:420px;bottom:-12%;right:-10%;opacity:.7;animation:haloBreatheSlow 11s var(--ease) infinite -3s,driftB 28s ease-in-out infinite}",
  ".fs-orb--core{width:min(60vh,660px);height:min(60vh,660px);top:50%;left:50%;transform:translate(-50%,-50%);opacity:.4;background:radial-gradient(circle,var(--glow,rgba(237,237,239,.4)),transparent 70%);animation:haloBreatheSlow 7s var(--ease) infinite;transition:background 1s var(--ease)}",
  ".fs-root.is-run .fs-orb--core{opacity:.7;animation:haloBreathe 3.4s var(--ease) infinite}",

  /* ---------- header capsule ---------- */
  ".fs-headwrap{flex-shrink:0;padding:12px 12px 8px;position:relative;z-index:20}",
  ".fs-head{display:flex;align-items:center;gap:10px;padding:9px 12px}",
  ".fs-hbtn{padding:8px 12px;border:1px solid rgba(255,255,255,.09);border-radius:999px;background:rgba(255,255,255,.03);color:#A0A0A8;cursor:pointer;font-size:11px;font-family:'JetBrains Mono',monospace;letter-spacing:.3px;white-space:nowrap;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),background var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fs-hbtn:hover{color:#EDEDEF;border-color:rgba(255,255,255,.22);background:rgba(255,255,255,.06)}",
  ".fs-hbtn:active{transform:scale(.96)}",
  ".fs-headtitle{flex:1;min-width:0;display:flex;align-items:center;gap:10px}",
  ".fs-headic{width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;background:color-mix(in srgb,var(--ac) 16%,transparent);border:1px solid color-mix(in srgb,var(--ac) 35%,transparent);color:var(--ac)}",
  ".fs-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font-size:10px;letter-spacing:.4px;font-family:'JetBrains Mono',monospace;border:1px solid rgba(255,255,255,.08);flex-shrink:0}",
  ".fs-danger{padding:8px 11px;border:1px solid rgba(192,140,140,.25);border-radius:999px;background:rgba(192,140,140,.06);color:rgba(192,140,140,.85);cursor:pointer;font-size:13px;line-height:1;transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fs-danger:hover{background:rgba(192,140,140,.16);border-color:rgba(192,140,140,.5)}",

  /* ---------- shell / main ---------- */
  ".fs-shell{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;position:relative;z-index:1}",
  ".fs-main{flex:1;min-width:0;min-height:0;overflow-y:auto;padding:4px 18px 8px;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;order:1;position:relative;z-index:1}",
  ".fs-panel-stage{flex:1;width:100%;min-height:0;display:flex;flex-direction:column}",

  /* ---------- dock capsule ---------- */
  ".fs-dockwrap{flex-shrink:0;padding:8px 12px max(8px,env(safe-area-inset-bottom));order:2;position:relative;z-index:25}",
  ".fs-dock{position:relative;display:flex;align-items:stretch;justify-content:space-around;gap:0;padding:5px}",
  ".fs-dock-thumb{position:absolute;top:5px;bottom:5px;left:5px;width:calc((100% - 10px)/5);border-radius:20px;background:color-mix(in srgb,var(--ac) 16%,transparent);border:1px solid color-mix(in srgb,var(--ac) 34%,transparent);transition:transform var(--dur-slow) var(--ease);z-index:0}",
  ".fs-navitem{position:relative;z-index:1;flex:1;height:52px;border:none;background:transparent;color:#6E6E76;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:16px;transition:color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fs-navitem span{font-size:8px;font-family:'JetBrains Mono',monospace;letter-spacing:.7px;line-height:1;text-transform:uppercase}",
  ".fs-navitem:active{transform:scale(.93)}",
  ".fs-navitem.on{color:#EDEDEF}",

  /* ---------- generic panel bits ---------- */
  ".fs-panel{flex:1;width:100%;min-height:0;padding:14px 2px 28px;animation:fxIn var(--dur-slow) var(--ease) both;box-sizing:border-box;display:flex;flex-direction:column}",
  ".fs-panel--clock{justify-content:center;align-items:center;min-height:calc(100vh - 150px);padding:20px 12px}",
  ".fs-title{margin:0 0 18px;display:flex;align-items:center;gap:10px;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;letter-spacing:.5px}",
  ".fs-icon-badge{width:28px;height:28px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;background:color-mix(in srgb,currentColor 14%,transparent);border:1px solid color-mix(in srgb,currentColor 32%,transparent)}",
  ".fs-label{display:block;font-size:10px;font-family:'JetBrains Mono',monospace;color:#6E6E76;margin-bottom:8px;letter-spacing:1.6px;text-transform:uppercase}",
  ".fs-note{margin:14px 0 0;font-size:10px;font-family:'JetBrains Mono',monospace;color:#6E6E76;text-align:center;line-height:1.6;max-width:420px}",

  ".fs-input,.fs-area{width:100%;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.09);border-radius:14px;color:#EDEDEF;padding:12px 14px;font-size:14px;line-height:1.5;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color var(--dur) var(--ease),background var(--dur) var(--ease)}",
  ".fs-input:hover:not(:focus):not(:disabled),.fs-area:hover:not(:focus):not(:disabled){border-color:rgba(255,255,255,.16)}",
  ".fs-input:focus,.fs-area:focus{border-color:color-mix(in srgb,var(--ac) 55%,transparent);background:rgba(255,255,255,.05)}",
  ".fs-area{min-height:min(360px,42vh);font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.7;resize:vertical;flex:1}",

  ".fs-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:11px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.045);color:#EDEDEF;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:500}",
  ".fs-btn:hover:not(:disabled){background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2)}",
  ".fs-btn:disabled{opacity:.4;cursor:not-allowed}",
  ".fs-x{background:none;border:none;color:#6E6E76;cursor:pointer;font-size:15px;line-height:1;padding:4px;opacity:0;transition:opacity var(--dur) var(--ease),color var(--dur) var(--ease)}",

  /* ---------- segmented controls (mode / clock style) ---------- */
  ".fs-modes{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}",
  ".fs-mode{padding:9px 15px;border-radius:999px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.03);color:#8A8A90;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;letter-spacing:.4px;cursor:pointer;transition:color var(--dur) var(--ease),background var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fs-mode:hover{color:#EDEDEF;border-color:rgba(255,255,255,.2)}",
  ".fs-mode.on{color:var(--ac);background:color-mix(in srgb,var(--ac) 16%,transparent);border-color:color-mix(in srgb,var(--ac) 45%,transparent)}",
  ".fs-styletog{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}",
  ".fs-stybtn{padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);color:#6E6E76;font-size:10.5px;letter-spacing:.5px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:color var(--dur) var(--ease),background var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".fs-stybtn:hover{color:#A0A0A8;border-color:rgba(255,255,255,.18)}",
  ".fs-stybtn.on{color:var(--glow);background:color-mix(in srgb,var(--glow) 14%,transparent);border-color:color-mix(in srgb,var(--glow) 40%,transparent)}",
  ".fs-notes-seg button{padding:9px 16px;font-size:11.5px;letter-spacing:.3px;color:#8A8A90}",
  ".fs-notes-seg button.on{color:#EDEDEF}",

  /* ---------- halo clock ---------- */
  ".fs-halo{position:relative;width:min(320px,72vw);height:min(320px,72vw);display:flex;align-items:center;justify-content:center;margin:2px auto}",
  ".fs-halo-glow{position:absolute;inset:-16%;border-radius:50%;background:radial-gradient(circle,var(--glow,rgba(237,237,239,.4)),transparent 66%);filter:blur(38px);opacity:.5;animation:haloBreatheSlow 6s var(--ease) infinite}",
  ".fs-halo.is-run .fs-halo-glow{opacity:.95;animation:haloBreathe 3s var(--ease) infinite}",
  ".fs-halo-rim{position:absolute;inset:0;border-radius:50%;border:1px solid rgba(255,255,255,.1)}",
  ".fs-halo-face{position:relative;width:86%;height:86%;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(165deg,rgba(255,255,255,.06),rgba(255,255,255,.012) 65%);border:1px solid rgba(255,255,255,.09);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);overflow:hidden;padding:6%;box-sizing:border-box}",

  ".fs-digital{font-family:'JetBrains Mono',monospace;font-weight:300;font-size:clamp(42px,11vw,78px);line-height:.9;letter-spacing:-.04em;color:#EDEDEF;font-variant-numeric:tabular-nums;text-align:center;transition:color var(--dur-slow) var(--ease)}",
  ".fs-digital.is-run{color:var(--glow);animation:glowPulse 2.6s var(--ease) infinite}",

  ".fs-analog{width:78%;height:78%;position:relative}",
  ".fs-analog-face{width:100%;height:100%;border-radius:50%;border:1px solid rgba(255,255,255,.14);position:relative}",
  ".fs-hand{position:absolute;bottom:50%;left:50%;border-radius:999px;transform-origin:bottom center;transition:opacity var(--dur) var(--ease)}",
  ".fs-hand--min{background:var(--glow,#EDEDEF)}",
  ".fs-hand--sec{background:#EDEDEF}",
  ".fs-analog-dot{position:absolute;inset:45%;border-radius:50%;background:var(--glow,#EDEDEF)}",

  ".fs-ring{width:82%;height:82%;position:relative;display:flex;align-items:center;justify-content:center}",
  ".fs-ring svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);overflow:visible}",
  ".fs-ring-track{fill:none;stroke:rgba(255,255,255,.09);stroke-width:5}",
  ".fs-ring-progress{fill:none;stroke:var(--glow);stroke-width:5;stroke-linecap:round;transition:stroke-dashoffset .9s linear;filter:drop-shadow(0 0 7px var(--glow))}",

  ".fs-blocks{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:center}",
  ".fs-block{width:clamp(26px,6.4vw,40px);height:clamp(44px,10.4vw,62px);border-radius:12px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.09);display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:clamp(17px,4.6vw,28px);font-weight:300;color:#6E6E76;transition:color var(--dur-slow) var(--ease),background var(--dur-slow) var(--ease),border-color var(--dur-slow) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fs-block.on{color:var(--glow);background:color-mix(in srgb,var(--glow) 14%,transparent);border-color:color-mix(in srgb,var(--glow) 40%,transparent);transform:translateY(-2px)}",

  ".fs-phase{margin:0;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:7px 15px;border-radius:999px;border:1px solid}",
  ".fs-prog{width:100%;max-width:420px;height:5px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden}",
  ".fs-prog i{display:block;height:100%;border-radius:999px;background:var(--glow);transition:width 1s linear;filter:drop-shadow(0 0 6px var(--glow))}",
  ".fs-tcontrols{display:flex;gap:14px;width:100%;max-width:420px;align-items:center;justify-content:center}",
  ".fs-tbtn{flex:1;min-height:52px;padding:14px 20px;border-radius:999px;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;letter-spacing:.6px;cursor:pointer;border:1px solid;background:rgba(255,255,255,.04)}",
  ".fs-tbtn:disabled{opacity:.35;cursor:not-allowed}",

  /* ---------- project picker ---------- */
  ".fs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;width:100%;flex:1;align-content:start;padding-bottom:8px}",
  ".fs-proj{position:relative;padding:22px;min-height:172px;cursor:pointer;display:flex;flex-direction:column;transition:transform var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".fs-proj::before{content:'';position:absolute;top:-1px;left:20px;right:20px;height:2px;border-radius:2px;background:var(--pc);filter:drop-shadow(0 0 8px var(--pc));opacity:.85}",
  ".fs-proj:hover{transform:translateY(-4px);border-color:rgba(255,255,255,.18)}",
  ".fs-proj-top{display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-right:30px}",
  ".fs-proj-ic{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;background:color-mix(in srgb,var(--pc) 16%,transparent);border:1px solid color-mix(in srgb,var(--pc) 38%,transparent);color:var(--pc)}",
  ".fs-proj-del{position:absolute;top:14px;right:14px;width:28px;height:28px;border-radius:50%;border:1px solid rgba(255,255,255,.1);background:rgba(10,10,11,.65);color:#6E6E76;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity var(--dur) var(--ease),background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease);z-index:2}",
  ".fs-proj:hover .fs-proj-del{opacity:1}",
  ".fs-proj-del:hover{background:rgba(192,140,140,.16);color:#C08C8C;border-color:rgba(192,140,140,.4)}",
  ".fs-proj-foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:10px;padding-top:14px}",
  ".fs-proj-play{display:flex;align-items:center;gap:7px;padding:8px 14px 8px 11px;border-radius:999px;border:1px solid color-mix(in srgb,var(--pc) 40%,transparent);background:color-mix(in srgb,var(--pc) 10%,transparent);color:var(--pc);font-family:'JetBrains Mono',monospace;font-size:10.5px;cursor:pointer;transition:background var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fs-proj-play:hover{background:color-mix(in srgb,var(--pc) 22%,transparent);transform:translateY(-1px)}",
  ".fs-proj-ring text{font-family:'JetBrains Mono',monospace}",
  ".fs-addcard{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:172px;border-radius:var(--radius-xl);border:1.5px dashed rgba(255,255,255,.14);background:rgba(255,255,255,.015);cursor:pointer;color:#6E6E76;transition:border-color var(--dur) var(--ease),color var(--dur) var(--ease),background var(--dur) var(--ease)}",
  ".fs-addcard:hover{border-color:color-mix(in srgb,var(--ac) 50%,transparent);color:var(--ac);background:color-mix(in srgb,var(--ac) 6%,transparent)}",
  ".fs-addcard-plus{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;border:1px solid rgba(255,255,255,.14);transition:border-color var(--dur) var(--ease),filter var(--dur) var(--ease)}",
  ".fs-addcard:hover .fs-addcard-plus{border-color:color-mix(in srgb,var(--ac) 55%,transparent);filter:drop-shadow(0 0 12px var(--ac))}",

  ".fs-modal-bg{position:fixed;inset:0;z-index:100;background:rgba(4,4,5,.72);display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}",
  ".fs-modal{width:min(460px,100%);max-height:88vh;overflow-y:auto;padding:26px}",
  ".fs-chipgrid{display:flex;gap:8px;flex-wrap:wrap}",
  ".fs-iconchip{width:38px;height:38px;border-radius:12px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.03);color:#A0A0A8;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:color var(--dur) var(--ease),background var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".fs-iconchip.on{color:#EDEDEF;background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.3)}",
  ".fs-colorchip{width:32px;height:32px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;background:none;transition:border-color var(--dur) var(--ease)}",
  ".fs-colorchip i{display:block;width:22px;height:22px;border-radius:50%}",
  ".fs-colorchip.on{border-color:rgba(255,255,255,.6)}",

  /* ---------- stats / analytics ---------- */
  ".fs-statgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:18px}",
  ".fs-stat{padding:16px}",
  ".fs-stat p{margin:0;font-size:10px;font-family:'JetBrains Mono',monospace;color:#6E6E76;letter-spacing:1.4px;text-transform:uppercase}",
  ".fs-stat strong{display:block;margin-top:8px;font-family:'JetBrains Mono',monospace;font-size:21px;font-weight:400;font-variant-numeric:tabular-nums}",
  ".fs-goal{margin:6px 0 20px;padding:18px}",
  ".fs-goalbar{height:8px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden;margin-top:12px}",
  ".fs-goalbar i{display:block;height:100%;border-radius:999px;background:var(--ac);filter:drop-shadow(0 0 6px var(--ac));transition:width var(--dur-slow) var(--ease)}",
  ".fs-chart{display:flex;gap:8px;align-items:flex-end;height:min(200px,26vh);margin:14px 0;padding:16px;min-height:150px}",
  ".fs-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;height:100%;justify-content:flex-end}",
  ".fs-bar{width:100%;max-width:36px;border-radius:8px 8px 3px 3px;min-height:4px;background:linear-gradient(180deg,var(--ac),color-mix(in srgb,var(--ac) 25%,transparent));transition:height var(--dur-slow) var(--ease),opacity var(--dur) var(--ease)}",
  ".fs-tablewrap{padding:6px 10px;overflow-x:auto}",
  ".fs-table{width:100%;border-collapse:collapse;font-size:12px}",
  ".fs-table th,.fs-table td{padding:10px 12px;text-align:left;font-family:'JetBrains Mono',monospace;border-bottom:1px solid rgba(255,255,255,.06)}",
  ".fs-table th{font-size:9.5px;color:#6E6E76;letter-spacing:1.4px;text-transform:uppercase;font-weight:500}",
  ".fs-table tr:last-child td{border-bottom:none}",
  ".fs-table tbody tr{transition:background var(--dur) var(--ease)}",
  ".fs-table tbody tr:hover{background:rgba(255,255,255,.03)}",

  /* ---------- ideas / tasks ---------- */
  ".fs-idea{position:relative;padding:14px 40px 14px 18px;border-radius:14px;font-size:13px;line-height:1.55;white-space:pre-wrap}",
  ".fs-idea::before{content:'';position:absolute;left:0;top:10px;bottom:10px;width:3px;border-radius:3px;background:var(--ac);opacity:.55}",
  ".fs-idea button{position:absolute;top:10px;right:8px;width:26px;height:26px;border-radius:50%;border:none;background:transparent;color:#6E6E76;cursor:pointer;opacity:0;transition:opacity var(--dur) var(--ease),color var(--dur) var(--ease),background var(--dur) var(--ease)}",
  ".fs-idea:hover button{opacity:1}",
  ".fs-idea button:hover{color:#C08C8C;background:rgba(192,140,140,.12)}",
  ".fs-task{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;transition:opacity var(--dur) var(--ease)}",
  ".fs-task.done{opacity:.4}",
  ".fs-task:hover .fs-x{opacity:1}",
  ".fs-task-check{width:23px;height:23px;border-radius:50%;border:1.5px solid rgba(255,255,255,.24);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".fs-task-check:hover{border-color:rgba(255,255,255,.55)}",
  ".fs-task-check.on{border-color:var(--ac);background:var(--ac);color:#0A0A0B;animation:chipPop .35s var(--ease)}",

  /* ---------- immersive session ---------- */
  ".fs-immersive{position:fixed;inset:0;z-index:200;background:#070708;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;cursor:pointer;overflow:hidden;animation:fxIn var(--dur-slow) var(--ease) both}",
  ".fs-immersive-bg{position:absolute;inset:-10%;pointer-events:none;background:radial-gradient(circle at 50% 42%,var(--glow,rgba(237,237,239,.28)),transparent 62%);animation:haloBreathe 5s var(--ease) infinite}",
  ".fs-immersive-inner{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:22px;width:100%;max-width:640px;pointer-events:none}",
  ".fs-immersive .fs-halo{width:min(72vw,420px);height:min(72vw,420px)}",
  ".fs-immersive .fs-digital{font-size:clamp(60px,16vw,116px)!important}",
  ".fs-immersive-hint{margin:0;font-size:10px;color:#6E6E76;font-family:'JetBrains Mono',monospace;letter-spacing:.4px;opacity:.7}",
  ".fs-immersive-bar{position:fixed;bottom:0;left:0;right:0;padding:20px 24px max(20px,env(safe-area-inset-bottom));background:linear-gradient(transparent,rgba(7,7,8,.92) 45%);display:flex;gap:12px;justify-content:center;pointer-events:auto;z-index:2}",
  ".fs-phase-flash{position:fixed;inset:0;z-index:190;pointer-events:none;animation:uiFlash .85s var(--ease) both}",
  ".fs-phase-flash--focus{background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.09),transparent 65%)}",
  ".fs-phase-flash--break{background:radial-gradient(circle at 50% 40%,rgba(196,165,124,.14),transparent 65%)}",

  /* ---------- responsive ---------- */
  "@media(max-width:720px){.fs-main{padding:2px 12px 6px}.fs-proj-del{opacity:1}.fs-panel--clock{min-height:calc(100vh - 210px);padding:14px 8px}.fs-halo{width:min(300px,80vw);height:min(300px,80vw)}.fs-input,.fs-area{font-size:16px!important}.fs-dockwrap{padding:6px 8px max(6px,env(safe-area-inset-bottom))}.fs-navitem{height:48px;font-size:15px}.fs-grid{grid-template-columns:1fr}.fs-tcontrols{max-width:none}.fs-prog{max-width:none}}",
  "@media(pointer:coarse){.fs-hbtn{min-height:44px}.fs-mode{min-height:40px}.fs-stybtn{min-height:40px}.fs-task-check{width:27px;height:27px}.fs-proj-del{width:34px;height:34px}.fs-idea button{width:30px;height:30px;opacity:1}.fs-task .fs-x{opacity:1}}",
  "@media(hover:none){.fs-proj:hover{transform:none}}",
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
    <div className={"fs-digital" + (props.running ? " is-run" : "")}>
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
    <div className="fs-analog">
      <div className="fs-analog-face">
        {Array.from({ length: 12 }, function(_, i) {
          var a = (i / 12) * Math.PI * 2;
          var big = i % 3 === 0;
          var r = 43;
          var x = 50 + r * Math.sin(a);
          var y = 50 - r * Math.cos(a);
          return (
            <span key={i} style={{
              position: "absolute", left: x + "%", top: y + "%", transform: "translate(-50%,-50%)",
              width: big ? 3 : 2, height: big ? 12 : 7, borderRadius: 2,
              background: big ? "rgba(255,255,255,0.34)" : "rgba(255,255,255,0.14)",
            }} />
          );
        })}
        <div className="fs-hand fs-hand--min" style={{ width: 3, height: "30%", transform: "translateX(-50%) rotate(" + minAngle + "deg)" }} />
        <div className="fs-hand fs-hand--sec" style={{ width: 1.5, height: "40%", transform: "translateX(-50%) rotate(" + secAngle + "deg)", opacity: 0.65 }} />
        <div className="fs-analog-dot" />
      </div>
    </div>
  );
}

function RingClock(props) {
  var r = 52;
  var c = 2 * Math.PI * r;
  var pct = props.total > 0 ? props.secs / props.total : 0;
  return (
    <div className="fs-ring">
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <circle className="fs-ring-track" cx="70" cy="70" r={r} />
        <circle
          className="fs-ring-progress"
          cx="70"
          cy="70"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="fs-digital" style={{ fontSize: "clamp(32px,8vw,52px)" }}>
        {focusTimer.fmtClock(props.secs)}
      </div>
    </div>
  );
}

function BlocksClock(props) {
  var str = focusTimer.fmtClock(props.secs);
  return (
    <div className="fs-blocks">
      {str.split("").map(function(ch, i) {
        if (ch === ":") return <span key={i} style={{ color: "#6E6E76", fontSize: 26 }}>:</span>;
        return <div key={i} className={"fs-block" + (props.running ? " on" : "")}>{ch}</div>;
      })}
    </div>
  );
}

function ClockDisplay(props) {
  var common = { secs: props.secs, total: props.total, running: props.running };
  var inner = <DigitalClock {...common} />;
  if (props.style === "analog") inner = <AnalogClock {...common} />;
  else if (props.style === "ring") inner = <RingClock {...common} />;
  else if (props.style === "blocks") inner = <BlocksClock {...common} />;
  return (
    <div className={"fs-halo" + (props.running ? " is-run" : "")}>
      <span className="fs-halo-glow" aria-hidden="true" />
      <span className="fs-halo-rim" aria-hidden="true" />
      <div className="fs-halo-face">{inner}</div>
    </div>
  );
}

function ImmersiveSession(props) {
  if (!props.active) return null;
  return (
    <div className="fs-immersive" style={{ "--glow": props.phaseColor }} onClick={props.onToggleControls} role="presentation">
      <span className="fs-immersive-bg" aria-hidden="true" />
      <div className="fs-immersive-inner">
        <p className="fs-phase" style={{ color: props.phaseColor, borderColor: alpha(props.phaseColor, 0.35), background: alpha(props.phaseColor, 0.12) }}>{props.phase === "focus" ? "Sessão de foco" : "Pausa"}</p>
        <ClockDisplay style={props.clockStyle} secs={props.secsLeft} total={props.phaseTotal} running={props.running} />
        <div className="fs-prog" style={{ maxWidth: 420, width: "100%" }}>
          <i style={{ width: props.progress + "%" }} />
        </div>
        <p className="fs-immersive-hint">Toca para controlos · Barra de espaço pausa/continua</p>
      </div>
      {props.showControls ? (
        <div className="fs-immersive-bar" onClick={function(e) { e.stopPropagation(); }}>
          <button type="button" className="fs-tbtn glow-btn" onClick={props.onPause}
            style={{ borderColor: alpha(props.running ? AMBER : "#8FB39B", 0.5), color: props.running ? AMBER : "#8FB39B" }}>
            {props.running ? "❚❚ Pausa" : "▶ Continuar"}
          </button>
          <button type="button" className="fs-tbtn glow-btn" onClick={props.onReset}
            style={{ borderColor: "rgba(255,255,255,.18)", color: "#A0A0A8" }}>↺ Reset</button>
          <button type="button" className="fs-tbtn glow-btn" onClick={props.onExitImmersive}
            style={{ borderColor: "rgba(255,255,255,.12)", color: "#6E6E76" }}>Sair</button>
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
    <div className="fs-root" data-scrollable style={{ "--ac": CYAN, "--glow": CYAN }}>
      <style>{MODULE_ENTRY_CSS + FX_CSS}</style>
      <div className="fs-field" aria-hidden="true">
        <span className="fs-orb fs-orb--core" />
        <span className="fs-orb fs-orb--a" style={{ background: moduleGlow(CYAN) }} />
        <span className="fs-orb fs-orb--b" style={{ background: moduleGlow(CYAN, "14") }} />
      </div>
      <div className="fs-headwrap">
        <header className="fs-head glass-capsule">
          <button type="button" className="fs-hbtn" onClick={function() { navigate("/"); }}>← Hub</button>
          <div className="fs-headtitle">
            <span className="fs-headic">◷</span>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 500, color: CYAN, letterSpacing: 1.2 }}>ESTÚDIO DE FOCO</h1>
              <p style={{ margin: "3px 0 0", fontSize: 11, lineHeight: 1.5, color: "#8A8A90" }}>Escolhe ou cria um projeto de estudo</p>
            </div>
          </div>
        </header>
      </div>
      <main className="fs-main">
        <div className="fs-grid">
          {props.projects.map(function(p, idx) {
            var prog = focusStore.goalProgress(p, props.metricsByProject[p.id] || []);
            var r = 20, c = 2 * Math.PI * r;
            return (
              <article key={p.id} className="fs-proj glass glass-in" style={{ "--pc": p.color, animationDelay: (idx * 0.04) + "s" }} onClick={function() { props.onSelect(p); }}>
                <button type="button" className="fs-proj-del" title="Eliminar projeto" aria-label="Eliminar projeto" onClick={function(e) { removeProject(e, p); }}>×</button>
                <div className="fs-proj-top">
                  <span className="fs-proj-ic">{p.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 14.5, fontWeight: 500, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h2>
                    <p style={{ margin: "5px 0 0", fontSize: 11, lineHeight: 1.5, color: "#8A8A90", fontFamily: "'JetBrains Mono',monospace" }}>{fmtHours(prog.studied)} estudados</p>
                  </div>
                </div>
                <div className="fs-proj-foot">
                  {prog.goalMin > 0 ? (
                    <svg className="fs-proj-ring" width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
                      <circle cx="23" cy="23" r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3" />
                      <circle cx="23" cy="23" r={r} fill="none" stroke={p.color} strokeWidth="3" strokeLinecap="round"
                        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, prog.pct) / 100)}
                        transform="rotate(-90 23 23)" style={{ filter: glowFilter(p.color, 6, 0.6), transition: "stroke-dashoffset var(--dur-slow) var(--ease)" }} />
                      <text x="23" y="26.5" textAnchor="middle" fontSize="9" fill={p.color}>{prog.pct}%</text>
                    </svg>
                  ) : (
                    <p style={{ margin: 0, fontSize: 9.5, letterSpacing: 1.2, textTransform: "uppercase", color: "#6E6E76", fontFamily: "'JetBrains Mono',monospace" }}>Sem meta</p>
                  )}
                  <button type="button" className="fs-proj-play" onClick={function(e) { e.stopPropagation(); if (props.onQuickStart) props.onQuickStart(p); }}>▶ Iniciar agora</button>
                </div>
              </article>
            );
          })}
          <button type="button" className="fs-addcard" onClick={openCreate}>
            <span className="fs-addcard-plus" style={{ color: CYAN }}>+</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, letterSpacing: 0.4 }}>Novo projeto</span>
          </button>
        </div>
      </main>

      {modalOpen && (
        <div className="fs-modal-bg" onClick={function(e) { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="fs-modal glass glass-in" onClick={function(e) { e.stopPropagation(); }}>
            <p style={{ margin: "0 0 20px", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#6E6E76", letterSpacing: 1.6 }}>NOVO PROJETO DE FOCO</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="fs-label">Nome</label>
                <input className="fs-input" value={name} onChange={function(e) { setName(e.target.value); }} placeholder="Ex: Estudar exame, Investimentos…" autoFocus />
              </div>
              <div>
                <label className="fs-label">Ícone</label>
                <div className="fs-chipgrid">
                  {ICONS.map(function(ic) {
                    return <button key={ic} type="button" className={"fs-iconchip" + (icon === ic ? " on" : "")} onClick={function() { setIcon(ic); }}>{ic}</button>;
                  })}
                </div>
              </div>
              <div>
                <label className="fs-label">Cor</label>
                <div className="fs-chipgrid">
                  {focusStore.PROJECT_COLORS.map(function(c) {
                    return <button key={c} type="button" className={"fs-colorchip" + (color === c ? " on" : "")} onClick={function() { setColor(c); }}><i style={{ background: c }} /></button>;
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
                    <label className="fs-label">Horas objetivo</label>
                    <input type="number" min={0} className="fs-input" value={goal} onChange={function(e) { setGoal(e.target.value); }} placeholder="40" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="fs-label">Data final</label>
                    <input type="date" className="fs-input" value={deadline} onChange={function(e) { setDeadline(e.target.value); }} />
                  </div>
                </div>
              ) : null}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" className="fs-btn glow-btn" onClick={create} style={{ flex: 1, minHeight: 44, background: "#EDEDEF", color: "#0A0A0B", borderColor: "#EDEDEF" }}>Criar e abrir</button>
                <button type="button" className="fs-hbtn" onClick={function() { setModalOpen(false); }} style={{ minHeight: 44, padding: "0 16px" }}>Cancelar</button>
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
      <div style={{ minHeight: "100vh", background: "#070708", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", color: "#6E6E76", fontSize: 12, letterSpacing: 1 }}>A carregar estúdio…</p>
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
  var dockIndex = SIDEBAR.findIndex(function(i) { return i.id === sidebarTab; });

  return (
    <div className={"fs-root" + (timer.running ? " is-run" : "")} style={{ "--ac": accent, "--glow": phaseColor }}>
      <style>{MODULE_ENTRY_CSS + FX_CSS}</style>
      <div className="fs-field" aria-hidden="true">
        <span className="fs-orb fs-orb--core" />
        <span className="fs-orb fs-orb--a" style={{ background: moduleGlow(accent) }} />
        <span className="fs-orb fs-orb--b" style={{ background: moduleGlow(accent, "12") }} />
      </div>
      {phaseFlash ? <div className={"fs-phase-flash fs-phase-flash--" + phaseFlash} aria-hidden="true" /> : null}

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

      <div className="fs-headwrap">
        <header className="fs-head glass-capsule">
          <button type="button" className="fs-hbtn" onClick={exitProject} title="Trocar projeto">← Projetos</button>
          <button type="button" className="fs-hbtn" onClick={function() { navigate("/"); }}>Hub</button>
          <div className="fs-headtitle">
            <span className="fs-headic">{activeProject.icon}</span>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, color: "#EDEDEF", letterSpacing: 0.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeProject.name}</h1>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "#6E6E76", fontFamily: "'JetBrains Mono',monospace" }}>
                {timer.running ? "● Sessão activa" : "Estúdio de Foco"} · hoje {todayMetric.minutes} min
              </p>
            </div>
          </div>
          <span className="fs-badge" style={{ color: timer.running ? "#8FB39B" : "#A0A0A8", background: timer.running ? "rgba(143,179,155,0.14)" : "rgba(255,255,255,.04)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: timer.running ? "#8FB39B" : "#6E6E76" }} />
            {timer.running ? "A contar" : (auth.user ? "Sync" : "Local")}
          </span>
          <button type="button" className="fs-danger" title="Eliminar este projeto"
            onClick={function() {
              if (!window.confirm("Eliminar \"" + activeProject.name + "\" e todos os dados associados?")) return;
              removeProject(activeProject);
            }}>×</button>
        </header>
      </div>

      <div className="fs-shell">
        <main className="fs-main" data-scrollable>
          <div key={sidebarTab} className="fs-panel-stage ui-fade-in">
          {sidebarTab === "clock" && (
            <section className="fs-panel fs-panel--clock">
              <h3 className="fs-title" style={{ color: phaseColor }}><span className="fs-icon-badge">◷</span> Relógio · {timer.phase === "focus" ? "Foco" : "Pausa"}</h3>
              <div className="fs-modes">
                {presets.map(function(m) {
                  var on = timer.modeId === m.id;
                  return (
                    <button key={m.id} type="button" className={"fs-mode" + (on ? " on" : "")} onClick={function() { selectMode(m.id); }}>{m.label}</button>
                  );
                })}
              </div>
              {timer.modeId === "custom" && (
                <div style={{ display: "flex", gap: 10, marginBottom: 16, width: "100%", maxWidth: 420 }}>
                  <div style={{ flex: 1 }}>
                    <label className="fs-label">Foco (min)</label>
                    <input type="number" min={1} max={180} className="fs-input" value={timer.customFocus} disabled={timer.running}
                      onChange={function(e) { focusTimer.configureTimer({ customFocus: Math.max(1, parseInt(e.target.value, 10) || 1) }); }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="fs-label">Pausa (min)</label>
                    <input type="number" min={1} max={180} className="fs-input" value={timer.customBreak} disabled={timer.running}
                      onChange={function(e) { focusTimer.configureTimer({ customBreak: Math.max(1, parseInt(e.target.value, 10) || 1) }); }} />
                  </div>
                </div>
              )}
              <div className="fs-clock-wrap" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%" }}>
                <div className="fs-styletog">
                  {CLOCK_STYLES.map(function(st) {
                    return (
                      <button key={st.id} type="button" className={"fs-stybtn" + (timer.clockStyle === st.id ? " on" : "")}
                        onClick={function() { focusTimer.setClockStyle(st.id); }}>{st.label}</button>
                    );
                  })}
                </div>
                <ClockDisplay style={timer.clockStyle} secs={timer.secsLeft} total={phaseTotal} running={timer.running} />
                <p className="fs-phase" style={{ color: phaseColor, borderColor: alpha(phaseColor, 0.35), background: alpha(phaseColor, 0.1) }}>
                  {timer.phase === "focus" ? "● Foco" : "❚❚ Pausa"} · {timer.phase === "focus" ? focusMin : breakMin} min
                </p>
                <div className="fs-prog" style={{ maxWidth: 420 }}><i style={{ width: progress + "%" }} /></div>
                <div className="fs-tcontrols">
                  <button type="button" className="fs-tbtn glow-btn" disabled={dis} onClick={handlePause}
                    style={{ borderColor: alpha(timer.running ? AMBER : "#8FB39B", 0.5), color: timer.running ? AMBER : "#8FB39B" }}>
                    {timer.running ? "❚❚ Pausa" : "▶ Iniciar"}
                  </button>
                  <button type="button" className="fs-tbtn glow-btn" disabled={dis} onClick={handleReset}
                    style={{ borderColor: "rgba(255,255,255,0.16)", color: "#A0A0A8" }}>↺ Reset</button>
                </div>
                <p className="fs-note">
                  O cronómetro continua ao mudares de aba ou módulo.<br />Só conta tempo com o cronómetro a correr — pausas não entram no total.
                </p>
              </div>
            </section>
          )}

          {sidebarTab === "time" && (
            <section className="fs-panel" style={{ minHeight: "calc(100vh - 150px)" }}>
              <h3 className="fs-title" style={{ color: accent }}><span className="fs-icon-badge">⏱</span> Tempo Estudado</h3>
              <div className="fs-statgrid">
                <div className="fs-stat glass-flat"><p>Hoje</p><strong style={{ color: accent }}>{todayMetric.minutes} min</strong></div>
                <div className="fs-stat glass-flat"><p>Total projeto</p><strong style={{ color: AMBER }}>{fmtHours(goal.studied)}</strong></div>
                <div className="fs-stat glass-flat"><p>Páginas hoje</p><strong>{todayMetric.pages}</strong></div>
                <div className="fs-stat glass-flat"><p>Sessão actual</p><strong style={{ color: timer.phase === "focus" ? accent : "#6E6E76" }}>{timer.phase === "focus" ? focusTimer.elapsedFocusMinutes(timer) + " min" : "—"}</strong></div>
              </div>
              <label className="fs-label">Minutos hoje (ajuste manual)</label>
              <input type="number" min={0} className="fs-input" value={todayMetric.minutes} disabled={dis}
                onChange={function(e) { updateTodayMetric({ minutes: Math.max(0, parseInt(e.target.value, 10) || 0) }); }}
                style={{ fontFamily: "'JetBrains Mono',monospace", marginBottom: 12, maxWidth: 420 }} />
              <label className="fs-label">Páginas lidas hoje</label>
              <input type="number" min={0} className="fs-input" value={todayMetric.pages} disabled={dis}
                onChange={function(e) { updateTodayMetric({ pages: Math.max(0, parseInt(e.target.value, 10) || 0) }); }}
                style={{ marginBottom: 12, maxWidth: 420 }} />
              <label className="fs-label">Matéria / tema</label>
              <input className="fs-input" value={todayMetric.subject} disabled={dis} placeholder="Ex: Cálculo, Português…"
                onChange={function(e) { updateTodayMetric({ subject: e.target.value }); }} style={{ maxWidth: 420 }} />
              <p className="fs-note" style={{ textAlign: "left" }}>
                Cada minuto creditado corresponde só ao tempo com o cronómetro em foco a correr (pausas não contam).
              </p>
            </section>
          )}

          {sidebarTab === "notes" && (
            <section className="fs-panel" style={{ minHeight: "calc(100vh - 150px)" }}>
              <div className="seg fs-notes-seg" style={{ marginBottom: 20 }}>
                <span className="seg-thumb" style={segThumbStyle(notesTab === "ideas" ? 0 : 1, 2, "#EDEDEF")} aria-hidden="true" />
                <button type="button" className={notesTab === "ideas" ? "on" : ""} onClick={function() { setNotesTab("ideas"); }}>Ideias espontâneas</button>
                <button type="button" className={notesTab === "review" ? "on" : ""} onClick={function() { setNotesTab("review"); }}>Notas de revisão</button>
              </div>
              {notesTab === "ideas" ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <input className="fs-input" value={ideaInput} disabled={dis} placeholder="Captura rápida sem perder o foco…"
                      onChange={function(e) { setIdeaInput(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") addIdea("idea"); }} />
                    <button type="button" className="fs-btn glow-btn" disabled={dis || !ideaInput.trim()} onClick={function() { addIdea("idea"); }}>+</button>
                  </div>
                  {ideasOnly.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#6E6E76", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", padding: 24 }}>Sem ideias ainda.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {ideasOnly.map(function(it) {
                        return (
                          <div key={it.id} className="fs-idea glass-flat">
                            <button type="button" onClick={function() { removeIdea(it.id); }}>×</button>
                            {it.content}
                            <time style={{ display: "block", marginTop: 6, fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: "#6E6E76" }}>{it.day_key}</time>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <textarea className="fs-area" value={reviewText} disabled={dis}
                    placeholder={"Resumo importante da matéria…\n\nEnvia para o Diário quando estiveres pronto."}
                    onChange={function(e) { onReviewChange(e.target.value); }} />
                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <button type="button" className="fs-btn glow-btn" disabled={!reviewText.trim() || syncStatus === "sending" || !auth.user} onClick={syncToDiary}>
                      {syncStatus === "sending" ? "A enviar…" : "↗ Sincronizar com Diário"}
                    </button>
                    {syncStatus === "sent" && <span className="fs-badge" style={{ color: "#8FB39B", background: "rgba(143,179,155,0.14)" }}>Enviado ✓</span>}
                  </div>
                </div>
              )}
            </section>
          )}

          {sidebarTab === "analytics" && (
            <section className="fs-panel" style={{ minHeight: "calc(100vh - 150px)" }}>
              <h3 className="fs-title" style={{ color: PURPLE }}><span className="fs-icon-badge">◈</span> Analytics · {activeProject.name}</h3>
              <div className="fs-statgrid">
                <div className="fs-stat glass-flat"><p>Total estudado</p><strong style={{ color: accent }}>{fmtHours(goal.studied)}</strong></div>
                <div className="fs-stat glass-flat"><p>Média 7 dias</p><strong>{Math.round(week.reduce(function(s, d) { return s + d.minutes; }, 0) / 7)} min/d</strong></div>
                <div className="fs-stat glass-flat"><p>Melhor dia</p><strong style={{ color: AMBER }}>{Math.max.apply(null, week.map(function(d) { return d.minutes; }))} min</strong></div>
                <div className="fs-stat glass-flat"><p>Tarefas</p><strong>{projectTasks.filter(function(t) { return t.done; }).length}/{projectTasks.length}</strong></div>
              </div>

              {goal.goalMin > 0 ? (
                <div className="fs-goal glass-flat">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <p style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#A0A0A8" }}>Meta: {activeProject.goal_hours}h até {activeProject.deadline ? new Date(activeProject.deadline).toLocaleDateString("pt-PT") : "—"}</p>
                    <strong style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: accent }}>{goal.pct}%</strong>
                  </div>
                  <div className="fs-goalbar"><i style={{ width: goal.pct + "%" }} /></div>
                  <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "#A0A0A8" }}>
                    <span>Faltam <strong style={{ color: accent }}>{fmtHours(goal.remaining)}</strong></span>
                    {goal.daysLeft != null ? <span><strong style={{ color: AMBER }}>{goal.daysLeft}</strong> dias restantes</span> : null}
                    {goal.daysLeft != null && goal.daysLeft > 0 ? (
                      <span>Ritmo: <strong>{Math.ceil(goal.remaining / goal.daysLeft)} min/dia</strong></span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <p className="fs-label" style={{ marginBottom: 10 }}>Últimos 7 dias</p>
              <div className="fs-chart glass-flat">
                {week.map(function(d) {
                  var h = Math.round((d.minutes / maxMin) * 100);
                  var isToday = d.day_key === today;
                  return (
                    <div key={d.day_key} className="fs-col" title={d.minutes + " min"}>
                      <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: isToday ? accent : "#6E6E76" }}>{d.minutes || "·"}</span>
                      <div className="fs-bar" style={{ height: (d.minutes > 0 ? Math.max(6, h) : 3) + "%", opacity: d.minutes ? 1 : 0.25, "--ac": isToday ? accent : "#6E6E76" }} />
                      <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: isToday ? accent : "#6E6E76" }}>{weekdayShort(d.day_key)}</span>
                    </div>
                  );
                })}
              </div>

              <p className="fs-label" style={{ marginTop: 22, marginBottom: 10 }}>Registo diário</p>
              <div className="fs-tablewrap glass-flat">
                <table className="fs-table">
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
            <section className="fs-panel" style={{ minHeight: "calc(100vh - 150px)" }}>
              <h3 className="fs-title" style={{ color: accent }}><span className="fs-icon-badge">☑</span> Tarefas</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input className="fs-input" value={taskInput} disabled={dis} placeholder="Nova tarefa…"
                  onChange={function(e) { setTaskInput(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") addTask(); }} />
                <button type="button" className="fs-btn glow-btn" disabled={dis || !taskInput.trim()} onClick={addTask}>+</button>
              </div>
              {projectTasks.length === 0 ? (
                <p style={{ textAlign: "center", color: "#6E6E76", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", padding: 24 }}>Lista vazia. Adiciona tarefas para este projeto.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {projectTasks.map(function(t) {
                    return (
                      <div key={t.id} className={"fs-task glass-flat" + (t.done ? " done" : "")}>
                        <button type="button" className={"fs-task-check" + (t.done ? " on" : "")}
                          onClick={function() { toggleTask(t.id); }}>{t.done ? "✓" : ""}</button>
                        <span style={{ flex: 1, fontSize: 13, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#6E6E76" : "#EDEDEF" }}>{t.text}</span>
                        <button type="button" className="fs-x" onClick={function() { removeTask(t.id); }}>×</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
          </div>
        </main>

        <div className="fs-dockwrap">
          <nav className="fs-dock glass-capsule" aria-label="Secções do estúdio">
            <span className="fs-dock-thumb" style={{ transform: "translateX(calc(" + Math.max(0, dockIndex) + " * 100%))" }} aria-hidden="true" />
            {SIDEBAR.map(function(item) {
              var on = sidebarTab === item.id;
              return (
                <button key={item.id} type="button" className={"fs-navitem ui-tap" + (on ? " on" : "")}
                  onClick={function() { setSidebarTab(item.id); }} title={item.label}>
                  {item.icon}<span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
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
