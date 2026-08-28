import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import * as taskStore from "../lib/tasksStore";
import { PageLoader } from "../components/PageLoader";
import { fs } from "../lib/mobileUi";
import { MICRO_CSS } from "../lib/microUi";
import { moduleColor, moduleGlow, MODULE_GLOW_CSS } from "../lib/theme";

var ACCENT = moduleColor("tasks");
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
  MICRO_CSS,
  MODULE_GLOW_CSS,
  "@keyframes taskIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}",
  ".tk-page{min-height:100vh;background:#070708;color:#EDEDEF;font-family:'IBM Plex Sans',sans-serif;position:relative;overflow-x:hidden}",
  ".tk-head{position:sticky;top:0;z-index:20;padding:14px 20px;background:rgba(7,7,8,.9);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.06)}",
  ".tk-head-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}",
  ".tk-head-inner--mob{flex-direction:column;align-items:stretch;padding:12px}",
  ".tk-back{padding:6px 2px;border:none;border-bottom:1px solid rgba(255,255,255,.14);background:transparent;color:#A0A0A8;font-size:12px;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-back:hover{color:#EDEDEF;border-bottom-color:#EDEDEF}",
  ".tk-back:active{transform:translateY(1px)}",
  ".tk-search-row{display:flex;align-items:center;gap:10px;flex:1;max-width:380px;min-width:180px}",
  ".tk-search-row--full{max-width:none}",
  ".tk-focus-btn{padding:8px 4px;border:none;border-bottom:1px solid rgba(255,255,255,.12);background:transparent;color:#6E6E76;font-size:11px;font-family:'JetBrains Mono',monospace;cursor:pointer;white-space:nowrap;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-focus-btn.is-on{color:var(--mc);border-bottom-color:var(--mc)}",
  ".tk-focus-btn:active{transform:scale(.96)}",
  ".tk-new-btn{background:transparent;border:none;border-bottom:2px solid var(--mc);color:var(--mc);font-size:12px;padding:10px 4px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-weight:500;transition:opacity var(--dur-fast) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-new-btn:hover{opacity:.85}",
  ".tk-new-btn:active{transform:scale(.96);opacity:.7}",
  ".tk-body{max-width:1200px;margin:0 auto;padding:16px 20px 80px}",
  ".tk-body--mob{padding:14px 12px 80px}",
  ".tk-progress-wrap{display:flex;align-items:center;gap:16px;margin-bottom:24px;flex-wrap:wrap}",
  ".tk-progress{flex:1;min-width:200px;height:4px;background:rgba(255,255,255,.08);overflow:hidden;border-radius:var(--radius-pill)}",
  ".tk-progress i{display:block;height:100%;background:var(--mc);transition:width var(--dur-slow) var(--ease)}",
  ".tk-stats{margin:0;font-size:11px;font-family:'JetBrains Mono',monospace;color:#6E6E76;letter-spacing:.3px}",
  ".tk-form{margin-bottom:28px;padding:0 0 24px;border-bottom:1px solid rgba(255,255,255,.1);animation:taskIn var(--dur) var(--ease)}",
  ".tk-form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}",
  ".tk-form-grid--mob{grid-template-columns:1fr}",
  ".tk-form-actions{display:flex;align-items:center;gap:12px;margin-top:20px;flex-wrap:wrap}",
  ".tk-save{padding:10px 4px;border:none;border-bottom:2px solid #EDEDEF;background:transparent;color:#EDEDEF;font-size:12px;font-weight:500;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:transform var(--dur-fast) var(--ease),opacity var(--dur-fast) var(--ease)}",
  ".tk-save:active{transform:scale(.96);opacity:.75}",
  ".tk-cancel,.tk-quick-save{padding:10px 4px;border:none;border-bottom:1px solid rgba(255,255,255,.12);background:transparent;color:#A0A0A8;font-size:12px;cursor:pointer;font-family:inherit;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".tk-cancel:hover{color:#EDEDEF;border-bottom-color:rgba(255,255,255,.3)}",
  ".tk-quick-save{margin-left:auto;color:#6E6E76;border:none}",
  ".tk-quick-save:hover{color:#A0A0A8}",
  ".tk-warn{margin:0 0 14px;padding:10px 0;border-bottom:1px solid rgba(196,165,124,.35);color:#C4A57C;font-size:11px;font-family:'JetBrains Mono',monospace;line-height:1.5}",
  ".task-col{animation:taskIn var(--dur-slow) var(--ease) both}",
  ".tk-card{padding:14px 12px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:var(--radius-md);margin-bottom:8px;transition:opacity var(--dur) var(--ease),border-color var(--dur) var(--ease),background var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-card:hover{background:rgba(255,255,255,.04);border-color:color-mix(in srgb,var(--mc) 30%,rgba(255,255,255,.1));transform:translateY(-2px)}",
  ".tk-card:hover{padding-left:4px;border-bottom-color:rgba(255,255,255,.14)}",
  ".tk-card:active{transform:scale(.995)}",
  ".tk-card.is-done{opacity:.48}",
  ".tk-card.is-late{border-bottom-color:rgba(192,140,140,.45)}",
  ".tk-check{display:flex;align-items:center;justify-content:center;width:20px;height:20px;flex-shrink:0;margin-top:3px;border:1px solid rgba(255,255,255,.28);background:transparent;color:transparent;font-size:11px;cursor:pointer;padding:0;transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-check:hover{border-color:rgba(255,255,255,.55);transform:scale(1.08)}",
  ".tk-check.on{background:#E6E6E9;border-color:#E6E6E9;color:#070708;animation:uiPop .38s var(--ease)}",
  ".tk-title{margin:0;line-height:1.45;color:#EDEDEF;overflow-wrap:anywhere;transition:color var(--dur) var(--ease)}",
  ".tk-card.is-done .tk-title{text-decoration:line-through;color:#6E6E76}",
  ".tk-notes{margin:7px 0 0;line-height:1.55;color:#A0A0A8;overflow-wrap:anywhere}",
  ".tk-subs{margin:10px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:7px}",
  ".tk-sub{display:flex;align-items:center;gap:9px;font-size:12.5px}",
  ".tk-sub>button{display:flex;align-items:center;justify-content:center;width:14px;height:14px;flex-shrink:0;padding:0;border:1px solid rgba(255,255,255,.22);background:transparent;color:transparent;font-size:9px;cursor:pointer;transition:background var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-sub>button:hover{transform:scale(1.1)}",
  ".tk-sub>button.on{background:#E6E6E9;border-color:#E6E6E9;color:#070708}",
  ".tk-sub>span{color:#A0A0A8;line-height:1.4}",
  ".tk-sub.on>span{color:#6E6E76;text-decoration:line-through}",
  ".tk-meta{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:11px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.6px}",
  ".tk-dot{display:inline-block;width:5px;height:5px;margin-right:6px;vertical-align:middle}",
  ".tk-due{color:#6E6E76}",
  ".tk-due.late{color:#C08C8C}",
  ".tk-tag{padding:0;color:#A0A0A8;letter-spacing:.3px}",
  ".tk-act{display:flex;flex-direction:column;gap:2px;opacity:0;transition:opacity var(--dur) var(--ease)}",
  ".tk-card:hover .tk-act,.tk-card:focus-within .tk-act{opacity:1}",
  ".tk-act>button{background:none;border:none;color:#6E6E76;cursor:pointer;font-size:12px;line-height:1;padding:5px 6px;transition:color var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-act>button:hover{color:#EDEDEF;transform:scale(1.1)}",
  "@media(hover:none){.tk-act{opacity:.55}}",
  ".tk-lbl{font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#6E6E76;font-family:'JetBrains Mono',monospace}",
  ".tk-count{font-family:'JetBrains Mono',monospace;font-size:11px;color:#6E6E76;padding:0}",
  ".tk-empty{margin:0;padding:22px 0;text-align:left;font-size:12px;color:#6E6E76;line-height:1.5}",
  ".tk-in{background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.12);color:#EDEDEF;outline:none;font-family:inherit;transition:border-color var(--dur) var(--ease),padding-left var(--dur) var(--ease)}",
  ".tk-in:focus{border-bottom-color:rgba(255,255,255,.4);padding-left:4px}",
  ".tk-col{padding:8px 0 18px;background:transparent;border:none}",
  ".tk-col-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding:0 2px;gap:8px;flex-wrap:wrap}",
  ".tk-col-title{display:flex;align-items:center;gap:9px}",
  ".tk-clear{padding:6px 4px;border:none;border-bottom:1px solid rgba(192,140,140,.35);background:transparent;color:#C08C8C;cursor:pointer;font-size:11px;font-family:'JetBrains Mono',monospace;white-space:nowrap;transition:opacity var(--dur-fast) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-clear:active{transform:scale(.96);opacity:.75}",
  ".tk-tab{display:flex;align-items:center;gap:16px;width:100%;text-align:left;padding:20px 0;cursor:pointer;font-family:inherit;border:none;border-bottom:1px solid rgba(255,255,255,.08);background:transparent;transition:color var(--dur) var(--ease),padding-left var(--dur) var(--ease),transform var(--dur-fast) var(--ease)}",
  ".tk-tab:hover{padding-left:6px}",
  ".tk-tab:active{transform:scale(.995)}",
  ".tk-tab-icon{font-size:20px;line-height:1;color:#A0A0A8;flex-shrink:0;width:32px}",
  ".tk-tab-count{font-size:15px;font-family:'JetBrains Mono',monospace;color:#EDEDEF;min-width:34px;text-align:right}",
  "@media(max-width:719px){.tk-head{padding:12px}.tk-head-inner{flex-direction:column;align-items:stretch}}",
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
    <div className="mod-main tk-page" style={{ "--mc": ACCENT }}>
      <style>{TASKS_CSS}</style>
      <div className="mod-glow" style={{ top: -100, right: "4%", background: moduleGlow(ACCENT) }} aria-hidden="true" />
      <header className={"tk-head" + (isMobile ? " tk-head--mob" : "")}>
        <div className={"tk-head-inner" + (isMobile ? " tk-head-inner--mob" : "")}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, width: isMobile ? "100%" : "auto" }}>
            {isMobile && mobileTab ? (
              <button type="button" className="tk-back ui-tap" onClick={function() { setMobileTab(null); }}>← Voltar</button>
            ) : (
              <button type="button" className="tk-back ui-tap" onClick={function() { navigate("/"); }}>← Hub</button>
            )}
            <h1 className="mod-h1" style={{ margin: 0, fontSize: fs(isMobile, 16, 19), fontFamily: "'JetBrains Mono',monospace", color: ACCENT, fontWeight: 500, letterSpacing: 0.5 }}>
              {isMobile && activeMobileView ? activeMobileView.label : "Tarefas"}
            </h1>
          </div>
          {!(isMobile && !mobileTab) ? (
          <div className={"tk-search-row" + (isMobile ? " tk-search-row--full" : "")}>
            <input className="tk-in ui-in" value={query} onChange={function(e) { setQuery(e.target.value); }} placeholder="Procurar..."
              style={{ flex: 1, padding: "10px 4px", fontSize: isMobile ? 16 : 13 }} />
            <button type="button" className={"tk-focus-btn ui-tap" + (focusToday ? " is-on" : "")} onClick={function() { setFocusToday(!focusToday); }}>
              Foco hoje
            </button>
          </div>
          ) : null}
          {!(isMobile && !mobileTab) ? (
          <button type="button" className="tk-new-btn ui-tap" style={{ width: isMobile ? "100%" : "auto" }} onClick={function() { resetDraft(); setShowForm(true); setDraft(function(d) { return Object.assign({}, d, { column: activeMobileView && activeMobileView.id === "today" ? "today" : activeMobileView && activeMobileView.id === "done" ? "done" : "inbox" }); }); }}>
            + Nova
          </button>
          ) : null}
        </div>
      </header>

      <div data-scrollable className={"tk-body" + (isMobile ? " tk-body--mob" : "")}>
        {!loaded ? <PageLoader accent={ACCENT} lines={6} /> : (
        <>
        {syncWarn ? (
          <p className="tk-warn">{syncWarn}</p>
        ) : null}
        {!(isMobile && !mobileTab) ? (
        <div className="tk-progress-wrap">
          <div className="tk-progress">
            <i style={{ width: stats.pct + "%" }} />
          </div>
          <p className="tk-stats">
            {stats.done}/{stats.total} concluídas · {stats.today} em foco hoje
          </p>
        </div>
        ) : null}

        {showForm && !(isMobile && !mobileTab) ? (
          <div className="tk-form">
            <p className="tk-lbl" style={{ margin: "0 0 14px" }}>{editId ? "EDITAR TAREFA" : "NOVA TAREFA"}</p>
            <div className={"tk-form-grid" + (isMobile ? " tk-form-grid--mob" : "")}>
              <input className="tk-in ui-in" value={draft.title} onChange={function(e) { setDraft(Object.assign({}, draft, { title: e.target.value })); }} placeholder="O que tens de fazer?" autoFocus
                style={{ gridColumn: "1 / -1", padding: "12px 4px", fontSize: isMobile ? 16 : 14.5 }} />
              <textarea className="tk-in ui-in" value={draft.notes} onChange={function(e) { setDraft(Object.assign({}, draft, { notes: e.target.value })); }} placeholder="Notas..." rows={2}
                style={{ gridColumn: "1 / -1", padding: "11px 4px", fontSize: isMobile ? 16 : 13, resize: "vertical", lineHeight: 1.55 }} />
              <select className="tk-in ui-in" value={draft.column} onChange={function(e) { setDraft(Object.assign({}, draft, { column: e.target.value })); }}
                style={{ padding: "11px 4px", fontSize: isMobile ? 16 : 13 }}>
                {COLUMNS.map(function(c) { return <option key={c.id} value={c.id}>{c.label}</option>; })}
              </select>
              <select className="tk-in ui-in" value={draft.priority} onChange={function(e) { setDraft(Object.assign({}, draft, { priority: e.target.value })); }}
                style={{ padding: "11px 4px", fontSize: isMobile ? 16 : 13 }}>
                {PRIORITIES.map(function(p) { return <option key={p.id} value={p.id}>{p.label}</option>; })}
              </select>
              <input className="tk-in ui-in" type="date" value={draft.due} onChange={function(e) { setDraft(Object.assign({}, draft, { due: e.target.value })); }}
                style={{ padding: "11px 4px", fontSize: isMobile ? 16 : 13, fontFamily: "'JetBrains Mono',monospace", color: "#A0A0A8" }} />
              <input className="tk-in ui-in" value={draft.tags} onChange={function(e) { setDraft(Object.assign({}, draft, { tags: e.target.value })); }} placeholder="Tags: casa, estudo..."
                style={{ padding: "11px 4px", fontSize: isMobile ? 16 : 13 }} />
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
                <input className="tk-in ui-in" value={subDraft} onChange={function(e) { setSubDraft(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") addSubtask(); }} placeholder="Nova subtarefa..."
                  style={{ flex: 1, padding: "10px 4px", fontSize: isMobile ? 16 : 13 }} />
                <button type="button" className="ui-line-btn ui-tap" onClick={addSubtask}>+</button>
              </div>
            </div>
            <div className="tk-form-actions">
              <button type="button" className="tk-save ui-tap" onClick={function() { saveTask(); }}>Guardar</button>
              <button type="button" className="tk-cancel ui-tap" onClick={resetDraft}>Cancelar</button>
              {!editId && (
                <button type="button" className="tk-quick-save ui-tap" onClick={function() { saveTask(Object.assign({}, draft, { column: "today", due: tk })); }}>
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
                <button key={v.id} type="button" className="tk-tab ui-tap" onClick={function() { setMobileTab(v.id); }}>
                  <span className="tk-tab-icon">{v.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 17, fontFamily: "'JetBrains Mono',monospace", color: "#EDEDEF", fontWeight: 500 }}>{v.label}</p>
                    <p style={{ margin: "5px 0 0", fontSize: 13, color: "#6E6E76", lineHeight: 1.4 }}>{v.hint}</p>
                  </div>
                  <span className="tk-tab-count">{n}</span>
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
                <div className="tk-col-head">
                  <div className="tk-col-title">
                    <span style={{ fontSize: fs(isMobile, 13, 15), color: "#6E6E76", lineHeight: 1 }}>{col.icon}</span>
                    <span style={{ fontSize: fs(isMobile, 13, 15), fontFamily: "'JetBrains Mono',monospace", color: "#EDEDEF", fontWeight: 500, letterSpacing: 0.3 }}>{col.label}</span>
                    <span className="tk-count">{list.length}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
                    {(col.id === "inbox" || col.id === "done") && list.length > 0 ? (
                      <button type="button" className="tk-clear ui-tap" onClick={function() { clearColumn(col.id); }}>
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
