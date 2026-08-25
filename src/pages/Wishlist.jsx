import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as wishlistStore from "../lib/wishlistStore";
import { PageLoader } from "../components/PageLoader";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { pageBg, pageText } from "../lib/ThemeContext";
import { useCloudSync } from "../lib/useCloudSync";
import { RECOVERY_EVENT, shouldSkipCloudSync } from "../lib/recoveryFlags";

var ACCENT = "#E6E6E9";
var GROUP_COLORS = ["#E6E6E9", "#A0A0A8", "#8FB39B", "#C4A57C", "#C08C8C", "#8FA8C4"];
var PRIORITIES = [
  { id: "low", label: "Baixa", color: "rgba(255,255,255,0.35)" },
  { id: "med", label: "Média", color: "#C4A57C" },
  { id: "high", label: "Alta", color: "#E6E6E9" },
];

var WL_CSS = [
  ".wl-lbl{margin:0;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.5;letter-spacing:1.6px;text-transform:uppercase;color:#6E6E76}",
  ".wl-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:8px 14px;border-radius:10px;",
  "background:var(--wl-bg,#141416);border:1px solid var(--wl-bd,rgba(255,255,255,0.07));color:var(--wl-fg,#A0A0A8);",
  "cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.4px;",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".wl-btn:hover{background:#1A1A1D;border-color:rgba(255,255,255,0.14);color:#EDEDEF}",
  ".wl-grp{flex:1;min-width:0;text-align:left;padding:11px 12px;border-radius:10px;cursor:pointer;",
  "font-family:'IBM Plex Sans',sans-serif;font-size:13px;line-height:1.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;",
  "background:var(--wl-bg);border:1px solid var(--wl-bd);color:var(--wl-fg);",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".wl-grp:hover{background:#1A1A1D;border-color:rgba(255,255,255,0.14)}",
  ".wl-icon{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;flex-shrink:0;padding:0;border-radius:10px;",
  "background:transparent;border:1px solid transparent;color:#6E6E76;cursor:pointer;font-size:14px;line-height:1;",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".wl-icon:hover{background:#1A1A1D;border-color:rgba(255,255,255,0.14);color:#EDEDEF}",
  ".wl-in{width:100%;box-sizing:border-box;min-height:44px;padding:11px 12px;border-radius:10px;",
  "background:#0E0E10;border:1px solid rgba(255,255,255,0.07);color:#EDEDEF;outline:none;",
  "font-size:14px;line-height:1.5;font-family:'IBM Plex Sans',sans-serif;",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".wl-in:hover:not(:focus){border-color:rgba(255,255,255,0.14)}",
  ".wl-in:focus{border-color:rgba(255,255,255,0.14);background:#141416}",
  ".wl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:12px;align-items:start}",
  ".wl-card{border-radius:14px;border:1px solid rgba(255,255,255,0.07);background:#141416;padding:16px;",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".wl-card:hover{background:#1A1A1D;border-color:rgba(255,255,255,0.14)}",
  ".wl-title{margin:0;font-size:14px;font-weight:500;line-height:1.45;overflow:hidden;overflow-wrap:anywhere;",
  "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}",
  ".wl-notes{margin:8px 0 0;font-size:12.5px;line-height:1.5;color:#6E6E76;overflow:hidden;overflow-wrap:anywhere;",
  "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}",
  ".wl-price{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;font-size:13px;font-weight:500;color:#EDEDEF;white-space:nowrap}",
  ".wl-prio{font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.5;letter-spacing:1.6px}",
  ".wl-link{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;border:1px solid rgba(255,255,255,0.07);",
  "background:#0E0E10;color:#A0A0A8;font-size:11px;line-height:1.5;text-decoration:none;white-space:nowrap;",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".wl-link:hover{background:#1A1A1D;border-color:rgba(255,255,255,0.14);color:#EDEDEF}",
  ".wl-check{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;flex-shrink:0;padding:0;",
  "border-radius:7px;font-size:12px;line-height:1;cursor:pointer;",
  "background:var(--wl-bg);border:1.5px solid var(--wl-bd);color:var(--wl-fg);",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".wl-empty{grid-column:1/-1;margin:0;padding:40px 20px;text-align:center;font-size:13px;line-height:1.5;color:#6E6E76}",
  "@media(hover:none){.wl-card:hover{background:#141416;border-color:rgba(255,255,255,0.07)}}",
  "@media(max-width:719px){.wl-grid{grid-template-columns:1fr}.wl-btn{min-height:44px;font-size:12px}",
  ".wl-grp{min-height:44px;font-size:15px}.wl-icon{width:38px;height:38px}.wl-title{font-size:15px}.wl-notes{font-size:13px}}",
].join("");

