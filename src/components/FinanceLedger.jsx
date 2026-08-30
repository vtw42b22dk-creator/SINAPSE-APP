import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { alpha } from "../lib/theme";

var SAVE_DEBOUNCE_MS = 1800;

var FL_CSS = [
  ".fl-lbl{margin:0;font-family:'JetBrains Mono',monospace;font-size:10px;line-height:1.5;letter-spacing:1.6px;text-transform:uppercase;color:#6E6E76}",
  ".fl-mono{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums}",
  ".fl-num{font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}",
  ".fl-card{border:none;background:transparent}",
  ".fl-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:8px 2px;",
  "background:transparent;border:none;border-bottom:1px solid currentColor;color:var(--fl-fg,#A0A0A8);",
  "cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.4px;",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".fl-btn:hover:not(:disabled){color:#EDEDEF}",
  ".fl-btn:disabled{cursor:not-allowed}",
  ".fl-nav{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;padding:0;",
  "background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,0.16);color:#A0A0A8;cursor:pointer;font-size:15px;",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".fl-nav:hover{background:#1A1A1D;border-color:rgba(255,255,255,0.14);color:#EDEDEF}",
  ".fl-icon{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;border-radius:10px;",
  "background:transparent;border:1px solid transparent;color:#6E6E76;cursor:pointer;font-size:14px;line-height:1;",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".fl-icon:hover{background:#1A1A1D;border-color:rgba(255,255,255,0.14);color:#EDEDEF}",
  ".fl-in{width:100%;box-sizing:border-box;min-height:44px;padding:11px 0;",
  "background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,0.12);color:#EDEDEF;outline:none;",
  "font-size:14px;line-height:1.5;font-family:'IBM Plex Sans',sans-serif;",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".fl-in:hover:not(:focus){border-bottom-color:rgba(255,255,255,0.28)}",
  ".fl-in:focus{border-bottom-color:rgba(255,255,255,0.4)}",
  ".fl-chip{display:inline-flex;align-items:center;padding:0;border:none;",
  "background:transparent;color:#A0A0A8;font-size:11px;line-height:1.5;white-space:nowrap}",
  ".fl-pick{min-height:34px;padding:7px 12px;border-radius:10px;font-size:12px;line-height:1.5;cursor:pointer;",
  "background:var(--fl-bg);border:1px solid var(--fl-bd);color:var(--fl-fg);",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".fl-pick:hover:not(:disabled){background:#1A1A1D;border-color:rgba(255,255,255,0.14)}",
  ".fl-pick:disabled{cursor:not-allowed}",
  ".fl-list{border:none;background:transparent;overflow:hidden}",
  ".fl-row{padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.07);transition:opacity var(--dur) var(--ease)}",
  ".fl-row:last-child{border-bottom:none}",
  ".fl-row:hover{opacity:.85}",
  ".fl-line{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06)}",
  ".fl-line:last-child{border-bottom:none}",
  ".fl-empty{margin:0;padding:40px 20px;text-align:center;font-size:13px;line-height:1.5;color:#6E6E76}",
  "@media(hover:none){.fl-row:hover{background:transparent}}",
  "@media(max-width:719px){.fl-btn{min-height:44px;font-size:12px}.fl-nav{width:44px;height:44px}.fl-icon{width:44px;height:44px;font-size:18px}",
  ".fl-pick{min-height:44px;font-size:13px}}",
].join("");

function monthKeyFromDate(d) {
  return d.getFullYear() + "-" + (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1);
}

function defaultDayForMonth(store, monthKey) {
  var current = monthKeyFromDate(new Date());
  if (monthKey === current) return store.todayKey();
  return monthKey + "-01";
}

