import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import * as taskStore from "../lib/tasksStore";
import { PageLoader } from "../components/PageLoader";
import { fs } from "../lib/mobileUi";

var ACCENT = "#E6E6E9";
var COLUMNS = [
  { id: "inbox", label: "Inbox", icon: "◎", hint: "Captura rápida" },
  { id: "today", label: "Hoje", icon: "◉", hint: "Foco do dia" },
  { id: "doing", label: "A fazer", icon: "▸", hint: "Em progresso" },
  { id: "done", label: "Concluído", icon: "✓", hint: "Vitórias" },
];
var MOBILE_VIEWS = [
  { id: "inbox", label: "Inbox", icon: "◎", hint: "Captura rápida", columns: ["inbox"] },
  { id: "today", label: "Hoje", icon: "◉", hint: "Foco e progresso", columns: ["today", "doing"] },
  { id: "done", label: "Concluídas", icon: "✓", hint: "Vitórias", columns: ["done"] },
];
var PRIORITIES = [
  { id: "low", label: "Baixa", color: "rgba(255,255,255,0.35)" },
  { id: "med", label: "Média", color: "#C4A57C" },
  { id: "high", label: "Alta", color: "#E6E6E9" },
];

var SAVE_DEBOUNCE_MS = 900;

var TASKS_CSS = [
  "@keyframes taskIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
  ".task-col{animation:taskIn var(--dur-slow) var(--ease) both}",
  ".tk-card{padding:15px;border-radius:14px;background:#141416;border:1px solid rgba(255,255,255,0.07);",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur) var(--ease),box-shadow var(--dur) var(--ease)}",
  ".tk-card:hover{background:#1C1C20;border-color:rgba(255,255,255,0.14)}",
  ".tk-card.is-done{opacity:.62}",
  ".tk-card.is-late{border-color:rgba(192,140,140,0.34)}",
  ".tk-check{display:flex;align-items:center;justify-content:center;width:22px;height:22px;flex-shrink:0;margin-top:1px;",
  "border-radius:7px;border:1.5px solid rgba(255,255,255,0.22);background:transparent;color:transparent;font-size:12px;cursor:pointer;padding:0;",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-check:hover{border-color:rgba(255,255,255,0.5)}",
  ".tk-check.on{background:#E6E6E9;border-color:#E6E6E9;color:#09090B;transform:scale(1.05)}",
  ".tk-title{margin:0;line-height:1.45;color:#EDEDEF;overflow-wrap:anywhere}",
  ".tk-card.is-done .tk-title{text-decoration:line-through;color:#6E6E76}",
  ".tk-notes{margin:7px 0 0;line-height:1.55;color:#A0A0A8;overflow-wrap:anywhere}",
  ".tk-subs{margin:10px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:7px}",
  ".tk-sub{display:flex;align-items:center;gap:9px;font-size:12.5px}",
  ".tk-sub>button{display:flex;align-items:center;justify-content:center;width:16px;height:16px;flex-shrink:0;padding:0;",
  "border-radius:5px;border:1px solid rgba(255,255,255,0.22);background:transparent;color:transparent;font-size:9px;cursor:pointer}",
  ".tk-sub>button.on{background:#E6E6E9;border-color:#E6E6E9;color:#0A0A0B}",
  ".tk-sub>span{color:#A0A0A8;line-height:1.4}",
  ".tk-sub.on>span{color:#6E6E76;text-decoration:line-through}",
  ".tk-meta{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:11px;",
  "font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.6px}",
  ".tk-dot{display:inline-block;width:5px;height:5px;border-radius:999px;margin-right:6px;vertical-align:middle}",
  ".tk-due{color:#6E6E76}",
  ".tk-due.late{color:#C08C8C}",
  ".tk-tag{padding:3px 8px;border-radius:999px;background:rgba(255,255,255,0.06);color:#A0A0A8;letter-spacing:.3px}",
  ".tk-act{display:flex;flex-direction:column;gap:2px;opacity:0;transition:opacity var(--dur) var(--ease)}",
  ".tk-card:hover .tk-act,.tk-card:focus-within .tk-act{opacity:1}",
  ".tk-act>button{background:none;border:none;border-radius:7px;color:#6E6E76;cursor:pointer;font-size:12px;line-height:1;padding:5px 6px}",
  ".tk-act>button:hover{color:#EDEDEF;background:rgba(255,255,255,0.07)}",
  "@media(hover:none){.tk-act{opacity:.55}.tk-card:hover{background:#141416;border-color:rgba(255,255,255,0.07)}}",
  ".tk-lbl{font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#6E6E76;font-family:'JetBrains Mono',monospace}",
  ".tk-count{font-family:'JetBrains Mono',monospace;font-size:11px;color:#6E6E76;padding:2px 8px;border-radius:999px;background:rgba(255,255,255,0.05)}",
  ".tk-empty{margin:0;padding:22px 16px;text-align:center;font-size:12px;color:#6E6E76;",
  "border:1px dashed rgba(255,255,255,0.09);border-radius:12px;line-height:1.5}",
  ".tk-in{background:#0E0E10;border:1px solid rgba(255,255,255,0.09);border-radius:10px;color:#EDEDEF;outline:none;font-family:inherit}",
  ".tk-in:focus{border-color:rgba(255,255,255,0.22);background:#141416}",
  ".tk-col{padding:16px 14px 18px;border-radius:16px;background:#0E0E10;border:1px solid rgba(255,255,255,0.06)}",
  ".tk-tab{display:flex;align-items:center;gap:16px;width:100%;text-align:left;padding:18px;border-radius:16px;cursor:pointer;",
  "font-family:inherit;border:1px solid rgba(255,255,255,0.07);background:#141416;",
  "transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".tk-tab:active{background:#1A1A1D;border-color:rgba(255,255,255,0.14)}",
].join("");