export default function Wishlist() {
  var navigate = useNavigate();
  var vwS = useState(window.innerWidth);
  var viewportW = vwS[0], setViewportW = vwS[1];
  var isMobile = viewportW < 720;
  var groupsS = useState([]);
  var groups = groupsS[0], setGroups = groupsS[1];
  var itemsS = useState([]);
  var items = itemsS[0], setItems = itemsS[1];
  var activeGroupS = useState(null);
  var activeGroup = activeGroupS[0], setActiveGroup = activeGroupS[1];
  var loadedS = useState(false);
  var loaded = loadedS[0], setLoaded = loadedS[1];
  var draftS = useState({ title: "", url: "", price: "", notes: "", priority: "med", group_id: "" });
  var draft = draftS[0], setDraft = draftS[1];
  var showDoneS = useState(false);
  var showDone = showDoneS[0], setShowDone = showDoneS[1];
  var newGroupS = useState("");
  var newGroupName = newGroupS[0], setNewGroupName = newGroupS[1];
  var saveTimer = useRef(null);
  var groupsRef = useRef([]);
  var itemsRef = useRef([]);
  var skipSaveRef = useRef(false);
  var lastSaveAt = useRef(0);
  var lastDeleteAt = useRef(0);

  function applyWishlistData(gs, list) {
    if (gs[0]) {
      list = list.map(function(i) {
        return i.group_id ? i : Object.assign({}, i, { group_id: gs[0].id });
      });
    }
    setGroups(gs);
    setItems(list);
    setActiveGroup(function(prev) {
      if (prev && gs.some(function(g) { return g.id === prev; })) return prev;
      return gs[0] ? gs[0].id : null;
    });
  }

  var syncFromCloud = useCallback(function() {
    if (Date.now() - lastDeleteAt.current < 20000) return Promise.resolve();
    if (Date.now() - lastSaveAt.current < 8000) return Promise.resolve();
    skipSaveRef.current = true;
    return Promise.all([wishlistStore.pullGroups(), wishlistStore.pullItems()]).then(function(res) {
      applyWishlistData(res[0], res[1]);
      setTimeout(function() { skipSaveRef.current = false; }, 150);
    }).catch(function() {
      skipSaveRef.current = false;
    });
  }, []);

  useCloudSync({
    shouldSkip: function() {
      if (!loaded) return true;
      if (shouldSkipCloudSync()) return true;
      if (Date.now() - lastDeleteAt.current < 20000) return true;
      if (Date.now() - lastSaveAt.current < 8000) return true;
      return false;
    },
    onPull: syncFromCloud,
    onPush: function() {
      skipSaveRef.current = true;
      return persist(groupsRef.current, itemsRef.current).finally(function() {
        lastSaveAt.current = Date.now();
        setTimeout(function() { skipSaveRef.current = false; }, 150);
      });
    },
  });

  function reloadLocalOnly() {
    skipSaveRef.current = true;
    return Promise.all([wishlistStore.loadGroupsLocal(), wishlistStore.loadItemsLocal()]).then(function(res) {
      applyWishlistData(res[0], res[1]);
      setLoaded(true);
      setTimeout(function() { skipSaveRef.current = false; }, 200);
    });
  }

  useEffect(function() {
    var alive = true;
    skipSaveRef.current = true;
    Promise.all([wishlistStore.loadGroupsLocal(), wishlistStore.loadItemsLocal()]).then(function(res) {
      if (!alive) return;
      applyWishlistData(res[0], res[1]);
      setLoaded(true);
      setTimeout(function() { skipSaveRef.current = false; }, 100);
      if (!shouldSkipCloudSync()) syncFromCloud();
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

  async function persist(gs, list) {
    var res = await wishlistStore.persistAll(gs || groupsRef.current, list || itemsRef.current);
    if (res.ok) {
      lastSaveAt.current = Date.now();
      try { sessionStorage.removeItem("sinapse-last-cloud-error"); } catch (e) {}
    }
    return res;
  }

  useEffect(function() {
    function onResize() { setViewportW(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  useEffect(function() { groupsRef.current = groups; }, [groups]);
  useEffect(function() { itemsRef.current = items; }, [items]);

  useEffect(function() {
    if (!loaded || skipSaveRef.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(function() {
      persist();
    }, 400);
    return function() { clearTimeout(saveTimer.current); };
  }, [items, groups, loaded]);

  useEffect(function() {
    if (!loaded) return;
    function flush() { persist(); }
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", function() {
      if (document.visibilityState === "hidden") flush();
    });
    return function() { window.removeEventListener("beforeunload", flush); };
  }, [loaded]);

  var activeG = groups.find(function(g) { return g.id === activeGroup; }) || groups[0];
  var accent = activeG ? activeG.color : ACCENT;

  var visible = useMemo(function() {
    return items.filter(function(i) {
      if (activeG && i.group_id !== activeG.id) return false;
      return showDone ? true : !i.purchased;
    });
  }, [items, showDone, activeG]);

  var totalPending = useMemo(function() {
    return visible.filter(function(i) { return !i.purchased && i.price; }).reduce(function(s, i) { return s + Number(i.price); }, 0);
  }, [visible]);

  function addGroup() {
    if (!newGroupName.trim()) return;
    var g = wishlistStore.newGroup(newGroupName.trim());
    g.color = GROUP_COLORS[groups.length % GROUP_COLORS.length];
    g.order_index = groups.length;
    var next = groups.concat([g]);
    setGroups(next);
    setActiveGroup(g.id);
    setNewGroupName("");
    persist(next, items);
  }

  async function removeGroup(g) {
    if (!g || groups.length <= 1) return;
    if (!window.confirm("Eliminar o grupo \"" + g.name + "\"? Os itens passam para o primeiro grupo restante.")) return;
    var fallback = groups.find(function(x) { return x.id !== g.id; });
    var nextItems = items.map(function(i) {
      return i.group_id === g.id ? Object.assign({}, i, { group_id: fallback ? fallback.id : null, updated: Date.now() }) : i;
    });
    var next = groups.filter(function(x) { return x.id !== g.id; });
    clearTimeout(saveTimer.current);
    skipSaveRef.current = true;
    setItems(nextItems);
    setGroups(next);
    if (activeGroup === g.id) setActiveGroup(next[0] ? next[0].id : null);
    lastDeleteAt.current = Date.now();
    await wishlistStore.deleteGroup(g.id);
    await persist(next, nextItems);
    setTimeout(function() { skipSaveRef.current = false; }, 200);
  }

  async function addItem() {
    if (!draft.title.trim()) return;
    var g = activeG || groups[0];
    if (!g) return;
    var item = wishlistStore.newItem(draft.title.trim(), g.id);
    item.url = draft.url.trim();
    item.price = draft.price ? Number(draft.price) : null;
    item.notes = draft.notes.trim();
    item.priority = draft.priority;
    item.updated = Date.now();
    var nextItems = [item].concat(items);
    setItems(nextItems);
    setDraft({ title: "", url: "", price: "", notes: "", priority: "med", group_id: g.id });
    await persist(groups, nextItems);
  }

  function togglePurchased(id) {
    var next = items.map(function(i) {
      return i.id === id ? Object.assign({}, i, { purchased: !i.purchased, updated: Date.now() }) : i;
    });
    setItems(next);
    persist(groups, next);
  }

  async function removeItem(id) {
    clearTimeout(saveTimer.current);
    skipSaveRef.current = true;
    lastDeleteAt.current = Date.now();
    var next = itemsRef.current.filter(function(i) { return i.id !== id; });
    itemsRef.current = next;
    setItems(next);
    await wishlistStore.deleteItem(id);
    await persist(groupsRef.current, next);
    setTimeout(function() { skipSaveRef.current = false; }, 200);
  }

  return (
    <div style={{ minHeight: "100vh", background: pageBg(), color: pageText(), fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <style>{MODULE_ENTRY_CSS}</style>
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "#0A0A0B", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: isMobile ? "12px" : "14px 20px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" onClick={function() { navigate("/"); }} style={backBtn()}>← Hub</button>
            <h1 className="mod-h1" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: isMobile ? 20 : 16, color: accent, margin: 0 }}>Wishlist</h1>
          </div>
          <label style={{ fontSize: isMobile ? 14 : 12, color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={showDone} onChange={function(e) { setShowDone(e.target.checked); }} />
            Mostrar comprados
          </label>
        </div>
      </header>

      <div className="mod-main" data-scrollable style={{ maxWidth: 1000, margin: "0 auto", padding: isMobile ? "14px 12px 80px" : "22px 20px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "220px minmax(0,1fr)", gap: isMobile ? 14 : 22 }}>
        {!loaded ? <div style={{ gridColumn: "1 / -1" }}><PageLoader accent={accent} lines={6} /></div> : null}
        {loaded && <aside style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16, background: "#141416", height: "fit-content", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
          <p className="mod-lbl" style={{ margin: "0 0 10px", fontSize: isMobile ? 11 : 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.28)", letterSpacing: 1 }}>GRUPOS</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {groups.map(function(g) {
              var on = activeG && g.id === activeG.id;
              return (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
                  <button type="button" onClick={function() { setActiveGroup(g.id); }} style={{
                    flex: 1, textAlign: "left", padding: isMobile ? "12px 14px" : "10px 12px", borderRadius: 12,
                    border: "1px solid " + (on ? g.color + "45" : "rgba(255,255,255,0.06)"),
                    background: on ? g.color + "12" : "transparent", color: on ? g.color : "rgba(255,255,255,0.55)",
                    cursor: "pointer", fontFamily: "'IBM Plex Sans',sans-serif", fontSize: isMobile ? 15 : 13,
                  }}>{g.name}</button>
                  {groups.length > 1 && <button type="button" onClick={function(e) { e.stopPropagation(); removeGroup(g); }} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 14 }} aria-label="Eliminar grupo">×</button>}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <input value={newGroupName} onChange={function(e) { setNewGroupName(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") addGroup(); }} placeholder="Novo grupo..." style={{ flex: 1, minWidth: 0, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", padding: "10px 12px", outline: "none", fontSize: isMobile ? 16 : 13 }} />
            <button type="button" onClick={addGroup} style={{ background: accent + "14", border: "1px solid " + accent + "35", borderRadius: 10, color: accent, padding: "0 12px", cursor: "pointer" }}>+</button>
          </div>
        </aside>}

        {loaded && <main style={{ minWidth: 0 }}>
          <p className="mod-stat" style={{ fontSize: isMobile ? 14 : 12, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>
            {activeG ? activeG.name : "—"} · {visible.length} item(ns) · ~{totalPending.toFixed(2)} €
          </p>

          <div style={{ display: "grid", gap: 10, marginBottom: 20, padding: 18, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "#141416", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
            <input value={draft.title} onChange={function(e) { setDraft(Object.assign({}, draft, { title: e.target.value })); }} placeholder="O que queres?" style={inputStyle()} onKeyDown={function(e) { if (e.key === "Enter") addItem(); }} />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 120px", gap: 10 }}>
              <input value={draft.url} onChange={function(e) { setDraft(Object.assign({}, draft, { url: e.target.value })); }} placeholder="Link (opcional)" style={inputStyle()} />
              <input value={draft.price} onChange={function(e) { setDraft(Object.assign({}, draft, { price: e.target.value })); }} placeholder="Preço €" type="number" min="0" step="0.01" style={inputStyle()} />
            </div>
            <textarea value={draft.notes} onChange={function(e) { setDraft(Object.assign({}, draft, { notes: e.target.value })); }} placeholder="Notas" rows={2} style={Object.assign({}, inputStyle(), { resize: "vertical" })} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {PRIORITIES.map(function(p) {
                var on = draft.priority === p.id;
                return <button key={p.id} type="button" onClick={function() { setDraft(Object.assign({}, draft, { priority: p.id })); }} style={{ border: "1px solid " + (on ? p.color : "rgba(255,255,255,0.1)"), background: on ? p.color + "18" : "transparent", color: on ? p.color : "rgba(255,255,255,0.4)", borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontSize: 11 }}>{p.label}</button>;
              })}
              <button type="button" onClick={addItem} style={{ marginLeft: "auto", background: "#EDEDEF", border: "none", color: "#09090B", borderRadius: 11, padding: "9px 16px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 500 }}>+ Adicionar</button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visible.length === 0 ? (
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.28)", padding: 40 }}>Sem itens neste grupo.</p>
            ) : visible.map(function(item, idx) {
              var pr = PRIORITIES.find(function(p) { return p.id === item.priority; }) || PRIORITIES[1];
              return (
                <article key={item.id} className="wl-card" style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "#141416", padding: "15px 16px", opacity: item.purchased ? 0.55 : 1, animation: "modIn .4s var(--ease) " + (idx * 0.04) + "s both" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <button type="button" onClick={function() { togglePurchased(item.id); }} style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: "2px solid " + (item.purchased ? accent : "rgba(255,255,255,0.2)"), background: item.purchased ? accent + "25" : "transparent", color: item.purchased ? accent : "transparent", cursor: "pointer" }}>{item.purchased ? "✓" : ""}</button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.4, textDecoration: item.purchased ? "line-through" : "none", color: item.purchased ? "#6E6E76" : "#EDEDEF" }}>{item.title}</p>
                      {item.notes && <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.5, color: "#A0A0A8" }}>{item.notes}</p>}
                      <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: pr.color }}>{pr.label.toUpperCase()}</span>
                        {item.price != null && <span style={{ fontSize: 11, color: accent }}>{Number(item.price).toFixed(2)} €</span>}
                        {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#E6E6E9" }}>Abrir link</a>}
                      </div>
                    </div>
                    <button type="button" onClick={function() { removeItem(item.id); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 16 }} aria-label="Eliminar">×</button>
                  </div>
                </article>
              );
            })}
          </div>
        </main>}
      </div>
    </div>
  );
}

function backBtn() {
  return { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#A0A0A8", padding: "8px 13px", cursor: "pointer", fontFamily: "inherit" };
}
function inputStyle() {
  return { width: "100%", background: "#0E0E10", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 11, color: "#EDEDEF", padding: "11px 13px", outline: "none", fontSize: 14, fontFamily: "'IBM Plex Sans',sans-serif", boxSizing: "border-box" };
}
