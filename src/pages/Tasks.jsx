import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as taskStore from "../lib/tasksStore";
import { PageLoader } from "../components/PageLoader";

var ACCENT = "#7B61FF";
var COLUMNS = [
  { id: "inbox", label: "Inbox", icon: "◎", hint: "Captura rápida" },
  { id: "today", label: "Hoje", icon: "◉", hint: "Foco do dia" },
  { id: "doing", label: "A fazer", icon: "▸", hint: "Em progresso" },
  { id: "done", label: "Concluído", icon: "✓", hint: "Vitórias" },
];
var PRIORITIES = [
  { id: "low", label: "Baixa", color: "rgba(255,255,255,0.35)" },
  { id: "med", label: "Média", color: "#FFB800" },
  { id: "high", label: "Alta", color: "#FF3D8A" },
];

function uid() { return "t" + Date.now() + Math.random().toString(36).slice(2, 7); }
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function todayKey() {
  var t = new Date();
  return t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate());
}
function TaskCard(props) {
  var t = props.task, p = PRIORITIES.find(function(x) { return x.id === t.priority; }) || PRIORITIES[0];
  var overdue = t.due && t.due < todayKey() && props.col !== "done";
  return (
    <article
      draggable={!props.readOnly}
      onDragStart={function(e) { if (props.readOnly) return; e.dataTransfer.setData("text/task-id", t.id); }}
      style={{
        padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.03)",
        border: "1px solid " + (overdue ? "#FF3D8A30" : "rgba(255,255,255,0.06)"),
        cursor: props.readOnly ? "default" : "grab",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={function(e) { if (!props.readOnly) e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.25)"; }}
      onMouseLeave={function(e) { e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <button type="button" onClick={function() { props.onToggle(t.id); }} title={props.col === "done" ? "Reabrir" : "Concluir"}
          style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
            border: "2px solid " + (props.col === "done" ? ACCENT : "rgba(255,255,255,0.2)"),
            background: props.col === "done" ? ACCENT + "25" : "transparent",
            color: props.col === "done" ? ACCENT : "transparent", cursor: "pointer", fontSize: 12,
          }}>{props.col === "done" ? "✓" : ""}</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 13, color: props.col === "done" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.88)",
            textDecoration: props.col === "done" ? "line-through" : "none", lineHeight: 1.4,
          }}>{t.title}</p>
          {t.notes && <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.45 }}>{t.notes}</p>}
          {(t.subtasks || []).length > 0 && (
            <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none" }}>
              {t.subtasks.map(function(st) {
                return (
                  <li key={st.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontSize: 11 }}>
                    <button type="button" onClick={function(e) { e.stopPropagation(); if (props.onToggleSubtask) props.onToggleSubtask(st.id); }}
                      style={{ width: 16, height: 16, borderRadius: 4, border: "1px solid " + (st.done ? ACCENT : "rgba(255,255,255,0.2)"), background: st.done ? ACCENT + "22" : "transparent", color: st.done ? ACCENT : "transparent", cursor: "pointer", fontSize: 9, padding: 0 }}>{st.done ? "✓" : ""}</button>
                    <span style={{ color: st.done ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.55)", textDecoration: st.done ? "line-through" : "none" }}>{st.title}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, alignItems: "center" }}>
            <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: p.color, letterSpacing: 0.5 }}>{p.label.toUpperCase()}</span>
            {t.due && (
              <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: overdue ? "#FF3D8A" : "rgba(255,255,255,0.25)" }}>
                {overdue ? "Atrasada · " : ""}{t.due.split("-").reverse().join("/")}
              </span>
            )}
            {(t.tags || []).map(function(tag) {
              return <span key={tag} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: ACCENT + "15", color: ACCENT }}>{tag}</span>;
            })}
          </div>
        </div>
        {!props.readOnly && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <button type="button" onClick={function() { props.onEdit(t); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: 11, padding: 2 }}>✎</button>
            <button type="button" onClick={function() { props.onDelete(t.id); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 11, padding: 2 }}>×</button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function Tasks() {
  var navigate = useNavigate();
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

  useEffect(function() {
    taskStore.loadTasks().then(function(list) {
      setTasks(list);
      setLoaded(true);
    });
  }, []);

  useEffect(function() {
    function onResize() { setViewportW(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  useEffect(function() {
    if (!loaded) return;
    taskStore.saveTasks(tasks);
  }, [tasks, loaded]);

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

  var resetDraft = useCallback(function() {
    setDraft({ title: "", notes: "", priority: "med", due: "", tags: "", column: "inbox", subtasks: [] });
    setSubDraft("");
    setEditId(null);
    setShowForm(false);
  }, []);

  function saveTask() {
    if (!draft.title.trim()) return;
    var tags = draft.tags.split(",").map(function(s) { return s.trim(); }).filter(Boolean).slice(0, 4);
    var item = {
      id: editId || uid(),
      title: draft.title.trim(),
      notes: draft.notes.trim(),
      priority: draft.priority,
      due: draft.due || null,
      tags: tags,
      subtasks: draft.subtasks || [],
      column: draft.column,
      created: editId ? undefined : Date.now(),
    };
    setTasks(function(prev) {
      if (editId) return prev.map(function(t) { return t.id === editId ? Object.assign({}, t, item) : t; });
      return prev.concat([Object.assign({}, item, { created: Date.now() })]);
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

  function deleteTask(id) {
    var next = tasks.filter(function(t) { return t.id !== id; });
    setTasks(next);
    if (editId === id) resetDraft();
    taskStore.deleteTaskById(next, id).catch(function() {});
  }

  function toggleDone(id) {
    setTasks(function(prev) {
      return prev.map(function(t) {
        if (t.id !== id) return t;
        if (t.column === "done") return Object.assign({}, t, { column: "today" });
        return Object.assign({}, t, { column: "done" });
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
        return Object.assign({}, t, {
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
      return prev.map(function(t) { return t.id === id ? Object.assign({}, t, { column: col }) : t; });
    });
  }

  var tk = todayKey();

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(155deg, #0A0A12 0%, #12101F 50%, #0A0A12 100%)", color: "#fff", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{"@keyframes taskIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .task-col{animation:taskIn .35s ease both}"}</style>
      <div style={{ position: "fixed", top: "-20%", left: "30%", width: 500, height: 500, background: "radial-gradient(circle,rgba(123,97,255,0.06),transparent 60%)", pointerEvents: "none" }} />

      <header style={{ position: "sticky", top: 0, zIndex: 20, padding: isMobile ? "12px" : "14px 20px", background: "linear-gradient(180deg,rgba(10,10,18,0.97),rgba(10,10,18,0.75))", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", flexDirection: isMobile ? "column" : "row", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <button type="button" onClick={function() { navigate("/"); }} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, color: "rgba(255,255,255,0.45)", padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← Hub</button>
            <h1 style={{ margin: 0, fontSize: 16, fontFamily: "'JetBrains Mono',monospace", color: ACCENT, letterSpacing: 1 }}>Tarefas</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, maxWidth: isMobile ? "none" : 360, minWidth: 180 }}>
            <input value={query} onChange={function(e) { setQuery(e.target.value); }} placeholder="Procurar..."
              style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", padding: "9px 12px", fontSize: isMobile ? 16 : 12, outline: "none", fontFamily: "inherit" }} />
            <button type="button" onClick={function() { setFocusToday(!focusToday); }}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid " + (focusToday ? ACCENT + "50" : "rgba(255,255,255,0.08)"), background: focusToday ? ACCENT + "15" : "transparent", color: focusToday ? ACCENT : "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer", whiteSpace: "nowrap" }}>
              Foco hoje
            </button>
          </div>
          <button type="button" onClick={function() { resetDraft(); setShowForm(true); setDraft(function(d) { return Object.assign({}, d, { column: "inbox" }); }); }}
            style={{ background: ACCENT + "18", border: "1px solid " + ACCENT + "45", borderRadius: 10, color: ACCENT, fontSize: 12, padding: "10px 16px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontWeight: 500, width: isMobile ? "100%" : "auto" }}>+ Nova</button>
        </div>
      </header>

      <div data-scrollable style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "14px 12px 80px" : "16px 20px" }}>
        {!loaded ? <PageLoader accent={ACCENT} lines={6} /> : (
        <>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ width: stats.pct + "%", height: "100%", background: "linear-gradient(90deg," + ACCENT + ",#00FFC8)", borderRadius: 3, transition: "width 0.4s ease" }} />
          </div>
          <p style={{ margin: 0, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.35)" }}>
            {stats.done}/{stats.total} concluídas · {stats.today} em foco hoje
          </p>
        </div>

        {showForm && (
          <div style={{ marginBottom: 24, padding: 18, borderRadius: 16, background: "rgba(123,97,255,0.06)", border: "1px solid " + ACCENT + "25", animation: "taskIn 0.25s ease" }}>
            <p style={{ margin: "0 0 12px", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: ACCENT, letterSpacing: 1 }}>{editId ? "EDITAR TAREFA" : "NOVA TAREFA"}</p>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
              <input value={draft.title} onChange={function(e) { setDraft(Object.assign({}, draft, { title: e.target.value })); }} placeholder="O que tens de fazer?" autoFocus
                style={{ gridColumn: "1 / -1", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", padding: "11px 12px", fontSize: isMobile ? 16 : 14, outline: "none", fontFamily: "inherit" }} />
              <textarea value={draft.notes} onChange={function(e) { setDraft(Object.assign({}, draft, { notes: e.target.value })); }} placeholder="Notas..." rows={2}
                style={{ gridColumn: "1 / -1", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", padding: "10px 12px", fontSize: isMobile ? 16 : 12, outline: "none", fontFamily: "inherit", resize: "vertical" }} />
              <select value={draft.column} onChange={function(e) { setDraft(Object.assign({}, draft, { column: e.target.value })); }}
                style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", padding: "9px", fontSize: 12, fontFamily: "inherit" }}>
                {COLUMNS.map(function(c) { return <option key={c.id} value={c.id}>{c.label}</option>; })}
              </select>
              <select value={draft.priority} onChange={function(e) { setDraft(Object.assign({}, draft, { priority: e.target.value })); }}
                style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", padding: "9px", fontSize: 12, fontFamily: "inherit" }}>
                {PRIORITIES.map(function(p) { return <option key={p.id} value={p.id}>{p.label}</option>; })}
              </select>
              <input type="date" value={draft.due} onChange={function(e) { setDraft(Object.assign({}, draft, { due: e.target.value })); }}
                style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: ACCENT, padding: "9px", fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }} />
              <input value={draft.tags} onChange={function(e) { setDraft(Object.assign({}, draft, { tags: e.target.value })); }} placeholder="Tags: casa, estudo..."
                style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", padding: "9px 12px", fontSize: 12, fontFamily: "inherit" }} />
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.35)", letterSpacing: 1 }}>SUBTAREFAS</p>
              {(draft.subtasks || []).map(function(st) {
                return (
                  <label key={st.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12, cursor: "pointer" }}>
                    <input type="checkbox" checked={!!st.done} onChange={function() {
                      setDraft(Object.assign({}, draft, {
                        subtasks: (draft.subtasks || []).map(function(s) { return s.id === st.id ? Object.assign({}, s, { done: !s.done }) : s; }),
                      }));
                    }} />
                    <span style={{ textDecoration: st.done ? "line-through" : "none", color: st.done ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.75)" }}>{st.title}</span>
                  </label>
                );
              })}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input value={subDraft} onChange={function(e) { setSubDraft(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") addSubtask(); }} placeholder="Nova subtarefa..."
                  style={{ flex: 1, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", padding: "8px 10px", fontSize: 12, outline: "none", fontFamily: "inherit" }} />
                <button type="button" onClick={addSubtask} style={{ background: ACCENT + "14", border: "1px solid " + ACCENT + "35", borderRadius: 10, color: ACCENT, padding: "0 12px", cursor: "pointer", fontSize: 11 }}>+</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="button" onClick={saveTask} style={{ background: ACCENT + "22", border: "1px solid " + ACCENT + "50", borderRadius: 10, color: ACCENT, padding: "9px 18px", fontSize: 12, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" }}>Guardar</button>
              <button type="button" onClick={resetDraft} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "rgba(255,255,255,0.4)", padding: "9px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
              {!editId && (
                <button type="button" onClick={function() { setDraft(Object.assign({}, draft, { column: "today", due: tk })); saveTask(); }} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                  Guardar em «Hoje»
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(240px,1fr))", gap: isMobile ? 18 : 16, alignItems: "start" }}>
          {COLUMNS.map(function(col, ci) {
            var list = tasksInCol(col.id);
            return (
              <div key={col.id} className="task-col" style={{ animationDelay: ci * 0.06 + "s" }}
                onDragOver={function(e) { e.preventDefault(); }}
                onDrop={function(e) { onDrop(col.id, e); }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 4px" }}>
                  <div>
                    <span style={{ fontSize: 14, marginRight: 8, opacity: 0.6 }}>{col.icon}</span>
                    <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{col.label}</span>
                    <span style={{ marginLeft: 8, fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'JetBrains Mono',monospace" }}>{list.length}</span>
                  </div>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", fontFamily: "'IBM Plex Sans',sans-serif" }}>{col.hint}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 80 }}>
                  {list.length === 0 ? (
                    <p style={{ margin: 0, padding: 16, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.15)", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 12 }}>
                      Arrasta tarefas para aqui
                    </p>
                  ) : list.map(function(t) {
                    return (
                      <TaskCard key={t.id} task={t} col={col.id} onEdit={startEdit} onDelete={deleteTask} onToggle={toggleDone} onToggleSubtask={function(sid) { toggleSubtask(t.id, sid); }} />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
