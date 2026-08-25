import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as journalStore from "../lib/journalStore";
import * as attachmentsStore from "../lib/attachmentsStore";
import { PageLoader } from "../components/PageLoader";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { pageBg, pageText } from "../lib/ThemeContext";
import { useCloudSync } from "../lib/useCloudSync";
import { RECOVERY_EVENT, shouldSkipCloudSync } from "../lib/recoveryFlags";

var ACCENT = "#E6E6E9";
var COLORS = ["#E6E6E9", "#A0A0A8", "#8FB39B", "#C4A57C", "#C08C8C", "#8FA8C4"];
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
  ".jr-lbl{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#6E6E76;margin:0}",
  ".jr-note{position:relative;display:flex;align-items:center;gap:9px;flex:1;min-width:0;text-align:left;border-radius:11px;cursor:pointer;",
  "font-family:'JetBrains Mono',monospace;",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".jr-note>span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
  ".jr-note>i{width:6px;height:6px;border-radius:999px;flex-shrink:0;opacity:.85}",
  ".jr-note:hover{background:#1A1A1D;border-color:rgba(255,255,255,0.14)}",
  ".jr-x{display:flex;align-items:center;justify-content:center;border-radius:9px;border:1px solid transparent;",
  "background:transparent;color:#6E6E76;cursor:pointer;flex-shrink:0;line-height:1;padding:0;",
  "transition:color var(--dur) var(--ease),background var(--dur) var(--ease)}",
  ".jr-x:hover{color:#C08C8C;background:rgba(255,255,255,0.05)}",
  ".jr-blk{border:1px solid rgba(255,255,255,0.07);background:#141416;border-radius:14px;padding:16px;",
  "transition:border-color var(--dur) var(--ease)}",
  ".jr-blk:hover,.jr-blk:focus-within{border-color:rgba(255,255,255,0.13)}",
  ".jr-ed{outline:none;color:#EDEDEF;line-height:1.75}",
  ".jr-ed:empty:before{content:attr(data-placeholder);color:#6E6E76;pointer-events:none}",
  ".jr-ed a{color:#EDEDEF;text-underline-offset:3px}",
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
    return (
      <div
        key={s.id}
        draggable={!isMobile}
        onDragStart={function(e) { dragNoteRef.current = s.id; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", s.id); } catch (_) {} }}
        onDragEnd={function() { dragNoteRef.current = null; setDragOverTarget(null); }}
        style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {!isMobile ? <span title="Arrastar" style={{ cursor: "grab", color: "#6E6E76", fontSize: 12, lineHeight: 1, userSelect: "none" }}>⠿</span> : null}
        <button type="button" className="jr-note" onClick={function() { openNote(s.id); }}
          style={{
            padding: isMobile ? "14px" : "10px 12px",
            border: "1px solid " + (on && (!isMobile || mobileNoteOpen) ? "rgba(255,255,255,0.16)" : "transparent"),
            background: on && (!isMobile || mobileNoteOpen) ? "#1A1A1D" : "transparent",
            color: on && (!isMobile || mobileNoteOpen) ? "#EDEDEF" : "#A0A0A8",
            letterSpacing: JOURNAL_LETTER_SPACING, fontSize: isMobile ? 15 : 13,
          }}><i style={{ background: s.color }} /><span>{s.title}</span></button>
        <button type="button" className="jr-x" onClick={function(e) { e.stopPropagation(); removeSpace(s); }} title="Eliminar nota"
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
      }}>
      <style>{MODULE_ENTRY_CSS + JR_CSS}</style>
      <header style={{position:"sticky",top:0,zIndex:20,background:"#0A0A0B",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:isMobile?"12px":"16px 20px"}}>
        <div style={{maxWidth:1180,margin:"0 auto",display:"flex",alignItems:isMobile?"stretch":"center",justifyContent:"space-between",gap:12,flexDirection:isMobile?"column":"row",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,minWidth:0}}>
            {isMobile && mobileNoteOpen ? (
              <button onClick={function(){setMobileNoteOpen(false);}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.09)",borderRadius:10,color:"#A0A0A8",padding:"9px 13px",cursor:"pointer",fontFamily:JOURNAL_FONT,fontSize:12,flexShrink:0}}>← Notas</button>
            ) : (
              <button onClick={function(){navigate("/");}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.09)",borderRadius:10,color:"#A0A0A8",padding:"9px 13px",cursor:"pointer",fontSize:12,flexShrink:0}}>← Hub</button>
            )}
            <h1 className="mod-h1" style={{ fontFamily: JOURNAL_FONT, fontSize: isMobile ? 17 : 16, color: "#EDEDEF", margin: 0, fontWeight: 500, letterSpacing: JOURNAL_LETTER_SPACING, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{isMobile && mobileNoteOpen && activeSpace ? activeSpace.title : "Diário"}</h1>
          </div>
          {(!isMobile || mobileNoteOpen) ? (
          <div style={{display:"flex",gap:8,alignItems:"center",overflowX:isMobile?"auto":"visible",paddingBottom:isMobile?2:0,flexWrap:"wrap"}}>
            <button onClick={function(){addBlock("title");}} style={topBtn()}>+ Título</button>
            <button onClick={function(){addBlock("text");}} style={topBtn()}>+ Texto</button>
            <button onClick={function(){addBlock("image");}} style={topBtn()}>+ Imagem</button>
            <button onClick={function(){addBlock("document");}} style={topBtn()}>+ Documento</button>
          </div>
          ) : null}
        </div>
      </header>

      {sessionWarn ? (
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "8px 20px 0", fontSize: 12, color: "#C4A57C", fontFamily: JOURNAL_FONT }}>
          {sessionWarn}
        </div>
      ) : null}

      <main className="mod-main" data-scrollable style={{maxWidth:1180,margin:"0 auto",padding:isMobile?"14px 12px 80px":"22px 20px"}}>
        {!isHydrated ? <PageLoader accent={ACCENT} lines={7} /> : (
        <div style={{ pointerEvents: isHydrated ? "auto" : "none", userSelect: isHydrated ? "auto" : "none" }}>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"260px minmax(0,1fr)",gap:isMobile?14:22}}>
        {(!isMobile || !mobileNoteOpen) ? (
        <aside style={{border:"1px solid rgba(255,255,255,0.07)",background:"#141416",borderRadius:16,padding:isMobile?14:18,height:"fit-content"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,margin:"0 0 16px"}}>
            <p className="jr-lbl">Notas</p>
            <button type="button" onClick={addNoteBlock} title="Novo bloco" style={{background:"transparent",border:"1px solid rgba(255,255,255,0.12)",borderRadius:9,color:"#A0A0A8",padding:"6px 11px",cursor:"pointer",fontFamily:JOURNAL_FONT,fontSize:10.5,letterSpacing:JOURNAL_LETTER_SPACING,lineHeight:1.2}}>+ Bloco</button>
          </div>
          <div data-scrollable style={{display:"flex",flexDirection:"column",gap:12,maxHeight:isMobile?"none":"62vh",overflowY:isMobile?"visible":"auto",paddingRight:isMobile?0:2}}>
            {noteGroups.ungrouped.length > 0 ? (
              <div {...dropZoneProps(null)} style={{display:"flex",flexDirection:"column",gap:6,borderRadius:14,padding:dragOverTarget==="__none__"?8:0,border:dragOverTarget==="__none__"?("1px dashed "+color+"55"):"none",background:dragOverTarget==="__none__"?color+"10":"transparent",transition:"border-color .15s,background .15s"}}>
                {noteGroups.ungrouped.map(renderNoteItem)}
              </div>
            ) : null}
            {noteBlocks.blocks.map(function(blk) {
              var items = noteGroups.byBlock[blk.id] || [];
              var collapsed = !!noteBlocks.collapsed[blk.id];
              var hot = dragOverTarget === blk.id;
              return (
                <div key={blk.id} {...dropZoneProps(blk.id)} style={{border:"1px solid "+(hot?"rgba(255,255,255,0.22)":"rgba(255,255,255,0.06)"),background:hot?"#1A1A1D":"rgba(255,255,255,0.02)",borderRadius:12,padding:10,transition:"border-color var(--dur) var(--ease),background var(--dur) var(--ease)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:collapsed?0:10}}>
                    <button type="button" onClick={function(){toggleNoteBlockCollapse(blk.id);}} style={{background:"none",border:"none",color:"#6E6E76",cursor:"pointer",fontSize:11,width:16,padding:0,lineHeight:1}}>{collapsed?"▸":"▾"}</button>
                    <button type="button" onClick={function(){renameNoteBlock(blk.id);}} title="Renomear bloco" style={{flex:1,minWidth:0,textAlign:"left",background:"none",border:"none",color:"#EDEDEF",cursor:"pointer",fontFamily:JOURNAL_FONT,fontSize:11.5,letterSpacing:"1px",textTransform:"uppercase",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:1.3}}>{blk.name} <span style={{color:"#6E6E76",fontWeight:400}}>· {items.length}</span></button>
                    <button type="button" className="jr-x" onClick={function(){deleteNoteBlock(blk.id);}} title="Eliminar bloco" style={{width:24,height:24,fontSize:14}}>×</button>
                  </div>
                  {!collapsed ? (
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {items.length ? items.map(renderNoteItem) : <p style={{margin:0,padding:"10px",fontSize:11,color:"#6E6E76",fontFamily:JOURNAL_FONT,letterSpacing:JOURNAL_LETTER_SPACING,lineHeight:1.5}}>Arrasta notas para aqui</p>}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:8,marginTop:18}}>
            <input value={newTitle} onChange={function(e){setNewTitle(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")createSpace();}} placeholder="Nova nota..." style={{flex:1,minWidth:0,background:"#0E0E10",border:"1px solid rgba(255,255,255,0.09)",borderRadius:11,color:"#EDEDEF",padding:"11px 12px",outline:"none",fontSize:isMobile?16:13,fontFamily:JOURNAL_FONT,letterSpacing:JOURNAL_LETTER_SPACING,lineHeight:1.4}}/>
            <button type="button" onClick={createSpace} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.14)",borderRadius:11,color:"#EDEDEF",padding:"0 15px",cursor:"pointer",fontSize:15}}>+</button>
          </div>
        </aside>
        ) : null}

        {(!isMobile || mobileNoteOpen) ? (
        <section style={{minWidth:0,maxWidth:720}}>
          <div style={{marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
            <span style={{width:8,height:8,borderRadius:999,background:color,flexShrink:0}} />
            <h2 style={{ margin: 0, fontSize: "clamp(26px,3.8vw,38px)", fontFamily: JOURNAL_FONT, color: "#EDEDEF", fontWeight: 400, letterSpacing: "-0.03em", lineHeight: 1.2, overflowWrap: "anywhere" }}>{activeSpace ? activeSpace.title : "Diário"}</h2>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
            <button type="button" onClick={function(){format("bold");}} style={toolBtn()}>Negrito</button>
            <button type="button" onClick={function(){format("italic");}} style={toolBtn()}>Itálico</button>
            <button type="button" onClick={function(){var url=prompt("Link"); if(url) format("createLink",url);}} style={toolBtn()}>Hiperligação</button>
          </div>
          {activeBlocks.length === 0 ? (
            <div style={{border:"1px dashed rgba(255,255,255,0.09)",borderRadius:16,minHeight:260,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:24,color:"#6E6E76",fontFamily:JOURNAL_FONT,fontSize:13,letterSpacing:JOURNAL_LETTER_SPACING,lineHeight:1.6}}>
              Adiciona blocos para começar a escrever.
            </div>
          ) : (
            <div data-stagger style={{display:"flex",flexDirection:"column",gap:12}}>
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
    <div className="jr-blk">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span className="jr-lbl">{b.type}</span>
        <button type="button" className="jr-x" onClick={function(){props.onDelete(b.id);}} style={{width:26,height:26,fontSize:15}}>×</button>
      </div>
      {uploadMsg ? <p style={{margin:"0 0 10px",fontSize:11.5,color:"#A0A0A8",lineHeight:1.5}}>{uploadMsg}</p> : null}
      {b.type === "image" ? (
        <div>
          {b.content ? <img src={b.content} alt={b.meta && b.meta.name || "Imagem"} style={{maxWidth:"100%",borderRadius:12,display:"block"}}/> : <button type="button" onClick={function(){fileRef.current.click();}} style={{width:"100%",minHeight:150,border:"1px dashed rgba(255,255,255,0.12)",borderRadius:12,background:"transparent",color:"#A0A0A8",cursor:"pointer",fontFamily:JOURNAL_FONT,fontSize:13}}>Escolher imagem</button>}
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={onFile}/>
        </div>
      ) : b.type === "document" ? (
        <div>
          {b.content ? <a href={b.content} download={b.meta && b.meta.name} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,0.09)",background:"#0E0E10",color:"#EDEDEF",textDecoration:"none",fontSize:13.5}}><span style={{fontSize:22}}>📄</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.meta && b.meta.name || "Documento"}</span></a> : <button type="button" onClick={function(){fileRef.current.click();}} style={{width:"100%",minHeight:110,border:"1px dashed rgba(255,255,255,0.12)",borderRadius:12,background:"transparent",color:"#A0A0A8",cursor:"pointer",fontFamily:JOURNAL_FONT,fontSize:13}}>Escolher documento</button>}
          <input ref={fileRef} type="file" style={{display:"none"}} onChange={onFile}/>
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
          className="jr-ed"
          style={{
            outline: "none",
            fontSize: b.type === "title" ? 24 : 15,
            fontWeight: b.type === "title" ? 600 : 400,
            minHeight: b.type === "title" ? 36 : 90,
            maxWidth: b.type === "title" ? "none" : "74ch",
            ...JOURNAL_TEXT,
            lineHeight: b.type === "title" ? 1.3 : JOURNAL_LINE_HEIGHT,
          }}
        />
      )}
    </div>
  );
}

function topBtn() {
  return {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 10,
    color: "#A0A0A8",
    padding: "9px 13px",
    cursor: "pointer",
    fontFamily: JOURNAL_FONT,
    fontSize: 11.5,
    letterSpacing: JOURNAL_LETTER_SPACING,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  };
}
function toolBtn() {
  return {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 10,
    color: "#A0A0A8",
    padding: "9px 13px",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: JOURNAL_FONT,
    letterSpacing: JOURNAL_LETTER_SPACING,
    lineHeight: 1.2,
  };
}
