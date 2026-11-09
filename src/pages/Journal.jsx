import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as journalStore from "../lib/journalStore";
import * as attachmentsStore from "../lib/attachmentsStore";
import { PageLoader } from "../components/PageLoader";
import { HubBack, HUB_BACK_CSS } from "../components/HubBack";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { useCloudSync } from "../lib/useCloudSync";
import { onSync } from "../lib/syncEvents";
import { pauseCloudPull, isCloudPullPaused } from "../lib/cloudSyncGuard";
import { RECOVERY_EVENT, shouldSkipCloudSync } from "../lib/recoveryFlags";
import { moduleColor, moduleGlow, PALETTE } from "../lib/theme";
import { GLASS_CSS } from "../lib/glassUi";

var ACCENT = moduleColor("journal");
var COLORS = PALETTE;
var JOURNAL_FONT = "'Manrope', sans-serif";
var JOURNAL_LETTER_SPACING = "0.04em";
var JOURNAL_LINE_HEIGHT = 1.75;
var JOURNAL_TEXT = {
  fontFamily: JOURNAL_FONT,
  color: "#EDEDEF",
  letterSpacing: JOURNAL_LETTER_SPACING,
  lineHeight: JOURNAL_LINE_HEIGHT,
};

var JR_CSS = [
  GLASS_CSS,
  ".nt-root{height:100%;min-height:0;display:flex;flex-direction:column;background:transparent;color:#EDE8DF;font-family:'Manrope',sans-serif;position:relative;overflow:hidden}",
  ".nt-head{flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 22px 12px;z-index:20;background:rgba(255,255,255,.04);backdrop-filter:blur(24px) saturate(1.8);-webkit-backdrop-filter:blur(24px) saturate(1.8);border-bottom:1px solid rgba(255,255,255,.08)}",
  ".nt-brand{display:flex;align-items:baseline;gap:10px;min-width:0}",
  ".nt-brand h1{margin:0;font-family:'Syne',sans-serif;font-size:22px;font-weight:700;letter-spacing:-.04em;color:#EDE8DF}",
  ".nt-count{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.8px;color:#7A756C}",
  ".nt-tools{display:flex;align-items:center;gap:8px;min-width:0;flex:1;justify-content:flex-end}",
  ".nt-search{width:min(240px,32vw);background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);color:#EDE8DF;padding:9px 12px;font-family:'Manrope',sans-serif;font-size:13px;outline:none}",
  ".nt-search:focus{border-color:color-mix(in srgb,var(--mc) 55%,transparent)}",
  ".nt-new{display:flex;align-items:center;gap:8px;min-width:0}",
  ".nt-new input{width:min(180px,28vw);background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.16);color:#EDE8DF;padding:8px 2px;font-family:'Manrope',sans-serif;font-size:13px;outline:none}",
  ".nt-new input:focus{border-bottom-color:var(--mc)}",
  ".nt-new-btn{width:36px;height:36px;border:1px solid color-mix(in srgb,var(--mc) 40%,transparent);background:color-mix(in srgb,var(--mc) 14%,transparent);color:var(--mc);cursor:pointer;font-size:18px;line-height:1}",
  ".nt-rail{flex-shrink:0;display:flex;align-items:center;gap:6px;padding:10px 22px;overflow-x:auto;border-bottom:1px solid rgba(255,255,255,.06);z-index:12}",
  ".nt-chip{flex-shrink:0;display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:#8A857C;cursor:pointer;font-family:'Manrope',sans-serif;font-size:12.5px;white-space:nowrap;border-radius:999px}",
  ".nt-chip:hover{color:#EDE8DF;border-color:rgba(255,255,255,.2)}",
  ".nt-chip.is-on{color:#EDE8DF;background:color-mix(in srgb,var(--mc) 18%,rgba(255,255,255,.05));border-color:color-mix(in srgb,var(--mc) 40%,transparent)}",
  ".nt-chip.is-hot{outline:1px dashed color-mix(in srgb,var(--mc) 55%,transparent);outline-offset:2px}",
  ".nt-chip b{font-weight:500;font-family:'JetBrains Mono',monospace;font-size:10px;color:#7A756C}",
  ".nt-chip-x{border:none;background:transparent;color:#6A655E;cursor:pointer;padding:0 0 0 2px;font-size:14px;line-height:1}",
  ".nt-chip-x:hover{color:#C08C8C}",
  ".nt-chip-add{border-style:dashed}",
  ".nt-split{flex:1;min-height:0;display:grid;grid-template-columns:280px minmax(0,1fr)}",
  ".nt-list{min-height:0;overflow-y:auto;padding:10px 10px 24px;border-right:1px solid rgba(255,255,255,.07);user-select:none;-webkit-user-select:none}",
  ".nt-empty{margin:28px 12px;font-size:13px;line-height:1.55;color:#7A756C}",
  ".nt-row{display:flex;align-items:flex-start;gap:6px;padding:10px 8px;border-bottom:1px solid rgba(255,255,255,.05)}",
  ".nt-row.is-on{background:color-mix(in srgb,var(--nc,#EDE8DF) 12%,rgba(255,255,255,.04))}",
  ".nt-row:hover{background:rgba(255,255,255,.04)}",
  ".nt-note{flex:1;min-width:0;display:flex;align-items:flex-start;gap:10px;padding:2px 0;border:none;background:transparent;color:inherit;text-align:left;cursor:pointer;font-family:inherit;-webkit-touch-callout:none}",
  ".nt-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:6px}",
  ".nt-note-body{min-width:0;flex:1}",
  ".nt-note-t{display:block;font-size:14px;font-weight:600;letter-spacing:-.02em;color:#EDE8DF;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".nt-note-s{margin-top:3px;font-size:12px;line-height:1.4;color:#7A756C;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
  ".nt-drag{cursor:grab;color:#5A5A62;font-size:12px;line-height:1;user-select:none;flex-shrink:0;margin-top:5px}",
  ".nt-note-x{display:none}",
  ".nt-menu-bg{position:fixed;inset:0;z-index:90}",
  ".nt-menu{position:fixed;z-index:91;min-width:214px;max-width:min(280px,calc(100vw - 16px));padding:8px;background:rgba(14,14,16,.78);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(28px) saturate(1.7);-webkit-backdrop-filter:blur(28px) saturate(1.7)}",
  ".nt-menu p{margin:0 0 4px;padding:6px 10px 4px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#7A756C}",
  ".nt-menu button{display:block;width:100%;text-align:left;padding:10px 12px;border:none;background:transparent;color:#EDE8DF;cursor:pointer;font-family:'Manrope',sans-serif;font-size:14px}",
  ".nt-menu button:hover,.nt-menu button.is-on{background:rgba(255,255,255,.06)}",
  ".nt-menu button.is-on{color:var(--mc)}",
  ".nt-menu button.is-danger{color:#C08C8C}",
  ".nt-menu-sep{height:1px;margin:6px 8px;background:rgba(255,255,255,.08)}",
  ".nt-rename{width:100%;background:transparent;border:none;border-bottom:1px solid color-mix(in srgb,var(--nc,#EDE8DF) 55%,transparent);color:#EDE8DF;font-family:'Manrope',sans-serif;font-size:14px;font-weight:600;padding:4px 0;outline:none;user-select:text;-webkit-user-select:text}",
  ".nt-editor{min-width:0;min-height:0;overflow-y:auto;padding:28px 36px 80px}",
  ".nt-ed-head{display:flex;align-items:center;gap:12px;margin-bottom:18px}",
  ".nt-ed-head h2{margin:0;font-family:'Syne',sans-serif;font-size:clamp(26px,3.6vw,40px);font-weight:700;letter-spacing:-.045em;line-height:1.1;overflow-wrap:anywhere}",
  ".nt-fmt{display:inline-flex;gap:2px;padding:3px;margin-bottom:14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}",
  ".nt-fmt button{background:transparent;border:none;color:#8A857C;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;padding:7px 12px}",
  ".nt-fmt button:hover{color:#EDE8DF;background:rgba(255,255,255,.06)}",
  ".nt-insert{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px}",
  ".nt-insert button{display:inline-flex;align-items:center;gap:7px;padding:8px 13px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035);color:#A0988C;cursor:pointer;font-family:'Manrope',sans-serif;font-size:12.5px;backdrop-filter:blur(18px)}",
  ".nt-insert button:hover{color:var(--mc);border-color:color-mix(in srgb,var(--mc) 40%,transparent);background:color-mix(in srgb,var(--mc) 10%,transparent)}",
  ".nt-insert svg{width:14px;height:14px}",
  ".nt-catform{display:flex;align-items:center;gap:8px;padding:0 8px}",
  ".nt-catform input{width:160px;background:transparent;border:none;border-bottom:1px solid color-mix(in srgb,var(--mc) 50%,transparent);color:#EDE8DF;padding:6px 2px;font-size:13px;outline:none}",
  ".jr-lbl{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#6E6E76;margin:0}",

  /* ---------- ambient field ---------- */
  ".gn-field{position:absolute;top:0;left:0;right:0;height:min(900px,100vh);overflow:hidden;pointer-events:none;z-index:0}",
  ".gn-orb{position:absolute;border-radius:50%;filter:blur(90px)}",
  ".gn-orb--a{width:50vw;height:50vw;max-width:520px;max-height:520px;top:-16%;left:-12%;animation:haloBreatheSlow 10s var(--ease) infinite,driftA 26s ease-in-out infinite}",
  ".gn-orb--b{width:38vw;height:38vw;max-width:400px;max-height:400px;top:30%;right:-10%;opacity:.6;animation:haloBreatheSlow 12s var(--ease) infinite -4s,driftB 30s ease-in-out infinite}",

  /* ---------- header ---------- */
  ".gn-header{position:sticky;top:0;z-index:20;background:rgba(9,9,10,.72);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.07)}",
  ".gn-hbtn{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:999px;color:#A0A0A8;padding:9px 14px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.3px;flex-shrink:0;transition:color var(--dur) var(--ease),background var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".gn-hbtn:hover{color:#EDEDEF;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.22)}",

  /* ---------- sidebar ---------- */
  ".gn-sidehead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 16px}",
  ".gn-addblk{display:inline-flex;align-items:center;gap:6px;background:color-mix(in srgb,var(--mc) 10%,transparent);border:1px solid color-mix(in srgb,var(--mc) 30%,transparent);border-radius:999px;color:var(--mc);padding:7px 13px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.4px;transition:background var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".gn-addblk:hover{background:color-mix(in srgb,var(--mc) 20%,transparent);transform:translateY(-1px)}",
  ".gn-addblk svg{width:12px;height:12px}",

  ".gn-drop{display:flex;flex-direction:column;gap:6px;border-radius:16px;padding:5px;transition:background var(--dur) var(--ease)}",
  ".gn-drop.is-hot{background:color-mix(in srgb,var(--mc) 10%,transparent);outline:1px dashed color-mix(in srgb,var(--mc) 50%,transparent);outline-offset:2px}",

  ".gn-noterow{display:flex;align-items:center;gap:6px}",
  ".gn-drag{cursor:grab;color:#5A5A62;font-size:12px;line-height:1;user-select:none;flex-shrink:0}",
  ".gn-note{flex:1;min-width:0;display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer;background:rgba(255,255,255,.022);border:1px solid rgba(255,255,255,.055);border-radius:13px;padding:9px 11px;font-family:'JetBrains Mono',monospace;transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".gn-note:hover{border-color:rgba(255,255,255,.16)}",
  ".gn-note.is-on{background:color-mix(in srgb,var(--nc) 16%,transparent);border-color:color-mix(in srgb,var(--nc) 48%,transparent)}",
  ".gn-avatar{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;border:1px solid;flex-shrink:0}",
  ".gn-notetitle{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px}",

  ".gn-group{padding:10px;transition:border-color var(--dur) var(--ease),background var(--dur) var(--ease)}",
  ".gn-group.is-hot{border-color:color-mix(in srgb,var(--mc) 45%,transparent);background:color-mix(in srgb,var(--mc) 8%,transparent)}",
  ".gn-group-head{display:flex;align-items:center;gap:7px}",
  ".gn-chevron{background:none;border:none;color:#6E6E76;cursor:pointer;display:flex;align-items:center;justify-content:center;width:18px;flex-shrink:0;padding:0}",
  ".gn-group-name{flex:1;min-width:0;text-align:left;background:none;border:none;color:#EDEDEF;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:600;line-height:1.3;display:flex;align-items:center;gap:7px}",
  ".gn-group-name svg{width:13px;height:13px;opacity:.7;flex-shrink:0}",
  ".gn-group-name span:first-of-type{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".gn-count{background:rgba(255,255,255,.06);border-radius:999px;padding:1px 7px;font-size:9.5px;color:#8A8A90;font-weight:400;letter-spacing:0;flex-shrink:0}",
  ".gn-group-body{display:flex;flex-direction:column;gap:6px;margin-top:10px}",
  ".gn-hint{margin:0;padding:12px 8px;font-size:11px;color:#6E6E76;font-family:'JetBrains Mono',monospace;letter-spacing:.4px;line-height:1.5;text-align:center}",

  ".gn-x{display:flex;align-items:center;justify-content:center;border:none;background:transparent;color:#6E6E76;cursor:pointer;flex-shrink:0;line-height:1;padding:0;border-radius:50%;transition:color var(--dur) var(--ease),background var(--dur) var(--ease)}",
  ".gn-x:hover{color:#C08C8C;background:rgba(192,140,140,.12)}",

  ".gn-newnote{display:flex;gap:8px;margin-top:18px}",
  ".gn-newnote-btn{width:38px;height:38px;flex-shrink:0;border-radius:50%;background:color-mix(in srgb,var(--mc) 14%,transparent);border:1px solid color-mix(in srgb,var(--mc) 38%,transparent);color:var(--mc);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:background var(--dur) var(--ease),transform var(--dur-fast) var(--ease),filter var(--dur) var(--ease)}",
  ".gn-newnote-btn:hover{background:color-mix(in srgb,var(--mc) 26%,transparent);filter:drop-shadow(0 0 10px var(--mc))}",
  ".gn-catbtn{flex-shrink:0;width:36px;height:36px;border:none;border-radius:10px;background:rgba(255,255,255,.04);color:#8A8A90;cursor:pointer;display:none;align-items:center;justify-content:center;padding:0}",
  ".gn-catbtn svg{width:15px;height:15px}",
  ".gn-catbtn.is-on{color:var(--mc);background:color-mix(in srgb,var(--mc) 14%,transparent)}",
  ".gn-noterow-wrap{display:flex;flex-direction:column;gap:6px}",
  ".gn-catmenu{display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1)}",
  ".gn-catmenu p{margin:0 0 4px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#8A8A90}",
  ".gn-catmenu button{text-align:left;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;color:#EDEDEF;padding:11px 12px;min-height:44px;font-family:'JetBrains Mono',monospace;font-size:13px;cursor:pointer}",
  ".gn-catmenu button.is-on{color:var(--mc);border-color:color-mix(in srgb,var(--mc) 40%,transparent)}",
  ".gn-cats-empty{margin:0;padding:14px 10px;font-size:12px;color:#6E6E76;line-height:1.5;font-family:'JetBrains Mono',monospace}",
  ".gn-catform{display:flex;gap:8px;align-items:center;margin:0 0 12px}",
  ".gn-catform .gn-input{flex:1;min-width:0}",
  ".gn-catform-ok{width:38px;height:38px;flex-shrink:0;border-radius:50%;background:color-mix(in srgb,var(--mc) 14%,transparent);border:1px solid color-mix(in srgb,var(--mc) 38%,transparent);color:var(--mc);cursor:pointer;font-size:16px}",
  ".gn-rename-in{width:100%;min-width:0;background:transparent;border:none;border-bottom:1px solid color-mix(in srgb,var(--mc) 45%,transparent);color:#EDEDEF;font:inherit;letter-spacing:inherit;text-transform:uppercase;outline:none;padding:4px 0}",

  ".gn-input{width:100%;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.09);border-radius:999px;color:#EDEDEF;padding:11px 15px;outline:none;box-sizing:border-box;font-family:'JetBrains Mono',monospace;letter-spacing:0.04em;transition:border-color var(--dur) var(--ease),background var(--dur) var(--ease)}",
  ".gn-input:focus{border-color:color-mix(in srgb,var(--mc) 55%,transparent);background:rgba(255,255,255,.05)}",

  /* ---------- canvas ---------- */
  ".gn-canvashead{margin-bottom:20px;display:flex;align-items:center;gap:11px}",
  ".gn-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;filter:drop-shadow(0 0 8px var(--nc))}",

  ".gn-fmtbar{display:inline-flex;gap:2px;padding:4px;border-radius:999px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);margin-bottom:16px}",
  ".gn-fmtbtn{background:transparent;border:none;color:#A0A0A8;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11.5px;padding:8px 14px;border-radius:999px;transition:color var(--dur) var(--ease),background var(--dur) var(--ease)}",
  ".gn-fmtbtn:hover{color:#EDEDEF;background:rgba(255,255,255,.06)}",

  ".gn-insertbar{display:flex;gap:8px;flex-wrap:wrap;padding:12px;margin-bottom:20px}",
  ".gn-insert{display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:999px;color:#A0A0A8;padding:8px 14px 8px 11px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.2px;transition:color var(--dur) var(--ease),background var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".gn-insert:hover{color:var(--mc);background:color-mix(in srgb,var(--mc) 12%,transparent);border-color:color-mix(in srgb,var(--mc) 38%,transparent);transform:translateY(-1px)}",
  ".gn-insert svg{width:15px;height:15px;flex-shrink:0}",

  ".gn-emptyblocks{border-radius:var(--radius-xl);border:1.5px dashed rgba(255,255,255,.12);min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#6E6E76;text-align:center;padding:32px;font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:0.04em;line-height:1.6}",

  ".gn-block{position:relative;padding:20px 22px 20px 25px;transition:border-color var(--dur) var(--ease)}",
  ".gn-block::before{content:'';position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:3px;background:var(--nc);opacity:.6}",
  ".gn-block:hover{border-color:rgba(255,255,255,.15)}",
  ".gn-block-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;cursor:default;user-select:none}",
  ".gn-block.is-collapsed{padding-bottom:14px}",
  ".gn-block.is-collapsed .gn-block-head{margin-bottom:0;cursor:pointer}",
  ".gn-block.is-collapsed > *:not(.gn-block-head){display:none!important}",
  ".gn-block-fold{margin-left:auto;font-size:10px;color:#6E6E76;font-family:'JetBrains Mono',monospace;letter-spacing:.3px;opacity:0;transition:opacity var(--dur) var(--ease)}",
  ".gn-block.is-collapsed .gn-block-fold,.gn-block-head:hover .gn-block-fold{opacity:1}",
  ".gn-type{display:inline-flex;align-items:center;gap:6px;color:#8A8A90;font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:1.4px;text-transform:uppercase}",
  ".gn-type svg{width:13px;height:13px;opacity:.8}",
  ".gn-block .gn-x{width:26px;height:26px;font-size:15px;opacity:0;transition:opacity var(--dur) var(--ease),color var(--dur) var(--ease),background var(--dur) var(--ease)}",
  ".gn-block:hover .gn-x{opacity:1}",

  ".gn-ed{outline:none;color:#EDEDEF;line-height:1.75}",
  ".gn-ed:empty:before{content:attr(data-placeholder);color:#6E6E76;pointer-events:none}",
  ".gn-ed a{color:#EDEDEF;text-underline-offset:3px}",
  ".gn-ed--title{font-size:24px;font-weight:600;line-height:1.3;min-height:36px}",
  ".gn-ed--text{font-size:15px;font-weight:400;min-height:90px;max-width:74ch}",

  ".gn-upload{width:100%;min-height:150px;border-radius:16px;border:1.5px dashed rgba(255,255,255,.13);background:rgba(255,255,255,.015);color:#8A8A90;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12.5px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;transition:border-color var(--dur) var(--ease),color var(--dur) var(--ease),background var(--dur) var(--ease)}",
  ".gn-upload:hover{border-color:color-mix(in srgb,var(--nc) 55%,transparent);color:var(--nc);background:color-mix(in srgb,var(--nc) 5%,transparent)}",
  ".gn-upload--doc{min-height:100px}",
  ".gn-upload-ic{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;transition:border-color var(--dur) var(--ease),filter var(--dur) var(--ease)}",
  ".gn-upload-ic svg{width:18px;height:18px}",
  ".gn-upload:hover .gn-upload-ic{border-color:color-mix(in srgb,var(--nc) 55%,transparent);filter:drop-shadow(0 0 10px var(--nc))}",

  ".gn-doclink{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.03);color:#EDEDEF;text-decoration:none;font-size:13.5px;transition:border-color var(--dur) var(--ease),background var(--dur) var(--ease)}",
  ".gn-doclink:hover{border-color:color-mix(in srgb,var(--nc) 45%,transparent);background:color-mix(in srgb,var(--nc) 8%,transparent)}",
  ".gn-doclink-ic{width:34px;height:34px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--nc) 16%,transparent);color:var(--nc)}",
  ".gn-doclink-ic svg{width:17px;height:17px}",

  ".gn-uploadmsg{margin:0 0 10px;font-size:11.5px;color:#A0A0A8;line-height:1.5;font-family:'JetBrains Mono',monospace}",

  /* ---------- responsive ---------- */
  "@media(max-width:720px){",
  ".nt-head{padding:max(12px,env(safe-area-inset-top)) 12px 12px;flex-wrap:wrap}",
  ".nt-tools{flex-basis:100%;justify-content:stretch}",
  ".nt-search,.nt-new{flex:1}",
  ".nt-search{width:auto}",
  ".nt-new input{width:auto;flex:1}",
  ".nt-rail{padding:8px 12px;gap:6px}",
  ".nt-split{grid-template-columns:1fr}",
  ".nt-list{border-right:none;padding:8px 8px 88px}",
  ".nt-editor{padding:18px 16px 80px}",
  ".nt-note-x{display:none}",
  ".nt-note-s{-webkit-line-clamp:1}",
  ".gn-field{height:min(640px,70vh)}",
  ".gn-orb--a{width:70vw;height:70vw;max-width:none;max-height:none}",
  ".gn-orb--b{width:55vw;height:55vw;max-width:none;max-height:none}",
  ".gn-header{padding-top:max(10px,env(safe-area-inset-top))!important}",
  ".gn-hbtn{min-height:42px;padding:10px 14px;font-size:13px}",
  ".gn-sidehead{margin-bottom:14px}",
  ".gn-addblk{min-height:40px;padding:9px 14px;font-size:12px}",
  ".gn-addblk svg{width:14px;height:14px}",
  ".gn-note{padding:12px;border-radius:14px;min-height:48px}",
  ".gn-avatar{width:28px;height:28px;font-size:12px}",
  ".gn-notetitle{font-size:15px}",
  ".gn-group{padding:12px}",
  ".gn-group-name{font-size:12px;min-height:36px}",
  ".gn-chevron{width:32px;height:32px}",
  ".gn-chevron svg{width:16px;height:16px}",
  ".gn-count{padding:3px 9px;font-size:11px}",
  ".gn-x{opacity:1!important;width:36px!important;height:36px!important;font-size:18px!important}",
  ".gn-catbtn{display:none}",
  ".gn-catmenu button{min-height:46px;font-size:14px}",
  ".gn-newnote{gap:10px;margin-top:16px;position:sticky;bottom:0;padding-bottom:max(8px,env(safe-area-inset-bottom));background:linear-gradient(transparent,rgba(9,9,10,.92) 30%)}",
  ".gn-newnote-btn{width:48px;height:48px;font-size:20px}",
  ".gn-input{font-size:16px!important;min-height:48px;padding:12px 16px}",
  ".gn-canvashead{margin-bottom:14px;gap:10px}",
  ".gn-fmtbar{width:100%;display:flex;margin-bottom:12px;overflow-x:auto;-webkit-overflow-scrolling:touch}",
  ".gn-fmtbtn{flex:1;min-height:42px;padding:10px 12px;font-size:13px;white-space:nowrap}",
  ".gn-insertbar{gap:8px;padding:10px;margin-bottom:16px;justify-content:stretch}",
  ".gn-insert{flex:1 1 calc(50% - 8px);justify-content:center;min-height:44px;padding:10px 12px;font-size:12px}",
  ".gn-insert svg{width:16px;height:16px}",
  ".gn-emptyblocks{min-height:180px;padding:28px 18px;font-size:13px}",
  ".gn-block{padding:16px 16px 16px 20px}",
  ".gn-block .gn-x{opacity:1}",
  ".gn-ed--text{font-size:16px!important;-webkit-text-size-adjust:100%}",
  ".gn-ed--title{font-size:22px!important}",
  ".gn-upload{min-height:140px;font-size:14px;padding:18px}",
  ".gn-upload--doc{min-height:110px}",
  ".gn-doclink{padding:14px;min-height:52px;font-size:14px}",
  "}",
  "@media(pointer:coarse){",
  ".gn-hbtn{min-height:44px}",
  ".gn-addblk{min-height:44px}",
  ".gn-note{min-height:48px}",
  ".gn-block .gn-x,.gn-noterow .gn-x{opacity:1}",
  ".gn-insert{min-height:44px}",
  ".gn-fmtbtn{min-height:44px}",
  "}",
  "@media(hover:none){",
  ".gn-block:hover{border-color:rgba(255,255,255,.09)}",
  ".gn-insert:hover{transform:none}",
  ".gn-addblk:hover{transform:none}",
  "}",
].join("");

var SAVE_DEBOUNCE_MS = 1800;

function newNoteBlockId() {
  return "nb" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function stripHtml(html) {
  return String(html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
function noteSnippet(spaceId, allBlocks) {
  var list = (allBlocks || []).filter(function(b) { return b.space_id === spaceId; }).sort(function(a, b) { return (a.order_index || 0) - (b.order_index || 0); });
  for (var i = 0; i < list.length; i++) {
    if (list[i].type !== "title" && list[i].type !== "text") continue;
    var t = stripHtml(list[i].content || "");
    if (t) return t;
  }
  return "";
}

function handleJournalCopy(e) {
  var sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.toString().trim()) return;
  var text = sel.toString();
  var html =
    '<span style="font-family:Manrope,sans-serif;color:#FFFFFF;letter-spacing:-0.01em;line-height:1.6;">' +
    escapeHtml(text).replace(/\n/g, "<br/>") +
    "</span>";
  e.clipboardData.setData("text/plain", text);
  e.clipboardData.setData("text/html", html);
  e.preventDefault();
}

/* --------------------------------- ícones --------------------------------- */

function IconTitle(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...props}>
      <path d="M5 6h14M5 12h9M5 18h6" />
    </svg>
  );
}
function IconParagraph(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...props}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}
function IconImage(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4 17l5-5 3.5 3.5L17 10l3 3" />
    </svg>
  );
}
function IconDocument(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}
function IconFolder(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3.5 6.5a1 1 0 0 1 1-1h5l2 2.2h8a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1Z" />
    </svg>
  );
}
function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      width="13" height="13" style={{ transform: props.open ? "rotate(90deg)" : "none", transition: "transform var(--dur) var(--ease)" }}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

