import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function monthKeyFromDate(d) {
  return d.getFullYear() + "-" + (d.getMonth() + 1 < 10 ? "0" : "") + (d.getMonth() + 1);
}

export default function FinanceLedger(props) {
  var store = props.store;
  var accent = props.accent;
  var isMobile = props.isMobile;
  var label = props.label || "Registo";
  var categoriesS = useState([]);
  var categories = categoriesS[0], setCategories = categoriesS[1];
  var rowsS = useState([]);
  var rows = rowsS[0], setRows = rowsS[1];
  var loadedS = useState(false);
  var loaded = loadedS[0], setLoaded = loadedS[1];
  var monthS = useState(monthKeyFromDate(new Date()));
  var month = monthS[0], setMonth = monthS[1];
  var draftS = useState({ title: "", amount: "", categories: [], day: store.todayKey(), notes: "" });
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
    if (Date.now() - lastSaveAt.current < 4000) return Promise.resolve();
    return Promise.all([pullCategories(), pullRows()]).then(function(res) {
      if (skipSaveRef.current) return;
      skipSaveRef.current = true;
      setCategories(res[0]);
      setRows(res[1]);
      setTimeout(function() { skipSaveRef.current = false; }, 80);
    }).catch(function() {});
  }, [store]);

  useEffect(function() {
    var alive = true;
    skipSaveRef.current = true;
    Promise.all([store.loadCategories(), store.loadRows()]).then(function(res) {
      if (!alive) return;
      setCategories(res[0]);
      setRows(res[1]);
      applyDraftCategories(res[0]);
      setLoaded(true);
      setTimeout(function() { skipSaveRef.current = false; }, 80);
      syncFromCloud();
    }).catch(function() {
      if (!alive) return;
      setLoaded(true);
      skipSaveRef.current = false;
    });
    return function() { alive = false; };
  }, [store, syncFromCloud]);

  useEffect(function() {
    function onVisible() {
      if (document.visibilityState === "hidden") return;
      syncFromCloud();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return function() {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [syncFromCloud]);

  useEffect(function() { categoriesRef.current = categories; }, [categories]);
  useEffect(function() { rowsRef.current = rows; }, [rows]);

  function persistCats(cats) {
    lastSaveAt.current = Date.now();
    return store.saveCategories(cats || categoriesRef.current);
  }
  function persistRows(rws) {
    lastSaveAt.current = Date.now();
    return store.saveRows(rws || rowsRef.current);
  }

  useEffect(function() {
    if (!loaded || skipSaveRef.current) return;
    clearTimeout(saveCatTimer.current);
    saveCatTimer.current = setTimeout(function() { persistCats(); }, 400);
    return function() { clearTimeout(saveCatTimer.current); };
  }, [categories, loaded, store]);

  useEffect(function() {
    if (!loaded || skipSaveRef.current) return;
    clearTimeout(saveRowsTimer.current);
    saveRowsTimer.current = setTimeout(function() { persistRows(); }, 500);
    return function() { clearTimeout(saveRowsTimer.current); };
  }, [rows, loaded, store]);

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
    if (!draft.title.trim() || !draft.amount) return;
    var cats = (draft.categories || []).slice(0, 2);
    if (!cats.length && categoryNames[0]) cats = [categoryNames[0]];
    var row = store.newRow(draft.title.trim(), Number(draft.amount), cats, draft.day);
    clearTimeout(saveRowsTimer.current);
    skipSaveRef.current = true;
    setRows(function(prev) {
      var next = prev.concat([row]);
      rowsRef.current = next;
      persistRows(next).finally(function() {
        setTimeout(function() { skipSaveRef.current = false; }, 80);
      });
      return next;
    });
    setDraft({ title: "", amount: "", categories: cats.slice(0, 1), day: store.todayKey(), notes: "" });
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
    await persistRows(next);
    setTimeout(function() { skipSaveRef.current = false; }, 200);
  }

  function shiftMonth(delta) {
    var p = month.split("-");
    var d = new Date(+p[0], +p[1] - 1 + delta, 1);
    setMonth(monthKeyFromDate(d));
  }

  function saveCategory() {
    if (!catDraft.name.trim()) return;
    if (catDraft.id) {
      var old = categories.find(function(c) { return c.id === catDraft.id; });
      var oldName = old ? old.name : "";
      var newName = catDraft.name.trim();
      setCategories(function(prev) {
        return prev.map(function(c) { return c.id === catDraft.id ? Object.assign({}, c, { name: newName }) : c; });
      });
      if (oldName && oldName !== newName) {
        setRows(function(prev) {
          return prev.map(function(e) {
            return Object.assign({}, e, {
              categories: (e.categories || []).map(function(c) { return c === oldName ? newName : c; }),
              category: e.category === oldName ? newName : e.category,
            });
          });
        });
      }
    } else {
      var nc = store.newCategory(catDraft.name.trim());
      nc.order_index = categories.length;
      setCategories(function(prev) { return prev.concat([nc]); });
    }
    setCatDraft({ id: null, name: "" });
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
    await Promise.all([persistCats(nextCats), persistRows(nextRows)]);
    setTimeout(function() { skipSaveRef.current = false; }, 120);
  }

  if (!loaded) return props.loader || null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={function() { setManageCat(!manageCat); }} style={{ background: manageCat ? accent + "18" : "rgba(255,255,255,0.03)", border: "1px solid " + (manageCat ? accent + "45" : "rgba(255,255,255,0.08)"), borderRadius: 10, color: manageCat ? accent : "rgba(255,255,255,0.45)", padding: "7px 12px", cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>Categorias</button>
        <button onClick={function() { shiftMonth(-1); }} style={navBtn()}>‹</button>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: accent, minWidth: 90, textAlign: "center" }}>{month}</span>
        <button onClick={function() { shiftMonth(1); }} style={navBtn()}>›</button>
      </div>

      {manageCat && (
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 18, border: "1px solid " + accent + "28", background: accent + "08" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <input value={catDraft.name} onChange={function(e) { setCatDraft(Object.assign({}, catDraft, { name: e.target.value })); }} onKeyDown={function(e) { if (e.key === "Enter") saveCategory(); }} placeholder={catDraft.id ? "Novo nome" : "Nova categoria"} style={inputStyle()} />
            <button onClick={saveCategory} style={{ background: accent + "18", border: "1px solid " + accent + "45", color: accent, borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{catDraft.id ? "Guardar" : "+ Criar"}</button>
          </div>
          {categories.map(function(cat) {
            return (
              <div key={cat.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span>{cat.name}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={function() { setCatDraft({ id: cat.id, name: cat.name }); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>✎</button>
                  {categories.length > 1 ? (
                    <button type="button" onClick={function() { removeCategory(cat); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer" }} aria-label={"Apagar " + cat.name}>×</button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={{ borderRadius: 18, border: "1px solid " + accent + "30", background: accent + "10", padding: 18 }}>
          <p style={{ margin: 0, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.35)" }}>TOTAL DO MÊS</p>
          <p style={{ margin: "6px 0 0", fontSize: 32, fontFamily: "'JetBrains Mono',monospace", color: accent }}>{total.toFixed(2)} €</p>
        </div>
        <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.025)", padding: 18 }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.35)" }}>POR CATEGORIA</p>
          {byCategory.length === 0 ? <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Sem registos</p> : byCategory.map(function(c) {
            return <div key={c.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: "rgba(255,255,255,0.55)" }}>{c.name}</span>
              <span style={{ color: accent, fontFamily: "'JetBrains Mono',monospace" }}>{c.total.toFixed(2)} €</span>
            </div>;
          })}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, marginBottom: 20, padding: 16, borderRadius: 18, border: "1px solid " + accent + "22", background: accent + "06" }}>
        <input value={draft.title} onChange={function(e) { setDraft(Object.assign({}, draft, { title: e.target.value })); }} placeholder="Descrição" style={inputStyle()} onKeyDown={function(e) { if (e.key === "Enter") addRow(); }} />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 140px 1fr", gap: 10 }}>
          <input value={draft.amount} onChange={function(e) { setDraft(Object.assign({}, draft, { amount: e.target.value })); }} placeholder="Valor €" type="number" min="0" step="0.01" style={inputStyle()} onKeyDown={function(e) { if (e.key === "Enter") addRow(); }} />
          <input type="date" value={draft.day} onChange={function(e) { setDraft(Object.assign({}, draft, { day: e.target.value })); }} style={inputStyle()} />
        </div>
        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono',monospace" }}>CATEGORIAS (máx. 2)</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categoryNames.map(function(name) {
            var on = (draft.categories || []).indexOf(name) >= 0;
            var disabled = !on && (draft.categories || []).length >= 2;
            return (
              <button key={name} type="button" disabled={disabled} onClick={function() { toggleCategory(name); }}
                style={{ border: "1px solid " + (on ? accent + "55" : "rgba(255,255,255,0.1)"), background: on ? accent + "18" : "transparent", color: on ? accent : disabled ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)", borderRadius: 10, padding: "6px 12px", cursor: disabled ? "not-allowed" : "pointer", fontSize: 11 }}>
                {name}
              </button>
            );
          })}
        </div>
        <button type="button" onClick={addRow} style={{ background: accent + "18", border: "1px solid " + accent + "45", color: accent, borderRadius: 12, padding: "10px 16px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>+ {label}</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {monthItems.length === 0 ? (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.28)", padding: 40 }}>Sem registos neste mês.</p>
        ) : monthItems.map(function(e, idx) {
          var cats = (e.categories || [e.category]).join(" · ");
          return (
            <article key={e.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.025)", padding: "14px 16px", animation: "modIn .35s ease " + (idx * 0.04) + "s both" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15 }}>{e.title}</p>
                  <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{e.day.split("-").reverse().join("/")} · {cats}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 16, fontFamily: "'JetBrains Mono',monospace", color: accent }}>{Number(e.amount).toFixed(2)} €</p>
                  <button type="button" onClick={function() { removeRow(e.id); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer" }}>×</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function navBtn() {
  return { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", width: 34, height: 34, cursor: "pointer" };
}
function inputStyle() {
  return { width: "100%", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff", padding: "10px 12px", outline: "none", fontSize: 14, fontFamily: "'IBM Plex Sans',sans-serif", boxSizing: "border-box" };
}
