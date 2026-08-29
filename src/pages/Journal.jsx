import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as journalStore from "../lib/journalStore";
import * as attachmentsStore from "../lib/attachmentsStore";
import { PageLoader } from "../components/PageLoader";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { pageBg } from "../lib/ThemeContext";
import { useCloudSync } from "../lib/useCloudSync";
import { RECOVERY_EVENT, shouldSkipCloudSync } from "../lib/recoveryFlags";
import { moduleColor, moduleGlow, PALETTE, alpha } from "../lib/theme";
import { GLASS_CSS } from "../lib/glassUi";

var ACCENT = moduleColor("journal");
var COLORS = PALETTE;
var JOURNAL_FONT = "'JetBrains Mono', monospace";
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
  ".gn-block-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}",
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
var NOTE_LAYOUT_DEBOUNCE_MS = 900;

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

function handleJournalCopy(e) {
  var sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.toString().trim()) return;
  var text = sel.toString();
  var html =
    '<span style="font-family:JetBrains Mono,monospace;color:#FFFFFF;letter-spacing:0.04em;line-height:1.75;">' +
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

function blockTypeMeta(type) {
  if (type === "title") return { label: "Título", Icon: IconTitle };
  if (type === "image") return { label: "Imagem", Icon: IconImage };
  if (type === "document") return { label: "Documento", Icon: IconDocument };
  return { label: "Texto", Icon: IconParagraph };
}

