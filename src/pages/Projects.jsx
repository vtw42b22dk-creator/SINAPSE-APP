import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as synapseStore from "../lib/synapseStore";
import * as projectModuleStore from "../lib/projectModuleStore";
import * as tasksStore from "../lib/tasksStore";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { pageBg, pageText } from "../lib/ThemeContext";

var ACCENT = "#FF3D8A";

function ProjectsIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="10" width="14" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
      <rect x="26" y="10" width="14" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
      <rect x="8" y="26" width="14" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
      <rect x="26" y="26" width="14" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

export { ProjectsIcon };

function projectTypeMeta(p) {
  var t = ((p.name || "") + " " + (p.description || "")).toLowerCase();
  if (/hardware|chip|pcb|arduino|component|invent/i.test(t)) return { icon: "◈", tag: "Hardware", color: "#00FFC8" };
  if (/resale|sneaker|sapatilha|venda|flip|streetwear|stock/i.test(t)) return { icon: "◇", tag: "Resale", color: "#FF3D8A" };
  if (/software|app|web|code|dev|saas/i.test(t)) return { icon: "⌘", tag: "Software", color: "#6B8AFF" };
  return { icon: "✦", tag: "Projeto", color: p.color || ACCENT };
}

function moduleToggleStyle(on, color) {
  return {
    flex: 1,
    minWidth: 0,
    padding: "8px 6px",
    borderRadius: 8,
    border: "1px solid " + (on ? color + "55" : "rgba(255,255,255,0.08)"),
    background: on ? color + "18" : "rgba(255,255,255,0.02)",
    color: on ? color : "rgba(255,255,255,0.35)",
    fontSize: 9,
    fontFamily: "'JetBrains Mono',monospace",
    cursor: "pointer",
    textAlign: "center",
  };
}

