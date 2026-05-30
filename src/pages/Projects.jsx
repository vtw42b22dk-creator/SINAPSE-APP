import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as synapseStore from "../lib/synapseStore";
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
      <style>{MODULE_ENTRY_CSS + ".proj-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}.proj-card{position:relative;border-radius:20px;padding:20px;text-align:left;cursor:pointer;transition:transform .25s,box-shadow .25s;border:1px solid rgba(255,255,255,0.06);background:linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))}.proj-card:hover{transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,0,0,0.35)}"}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(6,6,12,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: isMobile ? "12px" : "14px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={function() { navigate("/"); }} style={backBtn()}>← Hub</button>
            <h1 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 16, color: ACCENT, letterSpacing: 1 }}>PROJETOS</h1>
          </div>
          <button onClick={function() { setFormOpen(!formOpen); }} style={createBtn()}>
            {formOpen ? "Fechar" : "+ Criar Novo Projeto"}
          </button>
        </div>
      </header>

      <main className="mod-main" style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "16px 12px 80px" : "28px 24px" }}>
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
              return (
                <div key={p.id} className="proj-card" onClick={function() { openProject(p); }}
                  style={{ borderColor: (p.color || ACCENT) + "35", boxShadow: "0 8px 32px " + (p.color || ACCENT) + "12" }}>
                  <button type="button" onClick={function(e) { removeProject(e, p); }} title="Apagar"
                    style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)", color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>×</button>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: (p.color || ACCENT) + "18", color: p.color || ACCENT, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, fontSize: 18 }}>✦</div>
                  <h2 style={{ margin: "0 0 6px", fontFamily: "'JetBrains Mono',monospace", fontSize: 17, paddingRight: 28 }}>{p.name}</h2>
                  {p.description && <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.45 }}>{p.description}</p>}
                  <p style={{ margin: 0, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.28)" }}>
                    {activeMods.length ? activeMods.map(function(m) { return m.label; }).join(" · ") : "Sem módulos"}
                  </p>
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