export default function FinanceLedger(props) {
  var store = props.store;
  var isMobile = props.isMobile;
  var label = props.label || "Registo";
  var kind = props.kind === "income" ? "income" : "expense";
  var categoriesS = useState([]);
  var categories = categoriesS[0], setCategories = categoriesS[1];
  var rowsS = useState([]);
  var rows = rowsS[0], setRows = rowsS[1];
  var hydratedS = useState(false);
  var isHydrated = hydratedS[0], setIsHydrated = hydratedS[1];
  var sessionWarnS = useState("");
  var sessionWarn = sessionWarnS[0], setSessionWarn = sessionWarnS[1];
  var isHydratedRef = useRef(false);
  var internalMonthS = useState(monthKeyFromDate(new Date()));
  var month = props.month != null ? props.month : internalMonthS[0];
  var setMonth = props.onMonthChange || internalMonthS[1];
  var onDataChange = props.onDataChange || function() {};
  var draftS = useState({ title: "", amount: "", categories: [], day: defaultDayForMonth(store, month), notes: "" });
  var draft = draftS[0], setDraft = draftS[1];
  var manageCatS = useState(false);
  var manageCat = manageCatS[0], setManageCat = manageCatS[1];
  var catDraftS = useState({ id: null, name: "" });
  var catDraft = catDraftS[0], setCatDraft = catDraftS[1];
  var saveCatTimer = useRef(null);
  var saveRowsTimer = useRef(null);
  var skipSaveRef = useRef(false);
  var lastSaveAt = useRef(0);
  var lastDeleteAt = useRef(0);
  var categoriesRef = useRef([]);
  var rowsRef = useRef([]);
  var pullCategories = store.pullCategories || store.loadCategories;
  var pullRows = store.pullRows || store.loadRows;

  function applyDraftCategories(cats) {
    var first = cats && cats[0];
    if (first) {
      setDraft(function(d) {
        return Object.assign({}, d, { categories: d.categories.length ? d.categories : [first.name] });
      });
    }
  }

  var syncFromCloud = useCallback(function() {
    if (Date.now() - lastDeleteAt.current < 20000) return Promise.resolve();
    if (Date.now() - lastSaveAt.current < 8000) return Promise.resolve();
    return Promise.all([pullCategories(), pullRows()]).then(function(res) {
      if (skipSaveRef.current) return;
      skipSaveRef.current = true;
      setCategories(res[0]);
      setRows(res[1]);
      setTimeout(function() { skipSaveRef.current = false; }, 150);
      onDataChange();
    }).catch(function() {});
  }, [store]);

  function pushToCloud() {
    skipSaveRef.current = true;
    return Promise.all([
      saveCatsNow(categoriesRef.current),
      saveRowsNow(rowsRef.current),
    ]).finally(function() {
      lastSaveAt.current = Date.now();
      setTimeout(function() { skipSaveRef.current = false; }, 150);
    });
  }

  function finishHydration(res) {
    if (res) {
      setCategories(res[0]);
      setRows(res[1]);
      applyDraftCategories(res[0]);
    }
    isHydratedRef.current = true;
    setIsHydrated(true);
    setTimeout(function() { skipSaveRef.current = false; }, 200);
    onDataChange();
  }

  useEffect(function() {
    var alive = true;
    skipSaveRef.current = true;
    isHydratedRef.current = false;
    setIsHydrated(false);
    Promise.all([store.loadCategories(), store.loadRows()])
      .then(function(res) {
        if (!alive) return;
        setCategories(res[0]);
        setRows(res[1]);
        applyDraftCategories(res[0]);
        return Promise.all([pullCategories(), pullRows()]);
      })
      .then(function(sync) {
        if (!alive) return;
        finishHydration(sync);
      })
      .catch(function() {
        if (!alive) return;
        finishHydration(null);
      });
    return function() { alive = false; };
  }, [store, pullCategories, pullRows]);

  useEffect(function() {
    if (!isHydrated) return;
    function onVis() {
      if (!isHydratedRef.current) return;
      if (document.visibilityState === "hidden") pushToCloud();
      else if (Date.now() - lastDeleteAt.current >= 20000 && Date.now() - lastSaveAt.current >= 8000) syncFromCloud();
    }
    document.addEventListener("visibilitychange", onVis);
    return function() { document.removeEventListener("visibilitychange", onVis); };
  }, [isHydrated, syncFromCloud]);

  useEffect(function() { categoriesRef.current = categories; }, [categories]);
  useEffect(function() { rowsRef.current = rows; }, [rows]);

  // Ao mudar de mês, a data do novo registo passa a apontar para esse mês.
  useEffect(function() {
    setDraft(function(d) { return Object.assign({}, d, { day: defaultDayForMonth(store, month) }); });
  }, [month, store]);

  function reportSave(res) {
    if (!res) return;
    if (res.emergency) {
      setSessionWarn("Sessão expirada — dados guardados neste dispositivo. Inicia sessão no Hub.");
      return;
    }
    if (res.ok && res.cloud) {
      lastSaveAt.current = Date.now();
      setSessionWarn("");
    } else if (res.error) {
      setSessionWarn("Nuvem: " + res.error);
    }
  }

  // Gravação reativa (debounce/sync): respeita skipSaveRef.
  function persistCats(cats) {
    if (!isHydratedRef.current || skipSaveRef.current) return Promise.resolve();
    return store.saveCategories(cats || categoriesRef.current).then(reportSave);
  }
  function persistRows(rws) {
    if (!isHydratedRef.current || skipSaveRef.current) return Promise.resolve();
    return store.saveRows(rws || rowsRef.current).then(reportSave);
  }
  // Gravação explícita (adicionar/remover/sair): grava sempre.
  function saveCatsNow(cats) {
    if (!isHydratedRef.current) return Promise.resolve();
    return store.saveCategories(cats || categoriesRef.current).then(reportSave);
  }
  function saveRowsNow(rws) {
    if (!isHydratedRef.current) return Promise.resolve();
    return store.saveRows(rws || rowsRef.current).then(reportSave);
  }

  useEffect(function() {
    if (!isHydrated || skipSaveRef.current) return;
    clearTimeout(saveCatTimer.current);
    saveCatTimer.current = setTimeout(function() { persistCats(); }, SAVE_DEBOUNCE_MS);
    return function() { clearTimeout(saveCatTimer.current); };
  }, [categories, isHydrated, store]);

  useEffect(function() {
    if (!isHydrated || skipSaveRef.current) return;
    clearTimeout(saveRowsTimer.current);
    saveRowsTimer.current = setTimeout(function() { persistRows(); }, SAVE_DEBOUNCE_MS);
    return function() { clearTimeout(saveRowsTimer.current); };
  }, [rows, isHydrated, store]);

  var categoryNames = useMemo(function() {
    return categories.map(function(c) { return c.name; });
  }, [categories]);

  var monthItems = useMemo(function() {
    return rows.filter(function(e) { return e.day && e.day.indexOf(month) === 0; });
  }, [rows, month]);

  var total = useMemo(function() { return store.monthTotal(rows, month); }, [rows, month, store]);

  var byCategory = useMemo(function() {
    var map = {};
    monthItems.forEach(function(e) {
      (e.categories || [e.category || "Outro"]).forEach(function(c) {
        map[c] = (map[c] || 0) + Number(e.amount || 0) / (e.categories && e.categories.length > 1 ? e.categories.length : 1);
      });
    });
    return Object.keys(map).map(function(k) { return { name: k, total: map[k] }; }).sort(function(a, b) { return b.total - a.total; });
  }, [monthItems]);

  function toggleCategory(name) {
    setDraft(function(d) {
      var cur = d.categories || [];
      if (cur.indexOf(name) >= 0) {
        return Object.assign({}, d, { categories: cur.filter(function(c) { return c !== name; }) });
      }
      if (cur.length >= 2) return d;
      return Object.assign({}, d, { categories: cur.concat([name]) });
    });
  }

  function addRow() {
    if (!isHydrated) return;
    if (!draft.title.trim() || !draft.amount) return;
    var cats = (draft.categories || []).slice(0, 2);
    if (!cats.length && categoryNames[0]) cats = [categoryNames[0]];
    var row = store.newRow(draft.title.trim(), Number(draft.amount), cats, draft.day);
    clearTimeout(saveRowsTimer.current);
    skipSaveRef.current = true;
    var next = rowsRef.current.concat([row]);
    rowsRef.current = next;
    setRows(next);
    saveRowsNow(next).finally(function() {
      setTimeout(function() { skipSaveRef.current = false; }, 80);
      onDataChange();
    });
    setDraft({ title: "", amount: "", categories: cats.slice(0, 1), day: defaultDayForMonth(store, month), notes: "" });
  }

  async function removeRow(id) {
    clearTimeout(saveRowsTimer.current);
    skipSaveRef.current = true;
    lastDeleteAt.current = Date.now();
    lastSaveAt.current = Date.now();
    var next = rowsRef.current.filter(function(e) { return e.id !== id; });
    rowsRef.current = next;
    setRows(next);
    if (store.deleteRow) await store.deleteRow(id);
    await saveRowsNow(next);
    setTimeout(function() { skipSaveRef.current = false; }, 200);
    onDataChange();
  }

  function shiftMonth(delta) {
    var p = month.split("-");
    var d = new Date(+p[0], +p[1] - 1 + delta, 1);
    setMonth(monthKeyFromDate(d));
  }

  function saveCategory() {
    if (!isHydrated) return;
    if (!catDraft.name.trim()) return;
    skipSaveRef.current = true;
    if (catDraft.id) {
      var old = categoriesRef.current.find(function(c) { return c.id === catDraft.id; });
      var oldName = old ? old.name : "";
      var newName = catDraft.name.trim();
      var nextCats = categoriesRef.current.map(function(c) { return c.id === catDraft.id ? Object.assign({}, c, { name: newName }) : c; });
      categoriesRef.current = nextCats;
      setCategories(nextCats);
      saveCatsNow(nextCats);
      if (oldName && oldName !== newName) {
        var nextRows = rowsRef.current.map(function(e) {
          return Object.assign({}, e, {
            categories: (e.categories || []).map(function(c) { return c === oldName ? newName : c; }),
            category: e.category === oldName ? newName : e.category,
          });
        });
        rowsRef.current = nextRows;
        setRows(nextRows);
        saveRowsNow(nextRows);
      }
    } else {
      var nc = store.newCategory(catDraft.name.trim());
      nc.order_index = categoriesRef.current.length;
      var added = categoriesRef.current.concat([nc]);
      categoriesRef.current = added;
      setCategories(added);
      saveCatsNow(added);
    }
    setCatDraft({ id: null, name: "" });
    setTimeout(function() { skipSaveRef.current = false; }, 80);
  }

  async function removeCategory(cat) {
    if (!cat || categoriesRef.current.length <= 1) return;
    if (!window.confirm("Apagar a categoria \"" + cat.name + "\"?")) return;
    var fallback = categoriesRef.current.find(function(c) { return c.name === "Outro" && c.id !== cat.id; })
      || categoriesRef.current.find(function(c) { return c.id !== cat.id; });
    var fbName = fallback ? fallback.name : "Outro";
    var nextCats = categoriesRef.current.filter(function(c) { return c.id !== cat.id; });
    var nextRows = rowsRef.current.map(function(e) {
      return Object.assign({}, e, {
        categories: (e.categories || [e.category]).map(function(c) { return c === cat.name ? fbName : c; }).slice(0, 2),
        category: e.category === cat.name ? fbName : e.category,
      });
    });
    clearTimeout(saveCatTimer.current);
    clearTimeout(saveRowsTimer.current);
    skipSaveRef.current = true;
    lastDeleteAt.current = Date.now();
    categoriesRef.current = nextCats;
    rowsRef.current = nextRows;
    setCategories(nextCats);
    setRows(nextRows);
    if (catDraft.id === cat.id) setCatDraft({ id: null, name: "" });
    if (store.deleteCategory) await store.deleteCategory(cat.id);
    await Promise.all([saveCatsNow(nextCats), saveRowsNow(nextRows)]);
    setTimeout(function() { skipSaveRef.current = false; }, 120);
    onDataChange();
  }

  if (!isHydrated) return props.loader || null;

  return (
    <div style={{ pointerEvents: isHydrated ? "auto" : "none" }}>
      <style>{FL_CSS}</style>
      {sessionWarn ? (
        <p className="fl-mono" style={{ margin: "0 0 16px", padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(196,165,124,0.28)", background: "#141416", fontSize: 12, lineHeight: 1.5, color: "#C4A57C" }}>{sessionWarn}</p>
      ) : null}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <button className="fl-btn" onClick={function() { setManageCat(!manageCat); }} style={pickStyle(manageCat, false, props.accent)}>Categorias</button>
        <button className="fl-nav" onClick={function() { shiftMonth(-1); }}>‹</button>
        <span className="fl-mono" style={{ fontSize: 12, color: "#EDEDEF", minWidth: 90, textAlign: "center" }}>{month}</span>
        <button className="fl-nav" onClick={function() { shiftMonth(1); }}>›</button>
      </div>

      {manageCat && (
        <div className="fl-card" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <input className="fl-in" value={catDraft.name} onChange={function(e) { setCatDraft(Object.assign({}, catDraft, { name: e.target.value })); }} onKeyDown={function(e) { if (e.key === "Enter") saveCategory(); }} placeholder={catDraft.id ? "Novo nome" : "Nova categoria"} style={{ flex: 1, minWidth: 160, width: "auto" }} />
            <button className="fl-btn" onClick={saveCategory} style={{ "--fl-bg": "#1A1A1D", "--fl-bd": "rgba(255,255,255,0.14)", "--fl-fg": "#EDEDEF", minHeight: 44 }}>{catDraft.id ? "Guardar" : "+ Criar"}</button>
          </div>
          {categories.map(function(cat) {
            return (
              <div key={cat.id} className="fl-line">
                <span style={{ fontSize: 14, lineHeight: 1.5, color: "#EDEDEF" }}>{cat.name}</span>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button className="fl-icon" onClick={function() { setCatDraft({ id: cat.id, name: cat.name }); }}>✎</button>
                  {categories.length > 1 ? (
                    <button type="button" className="fl-icon" onClick={function() { removeCategory(cat); }} aria-label={"Apagar " + cat.name}>×</button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div data-stagger style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div className="fl-card" style={{ padding: isMobile ? "16px 18px" : "18px 20px" }}>
          <p className="fl-lbl">TOTAL DO MÊS</p>
          <p className="fl-mono" style={{ margin: "10px 0 0", fontSize: 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.01em", color: amountColor(total, kind) }}>{total.toFixed(2)} €</p>
        </div>
        <div className="fl-card" style={{ padding: isMobile ? "16px 18px" : "18px 20px" }}>
          <p className="fl-lbl" style={{ marginBottom: 4 }}>POR CATEGORIA</p>
          {byCategory.length === 0 ? <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.5, color: "#6E6E76" }}>Sem registos</p> : byCategory.map(function(c) {
            return <div key={c.name} className="fl-line" style={{ fontSize: 13 }}>
              <span style={{ color: "#A0A0A8", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
              <span className="fl-num" style={{ color: amountColor(c.total, kind) }}>{c.total.toFixed(2)} €</span>
            </div>;
          })}
        </div>
      </div>

      <div className="fl-card" style={{ display: "grid", gap: 12, marginBottom: 20, padding: 16 }}>
        <input className="fl-in" value={draft.title} onChange={function(e) { setDraft(Object.assign({}, draft, { title: e.target.value })); }} placeholder="Descrição" onKeyDown={function(e) { if (e.key === "Enter") addRow(); }} />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 140px 1fr", gap: 12 }}>
          <input className="fl-in" value={draft.amount} onChange={function(e) { setDraft(Object.assign({}, draft, { amount: e.target.value })); }} placeholder="Valor €" type="number" min="0" step="0.01" style={{ fontFamily: "'JetBrains Mono',monospace", fontVariantNumeric: "tabular-nums" }} onKeyDown={function(e) { if (e.key === "Enter") addRow(); }} />
          <input className="fl-in" type="date" value={draft.day} onChange={function(e) { setDraft(Object.assign({}, draft, { day: e.target.value })); }} style={{ fontFamily: "'JetBrains Mono',monospace" }} />
        </div>
        <p className="fl-lbl" style={{ marginTop: 4 }}>CATEGORIAS (máx. 2)</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categoryNames.map(function(name) {
            var on = (draft.categories || []).indexOf(name) >= 0;
            var disabled = !on && (draft.categories || []).length >= 2;
            return (
              <button key={name} type="button" className="fl-pick" disabled={disabled} onClick={function() { toggleCategory(name); }} style={pickStyle(on, disabled, props.accent)}>
                {name}
              </button>
            );
          })}
        </div>
        <button type="button" className="fl-btn" onClick={addRow} style={{ "--fl-bg": "#1A1A1D", "--fl-bd": "rgba(255,255,255,0.14)", "--fl-fg": "#EDEDEF", minHeight: 44, marginTop: 4 }}>+ {label}</button>
      </div>

      <div className="fl-list" data-stagger>
        {monthItems.length === 0 ? (
          <p className="fl-empty">Sem registos neste mês.</p>
        ) : monthItems.map(function(e) {
          var cats = (e.categories || [e.category]).join(" · ");
          return (
            <article key={e.id} className="fl-row">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.5, color: "#EDEDEF", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "8px 0 0" }}>
                    <span className="fl-mono" style={{ fontSize: 11, color: "#6E6E76" }}>{e.day.split("-").reverse().join("/")}</span>
                    <span className="fl-chip">{cats}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <p className="fl-num" style={{ margin: 0, fontSize: 15, fontWeight: 500, color: amountColor(Number(e.amount), kind) }}>{Number(e.amount).toFixed(2)} €</p>
                  <button type="button" className="fl-icon" onClick={function() { removeRow(e.id); }}>×</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/** Estado visual dos seletores (categorias, painel): ativo, inativo ou indisponível. */
function pickStyle(on, disabled, accent) {
  var ac = accent || "#EDEDEF";
  return {
    "--fl-bg": on ? alpha(ac, 0.08) : "#141416",
    "--fl-bd": on ? alpha(ac, 0.38) : "rgba(255,255,255,0.07)",
    "--fl-fg": on ? ac : disabled ? "#6E6E76" : "#A0A0A8",
  };
}
/** Montantes são guardados sempre positivos; o sinal vem do tipo de registo. */
function amountColor(v, kind) {
  if (!v) return "#EDEDEF";
  return kind === "income" ? "#8FB39B" : "#C08C8C";
}