export default function Journal() {
  var navigate = useNavigate();
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
  var mobileNoteOpenS = useState(false);
  var mobileNoteOpen = mobileNoteOpenS[0], setMobileNoteOpen = mobileNoteOpenS[1];
  var dragNoteRef = useRef(null);
  var dragOverS = useState(null);
  var dragOverTarget = dragOverS[0], setDragOverTarget = dragOverS[1];
  var saveSpacesTimer = useRef(null);
  var saveBlocksTimer = useRef(null);
  var saveNoteLayoutTimer = useRef(null);
  var blocksRef = useRef([]);
  var spacesRef = useRef([]);
  var noteBlocksRef = useRef({ blocks: [], assign: {}, collapsed: {} });
  var isHydratedRef = useRef(false);
  var editingBlockRef = useRef(null);
  var flushHandlersRef = useRef({});
  var skipSaveRef = useRef(false);
  var lastSaveAt = useRef(0);
  var lastDeleteAt = useRef(0);

  function getEditingSnapshot() {
    var id = editingBlockRef.current;
    if (!id) return null;
    return blocksRef.current.find(function(b) { return b.id === id; }) || null;
  }

  function applyNoteLayout(layout) {
    if (!layout) return;
    setNoteBlocks({
      blocks: layout.blocks || [],
      assign: layout.assign || {},
      collapsed: layout.collapsed || {},
    });
  }

  function applyJournalData(spacesList, blocksList) {
    setSpaces(spacesList);
    setBlocks(blocksList);
    setActive(function(prev) {
      if (prev && spacesList.some(function(s) { return s.id === prev; })) return prev;
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
      return Promise.all([
        journalStore.pullSpaces(),
        journalStore.pullBlocks(getEditingSnapshot()),
        journalStore.pullNoteLayout(),
      ]).then(function(sync) {
        applyJournalData(sync[0], sync[1]);
        applyNoteLayout(sync[2]);
      });
    }).finally(function() {
      isHydratedRef.current = true;
      setIsHydrated(true);
      setTimeout(function() { skipSaveRef.current = false; }, 200);
    });
  }, []);

  var syncFromCloud = useCallback(function() {
    if (editingBlockRef.current) return Promise.resolve();
    if (Date.now() - lastDeleteAt.current < 20000) return Promise.resolve();
    if (Date.now() - lastSaveAt.current < 8000) return Promise.resolve();
    skipSaveRef.current = true;
    return Promise.all([
      journalStore.pullSpaces(),
      journalStore.pullBlocks(getEditingSnapshot()),
      journalStore.pullNoteLayout(),
    ]).then(function(sync) {
      applyJournalData(sync[0], sync[1]);
      applyNoteLayout(sync[2]);
      setTimeout(function() { skipSaveRef.current = false; }, 150);
    }).catch(function() {
      skipSaveRef.current = false;
    });
  }, []);

  useCloudSync({
    shouldSkip: function() {
      if (!isHydratedRef.current) return true;
      if (shouldSkipCloudSync()) return true;
      if (editingBlockRef.current) return true;
      if (Date.now() - lastDeleteAt.current < 20000) return true;
      if (Date.now() - lastSaveAt.current < 8000) return true;
      return false;
    },
    onPull: syncFromCloud,
    onPush: function() {
      flushAllEditors();
      skipSaveRef.current = true;
      return Promise.all([
        persistAll(),
        journalStore.saveNoteLayout(noteBlocksRef.current),
      ]).finally(function() {
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
        return Promise.all([
          journalStore.pullSpaces(),
          journalStore.pullBlocks(getEditingSnapshot()),
          journalStore.pullNoteLayout(),
        ]);
      })
      .then(function(sync) {
        if (!alive) return;
        if (sync) {
          applyJournalData(sync[0], sync[1]);
          applyNoteLayout(sync[2]);
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
      setSessionWarn("Sessão expirada — o Diário foi guardado neste dispositivo. Inicia sessão no Hub para sincronizar.");
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
    reportSave(await journalStore.saveSpaces(nextSpaces || spacesRef.current));
  }

  async function persistBlocks(nextBlocks) {
    if (!isHydratedRef.current || skipSaveRef.current) return;
    reportSave(await journalStore.saveBlocks(nextBlocks || blocksRef.current));
  }

  async function persistAll(nextSpaces, nextBlocks) {
    if (!isHydratedRef.current || skipSaveRef.current) return;
    reportSave(await journalStore.saveAll(nextSpaces || spacesRef.current, nextBlocks || blocksRef.current));
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

  useEffect(function() {
    if (!isHydrated || skipSaveRef.current) return;
    clearTimeout(saveNoteLayoutTimer.current);
    saveNoteLayoutTimer.current = setTimeout(function() {
      journalStore.saveNoteLayout(noteBlocks).then(reportSave);
    }, NOTE_LAYOUT_DEBOUNCE_MS);
    return function() { clearTimeout(saveNoteLayoutTimer.current); };
  }, [noteBlocks, isHydrated]);

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

  function createSpace() {
    if (!isHydrated) return;
    if (!newTitle.trim()) return;
    var s = { id: journalStore.newBlock("x").id.replace("jb", "js"), title: newTitle.trim(), color: COLORS[spaces.length % COLORS.length] };
    var next = spaces.concat([s]);
    setSpaces(next);
    setActive(s.id);
    setNewTitle("");
    if (isMobile) setMobileNoteOpen(true);
    persistSpaces(next);
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
    var name = window.prompt("Nome do bloco:");
    if (name === null) return;
    name = name.trim();
    if (!name) return;
    setNoteBlocks(function(prev) {
      return Object.assign({}, prev, { blocks: prev.blocks.concat([{ id: newNoteBlockId(), name: name }]) });
    });
  }

  function renameNoteBlock(id) {
    var blk = noteBlocks.blocks.find(function(x) { return x.id === id; });
    if (!blk) return;
    var name = window.prompt("Nome do bloco:", blk.name);
    if (name === null) return;
    name = name.trim();
    setNoteBlocks(function(prev) {
      return Object.assign({}, prev, {
        blocks: prev.blocks.map(function(x) { return x.id === id ? Object.assign({}, x, { name: name || x.name }) : x; }),
      });
    });
  }

  function deleteNoteBlock(id) {
    if (!window.confirm("Eliminar este bloco? As notas dentro dele voltam para \"Sem bloco\".")) return;
    setNoteBlocks(function(prev) {
      var assign = Object.assign({}, prev.assign);
      Object.keys(assign).forEach(function(sid) { if (assign[sid] === id) delete assign[sid]; });
      var collapsed = Object.assign({}, prev.collapsed);
      delete collapsed[id];
      return { blocks: prev.blocks.filter(function(x) { return x.id !== id; }), assign: assign, collapsed: collapsed };
    });
  }

  function assignNoteToBlock(spaceId, blockId) {
    setNoteBlocks(function(prev) {
      var assign = Object.assign({}, prev.assign);
      if (blockId) assign[spaceId] = blockId; else delete assign[spaceId];
      return Object.assign({}, prev, { assign: assign });
    });
  }

  function toggleNoteBlockCollapse(id) {
    setNoteBlocks(function(prev) {
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
    var initial = (s.title || "?").trim().charAt(0).toUpperCase() || "?";
    return (
      <div key={s.id} className="gn-noterow">
        {!isMobile ? (
          <span
            className="gn-drag"
            title="Arrastar"
            draggable
            onDragStart={function(e) { dragNoteRef.current = s.id; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", s.id); } catch (_) {} }}
            onDragEnd={function() { dragNoteRef.current = null; setDragOverTarget(null); }}
          >⠿</span>
        ) : null}
        <button type="button" className={"gn-note" + (on && (!isMobile || mobileNoteOpen) ? " is-on" : "")} onClick={function() { openNote(s.id); }}
          style={{ "--nc": s.color, fontSize: isMobile ? 15 : 13, padding: isMobile ? "12px 12px" : "9px 11px" }}>
          <span className="gn-avatar" style={{ background: alpha(s.color, 0.18), color: s.color, borderColor: alpha(s.color, 0.4) }}>{initial}</span>
          <span className="gn-notetitle">{s.title}</span>
        </button>
        <button type="button" className="gn-x" onClick={function(e) { e.stopPropagation(); removeSpace(s); }} title="Eliminar nota"
          style={{ width: isMobile ? 36 : 28, height: isMobile ? 36 : 28, fontSize: isMobile ? 18 : 15 }} aria-label="Eliminar nota">×</button>
      </div>
    );
  }

  function format(cmd, value) {
    document.execCommand(cmd, false, value || null);
  }

  return (
    <div
      onCopyCapture={handleJournalCopy}
      style={{
        minHeight: "100vh",
        background: pageBg(),
        color: "#FFFFFF",
        fontFamily: JOURNAL_FONT,
        letterSpacing: JOURNAL_LETTER_SPACING,
        lineHeight: JOURNAL_LINE_HEIGHT,
        position: "relative",
        overflowX: "hidden",
        "--mc": ACCENT,
      }}>
      <style>{MODULE_ENTRY_CSS + JR_CSS}</style>
      <div className="gn-field" aria-hidden="true">
        <span className="gn-orb gn-orb--a" style={{ background: moduleGlow(ACCENT) }} />
        <span className="gn-orb gn-orb--b" style={{ background: moduleGlow(ACCENT, "14") }} />
      </div>

      <header className="gn-header" style={{ padding: isMobile ? "max(12px, env(safe-area-inset-top)) 12px 12px" : "14px 20px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            {isMobile && mobileNoteOpen ? (
              <button type="button" className="gn-hbtn" onClick={function() { setMobileNoteOpen(false); }}>← Notas</button>
            ) : (
              <button type="button" className="gn-hbtn" onClick={function() { navigate("/"); }}>← Hub</button>
            )}
            <h1 className="mod-h1" style={{ fontFamily: JOURNAL_FONT, fontSize: isMobile ? 17 : 16, color: activeSpace ? activeSpace.color : ACCENT, margin: 0, fontWeight: 500, letterSpacing: JOURNAL_LETTER_SPACING, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{isMobile && mobileNoteOpen && activeSpace ? activeSpace.title : "Diário"}</h1>
          </div>
        </div>
      </header>

      {sessionWarn ? (
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "8px 20px 0", fontSize: 12, color: "#C4A57C", fontFamily: JOURNAL_FONT, position: "relative", zIndex: 1 }}>
          {sessionWarn}
        </div>
      ) : null}

      <main className="mod-main" data-scrollable style={{ maxWidth: 1180, margin: "0 auto", padding: isMobile ? "14px 12px 80px" : "22px 20px", position: "relative", zIndex: 1 }}>
        {!isHydrated ? <PageLoader accent={ACCENT} lines={7} /> : (
        <div style={{ pointerEvents: isHydrated ? "auto" : "none", userSelect: isHydrated ? "auto" : "none" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "270px minmax(0,1fr)", gap: isMobile ? 14 : 26 }}>
        {(!isMobile || !mobileNoteOpen) ? (
        <aside style={{ height: "fit-content" }}>
          <div className="gn-sidehead">
            <p className="jr-lbl">Notas</p>
            <button type="button" className="gn-addblk" onClick={addNoteBlock} title="Novo bloco"><IconFolder /> + Bloco</button>
          </div>
          <div data-scrollable style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: isMobile ? "none" : "62vh", overflowY: isMobile ? "visible" : "auto", paddingRight: isMobile ? 0 : 2 }}>
            {noteGroups.ungrouped.length > 0 ? (
              <div {...dropZoneProps(null)} className={"gn-drop" + (dragOverTarget === "__none__" ? " is-hot" : "")}>
                {noteGroups.ungrouped.map(renderNoteItem)}
              </div>
            ) : null}
            {noteBlocks.blocks.map(function(blk) {
              var items = noteGroups.byBlock[blk.id] || [];
              var collapsed = !!noteBlocks.collapsed[blk.id];
              var hot = dragOverTarget === blk.id;
              return (
                <div key={blk.id} {...dropZoneProps(blk.id)} className={"gn-group glass-flat" + (hot ? " is-hot" : "")}>
                  <div className="gn-group-head">
                    <button type="button" className="gn-chevron" onClick={function() { toggleNoteBlockCollapse(blk.id); }}><IconChevron open={!collapsed} /></button>
                    <button type="button" className="gn-group-name" onClick={function() { renameNoteBlock(blk.id); }} title="Renomear bloco">
                      <IconFolder />
                      <span>{blk.name}</span>
                      <span className="gn-count">{items.length}</span>
                    </button>
                    <button type="button" className="gn-x" onClick={function() { deleteNoteBlock(blk.id); }} title="Eliminar bloco" style={{ width: 24, height: 24, fontSize: 14 }}>×</button>
                  </div>
                  {!collapsed ? (
                    <div className="gn-group-body">
                      {items.length ? items.map(renderNoteItem) : <p className="gn-hint">Arrasta notas para aqui</p>}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="gn-newnote">
            <input className="gn-input" value={newTitle} onChange={function(e) { setNewTitle(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") createSpace(); }} placeholder="Nova nota…" style={{ fontSize: isMobile ? 16 : 13 }} />
            <button type="button" className="gn-newnote-btn" onClick={createSpace}>+</button>
          </div>
        </aside>
        ) : null}

        {(!isMobile || mobileNoteOpen) ? (
        <section style={{ minWidth: 0, maxWidth: 720 }}>
          <div className="gn-canvashead">
            <span className="gn-dot" style={{ background: color, "--nc": color }} />
            <h2 style={{ margin: 0, fontSize: isMobile ? "clamp(22px,7vw,30px)" : "clamp(26px,3.8vw,38px)", fontFamily: JOURNAL_FONT, color: "#EDEDEF", fontWeight: 400, letterSpacing: "-0.03em", lineHeight: 1.2, overflowWrap: "anywhere" }}>{activeSpace ? activeSpace.title : "Diário"}</h2>
          </div>
          <div className="gn-fmtbar">
            <button type="button" className="gn-fmtbtn" onClick={function() { format("bold"); }}>{isMobile ? "N" : "Negrito"}</button>
            <button type="button" className="gn-fmtbtn" onClick={function() { format("italic"); }}>{isMobile ? "I" : "Itálico"}</button>
            <button type="button" className="gn-fmtbtn" onClick={function() { var url = prompt("Link"); if (url) format("createLink", url); }}>{isMobile ? "Link" : "Hiperligação"}</button>
          </div>
          <div className="gn-insertbar glass-flat">
            <button type="button" className="gn-insert" onClick={function() { addBlock("title"); }}><IconTitle /> Título</button>
            <button type="button" className="gn-insert" onClick={function() { addBlock("text"); }}><IconParagraph /> Texto</button>
            <button type="button" className="gn-insert" onClick={function() { addBlock("image"); }}><IconImage /> {isMobile ? "Img" : "Imagem"}</button>
            <button type="button" className="gn-insert" onClick={function() { addBlock("document"); }}><IconDocument /> {isMobile ? "Doc" : "Documento"}</button>
          </div>
          {activeBlocks.length === 0 ? (
            <div className="gn-emptyblocks">Adiciona blocos para começar a escrever.</div>
          ) : (
            <div data-stagger style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {activeBlocks.map(function(b) {
                return (
                  <JournalBlock
                    key={b.id}
                    block={b}
                    color={color}
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
        </section>
        ) : null}
        </div>
        </div>
        )}
      </main>
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
    <div className="gn-block glass" style={{ "--nc": props.color }}>
      <div className="gn-block-head">
        <span className="gn-type"><meta.Icon /> {meta.label}</span>
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