function uid() { return "t" + Date.now() + Math.random().toString(36).slice(2, 7); }
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function todayKey() {
  var t = new Date();
  return t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate());
}
function TaskCard(props) {
  var t = props.task, p = PRIORITIES.find(function(x) { return x.id === t.priority; }) || PRIORITIES[0];
  var overdue = t.due && t.due < todayKey() && props.col !== "done";
  var mob = props.isMobile;
  var done = props.col === "done";
  return (
    <article
      className={"tk-card" + (done ? " is-done" : "") + (overdue ? " is-late" : "")}
      draggable={!props.readOnly}
      onDragStart={function(e) { if (props.readOnly) return; e.dataTransfer.setData("text/task-id", t.id); }}
      style={{ cursor: props.readOnly ? "default" : "grab" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
        <button type="button" className={"tk-check" + (done ? " on" : "")} onClick={function() { props.onToggle(t.id); }}
          title={done ? "Reabrir" : "Concluir"}>{done ? "✓" : ""}</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="tk-title" style={{ fontSize: fs(mob, 13.5, 16) }}>{t.title}</p>
          {t.notes && <p className="tk-notes" style={{ fontSize: fs(mob, 12, 14) }}>{t.notes}</p>}
          {(t.subtasks || []).length > 0 && (
            <ul className="tk-subs">
              {t.subtasks.map(function(st) {
                return (
                  <li key={st.id} className={"tk-sub" + (st.done ? " on" : "")}>
                    <button type="button" className={st.done ? "on" : ""}
                      onClick={function(e) { e.stopPropagation(); if (props.onToggleSubtask) props.onToggleSubtask(st.id); }}>{st.done ? "✓" : ""}</button>
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
        </div>
        {!props.readOnly && (
          <div className="tk-act">
            <button type="button" title="Editar" onClick={function() { props.onEdit(t); }}>✎</button>
            <button type="button" title="Apagar" onClick={function() { props.onDelete(t.id); }}>×</button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function Tasks() {
  var navigate = useNavigate();
  var auth = useAuth();
  var vwS = useState(window.innerWidth);
  var viewportW = vwS[0], setViewportW = vwS[1];
  var isMobile = viewportW < 720;
  var tS = useState([]);
  var tasks = tS[0], setTasks = tS[1];
  var loadedS = useState(false);
  var loaded = loadedS[0], setLoaded = loadedS[1];
  var qS = useState("");
  var query = qS[0], setQuery = qS[1];
  var focusS = useState(false);
  var focusToday = focusS[0], setFocusToday = focusS[1];
  var draftS = useState({ title: "", notes: "", priority: "med", due: "", tags: "", column: "inbox", subtasks: [] });
  var subDraftS = useState("");
  var subDraft = subDraftS[0], setSubDraft = subDraftS[1];
  var draft = draftS[0], setDraft = draftS[1];
  var editIdS = useState(null);
  var editId = editIdS[0], setEditId = editIdS[1];
  var showFormS = useState(false);
  var showForm = showFormS[0], setShowForm = showFormS[1];
  var mobileTabS = useState(null);
  var mobileTab = mobileTabS[0], setMobileTab = mobileTabS[1];

  var tasksRef = useRef([]);
  var isHydratedRef = useRef(false);
  var skipSaveRef = useRef(false);
  var saveTimerRef = useRef(null);
  var lastSaveAt = useRef(0);
  var lastDeleteAt = useRef(0);
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
    if (Date.now() - lastDeleteAt.current < 20000) return Promise.resolve();
    if (Date.now() - lastSaveAt.current < 8000) return Promise.resolve();
    return taskStore.pullTasks().then(function(merged) {
      if (skipSaveRef.current) return;
      skipSaveRef.current = true;
      commitTasks(merged);
      setTimeout(function() { skipSaveRef.current = false; }, 150);
    }).catch(function() {});
  }, []);

  function persistDebounced() {
    if (!isHydratedRef.current || skipSaveRef.current) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(function() {
      if (skipSaveRef.current) return;
      taskStore.saveTasks(tasksRef.current).then(reportSave);
    }, SAVE_DEBOUNCE_MS);
  }

  function persistNow(next) {
    if (!isHydratedRef.current) return Promise.resolve();
    var list = next || tasksRef.current;
    tasksRef.current = list;
    setTasks(list);
    return taskStore.saveTasksNow(list).then(reportSave);
  }

  useEffect(function() {
    var alive = true;
    skipSaveRef.current = true;
    isHydratedRef.current = false;
    taskStore.loadTasksLocal()
      .then(function(local) {
        if (!alive) return;
        commitTasks(local);
        return taskStore.pullTasks();
      })
      .then(function(merged) {
        if (!alive) return;
        commitTasks(merged || []);
        return taskStore.pushTasks(merged || []).then(function(res) {
          if (res && res.emergency) reportSave(res);
        });
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
    if (!loaded || auth.loading) return;
    syncFromCloud();
  }, [auth.user && auth.user.id, loaded, syncFromCloud]);

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
      if (!isHydratedRef.current) return;
      clearTimeout(saveTimerRef.current);
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
    }, 15000);
    return function() {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("focus", syncFromCloud);
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(timer);
    };
  }, [loaded, syncFromCloud]);

  var stats = useMemo(function() {
    var done = tasks.filter(function(t) { return t.column === "done"; }).length;
    var today = tasks.filter(function(t) { return t.column === "today"; }).length;
    return { total: tasks.length, done: done, today: today, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
  }, [tasks]);

  var filtered = useMemo(function() {
    var q = query.trim().toLowerCase();
    return tasks.filter(function(t) {
      if (focusToday && t.column !== "today" && t.column !== "doing") return false;
      if (!q) return true;
      return (t.title && t.title.toLowerCase().indexOf(q) >= 0) || (t.notes && t.notes.toLowerCase().indexOf(q) >= 0);
    });
  }, [tasks, query, focusToday]);

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
    setDraft({ title: "", notes: "", priority: "med", due: "", tags: "", column: "inbox", subtasks: [] });
    setSubDraft("");
    setEditId(null);
    setShowForm(false);
  }, []);

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
      column: d.column,
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
        if (t.column === "done") return taskStore.touchTask(t, { column: "today" });
        return taskStore.touchTask(t, { column: "done" });
      });
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
    setTasks(function(prev) {
      return prev.map(function(t) { return t.id === id ? taskStore.touchTask(t, { column: col }) : t; });
    });
  }

  var tk = todayKey();

  return (
    <div className="mod-main" style={{ minHeight: "100vh", background: "#0A0A0B", color: "#EDEDEF", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{TASKS_CSS}</style>
      <header style={{ position: "sticky", top: 0, zIndex: 20, padding: isMobile ? "12px" : "16px 20px", background: "#0A0A0B", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
            {isMobile && mobileTab ? (
              <button type="button" onClick={function() { setMobileTab(null); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, color: "#A0A0A8", padding: "8px 13px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← Voltar</button>
            ) : (
              <button type="button" onClick={function() { navigate("/"); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, color: "#A0A0A8", padding: "8px 13px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← Hub</button>
            )}
            <h1 className="mod-h1" style={{ margin: 0, fontSize: fs(isMobile, 16, 19), fontFamily: "'JetBrains Mono',monospace", color: "#EDEDEF", fontWeight: 500, letterSpacing: 0.5 }}>
              {isMobile && activeMobileView ? activeMobileView.label : "Tarefas"}
            </h1>
          </div>
          {!(isMobile && !mobileTab) ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: isMobile ? "none" : 380, minWidth: 180 }}>
            <input className="tk-in" value={query} onChange={function(e) { setQuery(e.target.value); }} placeholder="Procurar..."
              style={{ flex: 1, padding: "10px 13px", fontSize: isMobile ? 16 : 13 }} />
            <button type="button" onClick={function() { setFocusToday(!focusToday); }}
              style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid " + (focusToday ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)"), background: focusToday ? "#1A1A1D" : "transparent", color: focusToday ? "#EDEDEF" : "#6E6E76", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", whiteSpace: "nowrap" }}>
              Foco hoje
            </button>
          </div>
          ) : null}
          {!(isMobile && !mobileTab) ? (
          <button type="button" onClick={function() { resetDraft(); setShowForm(true); setDraft(function(d) { return Object.assign({}, d, { column: activeMobileView && activeMobileView.id === "today" ? "today" : activeMobileView && activeMobileView.id === "done" ? "done" : "inbox" }); }); }}
            style={{ background: "#EDEDEF", border: "1px solid #EDEDEF", borderRadius: 10, color: "#0A0A0B", fontSize: 12.5, padding: "11px 18px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontWeight: 500, width: isMobile ? "100%" : "auto" }}>+ Nova</button>
          ) : null}
        </div>
      </header>

      <div data-scrollable style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "14px 12px 80px" : "16px 20px" }}>
        {!loaded ? <PageLoader accent={ACCENT} lines={6} /> : (
        <>
        {syncWarn ? (
          <p style={{ margin: "0 0 14px", padding: "10px 12px", borderRadius: 10, background: "rgba(196,165,124,0.1)", border: "1px solid rgba(196,165,124,0.28)", color: "#C4A57C", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.5 }}>
            {syncWarn}
          </p>
        ) : null}
        {!(isMobile && !mobileTab) ? (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ width: stats.pct + "%", height: "100%", background: "#E6E6E9", borderRadius: 999, transition: "width var(--dur-slow) var(--ease)" }} />
          </div>
          <p style={{ margin: 0, fontSize: 11.5, fontFamily: "'JetBrains Mono',monospace", color: "#6E6E76", letterSpacing: 0.3 }}>
            {stats.done}/{stats.total} concluídas · {stats.today} em foco hoje
          </p>
        </div>
        ) : null}

        {showForm && !(isMobile && !mobileTab) ? (
          <div style={{ marginBottom: 26, padding: 20, borderRadius: 16, background: "#141416", border: "1px solid rgba(255,255,255,0.09)", animation: "taskIn var(--dur) var(--ease)" }}>
            <p className="tk-lbl" style={{ margin: "0 0 14px" }}>{editId ? "EDITAR TAREFA" : "NOVA TAREFA"}</p>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
              <input className="tk-in" value={draft.title} onChange={function(e) { setDraft(Object.assign({}, draft, { title: e.target.value })); }} placeholder="O que tens de fazer?" autoFocus
                style={{ gridColumn: "1 / -1", padding: "12px 13px", fontSize: isMobile ? 16 : 14.5 }} />
              <textarea className="tk-in" value={draft.notes} onChange={function(e) { setDraft(Object.assign({}, draft, { notes: e.target.value })); }} placeholder="Notas..." rows={2}
                style={{ gridColumn: "1 / -1", padding: "11px 13px", fontSize: isMobile ? 16 : 13, resize: "vertical", lineHeight: 1.55 }} />
              <select className="tk-in" value={draft.column} onChange={function(e) { setDraft(Object.assign({}, draft, { column: e.target.value })); }}
                style={{ padding: "11px 10px", fontSize: isMobile ? 16 : 13 }}>
                {COLUMNS.map(function(c) { return <option key={c.id} value={c.id}>{c.label}</option>; })}
              </select>
              <select className="tk-in" value={draft.priority} onChange={function(e) { setDraft(Object.assign({}, draft, { priority: e.target.value })); }}
                style={{ padding: "11px 10px", fontSize: isMobile ? 16 : 13 }}>
                {PRIORITIES.map(function(p) { return <option key={p.id} value={p.id}>{p.label}</option>; })}
              </select>
              <input className="tk-in" type="date" value={draft.due} onChange={function(e) { setDraft(Object.assign({}, draft, { due: e.target.value })); }}
                style={{ padding: "11px 10px", fontSize: isMobile ? 16 : 13, fontFamily: "'JetBrains Mono',monospace", color: "#A0A0A8" }} />
              <input className="tk-in" value={draft.tags} onChange={function(e) { setDraft(Object.assign({}, draft, { tags: e.target.value })); }} placeholder="Tags: casa, estudo..."
                style={{ padding: "11px 13px", fontSize: isMobile ? 16 : 13 }} />
            </div>
            <div style={{ marginTop: 18 }}>
              <p className="tk-lbl" style={{ margin: "0 0 10px" }}>SUBTAREFAS</p>
              {(draft.subtasks || []).map(function(st) {
                return (
                  <label key={st.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12, cursor: "pointer" }}>
                    <input type="checkbox" checked={!!st.done} onChange={function() {
                      setDraft(Object.assign({}, draft, {
                        subtasks: (draft.subtasks || []).map(function(s) { return s.id === st.id ? Object.assign({}, s, { done: !s.done }) : s; }),
                      }));
                    }} />
                    <span style={{ textDecoration: st.done ? "line-through" : "none", color: st.done ? "#6E6E76" : "#A0A0A8" }}>{st.title}</span>
                  </label>
                );
              })}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input className="tk-in" value={subDraft} onChange={function(e) { setSubDraft(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") addSubtask(); }} placeholder="Nova subtarefa..."
                  style={{ flex: 1, padding: "10px 12px", fontSize: isMobile ? 16 : 13 }} />
                <button type="button" onClick={addSubtask} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, color: "#EDEDEF", padding: "0 15px", cursor: "pointer", fontSize: 14 }}>+</button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
              <button type="button" onClick={function() { saveTask(); }} style={{ background: "#EDEDEF", border: "1px solid #EDEDEF", borderRadius: 10, color: "#0A0A0B", padding: "11px 20px", fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>Guardar</button>
              <button type="button" onClick={resetDraft} style={{ background: "none", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, color: "#A0A0A8", padding: "11px 16px", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              {!editId && (
                <button type="button" onClick={function() { saveTask(Object.assign({}, draft, { column: "today", due: tk })); }} style={{ marginLeft: "auto", background: "none", border: "none", color: "#6E6E76", fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: "8px 4px" }}>
                  Guardar em «Hoje»
                </button>
              )}
            </div>
          </div>
        ) : null}

        {isMobile && !mobileTab ? (
          <div data-stagger style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            <p style={{ margin: "0 0 4px", fontSize: 13.5, color: "#A0A0A8", lineHeight: 1.5 }}>Onde queres começar?</p>
            {MOBILE_VIEWS.map(function(v) {
              var n = countMobileView(v.id);
              return (
                <button key={v.id} type="button" className="tk-tab" onClick={function() { setMobileTab(v.id); }}>
                  <span style={{
                    display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, flexShrink: 0,
                    borderRadius: 12, background: "#0E0E10", border: "1px solid rgba(255,255,255,0.07)",
                    fontSize: 20, lineHeight: 1, color: "#A0A0A8",
                  }}>{v.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 17, fontFamily: "'JetBrains Mono',monospace", color: "#EDEDEF", fontWeight: 500 }}>{v.label}</p>
                    <p style={{ margin: "5px 0 0", fontSize: 13, color: "#6E6E76", lineHeight: 1.4 }}>{v.hint}</p>
                  </div>
                  <span style={{ fontSize: 15, fontFamily: "'JetBrains Mono',monospace", color: "#EDEDEF", minWidth: 34, textAlign: "right" }}>{n}</span>
                </button>
              );
            })}
          </div>
        ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(240px,1fr))", gap: isMobile ? 18 : 16, alignItems: "start" }}>
          {visibleColumns.map(function(col, ci) {
            var list = tasksInCol(col.id);
            return (
              <div key={col.id} className="task-col tk-col" style={{ animationDelay: ci * 0.06 + "s" }}
                onDragOver={function(e) { e.preventDefault(); }}
                onDrop={function(e) { onDrop(col.id, e); }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "0 2px", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ fontSize: fs(isMobile, 13, 15), color: "#6E6E76", lineHeight: 1 }}>{col.icon}</span>
                    <span style={{ fontSize: fs(isMobile, 13, 15), fontFamily: "'JetBrains Mono',monospace", color: "#EDEDEF", fontWeight: 500, letterSpacing: 0.3 }}>{col.label}</span>
                    <span className="tk-count">{list.length}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
                    {(col.id === "inbox" || col.id === "done") && list.length > 0 ? (
                      <button type="button" onClick={function() { clearColumn(col.id); }}
                        style={{ background: "transparent", border: "1px solid rgba(192,140,140,0.28)", borderRadius: 8, color: "#C08C8C", padding: isMobile ? "8px 12px" : "6px 11px", cursor: "pointer", fontSize: fs(isMobile, 10.5, 12), fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>
                        Apagar tudo
                      </button>
                    ) : null}
                    {!isMobile ? <span style={{ fontSize: 11, color: "#6E6E76", fontFamily: "'IBM Plex Sans',sans-serif" }}>{col.hint}</span> : null}
                  </div>
                </div>
                <div data-stagger style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 80 }}>
                  {list.length === 0 ? (
                    <p className="tk-empty">
                      Arrasta tarefas para aqui
                    </p>
                  ) : list.map(function(t) {
                    return (
                      <TaskCard key={t.id} task={t} col={col.id} isMobile={isMobile} onEdit={startEdit} onDelete={deleteTask} onToggle={toggleDone} onToggleSubtask={function(sid) { toggleSubtask(t.id, sid); }} />
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
    </div>
  );
}
