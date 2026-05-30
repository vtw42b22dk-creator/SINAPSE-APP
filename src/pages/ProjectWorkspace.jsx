import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import * as synapseStore from "../lib/synapseStore";
import * as projectModuleStore from "../lib/projectModuleStore";
import Synapse from "./Synapse";
import { ProjectInvestments, ProjectNotes, ProjectAnalytics, ProjectInventory } from "../components/ProjectModules";

var ACCENT = "#FF3D8A";

var MODULE_ICONS = {
  documents: "✦",
  investments: "€",
  notes: "✎",
  analytics: "◈",
  inventory: "▦",
};

var MODULE_COLORS = {
  documents: "#FF3D8A",
  investments: "#34D399",
  notes: "#FFB800",
  analytics: "#00FFC8",
  inventory: "#6B8AFF",
};

var SIDEBAR_CSS = [
  ".pw{height:100vh;display:flex;flex-direction:column;background:radial-gradient(120% 90% at 80% -10%,#10111b 0%,#08080f 55%,#060609 100%);color:#fff;overflow:hidden;font-family:'IBM Plex Sans',sans-serif}",
  ".pw-head{flex-shrink:0;height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(7,7,13,0.78);backdrop-filter:blur(16px);z-index:30}",
  ".pw-hbtn{display:inline-flex;align-items:center;justify-content:center;height:34px;min-width:34px;padding:0 11px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.6);cursor:pointer;font-size:13px;font-family:inherit;flex-shrink:0;transition:all .16s}",
  ".pw-hbtn:hover{color:#fff;border-color:rgba(255,255,255,0.2)}",
  ".pw-shell{flex:1;display:flex;min-height:0}",
  ".pw-side{width:clamp(212px,17vw,256px);flex-shrink:0;display:flex;flex-direction:column;padding:14px 12px;border-right:1px solid rgba(255,255,255,0.06);background:rgba(8,9,14,0.6);backdrop-filter:blur(14px);overflow-y:auto;transition:width .22s ease,padding .22s ease}",
  ".pw-side--closed{width:0;padding:0;border:none;overflow:hidden}",
  ".pw-side--mini{width:66px;padding:14px 8px;align-items:center}",
  ".pw-side--mini .pw-lbl,.pw-side--mini .pw-sec,.pw-side--mini .pw-pcard-meta,.pw-side--mini .pw-foot{display:none}",
  ".pw-pcard{display:flex;align-items:center;gap:11px;padding:11px;border-radius:14px;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(150deg,rgba(255,255,255,0.05),rgba(255,255,255,0.012));margin-bottom:14px}",
  ".pw-side--mini .pw-pcard{padding:0;border:none;background:none;justify-content:center;margin-bottom:16px}",
  ".pw-pic{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}",
  ".pw-pname{margin:0;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".pw-pcard-meta{margin:3px 0 0;font-size:9px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.38);letter-spacing:.4px}",
  ".pw-sec{margin:2px 4px 8px;font-size:9px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.26);letter-spacing:1.4px}",
  ".pw-link{position:relative;display:flex;align-items:center;gap:12px;width:100%;padding:11px 12px;margin-bottom:3px;border-radius:11px;border:1px solid transparent;background:transparent;color:rgba(255,255,255,0.55);cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12px;text-align:left;transition:all .16s;overflow:hidden}",
  ".pw-side--mini .pw-link{justify-content:center;padding:11px 0;width:46px;margin:0 auto 6px}",
  ".pw-link:hover{color:#fff;background:rgba(255,255,255,0.04)}",
  ".pw-link.on{color:#fff;background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.1)}",
  ".pw-link.on::before{content:'';position:absolute;left:0;top:7px;bottom:7px;width:3px;border-radius:0 3px 3px 0;background:var(--lc);box-shadow:0 0 12px var(--lc)}",
  ".pw-lic{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;transition:all .16s}",
  ".pw-lbl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}",
  ".pw-foot{margin-top:auto;padding:12px 8px 4px;font-size:9px;color:rgba(255,255,255,0.24);line-height:1.5}",
  ".pw-main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column}",
  ".pw-main-in{flex:1;min-height:0;overflow:hidden}",
  ".pw-bk{position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);z-index:40}",
  "@media(max-width:719px){.pw-side{position:fixed;top:58px;left:0;bottom:0;z-index:50;width:min(86vw,280px);box-shadow:16px 0 60px rgba(0,0,0,0.5)}.pw-side--mini{width:min(86vw,280px);padding:14px 12px;align-items:stretch}.pw-side--mini .pw-lbl,.pw-side--mini .pw-sec,.pw-side--mini .pw-pcard-meta,.pw-side--mini .pw-foot{display:block}.pw-side--mini .pw-pcard{padding:11px;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(150deg,rgba(255,255,255,0.05),rgba(255,255,255,0.012));justify-content:flex-start}.pw-side--mini .pw-link{justify-content:flex-start;padding:11px 12px;width:100%;margin:0 0 3px}}",
].join("");

function firstActiveModule(modules) {
  var order = ["documents", "investments", "notes", "analytics", "inventory"];
  for (var i = 0; i < order.length; i++) {
    if (modules[order[i]]) return order[i];
  }
  return "documents";
}

