import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as wishlistStore from "../lib/wishlistStore";
import { PageLoader } from "../components/PageLoader";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { pageBg, pageText } from "../lib/ThemeContext";
import { useCloudSync } from "../lib/useCloudSync";
import { RECOVERY_EVENT, shouldSkipCloudSync } from "../lib/recoveryFlags";
import { moduleColor, moduleGlow, MODULE_GLOW_CSS, PALETTE } from "../lib/theme";

var ACCENT = moduleColor("wishlist");
var GROUP_COLORS = PALETTE;
var PRIORITIES = [
  { id: "low", label: "Baixa", color: "rgba(255,255,255,0.35)" },
  { id: "med", label: "Média", color: "#C4A57C" },
  { id: "high", label: "Alta", color: "#E6E6E9" },
];

var WL_CSS = [
  "@keyframes wlIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
  ".wl-page{min-height:100vh;background:var(--page-bg);color:var(--page-text);font-family:'IBM Plex Sans',sans-serif;position:relative;overflow-x:hidden}",
  ".wl-glow{position:absolute;width:min(520px,70vw);height:min(520px,70vw);border-radius:50%;pointer-events:none;filter:blur(80px);opacity:.55;transition:background 1s var(--ease)}",
  ".wl-head{position:sticky;top:0;z-index:20;background:rgba(7,7,8,.88);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,.06)}",
  ".wl-head-in{max-width:1040px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}",
  ".wl-back{background:none;border:none;border-bottom:1px solid rgba(255,255,255,.16);color:#A0A0A8;padding:8px 2px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.3px}",
  ".wl-back:hover{color:#EDEDEF;border-bottom-color:#EDEDEF}",
  ".wl-h1{margin:0;font-family:'JetBrains Mono',monospace;font-weight:400;letter-spacing:-.03em}",
  ".wl-toggle{display:flex;align-items:center;gap:10px;font-size:12px;color:#6E6E76;cursor:pointer;user-select:none}",
  ".wl-toggle input{accent-color:#EDEDEF;width:15px;height:15px}",
  ".wl-shell{max-width:1040px;margin:0 auto;padding:28px 20px 88px;display:grid;grid-template-columns:minmax(0,200px) minmax(0,1fr);gap:40px;align-items:start}",
  ".wl-rail{position:sticky;top:88px;display:flex;flex-direction:column;gap:2px}",
  ".wl-rail-lbl{margin:0 0 14px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#6E6E76}",
  ".wl-grp-wrap{display:flex;align-items:center;gap:4px;width:100%}",
  ".wl-grp{flex:1;min-width:0;display:flex;align-items:center;gap:10px;text-align:left;padding:10px 0 10px 2px;cursor:pointer;",
  "font-family:'IBM Plex Sans',sans-serif;font-size:13px;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;",
  "background:transparent;border:none;color:#6E6E76;transition:color var(--dur) var(--ease),padding-left var(--dur) var(--ease)}",
  ".wl-grp:hover{color:#A0A0A8;padding-left:6px}",
  ".wl-grp.is-on{color:var(--gc);padding-left:8px}",
  ".wl-grp-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;opacity:.55;transition:opacity var(--dur) var(--ease),transform var(--dur) var(--ease)}",
  ".wl-grp.is-on .wl-grp-dot{opacity:1;transform:scale(1.15)}",
  ".wl-grp-x{width:24px;height:24px;border:none;background:transparent;color:#6E6E76;cursor:pointer;font-size:15px;line-height:1;opacity:0;transition:opacity var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".wl-grp-wrap:hover .wl-grp-x{opacity:1}",
  ".wl-grp-x:hover{color:#C08C8C}",
  ".wl-new-grp{display:flex;align-items:flex-end;gap:10px;margin-top:18px;padding-top:16px;border-top:1px solid rgba(255,255,255,.06)}",
  ".wl-in{width:100%;box-sizing:border-box;min-height:42px;padding:10px 0;background:transparent;border:none;",
  "border-bottom:1px solid rgba(255,255,255,.12);color:#EDEDEF;outline:none;font-size:14px;line-height:1.5;font-family:'IBM Plex Sans',sans-serif;",
  "transition:border-color var(--dur) var(--ease)}",
  ".wl-in:focus{border-bottom-color:rgba(255,255,255,.45)}",
  ".wl-in::placeholder{color:#6E6E76}",
  ".wl-in--area{min-height:72px;resize:vertical;line-height:1.55}",
  ".wl-add-grp{background:none;border:none;border-bottom:1px solid currentColor;color:var(--gc);padding:10px 2px;cursor:pointer;font-size:18px;line-height:1}",
  ".wl-main{min-width:0}",
  ".wl-hero{margin:0 0 32px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,.08)}",
  ".wl-hero-kicker{margin:0 0 8px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#6E6E76}",
  ".wl-hero-row{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap}",
  ".wl-hero-name{margin:0;font-family:'JetBrains Mono',monospace;font-size:clamp(28px,5vw,42px);font-weight:300;letter-spacing:-.04em;line-height:1;color:#EDEDEF}",
  ".wl-hero-total{margin:0;font-family:'JetBrains Mono',monospace;font-size:clamp(22px,3.5vw,32px);font-weight:300;letter-spacing:-.03em;color:var(--gc);font-variant-numeric:tabular-nums}",
  ".wl-hero-meta{margin:10px 0 0;font-size:13px;color:#6E6E76}",
  ".wl-compose{margin:0 0 36px;padding-bottom:28px;border-bottom:1px solid rgba(255,255,255,.06)}",
  ".wl-compose-lbl{margin:0 0 18px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#6E6E76}",
  ".wl-compose-grid{display:grid;gap:14px}",
  ".wl-compose-row{display:grid;grid-template-columns:1fr 120px;gap:16px}",
  ".wl-prio-row{display:flex;gap:16px;flex-wrap:wrap;align-items:center;margin-top:4px}",
  ".wl-prio{background:none;border:none;border-bottom:1px solid transparent;color:#6E6E76;padding:6px 0;cursor:pointer;",
  "font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.4px;text-transform:uppercase;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".wl-prio:hover{color:#A0A0A8}",
  ".wl-prio.is-on{color:var(--pc);border-bottom-color:var(--pc)}",
  ".wl-submit{margin-left:auto;background:none;border:none;border-bottom:1px solid #EDEDEF;color:#EDEDEF;padding:8px 2px;",
  "cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.5px;white-space:nowrap}",
  ".wl-submit:hover{opacity:.65}",
  ".wl-list{display:flex;flex-direction:column;gap:0}",
  ".wl-item{position:relative;display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:flex-start;padding:22px 0 22px 18px;",
  "border:none;border-bottom:1px solid rgba(255,255,255,.07);background:transparent;animation:wlIn var(--dur-slow) var(--ease) both}",
  ".wl-item::before{content:'';position:absolute;left:0;top:18px;bottom:18px;width:2px;border-radius:999px;background:var(--ic);opacity:.65;transition:opacity var(--dur) var(--ease),height var(--dur) var(--ease)}",
  ".wl-item:hover::before{opacity:1}",
  ".wl-item.is-done{opacity:.48}",
  ".wl-check{width:20px;height:20px;border-radius:50%;flex-shrink:0;margin-top:2px;border:1.5px solid rgba(255,255,255,.22);",
  "background:transparent;color:transparent;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center;",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".wl-check:hover{border-color:rgba(255,255,255,.5)}",
  ".wl-check.is-on{background:var(--ic);border-color:var(--ic);color:#070708}",
  ".wl-title{margin:0;font-size:clamp(16px,2.2vw,19px);font-weight:400;line-height:1.35;letter-spacing:-.02em;color:#EDEDEF;overflow-wrap:anywhere}",
  ".wl-item.is-done .wl-title{text-decoration:line-through;color:#6E6E76}",
  ".wl-notes{margin:7px 0 0;font-size:13px;line-height:1.55;color:#A0A0A8;overflow-wrap:anywhere}",
  ".wl-meta{display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-top:10px}",
  ".wl-prio-tag{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:1.4px;text-transform:uppercase}",
  ".wl-price{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;font-size:13px;color:#EDEDEF}",
  ".wl-link{color:#A0A0A8;font-size:11px;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.16);padding-bottom:1px;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".wl-link:hover{color:#EDEDEF;border-bottom-color:#EDEDEF}",
  ".wl-del{background:none;border:none;color:#6E6E76;cursor:pointer;font-size:18px;line-height:1;padding:4px;opacity:0;transition:opacity var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".wl-item:hover .wl-del,.wl-item:focus-within .wl-del{opacity:1}",
  ".wl-del:hover{color:#C08C8C}",
  ".wl-empty{margin:0;padding:48px 0;text-align:left;font-size:14px;line-height:1.6;color:#6E6E76;font-family:'JetBrains Mono',monospace;font-weight:300}",
  "@media(max-width:719px){",
  ".wl-head-in{padding:12px}.wl-shell{grid-template-columns:1fr;gap:24px;padding:20px 16px 88px}",
  ".wl-rail{position:static;flex-direction:row;flex-wrap:wrap;gap:8px 16px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.06)}",
  ".wl-rail-lbl{width:100%}.wl-grp-wrap{width:auto}.wl-grp{padding:8px 0}.wl-new-grp{width:100%}",
  ".wl-compose-row{grid-template-columns:1fr}.wl-item{padding-left:14px}.wl-del{opacity:1!important;min-width:44px;min-height:44px;font-size:22px}",
  ".wl-grp-x{opacity:1!important;min-width:40px;min-height:40px}",
  ".wl-hero-name{font-size:32px}.wl-in,.wl-h1{font-size:16px!important}}",
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
    tables: ["wishlist_items", "wishlist_groups"],
    intervalMs: 12000,
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
    <div className="wl-page mod-main" style={{ color: pageText(), "--gc": accent }}>
      <style>{MODULE_ENTRY_CSS + WL_CSS}</style>
      <div className="wl-glow" style={{ top: -120, right: "5%", background: accent + "18" }} aria-hidden="true" />

      <header className="wl-head">
        <div className="wl-head-in">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button type="button" className="wl-back" onClick={function() { navigate("/"); }}>← Hub</button>
            <h1 className="wl-h1 mod-h1" style={{ fontSize: isMobile ? 20 : 15, color: accent }}>Wishlist</h1>
          </div>
          <label className="wl-toggle">
            <input type="checkbox" checked={showDone} onChange={function(e) { setShowDone(e.target.checked); }} />
            Mostrar comprados
          </label>
        </div>
      </header>

      {!loaded ? (
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 20px" }}>
          <PageLoader accent={accent} lines={6} />
        </div>
      ) : (
        <div className="wl-shell">
          <aside className="wl-rail">
            <p className="wl-rail-lbl">Grupos</p>
            {groups.map(function(g) {
              var on = activeG && g.id === activeG.id;
              return (
                <div key={g.id} className="wl-grp-wrap">
                  <button
                    type="button"
                    className={"wl-grp" + (on ? " is-on" : "")}
                    style={{ "--gc": g.color }}
                    onClick={function() { setActiveGroup(g.id); }}>
                    <span className="wl-grp-dot" style={{ background: g.color }} />
                    {g.name}
                  </button>
                  {groups.length > 1 && (
                    <button type="button" className="wl-grp-x" onClick={function(e) { e.stopPropagation(); removeGroup(g); }} aria-label="Eliminar grupo">×</button>
                  )}
                </div>
              );
            })}
            <div className="wl-new-grp">
              <input
                className="wl-in"
                value={newGroupName}
                onChange={function(e) { setNewGroupName(e.target.value); }}
                onKeyDown={function(e) { if (e.key === "Enter") addGroup(); }}
                placeholder="Novo grupo…"
              />
              <button type="button" className="wl-add-grp" style={{ "--gc": accent }} onClick={addGroup} aria-label="Criar grupo">+</button>
            </div>
          </aside>

          <main className="wl-main">
            <section className="wl-hero">
              <p className="wl-hero-kicker">A desejar</p>
              <div className="wl-hero-row">
                <h2 className="wl-hero-name">{activeG ? activeG.name : "—"}</h2>
                <p className="wl-hero-total" style={{ "--gc": accent }}>{totalPending.toFixed(2)} €</p>
              </div>
              <p className="wl-hero-meta">{visible.length} {visible.length === 1 ? "item" : "itens"} · estimativa pendente</p>
            </section>

            <section className="wl-compose">
              <p className="wl-compose-lbl">Adicionar</p>
              <div className="wl-compose-grid">
                <input
                  className="wl-in"
                  value={draft.title}
                  onChange={function(e) { setDraft(Object.assign({}, draft, { title: e.target.value })); }}
                  placeholder="O que queres?"
                  onKeyDown={function(e) { if (e.key === "Enter") addItem(); }}
                />
                <div className="wl-compose-row">
                  <input
                    className="wl-in"
                    value={draft.url}
                    onChange={function(e) { setDraft(Object.assign({}, draft, { url: e.target.value })); }}
                    placeholder="Link (opcional)"
                  />
                  <input
                    className="wl-in"
                    value={draft.price}
                    onChange={function(e) { setDraft(Object.assign({}, draft, { price: e.target.value })); }}
                    placeholder="Preço €"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </div>
                <textarea
                  className="wl-in wl-in--area"
                  value={draft.notes}
                  onChange={function(e) { setDraft(Object.assign({}, draft, { notes: e.target.value })); }}
                  placeholder="Notas"
                  rows={2}
                />
                <div className="wl-prio-row">
                  {PRIORITIES.map(function(p) {
                    var on = draft.priority === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={"wl-prio" + (on ? " is-on" : "")}
                        style={{ "--pc": p.color }}
                        onClick={function() { setDraft(Object.assign({}, draft, { priority: p.id })); }}>
                        {p.label}
                      </button>
                    );
                  })}
                  <button type="button" className="wl-submit" onClick={addItem}>+ Adicionar →</button>
                </div>
              </div>
            </section>

            <div className="wl-list">
              {visible.length === 0 ? (
                <p className="wl-empty">Nada por aqui — adiciona o primeiro desejo.</p>
              ) : visible.map(function(item, idx) {
                var pr = PRIORITIES.find(function(p) { return p.id === item.priority; }) || PRIORITIES[1];
                var ic = item.purchased ? "#6E6E76" : (activeG ? activeG.color : accent);
                return (
                  <article
                    key={item.id}
                    className={"wl-item" + (item.purchased ? " is-done" : "")}
                    style={{ "--ic": ic, animationDelay: (idx * 0.04) + "s" }}>
                    <button
                      type="button"
                      className={"wl-check" + (item.purchased ? " is-on" : "")}
                      style={{ "--ic": ic }}
                      onClick={function() { togglePurchased(item.id); }}
                      aria-label={item.purchased ? "Marcar como pendente" : "Marcar como comprado"}>
                      {item.purchased ? "✓" : ""}
                    </button>
                    <div style={{ minWidth: 0 }}>
                      <p className="wl-title">{item.title}</p>
                      {item.notes && <p className="wl-notes">{item.notes}</p>}
                      <div className="wl-meta">
                        <span className="wl-prio-tag" style={{ color: pr.color }}>{pr.label}</span>
                        {item.price != null && <span className="wl-price">{Number(item.price).toFixed(2)} €</span>}
                        {item.url && (
                          <a className="wl-link" href={item.url} target="_blank" rel="noopener noreferrer">Abrir link</a>
                        )}
                      </div>
                    </div>
                    <button type="button" className="wl-del" onClick={function() { removeItem(item.id); }} aria-label="Eliminar">×</button>
                  </article>
                );
              })}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
