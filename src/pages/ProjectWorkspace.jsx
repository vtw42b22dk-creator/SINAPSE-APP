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

var SIDEBAR_CSS = ".proj-workspace-shell{flex:1;display:flex;min-height:0}.proj-sidebar{width:clamp(188px,16vw,240px);flex-shrink:0;display:flex;flex-direction:column;gap:2px;padding:10px 8px;border-right:1px solid rgba(255,255,255,0.06);background:rgba(8,10,14,0.88);backdrop-filter:blur(14px);overflow-y:auto;transition:width .22s ease,padding .22s ease}.proj-sidebar--closed{width:0;padding:0;border:none;overflow:hidden}.proj-sidebar--icon-only{width:52px;padding:8px 6px;align-items:center}.proj-sidebar--icon-only .proj-sidebar-label,.proj-sidebar--icon-only .proj-sidebar-section,.proj-sidebar--icon-only .proj-sidebar-desc{display:none}.proj-sidebar-section{margin:0 0 6px 10px;font-size:8px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.22);letter-spacing:1px}.proj-sidebar-link{position:relative;display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border-radius:9px;border:1px solid transparent;background:transparent;color:rgba(255,255,255,0.48);cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:10px;text-align:left;transition:all .18s;overflow:hidden}.proj-sidebar--icon-only .proj-sidebar-link{justify-content:center;padding:9px 0;width:40px;margin:0 auto}.proj-sidebar-link:hover{color:rgba(255,255,255,0.75);background:rgba(255,255,255,0.03)}.proj-sidebar-link--active{border-color:rgba(255,61,138,0.35);background:rgba(255,61,138,0.1);color:#FF3D8A;box-shadow:inset 3px 0 0 #FF3D8A,0 0 20px rgba(255,61,138,0.08)}.proj-sidebar-link--active .proj-sidebar-icon{text-shadow:0 0 10px rgba(255,61,138,0.6)}.proj-sidebar-icon{width:22px;text-align:center;opacity:.85;flex-shrink:0;font-size:13px}.proj-sidebar-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.proj-sidebar-collapse{align-self:flex-end;margin:4px 4px 8px;width:32px;height:28px;border-radius:8px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.4);cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;transition:all .18s}.proj-sidebar-collapse:hover{border-color:rgba(255,61,138,0.35);color:#FF3D8A}.proj-sidebar--icon-only .proj-sidebar-collapse{align-self:center;margin:6px auto 8px}.proj-main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column}.proj-main-inner{flex:1;min-height:0;overflow:hidden}.proj-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);z-index:40}@media(max-width:719px){.proj-sidebar{position:fixed;top:52px;left:0;bottom:0;z-index:50;width:min(88vw,260px);box-shadow:16px 0 60px rgba(0,0,0,0.5)}.proj-sidebar--icon-only{width:min(88vw,260px);padding:10px 8px}}";

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
  var sidebarClass = "proj-sidebar";
  if (!sidebarOpen) sidebarClass += " proj-sidebar--closed";
  else if (navCollapsed && !isMobile) sidebarClass += " proj-sidebar--icon-only";

  return (
    <div className={"proj-workspace" + (isMobile ? " proj-workspace--mobile" : "")} style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#06060C", color: "#fff", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{SIDEBAR_CSS}</style>

      <header style={{ flexShrink: 0, height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(6,6,12,0.95)", backdropFilter: "blur(12px)", zIndex: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <button type="button" onClick={function() { navigate("/projects"); }} style={hdrBtn()}>←</button>
          <button type="button" onClick={toggleSidebar} style={hdrBtn()} title="Menu de módulos">
            {!isMobile && sidebarOpen && navCollapsed ? "▸" : !isMobile && sidebarOpen ? "◂" : "☰"}
          </button>
          <h1 style={{ margin: 0, fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: ACCENT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.name}</h1>
        </div>
        <button type="button" onClick={function() { navigate("/"); }} style={hdrBtn()}>Hub</button>
      </header>

      <div className="proj-workspace-shell">
        {sidebarOpen && isMobile && <div className="proj-backdrop" onClick={function() { setSidebarOpen(false); }} />}
        <aside className={sidebarClass}>
          {!isMobile && sidebarOpen && (
            <button type="button" className="proj-sidebar-collapse" onClick={function() { setNavCollapsed(!navCollapsed); }} title={navCollapsed ? "Expandir" : "Colapsar"}>
              {navCollapsed ? "▸" : "◂"}
            </button>
          )}
          <p className="proj-sidebar-section">MÓDULOS</p>
          {activeModules.map(function(m) {
            var active = moduleId === m.id;
            return (
              <button type="button" key={m.id} className={"proj-sidebar-link" + (active ? " proj-sidebar-link--active" : "")} onClick={function() { goModule(m.id); }} title={m.label}>
                <span className="proj-sidebar-icon">{MODULE_ICONS[m.id] || "·"}</span>
                <span className="proj-sidebar-label">{m.label}</span>
              </button>
            );
          })}
          {project.description && (
            <p className="proj-sidebar-desc" style={{ margin: "14px 10px 0", fontSize: 9, color: "rgba(255,255,255,0.26)", lineHeight: 1.45 }}>{project.description}</p>
          )}
        </aside>
        <main className="proj-main">
          <div className="proj-main-inner" style={isFullBleed ? { padding: 0 } : { overflow: "auto" }}>
            {renderModule()}
          </div>
        </main>
      </div>
    </div>
  );
}

function hdrBtn() {
  return { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: "rgba(255,255,255,0.55)", padding: "5px 9px", cursor: "pointer", fontSize: 11, fontFamily: "inherit", flexShrink: 0 };
}