export default function ProjectWorkspace() {
  var navigate = useNavigate();
  var params = useParams();
  var projectId = params.projectId;
  var moduleId = params.moduleId;
  var projectsS = useState([]);
  var projects = projectsS[0], setProjects = projectsS[1];
  var loadedS = useState(false);
  var loaded = loadedS[0], setLoaded = loadedS[1];
  var sidebarS = useState(true);
  var sidebarOpen = sidebarS[0], setSidebarOpen = sidebarS[1];
  var navCollapsedS = useState(false);
  var navCollapsed = navCollapsedS[0], setNavCollapsed = navCollapsedS[1];
  var vwS = useState(window.innerWidth);
  var isMobile = vwS[0] < 720;

  useEffect(function() {
    function onResize() { vwS[1](window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  useEffect(function() {
    synapseStore.loadProjects().then(function(list) {
      setProjects(list);
      setLoaded(true);
    });
  }, []);

  useEffect(function() {
    if (!projectId) return;
    projectModuleStore.pullProjectModules(projectId);
    function refreshModules() {
      if (document.visibilityState !== "visible") return;
      projectModuleStore.pullProjectModules(projectId);
    }
    document.addEventListener("visibilitychange", refreshModules);
    window.addEventListener("focus", refreshModules);
    return function() {
      document.removeEventListener("visibilitychange", refreshModules);
      window.removeEventListener("focus", refreshModules);
    };
  }, [projectId]);

  useEffect(function() {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  var project = useMemo(function() {
    return projects.find(function(p) { return p.id === projectId; }) || null;
  }, [projects, projectId]);

  var activeModules = useMemo(function() {
    if (!project) return [];
    return synapseStore.MODULE_META.filter(function(m) { return project.modules && project.modules[m.id]; });
  }, [project]);

  var resolvedModule = moduleId;
  if (project && moduleId && (!project.modules || !project.modules[moduleId])) {
    resolvedModule = firstActiveModule(project.modules || synapseStore.DEFAULT_MODULES);
  }

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: "#06060C", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", color: ACCENT, opacity: 0.5 }}>A carregar...</p>
      </div>
    );
  }

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  if (!moduleId || resolvedModule !== moduleId) {
    return <Navigate to={"/projects/" + projectId + "/" + (resolvedModule || firstActiveModule(project.modules))} replace />;
  }

  function goModule(id) {
    navigate("/projects/" + projectId + "/" + id);
    if (isMobile) setSidebarOpen(false);
  }

  function toggleSidebar() {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
      return;
    }
    if (sidebarOpen && !navCollapsed) {
      setNavCollapsed(true);
      return;
    }
    if (sidebarOpen && navCollapsed) {
      setNavCollapsed(false);
      return;
    }
    setSidebarOpen(true);
    setNavCollapsed(false);
  }

  function renderModule() {
    if (moduleId === "documents") {
      return <Synapse projectId={projectId} embedded />;
    }
    if (moduleId === "investments") return <ProjectInvestments projectId={projectId} />;
    if (moduleId === "notes") return <ProjectNotes projectId={projectId} />;
    if (moduleId === "analytics") return <ProjectAnalytics projectId={projectId} />;
    if (moduleId === "inventory") return <ProjectInventory projectId={projectId} />;
    return null;
  }

  var isFullBleed = moduleId === "documents";
  var pColor = project.color || ACCENT;
  var sidebarClass = "pw-side";
  if (!sidebarOpen) sidebarClass += " pw-side--closed";
  else if (navCollapsed && !isMobile) sidebarClass += " pw-side--mini";

  return (
    <div className="pw">
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{SIDEBAR_CSS}</style>

      <header className="pw-head">
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <button type="button" className="pw-hbtn" onClick={function() { navigate("/projects"); }} title="Projetos">←</button>
          <button type="button" className="pw-hbtn" onClick={toggleSidebar} title="Menu de módulos">
            {!isMobile && sidebarOpen && navCollapsed ? "▸" : !isMobile && sidebarOpen ? "◂" : "☰"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0, marginLeft: 4 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: pColor, boxShadow: "0 0 10px " + pColor, flexShrink: 0 }} />
            <h1 style={{ margin: 0, fontSize: 14, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.name}</h1>
          </div>
        </div>
        <button type="button" className="pw-hbtn" onClick={function() { navigate("/"); }}>Hub</button>
      </header>

      <div className="pw-shell">
        {sidebarOpen && isMobile && <div className="pw-bk" onClick={function() { setSidebarOpen(false); }} />}
        <aside className={sidebarClass}>
          <div className="pw-pcard">
            <div className="pw-pic" style={{ background: pColor + "1a", color: pColor, boxShadow: "0 0 16px " + pColor + "26" }}>✦</div>
            <div style={{ minWidth: 0 }}>
              <p className="pw-pname">{project.name}</p>
              <p className="pw-pcard-meta">{activeModules.length} módulos</p>
            </div>
          </div>
          <p className="pw-sec">MÓDULOS</p>
          {activeModules.map(function(m) {
            var active = moduleId === m.id;
            var lc = MODULE_COLORS[m.id] || ACCENT;
            return (
              <button type="button" key={m.id} className={"pw-link" + (active ? " on" : "")} onClick={function() { goModule(m.id); }} title={m.label} style={{ "--lc": lc }}>
                <span className="pw-lic" style={active ? { background: lc + "22", color: lc, boxShadow: "0 0 12px " + lc + "33" } : { color: "rgba(255,255,255,0.5)" }}>{MODULE_ICONS[m.id] || "·"}</span>
                <span className="pw-lbl">{m.label}</span>
              </button>
            );
          })}
          {project.description && (
            <p className="pw-foot">{project.description}</p>
          )}
        </aside>
        <main className="pw-main">
          <div className="pw-main-in" style={isFullBleed ? { padding: 0 } : null}>
            {renderModule()}
          </div>
        </main>
      </div>
    </div>
  );
}
