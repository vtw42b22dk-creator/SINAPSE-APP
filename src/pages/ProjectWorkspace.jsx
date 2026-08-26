import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import * as synapseStore from "../lib/synapseStore";
import * as projectModuleStore from "../lib/projectModuleStore";
import Synapse from "./Synapse";
import { ProjectInvestments, ProjectNotes, ProjectAnalytics, ProjectInventory } from "../components/ProjectModules";

import { moduleColor, moduleGlow, MODULE_GLOW_CSS } from "../lib/theme";

var ACCENT = moduleColor("projects");

var MODULE_ICONS = {
  documents: "✦",
  investments: "€",
  notes: "✎",
  analytics: "◈",
  inventory: "▦",
};

var MODULE_COLORS = {
  documents: "#8FA8C4",
  investments: "#8FB39B",
  notes: "#C4A57C",
  analytics: "#C08C8C",
  inventory: "#A0A0A8",
};

var SIDEBAR_CSS = [
  MODULE_GLOW_CSS,
  ".pw{height:100vh;display:flex;flex-direction:column;background:#0A0A0B;color:#EDEDEF;overflow:hidden;font-family:'IBM Plex Sans',sans-serif}",
  ".pw-head{flex-shrink:0;height:60px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 20px;border-bottom:1px solid rgba(255,255,255,0.07);background:#0A0A0B;z-index:30}",
  ".pw-hbtn{display:inline-flex;align-items:center;justify-content:center;height:36px;min-width:36px;padding:0 4px;border:none;border-bottom:1px solid currentColor;background:transparent;color:#A0A0A8;cursor:pointer;font-size:13px;font-family:inherit;flex-shrink:0}",
  ".pw-shell{flex:1;display:flex;min-height:0}",
  ".pw-side{width:clamp(212px,17vw,256px);flex-shrink:0;display:flex;flex-direction:column;padding:16px 12px;border-right:1px solid rgba(255,255,255,0.07);background:#0A0A0B;overflow-y:auto;transition:width var(--dur) var(--ease),padding var(--dur) var(--ease)}",
  ".pw-side--closed{width:0;padding:0;border:none;overflow:hidden}",
  ".pw-side--mini{width:66px;padding:16px 8px;align-items:center}",
  ".pw-side--mini .pw-lbl,.pw-side--mini .pw-sec,.pw-side--mini .pw-pcard-meta,.pw-side--mini .pw-foot{display:none}",
  ".pw-pcard{display:flex;align-items:center;gap:12px;padding:14px 0;border:none;border-bottom:1px solid rgba(255,255,255,0.08);background:transparent;margin-bottom:20px}",
  ".pw-side--mini .pw-pcard{padding:0;border:none;background:none;justify-content:center;margin-bottom:20px}",
  ".pw-pic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}",
  ".pw-pname{margin:0;font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:500;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".pw-pcard-meta{margin:4px 0 0;font-size:10.5px;font-family:'JetBrains Mono',monospace;color:#6E6E76;letter-spacing:.4px}",
  ".pw-sec{margin:4px 4px 12px;font-size:10px;font-family:'JetBrains Mono',monospace;font-weight:500;color:#6E6E76;letter-spacing:1.6px}",
  ".pw-link{position:relative;display:flex;align-items:center;gap:12px;width:100%;padding:11px 12px;margin-bottom:4px;border-radius:10px;border:1px solid transparent;background:transparent;color:#A0A0A8;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:12.5px;line-height:1.5;text-align:left;transition:background-color var(--dur) var(--ease),border-color var(--dur) var(--ease),color var(--dur) var(--ease);overflow:hidden}",
  ".pw-side--mini .pw-link{justify-content:center;padding:11px 0;width:46px;margin:0 auto 6px}",
  ".pw-link.on{color:#EDEDEF;background:#1A1A1D;border-color:rgba(255,255,255,0.14)}",
  ".pw-link.on::before{content:'';position:absolute;left:0;top:7px;bottom:7px;width:2px;border-radius:0 2px 2px 0;background:var(--lc);opacity:.7}",
  ".pw-lic{width:28px;height:28px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;transition:background-color var(--dur) var(--ease),color var(--dur) var(--ease)}",
  ".pw-lbl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}",
  ".pw-foot{margin-top:auto;padding:16px 8px 4px;font-size:11px;color:#6E6E76;line-height:1.55;border-top:1px solid rgba(255,255,255,0.06)}",
  ".pw-main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column}",
  ".pw-main-in{flex:1;min-height:0;overflow:hidden}",
  ".pw-bk{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:40;animation:appearIn var(--dur) var(--ease)}",
  "@media(hover:hover){.pw-hbtn:hover{background:#1A1A1D;color:#EDEDEF;border-color:rgba(255,255,255,0.14)}.pw-link:hover{color:#EDEDEF;background:#1A1A1D}}",
  "@media(max-width:719px){.pw-head{height:58px;padding:0 14px}.pw-hbtn{height:44px;min-width:44px;padding:0 14px;font-size:15px}.pw-side{position:fixed;top:58px;left:0;bottom:0;z-index:50;width:min(86vw,280px);box-shadow:16px 0 60px rgba(0,0,0,0.5)}.pw-side--mini{width:min(86vw,280px);padding:16px 12px;align-items:stretch}.pw-side--mini .pw-lbl,.pw-side--mini .pw-sec,.pw-side--mini .pw-pcard-meta,.pw-side--mini .pw-foot{display:block}.pw-side--mini .pw-pcard{padding:14px 12px;border:1px solid rgba(255,255,255,0.07);background:#141416;justify-content:flex-start}.pw-link{padding:13px 14px;min-height:48px}.pw-side--mini .pw-link{justify-content:flex-start;padding:13px 14px;width:100%;margin:0 0 4px;font-size:14px!important}.pw-lbl{font-size:13px!important}.pw-head-title{font-size:15px!important}}",
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
      <div style={{ minHeight: "100vh", background: "#0A0A0B", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
    <div className="pw" style={{ "--mc": pColor }}>
      <style>{SIDEBAR_CSS}</style>
      <div className="mod-glow" style={{ top: -90, right: "6%", background: moduleGlow(pColor) }} aria-hidden="true" />

      <header className="pw-head">
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <button type="button" className="pw-hbtn" onClick={function() { navigate("/projects"); }} title="Projetos">←</button>
          <button type="button" className="pw-hbtn" onClick={toggleSidebar} title="Menu de módulos">
            {!isMobile && sidebarOpen && navCollapsed ? "▸" : !isMobile && sidebarOpen ? "◂" : "☰"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, marginLeft: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: pColor, flexShrink: 0 }} />
            <h1 style={{ margin: 0, fontSize: 14, fontFamily: "'JetBrains Mono',monospace", fontWeight: 500, letterSpacing: ".2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: pColor }}>{project.name}</h1>
          </div>
        </div>
        <button type="button" className="pw-hbtn" onClick={function() { navigate("/"); }}>Hub</button>
      </header>

      <div className="pw-shell">
        {sidebarOpen && isMobile && <div className="pw-bk" onClick={function() { setSidebarOpen(false); }} />}
        <aside className={sidebarClass} data-stagger>
          <div className="pw-pcard">
            <div className="pw-pic" style={{ background: pColor + "14", color: pColor }}>✦</div>
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
                <span className="pw-lic" style={active ? { background: lc + "1a", color: lc } : { color: "#6E6E76" }}>{MODULE_ICONS[m.id] || "·"}</span>
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