export default function Projects() {
  var navigate = useNavigate();
  var vwS = useState(window.innerWidth);
  var isMobile = vwS[0] < 720;
  var projectsS = useState([]);
  var projects = projectsS[0], setProjects = projectsS[1];
  var loadedS = useState(false);
  var loaded = loadedS[0], setLoaded = loadedS[1];
  var formOpenS = useState(false);
  var formOpen = formOpenS[0], setFormOpen = formOpenS[1];
  var nameS = useState("");
  var name = nameS[0], setName = nameS[1];
  var descS = useState("");
  var description = descS[0], setDescription = descS[1];
  var modulesS = useState(Object.assign({}, synapseStore.DEFAULT_MODULES));
  var modules = modulesS[0], setModules = modulesS[1];
  var statsS = useState({});
  var stats = statsS[0], setStats = statsS[1];

  useEffect(function() {
    function onResize() { vwS[1](window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  useEffect(function() {
    synapseStore.loadProjects().then(function(list) {
      if (list.length) {
        setProjects(list);
        setLoaded(true);
        return;
      }
      var p = synapseStore.newProject("Principal");
      setProjects([p]);
      synapseStore.saveProjects([p]);
      setLoaded(true);
    });
  }, []);

  useEffect(function() {
    if (!projects.length) return;
    Promise.all([
      tasksStore.loadTasks(),
      Promise.all(projects.map(function(p) {
        return projectModuleStore.loadInvestments(p.id).then(function(rows) {
          return { id: p.id, totals: projectModuleStore.investmentTotals(rows) };
        });
      })),
    ]).then(function(results) {
      var tasks = results[0];
      var invRows = results[1];
      var next = {};
      projects.forEach(function(p) {
        var inv = invRows.find(function(d) { return d.id === p.id; });
        var projTasks = tasks.filter(function(t) { return t.synapse_project_id === p.id; });
        var pending = projTasks.filter(function(t) { return t.column !== "done"; }).length;
        next[p.id] = {
          roi: inv ? inv.totals.roi : 0,
          hasInvestments: inv ? inv.totals.injected > 0 || inv.totals.returned > 0 : false,
          pending: pending,
          total: projTasks.length,
        };
      });
      setStats(next);
    });
  }, [projects]);

  function toggleModule(id) {
    setModules(function(prev) {
      var next = Object.assign({}, prev);
      next[id] = !next[id];
      if (!Object.keys(next).some(function(k) { return next[k]; })) next.documents = true;
      return next;
    });
  }

  function createProject() {
    if (!name.trim()) return;
    var p = synapseStore.newProject(name.trim(), { description: description.trim(), modules: modules });
    var next = projects.concat([p]);
    setProjects(next);
    synapseStore.saveProjects(next);
    setName("");
    setDescription("");
    setModules(Object.assign({}, synapseStore.DEFAULT_MODULES));
    setFormOpen(false);
    navigate("/projects/" + p.id);
  }

  function removeProject(e, p) {
    e.stopPropagation();
    if (!window.confirm("Apagar o projeto \"" + p.name + "\"?")) return;
    synapseStore.deleteProject(p.id, projects).then(function(next) {
      setProjects(next);
    });
  }

  function openProject(p) {
    navigate("/projects/" + p.id);
  }

  var bg = pageBg();
  var text = pageText();

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", color: ACCENT, opacity: 0.5 }}>A carregar projetos...</p>
      </div>
    );
  }

  return (
    <div data-scrollable style={{ minHeight: "100vh", background: "linear-gradient(160deg,#06060C 0%,#0D1218 45%,#06060C 100%)", color: text, fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{MODULE_ENTRY_CSS + ".proj-hub{max-width:1152px;margin:0 auto}.proj-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}.proj-card{position:relative;border-radius:16px;padding:16px 16px 14px;text-align:left;cursor:pointer;transition:transform .22s,box-shadow .22s;border:1px solid rgba(255,255,255,0.06);background:linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012));display:flex;flex-direction:column;min-height:148px}.proj-card:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,0,0,0.35)}.proj-card-head{display:flex;align-items:flex-start;gap:10px;margin-bottom:10px}.proj-card-icon{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}.proj-card-tag{font-size:8px;font-family:'JetBrains Mono',monospace;letter-spacing:.5px;opacity:.7;margin-top:2px}.proj-card-progress{height:4px;border-radius:999px;background:rgba(255,255,255,0.06);overflow:hidden;margin-top:auto}.proj-card-progress-fill{height:100%;border-radius:999px;transition:width .3s}.proj-card-foot{display:flex;justify-content:space-between;align-items:center;margin-top:8px;gap:8px}"}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(6,6,12,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: isMobile ? "12px" : "14px 24px" }}>
        <div className="proj-hub" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={function() { navigate("/"); }} style={backBtn()}>← Hub</button>
            <h1 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 16, color: ACCENT, letterSpacing: 1 }}>PROJETOS</h1>
          </div>
          <button onClick={function() { setFormOpen(!formOpen); }} style={createBtn()}>
            {formOpen ? "Fechar" : "+ Criar Novo Projeto"}
          </button>
        </div>
      </header>

      <main className="mod-main proj-hub" style={{ padding: isMobile ? "16px 12px 80px" : "24px 24px 48px" }}>
        {formOpen && (
          <div style={{ marginBottom: 24, padding: 20, borderRadius: 18, border: "1px solid rgba(255,61,138,0.25)", background: "rgba(255,61,138,0.06)" }}>
            <p style={{ margin: "0 0 14px", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: ACCENT, letterSpacing: 1 }}>NOVO PROJETO</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={name} onChange={function(e) { setName(e.target.value); }} placeholder="Nome do projeto"
                style={inputStyle()} onKeyDown={function(e) { if (e.key === "Enter") createProject(); }} />
              <textarea value={description} onChange={function(e) { setDescription(e.target.value); }} placeholder="Descrição (opcional)" rows={2}
                style={Object.assign({}, inputStyle(), { resize: "vertical", lineHeight: 1.5 })} />
              <div>
                <p style={{ margin: "0 0 8px", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.35)" }}>MÓDULOS ATIVÁVEIS</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {synapseStore.MODULE_META.map(function(m) {
                    return (
                      <button type="button" key={m.id} onClick={function() { toggleModule(m.id); }} style={moduleToggleStyle(modules[m.id], ACCENT)} title={m.desc}>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={createProject} style={{ alignSelf: "flex-start", background: ACCENT + "22", border: "1px solid " + ACCENT + "55", borderRadius: 10, color: ACCENT, padding: "10px 18px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600 }}>
                Criar projeto
              </button>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.35)", textAlign: "center", padding: 40 }}>Nenhum projeto ainda. Cria o primeiro acima.</p>
        ) : (
          <div className="proj-grid">
            {projects.map(function(p) {
              var activeMods = synapseStore.MODULE_META.filter(function(m) { return p.modules && p.modules[m.id]; });
              var meta = projectTypeMeta(p);
              var st = stats[p.id] || {};
              var donePct = st.total > 0 ? Math.round(((st.total - st.pending) / st.total) * 100) : 0;
              return (
                <div key={p.id} className="proj-card" onClick={function() { openProject(p); }}
                  style={{ borderColor: meta.color + "30", boxShadow: "0 6px 28px " + meta.color + "10" }}>
                  <button type="button" onClick={function(e) { removeProject(e, p); }} title="Apagar"
                    style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.32)", cursor: "pointer", fontSize: 13 }}>×</button>
                  <div className="proj-card-head">
                    <div className="proj-card-icon" style={{ background: meta.color + "16", color: meta.color, boxShadow: "0 0 12px " + meta.color + "22" }}>{meta.icon}</div>
                    <div style={{ minWidth: 0, flex: 1, paddingRight: 22 }}>
                      <h2 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h2>
                      <p className="proj-card-tag" style={{ margin: 0, color: meta.color }}>{meta.tag}</p>
                    </div>
                  </div>
                  {p.description && <p style={{ margin: "0 0 8px", fontSize: 11, color: "rgba(255,255,255,0.38)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</p>}
                  {st.total > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <div className="proj-card-progress">
                        <div className="proj-card-progress-fill" style={{ width: donePct + "%", background: meta.color, boxShadow: "0 0 6px " + meta.color + "88" }} />
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.32)" }}>{st.pending} pendentes · {st.total} tarefas</p>
                    </div>
                  )}
                  <div className="proj-card-foot">
                    <p style={{ margin: 0, fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.26)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {activeMods.length ? activeMods.map(function(m) { return m.label; }).join(" · ") : "Sem módulos"}
                    </p>
                    {st.hasInvestments && (
                      <p style={{ margin: 0, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: st.roi >= 0 ? "#34D399" : "#FF6B35", flexShrink: 0 }}>
                        ROI {(st.roi >= 0 ? "+" : "") + st.roi.toFixed(0) + "%"}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function backBtn() {
  return { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(255,255,255,0.45)", padding: "7px 12px", cursor: "pointer" };
}
function createBtn() {
  return { background: "rgba(255,61,138,0.14)", border: "1px solid rgba(255,61,138,0.35)", borderRadius: 10, color: ACCENT, padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 };
}
function inputStyle() {
  return { width: "100%", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", padding: "11px 12px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
}