var LAST_JOURNAL_KEY = "sinapse-journal-last-v1";

function loadJournalLast() {
  try {
    var raw = JSON.parse(localStorage.getItem(LAST_JOURNAL_KEY) || "null");
    if (!raw || typeof raw !== "object") return { id: "", open: false };
    return { id: raw.id || "", open: !!raw.open };
  } catch (e) {
    return { id: "", open: false };
  }
}

function saveJournalLast(id, open) {
  try { localStorage.setItem(LAST_JOURNAL_KEY, JSON.stringify({ id: id || "", open: !!open })); } catch (e) {}
}

function blockTypeMeta(type) {
  if (type === "title") return { label: "Título", Icon: IconTitle };
  if (type === "image") return { label: "Imagem", Icon: IconImage };
  if (type === "document") return { label: "Documento", Icon: IconDocument };
  return { label: "Texto", Icon: IconParagraph };
}

export default function Journal() {
  var vwS = useState(window.innerWidth);
  var viewportW = vwS[0], setViewportW = vwS[1];
  var isMobile = viewportW < 720;
  var spS = useState([]);
  var spaces = spS[0], setSpaces = spS[1];
  var blS = useState([]);
  var blocks = blS[0], setBlocks = blS[1];
  var activeS = useState(null);
  var active = activeS[0], setActive = activeS[1];
  var titleS = useState("");
  var newTitle = titleS[0], setNewTitle = titleS[1];
  var hydratedS = useState(false);
  var isHydrated = hydratedS[0], setIsHydrated = hydratedS[1];
  var sessionWarnS = useState("");
  var sessionWarn = sessionWarnS[0], setSessionWarn = sessionWarnS[1];
  var noteBlocksS = useState(function() { return { blocks: [], assign: {}, collapsed: {} }; });
  var noteBlocks = noteBlocksS[0], setNoteBlocks = noteBlocksS[1];
  var mobileNoteOpenS = useState(function() { return loadJournalLast().open; });
  var mobileNoteOpen = mobileNoteOpenS[0], setMobileNoteOpen = mobileNoteOpenS[1];
  var catPickS = useState(null);
  var catPick = catPickS[0], setCatPick = catPickS[1];
  var menuS = useState(null);
  var menu = menuS[0], setMenu = menuS[1];
  var renameIdS = useState(null);
  var renameId = renameIdS[0], setRenameId = renameIdS[1];
  var renameValS = useState("");
  var renameVal = renameValS[0], setRenameVal = renameValS[1];
  var skipClickRef = useRef(false);
  var pressTimerRef = useRef(0);
  var pressPosRef = useRef(null);
  var catFormS = useState(null);
  var catForm = catFormS[0], setCatForm = catFormS[1];
  var queryS = useState("");
  var query = queryS[0], setQuery = queryS[1];
  var catFilterS = useState("all");
  var catFilter = catFilterS[0], setCatFilter = catFilterS[1];
  var catFormRef = useRef(null);
  var skipCatBlurRef = useRef(false);
  var dragNoteRef = useRef(null);
  var dragOverS = useState(null);
  var dragOverTarget = dragOverS[0], setDragOverTarget = dragOverS[1];
  var saveSpacesTimer = useRef(null);
  var saveBlocksTimer = useRef(null);
  var blocksRef = useRef([]);
  var spacesRef = useRef([]);
  var noteBlocksRef = useRef({ blocks: [], assign: {}, collapsed: {} });
  var isHydratedRef = useRef(false);
  var editingBlockRef = useRef(null);
  var flushHandlersRef = useRef({});
  var skipSaveRef = useRef(false);
  var lastSaveAt = useRef(0);
  var lastDeleteAt = useRef(0);
  var noteLayoutDirtyRef = useRef(false);
  var canvasCollapsedS = useState({});
  var canvasCollapsed = canvasCollapsedS[0], setCanvasCollapsed = canvasCollapsedS[1];

  useEffect(function() {
    setCanvasCollapsed({});
  }, [active]);

  useEffect(function() {
    if (!isHydrated || !active) return;
    saveJournalLast(active, mobileNoteOpen);
  }, [isHydrated, active, mobileNoteOpen]);

  function toggleCanvasBlockCollapse(id) {
    setCanvasCollapsed(function(prev) {
      var next = Object.assign({}, prev);
      next[id] = !next[id];
      return next;
    });
  }

  function getEditingSnapshot() {
    var id = editingBlockRef.current;
    if (!id) return null;
    return blocksRef.current.find(function(b) { return b.id === id; }) || null;
  }

  function applyNoteLayout(layout) {
    if (!layout) return;
    if (noteLayoutDirtyRef.current) return;
    var next = {
      blocks: layout.blocks || [],
      assign: layout.assign || {},
      collapsed: layout.collapsed || {},
      updated: layout.updated || 0,
      schema: layout.schema || 0,
    };
    noteBlocksRef.current = next;
    setNoteBlocks(next);
  }

  function applyJournalData(spacesList, blocksList) {
    setSpaces((spacesList || []).filter(function(s) { return s && s.id !== "__journal_cats__"; }));
    setBlocks(blocksList);
    setActive(function(prev) {
      if (prev && spacesList.some(function(s) { return s.id === prev; })) return prev;
      var saved = loadJournalLast();
      if (saved.id && spacesList.some(function(s) { return s.id === saved.id; })) return saved.id;
      return spacesList[0] ? spacesList[0].id : null;
    });
  }

  var loadFromCloud = useCallback(function() {
    flushAllEditors();
    skipSaveRef.current = true;
    return Promise.all([
      journalStore.loadSpacesLocal(),
      journalStore.loadBlocksLocal(),
      journalStore.loadNoteLayoutLocal(),
    ]).then(function(local) {
      applyJournalData(local[0], local[1]);
      applyNoteLayout(local[2]);
      return journalStore.syncJournal(getEditingSnapshot()).then(function(sync) {
        applyJournalData(sync.spaces, sync.blocks);
        applyNoteLayout(sync.layout);
      });
    }).finally(function() {
      isHydratedRef.current = true;
      setIsHydrated(true);
      setTimeout(function() { skipSaveRef.current = false; }, 200);
    });
  }, []);

  var syncFromCloud = useCallback(function() {
    if (editingBlockRef.current) return Promise.resolve();
    if (noteLayoutDirtyRef.current) return Promise.resolve();
    if (isCloudPullPaused("journal_note_layout") || isCloudPullPaused("journal_spaces") || isCloudPullPaused("journal_blocks")) {
      return Promise.resolve();
    }
    if (Date.now() - lastDeleteAt.current < 12000) return Promise.resolve();
    if (Date.now() - lastSaveAt.current < 4000) return Promise.resolve();
    skipSaveRef.current = true;
    return journalStore.syncJournal(getEditingSnapshot()).then(function(sync) {
      applyJournalData(sync.spaces, sync.blocks);
      applyNoteLayout(sync.layout);
      lastSaveAt.current = Date.now();
      setTimeout(function() { skipSaveRef.current = false; }, 150);
    }).catch(function() {
      skipSaveRef.current = false;
    });
  }, []);

  useCloudSync({
    tables: ["journal_spaces", "journal_blocks", "journal_note_layout"],
    intervalMs: 10000,
    shouldSkip: function() {
      if (!isHydratedRef.current) return true;
      if (shouldSkipCloudSync()) return true;
      if (editingBlockRef.current) return true;
      if (noteLayoutDirtyRef.current) return true;
      if (isCloudPullPaused("journal_note_layout") || isCloudPullPaused("journal_spaces") || isCloudPullPaused("journal_blocks")) return true;
      if (Date.now() - lastDeleteAt.current < 12000) return true;
      if (Date.now() - lastSaveAt.current < 4000) return true;
      return false;
    },
    onPull: syncFromCloud,
    onPush: function() {
      flushAllEditors();
      skipSaveRef.current = true;
      return persistAll().finally(function() {
        lastSaveAt.current = Date.now();
        setTimeout(function() { skipSaveRef.current = false; }, 150);
      });
    },
  });

  function reloadLocalOnly() {
    skipSaveRef.current = true;
    isHydratedRef.current = false;
    setIsHydrated(false);
    return Promise.all([journalStore.loadSpacesLocal(), journalStore.loadBlocksLocal(), journalStore.loadNoteLayoutLocal()]).then(function(local) {
      applyJournalData(local[0], local[1]);
      applyNoteLayout(local[2]);
    }).finally(function() {
      isHydratedRef.current = true;
      setIsHydrated(true);
      setTimeout(function() { skipSaveRef.current = false; }, 200);
    });
  }

  function finishHydration(sync) {
    if (sync) applyJournalData(sync[0], sync[1]);
    isHydratedRef.current = true;
    setIsHydrated(true);
    setTimeout(function() { skipSaveRef.current = false; }, 200);
  }

  useEffect(function() {
    var alive = true;
    skipSaveRef.current = true;
    isHydratedRef.current = false;
    setIsHydrated(false);
    Promise.all([journalStore.loadSpacesLocal(), journalStore.loadBlocksLocal(), journalStore.loadNoteLayoutLocal()])
      .then(function(local) {
        if (!alive) return;
        applyJournalData(local[0], local[1]);
        applyNoteLayout(local[2]);
        if (shouldSkipCloudSync()) return null;
        return journalStore.syncJournal(getEditingSnapshot());
      })
      .then(function(sync) {
        if (!alive) return;
        if (sync) {
          applyJournalData(sync.spaces, sync.blocks);
          applyNoteLayout(sync.layout);
        }
        finishHydration(null);
      })
      .catch(function() {
        if (!alive) return;
        finishHydration(null);
      });
    function onRecovered() {
      if (!alive) return;
      reloadLocalOnly();
    }
    window.addEventListener(RECOVERY_EVENT, onRecovered);
    return function() {
      alive = false;
      window.removeEventListener(RECOVERY_EVENT, onRecovered);
    };
  }, []);

  function flushAllEditors() {
    Object.keys(flushHandlersRef.current).forEach(function(id) {
      var fn = flushHandlersRef.current[id];
      if (fn) fn();
    });
  }

  function reportSave(res) {
    if (!res) return;
    if (res.emergency || (res.spaces && res.spaces.emergency) || (res.blocks && res.blocks.emergency)) {
      setSessionWarn("Sessão expirada — as notas foram guardadas neste dispositivo. Inicia sessão no Hub para sincronizar.");
      return;
    }
    if (res.ok && res.cloud !== false) {
      lastSaveAt.current = Date.now();
      setSessionWarn("");
      try { sessionStorage.removeItem("sinapse-last-cloud-error"); } catch (e) {}
    } else if (res.error) {
      setSessionWarn("Nuvem: " + res.error);
    }
  }

  async function persistSpaces(nextSpaces) {
    if (!isHydratedRef.current || skipSaveRef.current) return;
    reportSave(await journalStore.saveSpaces(nextSpaces || spacesRef.current, noteBlocksRef.current));
  }

  async function persistBlocks(nextBlocks) {
    if (!isHydratedRef.current || skipSaveRef.current) return;
    reportSave(await journalStore.saveBlocks(nextBlocks || blocksRef.current, noteBlocksRef.current));
  }

  async function persistAll(nextSpaces, nextBlocks) {
    if (!isHydratedRef.current || skipSaveRef.current) return;
    reportSave(await journalStore.saveAll(
      nextSpaces || spacesRef.current,
      nextBlocks || blocksRef.current,
      noteBlocksRef.current
    ));
  }

  useEffect(function() {
    function onResize() {
      var w = window.innerWidth;
      setViewportW(w);
      if (w >= 720) setMobileNoteOpen(false);
    }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  useEffect(function() { blocksRef.current = blocks; }, [blocks]);
  useEffect(function() { spacesRef.current = spaces; }, [spaces]);
  useEffect(function() { noteBlocksRef.current = noteBlocks; }, [noteBlocks]);
  useEffect(function() { catFormRef.current = catForm; }, [catForm]);

  useEffect(function() {
    if (!isHydrated) return;
    return onSync(function(detail) {
      var table = detail && detail.table;
      if (table && table !== "*" && table !== "journal_spaces" && table !== "journal_blocks" && table !== "journal_note_layout") return;
      syncFromCloud();
    });
  }, [isHydrated, syncFromCloud]);

  function commitNoteLayout(updater) {
    var prev = noteBlocksRef.current || { blocks: [], assign: {}, collapsed: {} };
    var next = typeof updater === "function" ? updater(prev) : updater;
    next = {
      blocks: (next && next.blocks) || [],
      assign: (next && next.assign) || {},
      collapsed: (next && next.collapsed) || {},
      schema: (next && next.schema) || 2,
      updated: Date.now(),
    };
    noteBlocksRef.current = next;
    noteLayoutDirtyRef.current = true;
    lastSaveAt.current = Date.now();
    pauseCloudPull(8000, "journal_note_layout");
    pauseCloudPull(8000, "journal_spaces");
    pauseCloudPull(8000, "journal_blocks");
    setNoteBlocks(next);
    journalStore.saveNoteLayout(next).then(function(res) {
      reportSave(res);
    }).finally(function() {
      noteLayoutDirtyRef.current = false;
    });
  }

  useEffect(function() {
    if (!isHydrated || skipSaveRef.current) return;
    clearTimeout(saveSpacesTimer.current);
    saveSpacesTimer.current = setTimeout(function() {
      persistSpaces(spacesRef.current);
    }, SAVE_DEBOUNCE_MS);
    return function() { clearTimeout(saveSpacesTimer.current); };
  }, [spaces, isHydrated]);

  useEffect(function() {
    if (!isHydrated || skipSaveRef.current) return;
    clearTimeout(saveBlocksTimer.current);
    saveBlocksTimer.current = setTimeout(function() {
      flushAllEditors();
      persistBlocks(blocksRef.current);
    }, SAVE_DEBOUNCE_MS);
    return function() { clearTimeout(saveBlocksTimer.current); };
  }, [blocks, isHydrated]);

  useEffect(function() {
    if (!isHydrated) return;
    function flush() {
      if (!isHydratedRef.current) return;
      flushAllEditors();
      persistAll();
    }
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", function() {
      if (document.visibilityState === "hidden") flush();
    });
    return function() { window.removeEventListener("beforeunload", flush); };
  }, [isHydrated]);

  function registerFlush(id, fn) {
    flushHandlersRef.current[id] = fn;
  }
  function unregisterFlush(id) {
    delete flushHandlersRef.current[id];
  }

  var activeSpace = spaces.find(function(s) { return s.id === active; }) || spaces[0];
  var color = activeSpace ? activeSpace.color : ACCENT;
  var activeBlocks = useMemo(function() {
    return blocks.filter(function(b) { return b.space_id === active; }).sort(function(a, b) { return a.order_index - b.order_index; });
  }, [blocks, active]);
  var noteGroups = useMemo(function() {
    var valid = {};
    noteBlocks.blocks.forEach(function(b) { valid[b.id] = true; });
    var byBlock = {};
    var ungrouped = [];
    spaces.forEach(function(s) {
      var bid = noteBlocks.assign[s.id];
      if (bid && valid[bid]) {
        if (!byBlock[bid]) byBlock[bid] = [];
        byBlock[bid].push(s);
      } else {
        ungrouped.push(s);
      }
    });
    return { byBlock: byBlock, ungrouped: ungrouped };
  }, [spaces, noteBlocks]);
  var visibleNotes = useMemo(function() {
    var q = (query || "").trim().toLowerCase();
    var valid = {};
    noteBlocks.blocks.forEach(function(b) { valid[b.id] = true; });
    return spaces.filter(function(s) {
      var bid = noteBlocks.assign[s.id];
      var grouped = !!(bid && valid[bid]);
      if (catFilter === "none" && grouped) return false;
      if (catFilter !== "all" && catFilter !== "none" && bid !== catFilter) return false;
      if (q && (s.title || "").toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }, [spaces, noteBlocks, catFilter, query]);

  function createSpace() {
    if (!isHydrated) return;
    if (!newTitle.trim()) return;
    var s = { id: journalStore.newBlock("x").id.replace("jb", "js"), title: newTitle.trim(), color: COLORS[spaces.length % COLORS.length] };
    var next = spaces.concat([s]);
    spacesRef.current = next;
    lastSaveAt.current = Date.now();
    pauseCloudPull(8000, "journal_spaces");
    setSpaces(next);
    setActive(s.id);
    setNewTitle("");
    if (isMobile) setMobileNoteOpen(true);
    persistSpaces(next);
    if (catFilter && catFilter !== "all" && catFilter !== "none") assignNoteToBlock(s.id, catFilter);
  }

  function renameSpace(space, name) {
    var nextName = (name || "").trim();
    if (!space || !nextName || nextName === space.title) return;
    var next = spaces.map(function(s) {
      return s.id === space.id ? Object.assign({}, s, { title: nextName, updated: Date.now() }) : s;
    });
    spacesRef.current = next;
    setSpaces(next);
    persistSpaces(next);
  }

  function closeNoteMenu() {
    setMenu(null);
  }

  function openNoteMenu(space, x, y) {
    if (!space) return;
    var mw = 228;
    var mh = 72 + ((noteBlocks.blocks || []).length + 1) * 40;
    var pad = 10;
    var left = Math.max(pad, Math.min(x, window.innerWidth - mw - pad));
    var top = Math.max(pad, Math.min(y, window.innerHeight - Math.min(mh, window.innerHeight - pad * 2) - pad));
    setMenu({ id: space.id, x: left, y: top });
  }

  function clearPressTimer() {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = 0;
    }
    pressPosRef.current = null;
  }

  async function removeSpace(space) {
    if (!space) return;
    if (!window.confirm("Eliminar a nota \"" + space.title + "\" e todo o seu conteúdo?")) return;
    var nextSpaces = spaces.filter(function(s) { return s.id !== space.id; });
    if (!nextSpaces.length) nextSpaces = [{ id: journalStore.newBlock("x").id.replace("jb", "js"), title: "Livre", color: ACCENT }];
    blocks.filter(function(b) { return b.space_id === space.id && b.meta && b.meta.attachment; }).forEach(function(b) {
      attachmentsStore.deleteAttachment(b.meta.attachment);
    });
    var deletedBlockIds = blocks.filter(function(b) { return b.space_id === space.id; }).map(function(b) { return b.id; });
    var nextBlocks = blocks.filter(function(b) { return b.space_id !== space.id; });
    clearTimeout(saveSpacesTimer.current);
    clearTimeout(saveBlocksTimer.current);
    skipSaveRef.current = true;
    flushAllEditors();
    setSpaces(nextSpaces);
    setBlocks(nextBlocks);
    if (active === space.id) setActive(nextSpaces[0] ? nextSpaces[0].id : null);
    lastDeleteAt.current = Date.now();
    await journalStore.deleteSpaceAndBlocks(space.id, deletedBlockIds);
    await persistAll(nextSpaces, nextBlocks);
    setTimeout(function() { skipSaveRef.current = false; }, 200);
  }

  function addBlock(type) {
    if (!isHydrated || !active) return;
    var next = blocks.concat([journalStore.newBlock(active, type)]);
    setBlocks(next);
    persistBlocks(next);
  }

  function updateBlock(id, patch) {
    if (!isHydrated) return;
    setBlocks(function(prev) {
      return prev.map(function(b) {
        return b.id === id ? Object.assign({}, b, patch, { updated: Date.now() }) : b;
      });
    });
  }

  async function removeBlock(id) {
    var block = blocksRef.current.find(function(b) { return b.id === id; });
    if (block && block.meta && block.meta.attachment) attachmentsStore.deleteAttachment(block.meta.attachment);
    var next = blocksRef.current.filter(function(b) { return b.id !== id; });
    clearTimeout(saveBlocksTimer.current);
    skipSaveRef.current = true;
    setBlocks(next);
    lastDeleteAt.current = Date.now();
    await journalStore.deleteRemoteBlock(id);
    await persistBlocks(next);
    setTimeout(function() { skipSaveRef.current = false; }, 200);
  }

  function addNoteBlock() {
    if (catForm && catForm.mode === "new") {
      cancelCatForm();
      return;
    }
    setCatForm({ mode: "new", id: null, name: "" });
  }

  function renameNoteBlock(id) {
    var blk = noteBlocks.blocks.find(function(x) { return x.id === id; });
    if (!blk) return;
    setCatForm({ mode: "rename", id: id, name: blk.name || "" });
  }

  function cancelCatForm() {
    skipCatBlurRef.current = true;
    catFormRef.current = null;
    setCatForm(null);
  }

  function submitCatForm() {
    var form = catFormRef.current || catForm;
    if (!form) return;
    var name = (form.name || "").trim();
    if (!name) return;
    if (form.mode === "rename" && form.id) {
      var renameId = form.id;
      commitNoteLayout(function(prev) {
        return Object.assign({}, prev, {
          blocks: (prev.blocks || []).map(function(x) {
            return x.id === renameId ? Object.assign({}, x, { name: name }) : x;
          }),
        });
      });
    } else {
      commitNoteLayout(function(prev) {
        return Object.assign({}, prev, {
          blocks: (prev.blocks || []).concat([{ id: newNoteBlockId(), name: name }]),
        });
      });
    }
    skipCatBlurRef.current = true;
    catFormRef.current = null;
    setCatForm(null);
  }

  function deleteNoteBlock(id) {
    if (!window.confirm("Eliminar esta categoria? As notas dentro dela voltam para \"Sem categoria\".")) return;
    commitNoteLayout(function(prev) {
      var assign = Object.assign({}, prev.assign);
      Object.keys(assign).forEach(function(sid) { if (assign[sid] === id) delete assign[sid]; });
      var collapsed = Object.assign({}, prev.collapsed);
      delete collapsed[id];
      return { blocks: (prev.blocks || []).filter(function(x) { return x.id !== id; }), assign: assign, collapsed: collapsed };
    });
  }

  function assignNoteToBlock(spaceId, blockId) {
    commitNoteLayout(function(prev) {
      var assign = Object.assign({}, prev.assign);
      if (blockId) assign[spaceId] = blockId; else delete assign[spaceId];
      return Object.assign({}, prev, { assign: assign });
    });
  }

  function toggleNoteBlockCollapse(id) {
    commitNoteLayout(function(prev) {
      var collapsed = Object.assign({}, prev.collapsed);
      collapsed[id] = !collapsed[id];
      return Object.assign({}, prev, { collapsed: collapsed });
    });
  }

  function dropZoneProps(blockId) {
    var key = blockId || "__none__";
    return {
      onDragOver: function(e) {
        if (!dragNoteRef.current) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverTarget !== key) setDragOverTarget(key);
      },
      onDrop: function(e) {
        e.preventDefault();
        var sid = dragNoteRef.current || (e.dataTransfer && e.dataTransfer.getData("text/plain"));
        if (sid) assignNoteToBlock(sid, blockId || null);
        dragNoteRef.current = null;
        setDragOverTarget(null);
      },
    };
  }

  function openNote(spaceId) {
    setActive(spaceId);
    if (isMobile) setMobileNoteOpen(true);
  }

  function renderNoteItem(s) {
    var on = active === s.id;
    var snippet = noteSnippet(s.id, blocks);
    var renaming = renameId === s.id;
    return (
      <div key={s.id} className={"nt-row" + (on && (!isMobile || mobileNoteOpen) ? " is-on" : "")} style={{ "--nc": s.color }}>
        {renaming ? (
          <div className="nt-note">
            <span className="nt-dot" style={{ background: s.color }} />
            <input
              className="nt-rename"
              autoFocus
              value={renameVal}
              onChange={function(e) { setRenameVal(e.target.value); }}
              onBlur={function() {
                renameSpace(s, renameVal);
                setRenameId(null);
              }}
              onKeyDown={function(e) {
                if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
                if (e.key === "Escape") { e.preventDefault(); setRenameId(null); }
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            className="nt-note"
            onClick={function() {
              if (skipClickRef.current) { skipClickRef.current = false; return; }
              openNote(s.id);
            }}
            onContextMenu={function(e) {
              e.preventDefault();
              e.stopPropagation();
              skipClickRef.current = true;
              openNoteMenu(s, e.clientX, e.clientY);
            }}
            onPointerDown={function(e) {
              if (e.pointerType === "mouse" && e.button !== 0) return;
              pressPosRef.current = { x: e.clientX, y: e.clientY };
              clearPressTimer();
              pressTimerRef.current = setTimeout(function() {
                skipClickRef.current = true;
                var pos = pressPosRef.current || { x: 24, y: 24 };
                openNoteMenu(s, pos.x, pos.y);
                pressTimerRef.current = 0;
              }, 480);
            }}
            onPointerMove={function(e) {
              var start = pressPosRef.current;
              if (!start) return;
              var dx = e.clientX - start.x;
              var dy = e.clientY - start.y;
              if ((dx * dx + dy * dy) > 64) clearPressTimer();
            }}
            onPointerUp={clearPressTimer}
            onPointerCancel={clearPressTimer}
          >
            <span className="nt-dot" style={{ background: s.color }} />
            <span className="nt-note-body">
              <span className="nt-note-t">{s.title}</span>
              {snippet ? <span className="nt-note-s">{snippet}</span> : null}
            </span>
          </button>
        )}
      </div>
    );
  }

  useEffect(function() {
    if (!menu) return;
    function onKey(e) { if (e.key === "Escape") closeNoteMenu(); }
    function onScroll() { closeNoteMenu(); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return function() {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [menu]);

  function format(cmd, value) {
    document.execCommand(cmd, false, value || null);
  }

  return (
    <div className="nt-root" onCopyCapture={handleJournalCopy} style={{ "--mc": ACCENT }}>
      <style>{MODULE_ENTRY_CSS + HUB_BACK_CSS + JR_CSS}</style>
      <div className="gn-field" aria-hidden="true">
        <span className="gn-orb gn-orb--a" style={{ background: moduleGlow(ACCENT) }} />
        <span className="gn-orb gn-orb--b" style={{ background: moduleGlow(ACCENT, "14") }} />
      </div>

      <header className="nt-head">
        <div className="nt-brand">
          {isMobile && mobileNoteOpen ? (
            <HubBack label="Notas" onClick={function() { setMobileNoteOpen(false); }} />
          ) : null}
          <h1>{isMobile && mobileNoteOpen && activeSpace ? activeSpace.title : "Notas"}</h1>
          {isMobile && mobileNoteOpen ? null : <span className="nt-count">{spaces.length}</span>}
        </div>
        {isMobile && mobileNoteOpen ? null : (
          <div className="nt-tools">
            <input className="nt-search" value={query} onChange={function(e) { setQuery(e.target.value); }} placeholder="Procurar…" />
            <div className="nt-new">
              <input value={newTitle} onChange={function(e) { setNewTitle(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") createSpace(); }} placeholder="Nova nota…" />
              <button type="button" className="nt-new-btn" onClick={createSpace} title="Criar nota">+</button>
            </div>
          </div>
        )}
      </header>

      {sessionWarn ? (
        <div style={{ padding: "8px 22px 0", fontSize: 12, color: "#C4A57C", fontFamily: JOURNAL_FONT, position: "relative", zIndex: 1 }}>{sessionWarn}</div>
      ) : null}

      {!isHydrated ? <PageLoader accent={ACCENT} lines={7} /> : (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", pointerEvents: "auto", position: "relative", zIndex: 1 }}>
          {(!isMobile || !mobileNoteOpen) ? (
            <div className="nt-rail">
              <button type="button" className={"nt-chip" + (catFilter === "all" ? " is-on" : "")} onClick={function() { setCatFilter("all"); }}>Todas <b>{spaces.length}</b></button>
              <button type="button" className={"nt-chip" + (catFilter === "none" ? " is-on" : "") + (dragOverTarget === "__none__" ? " is-hot" : "")} {...dropZoneProps(null)} onClick={function() { setCatFilter("none"); }}>
                Sem categoria <b>{noteGroups.ungrouped.length}</b>
              </button>
              {noteBlocks.blocks.map(function(blk) {
                var items = noteBlocks.blocks ? (noteGroups.byBlock[blk.id] || []) : [];
                var hot = dragOverTarget === blk.id;
                if (catForm && catForm.mode === "rename" && catForm.id === blk.id) {
                  return (
                    <div key={blk.id} className="nt-catform">
                      <input
                        autoFocus
                        value={catForm.name}
                        onChange={function(e) { setCatForm(Object.assign({}, catForm, { name: e.target.value })); }}
                        onBlur={function() {
                          if (skipCatBlurRef.current) { skipCatBlurRef.current = false; return; }
                          submitCatForm();
                        }}
                        onKeyDown={function(e) {
                          if (e.key === "Enter") { e.preventDefault(); submitCatForm(); }
                          if (e.key === "Escape") { e.preventDefault(); cancelCatForm(); }
                        }}
                      />
                    </div>
                  );
                }
                return (
                  <button
                    key={blk.id}
                    type="button"
                    className={"nt-chip" + (catFilter === blk.id ? " is-on" : "") + (hot ? " is-hot" : "")}
                    {...dropZoneProps(blk.id)}
                    onClick={function() { setCatFilter(blk.id); }}
                    onDoubleClick={function(e) { e.preventDefault(); renameNoteBlock(blk.id); }}
                    title="Duplo clique para renomear · arrasta notas para aqui"
                  >
                    {blk.name} <b>{items.length}</b>
                    <span className="nt-chip-x" role="button" title="Eliminar categoria" onClick={function(e) { e.stopPropagation(); deleteNoteBlock(blk.id); }}>×</span>
                  </button>
                );
              })}
              {catForm && catForm.mode === "new" ? (
                <div className="nt-catform">
                  <input
                    autoFocus
                    value={catForm.name}
                    onChange={function(e) { setCatForm(Object.assign({}, catForm, { name: e.target.value })); }}
                    onKeyDown={function(e) {
                      if (e.key === "Enter") { e.preventDefault(); submitCatForm(); }
                      if (e.key === "Escape") { e.preventDefault(); cancelCatForm(); }
                    }}
                    placeholder="Nome da categoria"
                  />
                  <button type="button" className="nt-chip is-on" onClick={submitCatForm}>Criar</button>
                </div>
              ) : (
                <button type="button" className="nt-chip nt-chip-add" onClick={addNoteBlock} title="Nova categoria">+ Categoria</button>
              )}
            </div>
          ) : null}

          <div className="nt-split">
            {(!isMobile || !mobileNoteOpen) ? (
              <aside className="nt-list" data-scrollable>
                {!spaces.length ? (
                  <p className="nt-empty">Ainda não há notas. Cria a primeira em cima — se já as tens noutro dispositivo, espera um momento a sincronizar.</p>
                ) : !visibleNotes.length ? (
                  <p className="nt-empty">Nada neste filtro. Muda de categoria ou cria uma nota nova.</p>
                ) : visibleNotes.map(renderNoteItem)}
              </aside>
            ) : null}

            {(!isMobile || mobileNoteOpen) ? (
              <section className="nt-editor" data-scrollable>
                {!activeSpace ? (
                  <p className="nt-empty">Escolhe uma nota à esquerda, ou cria uma nova.</p>
                ) : (
                  <div>
                    <div className="nt-ed-head">
                      <span className="nt-dot" style={{ background: color, width: 10, height: 10, marginTop: 8 }} />
                      <h2>{activeSpace.title}</h2>
                    </div>
                    <div className="nt-fmt">
                      <button type="button" onClick={function() { format("bold"); }}>{isMobile ? "N" : "Negrito"}</button>
                      <button type="button" onClick={function() { format("italic"); }}>{isMobile ? "I" : "Itálico"}</button>
                      <button type="button" onClick={function() { var url = prompt("Link"); if (url) format("createLink", url); }}>{isMobile ? "Link" : "Hiperligação"}</button>
                    </div>
                    <div className="nt-insert">
                      <button type="button" onClick={function() { addBlock("title"); }}><IconTitle /> Título</button>
                      <button type="button" onClick={function() { addBlock("text"); }}><IconParagraph /> Texto</button>
                      <button type="button" onClick={function() { addBlock("image"); }}><IconImage /> {isMobile ? "Img" : "Imagem"}</button>
                      <button type="button" onClick={function() { addBlock("document"); }}><IconDocument /> {isMobile ? "Doc" : "Documento"}</button>
                    </div>
                    {activeBlocks.length === 0 ? (
                      <div className="gn-emptyblocks">Adiciona um título ou texto para começar.</div>
                    ) : (
                      <div data-stagger style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {activeBlocks.map(function(b) {
                          return (
                            <JournalBlock
                              key={b.id}
                              block={b}
                              color={color}
                              collapsed={!!canvasCollapsed[b.id]}
                              onToggleCollapse={function() { toggleCanvasBlockCollapse(b.id); }}
                              onChange={updateBlock}
                              onDelete={removeBlock}
                              onEditStart={function(id) { editingBlockRef.current = id; }}
                              onEditEnd={function() { editingBlockRef.current = null; }}
                              registerFlush={registerFlush}
                              unregisterFlush={unregisterFlush}
                              editingEnabled={isHydrated}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </section>
            ) : null}
          </div>
        </div>
      )}

      {menu ? (function() {
        var space = spaces.find(function(s) { return s.id === menu.id; });
        if (!space) return null;
        var currentCat = noteBlocks.assign[space.id];
        return (
          <div
            className="nt-menu-bg"
            onClick={closeNoteMenu}
            onContextMenu={function(e) { e.preventDefault(); closeNoteMenu(); }}
          >
            <div className="nt-menu" style={{ left: menu.x, top: menu.y }} onClick={function(e) { e.stopPropagation(); }}>
              <p>Categoria</p>
              <button type="button" className={!currentCat ? "is-on" : ""} onClick={function() { assignNoteToBlock(space.id, null); closeNoteMenu(); }}>Sem categoria</button>
              {noteBlocks.blocks.map(function(blk) {
                return (
                  <button key={blk.id} type="button" className={currentCat === blk.id ? "is-on" : ""} onClick={function() { assignNoteToBlock(space.id, blk.id); closeNoteMenu(); }}>{blk.name}</button>
                );
              })}
              <div className="nt-menu-sep" />
              <button type="button" onClick={function() { setRenameVal(space.title || ""); setRenameId(space.id); closeNoteMenu(); }}>Mudar nome</button>
              <button type="button" className="is-danger" onClick={function() { closeNoteMenu(); removeSpace(space); }}>Eliminar</button>
            </div>
          </div>
        );
      })() : null}
    </div>
  );
}

function JournalBlock(props) {
  var b = props.block;
  var fileRef = useRef(null);
  var editorRef = useRef(null);
  var latestHtml = useRef(b.content || "");
  var saveTimer = useRef(null);
  var focusedRef = useRef(false);
  var uploadS = useState("");
  var uploadMsg = uploadS[0], setUploadMsg = uploadS[1];
  var meta = blockTypeMeta(b.type);

  useEffect(function() {
    latestHtml.current = b.content || "";
    if (!editorRef.current || b.type === "image" || b.type === "document") return;
    editorRef.current.innerHTML = latestHtml.current;
  }, [b.id, b.type]);

  useEffect(function() {
    return function() { clearTimeout(saveTimer.current); };
  }, [b.id]);

  function pushContent() {
    props.onChange(b.id, { content: latestHtml.current });
  }

  function onInput(e) {
    latestHtml.current = e.currentTarget.innerHTML;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(pushContent, 300);
  }

  function syncText() {
    clearTimeout(saveTimer.current);
    pushContent();
  }

  useEffect(function() {
    if (props.registerFlush) props.registerFlush(b.id, syncText);
    return function() {
      if (props.unregisterFlush) props.unregisterFlush(b.id);
    };
  }, [b.id]);

  async function onFile(e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    e.target.value = "";
    setUploadMsg("A enviar...");
    var uploaded = await attachmentsStore.uploadAttachment(f, "journal_block", b.id, { block_id: b.id, space_id: b.space_id });
    if (uploaded.uploadError && uploaded.localOnly) {
      setUploadMsg("Guardado só neste dispositivo: " + uploaded.uploadError);
    } else if (uploaded.uploadError) {
      setUploadMsg("Erro: " + uploaded.uploadError);
      return;
    } else {
      setUploadMsg(uploaded.localOnly ? "Guardado localmente (sem nuvem)" : "Guardado");
    }
    var url = uploaded.url || uploaded.data || "";
    props.onChange(b.id, {
      content: url,
      meta: { name: f.name, attachment: attachmentsStore.stripAttachmentRef(uploaded) },
    });
    setTimeout(function() { setUploadMsg(""); }, 2800);
  }

  return (
    <div className={"gn-block glass" + (props.collapsed ? " is-collapsed" : "")} style={{ "--nc": props.color }}>
      <div
        className="gn-block-head"
        title="Duplo clique para minimizar"
        onDoubleClick={function(e) {
          if (e.target.closest(".gn-x")) return;
          if (props.onToggleCollapse) props.onToggleCollapse();
        }}
      >
        <span className="gn-type"><meta.Icon /> {meta.label}</span>
        <span className="gn-block-fold">{props.collapsed ? "Expandir" : "Minimizar"}</span>
        <button type="button" className="gn-x" onClick={function() { props.onDelete(b.id); }} style={{ width: 26, height: 26, fontSize: 15 }}>×</button>
      </div>
      {uploadMsg ? <p className="gn-uploadmsg">{uploadMsg}</p> : null}
      {b.type === "image" ? (
        <div>
          {b.content ? (
            <img src={b.content} alt={(b.meta && b.meta.name) || "Imagem"} style={{ maxWidth: "100%", borderRadius: 14, display: "block" }} />
          ) : (
            <button type="button" className="gn-upload" onClick={function() { fileRef.current.click(); }}>
              <span className="gn-upload-ic"><IconImage /></span>
              Escolher imagem
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />
        </div>
      ) : b.type === "document" ? (
        <div>
          {b.content ? (
            <a href={b.content} download={b.meta && b.meta.name} className="gn-doclink">
              <span className="gn-doclink-ic"><IconDocument /></span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(b.meta && b.meta.name) || "Documento"}</span>
            </a>
          ) : (
            <button type="button" className="gn-upload gn-upload--doc" onClick={function() { fileRef.current.click(); }}>
              <span className="gn-upload-ic"><IconDocument /></span>
              Escolher documento
            </button>
          )}
          <input ref={fileRef} type="file" style={{ display: "none" }} onChange={onFile} />
        </div>
      ) : (
        <div
          ref={editorRef}
          contentEditable={props.editingEnabled !== false}
          suppressContentEditableWarning
          onInput={onInput}
          onFocus={function() {
            focusedRef.current = true;
            if (props.onEditStart) props.onEditStart(b.id);
          }}
          onBlur={function() {
            focusedRef.current = false;
            syncText();
            if (props.onEditEnd) props.onEditEnd();
          }}
          data-placeholder={b.type === "title" ? "Título" : "Escreve aqui..."}
          className={"gn-ed" + (b.type === "title" ? " gn-ed--title" : " gn-ed--text")}
          style={{
            outline: "none",
            ...JOURNAL_TEXT,
            lineHeight: b.type === "title" ? 1.3 : JOURNAL_LINE_HEIGHT,
          }}
        />
      )}
    </div>
  );
}
