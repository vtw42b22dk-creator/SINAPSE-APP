import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as synapseStore from "../lib/synapseStore";
import * as projectModuleStore from "../lib/projectModuleStore";
import * as tasksStore from "../lib/tasksStore";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { pageBg, pageText } from "../lib/ThemeContext";

var ACCENT = "#FF3D8A";
var CYAN = "#00FFC8";

var MODULE_ICONS = {
  documents: "✦",
  investments: "€",
  notes: "✎",
  analytics: "◈",
  inventory: "▦",
};

var PROJ_CSS = [
  "@keyframes projIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}",
  "@keyframes projPulse{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:.85;transform:scale(1.06)}}",
  "@keyframes projShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}",
  "@keyframes orbDrift{0%,100%{transform:translate(0,0)}50%{transform:translate(18px,-12px)}}",
  ".proj-page{position:relative;display:flex;flex-direction:column;height:100vh;min-height:100vh;overflow:hidden;background:#06060C}",
  ".proj-bg{position:absolute;inset:0;pointer-events:none;overflow:hidden}",
  ".proj-bg-orb{position:absolute;border-radius:50%;filter:blur(80px);animation:orbDrift 14s ease-in-out infinite}",
  ".proj-bg-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px);background-size:32px 32px;mask-image:radial-gradient(ellipse 80% 70% at 50% 40%,black,transparent)}",
  ".proj-header{position:relative;z-index:20;flex-shrink:0;display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(6,6,12,0.82);backdrop-filter:blur(18px)}",
  ".proj-header-search{flex:1;max-width:360px;position:relative}",
  ".proj-header-search input{width:100%;padding:8px 12px 8px 34px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.35);color:#fff;font-size:12px;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s}",
  ".proj-header-search input:focus{border-color:rgba(255,61,138,0.45);box-shadow:0 0 0 3px rgba(255,61,138,0.1)}",
  ".proj-header-search svg{position:absolute;left:11px;top:50%;transform:translateY(-50%);opacity:.35;pointer-events:none}",
  ".proj-body{position:relative;z-index:1;flex:1;display:flex;min-height:0;overflow:hidden}",
  ".proj-rail{width:232px;flex-shrink:0;display:flex;flex-direction:column;gap:10px;padding:12px 10px;border-right:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.28);backdrop-filter:blur(12px);overflow-y:auto}",
  ".proj-stat{display:flex;align-items:center;gap:10px;padding:10px 11px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.025);transition:transform .18s,border-color .18s}",
  ".proj-stat:hover{transform:translateX(2px);border-color:rgba(255,255,255,0.1)}",
  ".proj-stat-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}",
  ".proj-stat-val{margin:0;font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:600;line-height:1.1}",
  ".proj-stat-lbl{margin:2px 0 0;font-size:8px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.32);letter-spacing:.5px;text-transform:uppercase}",
  ".proj-rail-title{margin:2px 4px 0;font-size:8px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.22);letter-spacing:1.2px}",
  ".proj-filter-row{display:flex;flex-wrap:wrap;gap:5px}",
  ".proj-filter-chip{padding:5px 9px;border-radius:999px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.4);font-size:9px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all .18s}",
  ".proj-filter-chip--on{border-color:rgba(255,61,138,0.5);background:rgba(255,61,138,0.12);color:#FF3D8A}",
  ".proj-main-area{flex:1;min-width:0;overflow-y:auto;padding:12px 14px 20px;-webkit-overflow-scrolling:touch}",
  ".proj-bento{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:11px;align-content:start}",
  ".proj-card{position:relative;border-radius:14px;padding:0;cursor:pointer;overflow:hidden;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(155deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015));transition:transform .18s cubic-bezier(.2,.8,.2,1),box-shadow .22s,border-color .22s;animation:projIn .45s ease both;--rx:0deg;--ry:0deg}",
  ".proj-card:hover{transform:perspective(800px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateY(-4px) scale(1.01);box-shadow:0 20px 50px rgba(0,0,0,0.45)}",
  ".proj-card-strip{height:3px;background:linear-gradient(90deg,var(--pc),transparent 80%)}",
  ".proj-card-inner{padding:12px 13px 11px;display:flex;flex-direction:column;gap:8px;min-height:132px}",
  ".proj-card-top{display:flex;align-items:flex-start;gap:10px}",
  ".proj-card-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;position:relative}",
  ".proj-card-icon::after{content:'';position:absolute;inset:-2px;border-radius:14px;border:1px solid var(--pc);opacity:0;transition:opacity .2s}",
  ".proj-card:hover .proj-card-icon::after{opacity:.35;animation:projPulse 2s ease infinite}",
  ".proj-card-name{margin:0;font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".proj-card-tag{display:inline-block;margin-top:3px;padding:2px 7px;border-radius:999px;font-size:8px;font-family:'JetBrains Mono',monospace;letter-spacing:.4px}",
  ".proj-card-desc{margin:0;font-size:11px;color:rgba(255,255,255,0.38);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:0}",
  ".proj-card-mods{display:flex;flex-wrap:wrap;gap:4px}",
  ".proj-mod-pill{width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.25);color:rgba(255,255,255,0.55);transition:transform .15s,border-color .15s,box-shadow .15s}",
  ".proj-card:hover .proj-mod-pill{transform:translateY(-1px)}",
  ".proj-card-metrics{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:4px;border-top:1px solid rgba(255,255,255,0.05)}",
  ".proj-ring-wrap{display:flex;align-items:center;gap:7px}",
  ".proj-ring{--pct:0;width:30px;height:30px;border-radius:50%;background:conic-gradient(var(--pc) calc(var(--pct)*1%),rgba(255,255,255,0.06) 0);display:flex;align-items:center;justify-content:center;flex-shrink:0}",
  ".proj-ring-inner{width:22px;height:22px;border-radius:50%;background:#0a0a10;display:flex;align-items:center;justify-content:center;font-size:8px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.55)}",
  ".proj-roi-pill{padding:3px 8px;border-radius:999px;font-size:9px;font-family:'JetBrains Mono',monospace;font-weight:600}",
  ".proj-card-cta{position:absolute;bottom:11px;right:12px;font-size:9px;font-family:'JetBrains Mono',monospace;color:var(--pc);opacity:0;transform:translateX(-6px);transition:opacity .2s,transform .2s}",
  ".proj-card:hover .proj-card-cta{opacity:.85;transform:none}",
  ".proj-card-del{position:absolute;top:8px;right:8px;width:24px;height:24px;border-radius:7px;border:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.35);color:rgba(255,255,255,0.28);cursor:pointer;font-size:12px;opacity:0;transition:opacity .18s,background .18s;z-index:2}",
  ".proj-card:hover .proj-card-del{opacity:1}",
  ".proj-card-del:hover{background:rgba(255,61,90,0.15);color:#FF3D5A;border-color:rgba(255,61,90,0.35)}",
  ".proj-card--hero{grid-column:span 2}",
  ".proj-card--hero .proj-card-inner{min-height:118px;flex-direction:row;flex-wrap:wrap;align-items:center}",
  ".proj-card--hero .proj-card-desc{-webkit-line-clamp:1;flex:1 1 100%}",
  ".proj-empty{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;border-radius:16px;border:1px dashed rgba(255,61,138,0.25);background:rgba(255,61,138,0.04);text-align:center}",
  ".proj-modal-backdrop{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,0.65);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;animation:projIn .25s ease}",
  ".proj-modal{width:min(440px,100%);border-radius:16px;border:1px solid rgba(255,61,138,0.3);background:linear-gradient(160deg,#101018,#0a0a12);box-shadow:0 30px 80px rgba(0,0,0,0.55),0 0 40px rgba(255,61,138,0.08);padding:18px;animation:projIn .3s ease}",
  ".proj-modal-mods{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}",
  ".proj-modal-mod{padding:8px 4px;border-radius:9px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.35);font-size:8px;font-family:'JetBrains Mono',monospace;cursor:pointer;text-align:center;transition:all .15s}",
  ".proj-modal-mod--on{border-color:rgba(255,61,138,0.5);background:rgba(255,61,138,0.12);color:#FF3D8A}",
  ".proj-btn-primary{padding:9px 16px;border-radius:10px;border:1px solid rgba(255,61,138,0.5);background:linear-gradient(135deg,rgba(255,61,138,0.22),rgba(255,61,138,0.08));color:#FF3D8A;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;cursor:pointer;transition:transform .15s,box-shadow .15s}",
  ".proj-btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(255,61,138,0.2)}",
  ".proj-btn-ghost{padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer}",
  "@media(max-width:719px){.proj-body{flex-direction:column}.proj-rail{width:100%;flex-direction:row;flex-wrap:wrap;border-right:none;border-bottom:1px solid rgba(255,255,255,0.05);padding:10px 12px}.proj-stat{flex:1 1 calc(50% - 6px);min-width:140px}.proj-rail-title{display:none}.proj-filter-row{width:100%}.proj-bento{grid-template-columns:1fr}.proj-card--hero{grid-column:span 1}.proj-header-search{max-width:none}}",
].join("");

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
  if (/hardware|chip|pcb|arduino|component|invent/i.test(t)) return { icon: "◈", tag: "Hardware", color: CYAN };
  if (/resale|sneaker|sapatilha|venda|flip|streetwear|stock/i.test(t)) return { icon: "◇", tag: "Resale", color: ACCENT };
  if (/software|app|web|code|dev|saas/i.test(t)) return { icon: "⌘", tag: "Software", color: "#6B8AFF" };
  return { icon: "✦", tag: "Projeto", color: p.color || ACCENT };
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/>
    </svg>
  );
}

function ProjectCard(props) {
  var p = props.project;
  var meta = props.meta;
  var st = props.stats || {};
  var activeMods = props.activeMods;
  var donePct = st.total > 0 ? Math.round(((st.total - st.pending) / st.total) * 100) : 0;
  var delay = (props.index || 0) * 0.05;
  var cardRef = useRef(null);

  function onMove(e) {
    if (!cardRef.current) return;
    var rect = cardRef.current.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width - 0.5;
    var y = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.setProperty("--rx", (-y * 5) + "deg");
    cardRef.current.style.setProperty("--ry", (x * 5) + "deg");
  }

  function onLeave() {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty("--rx", "0deg");
    cardRef.current.style.setProperty("--ry", "0deg");
  }

  return (
    <article
      ref={cardRef}
      className={"proj-card" + (props.hero ? " proj-card--hero" : "")}
      style={{ "--pc": meta.color, animationDelay: delay + "s", transform: "perspective(800px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))" }}
      onClick={props.onOpen}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="proj-card-strip" style={{ boxShadow: "0 0 12px " + meta.color + "55" }} />
      <div className="proj-card-inner">
        <button type="button" className="proj-card-del" onClick={props.onDelete} title="Apagar">×</button>
        <div className="proj-card-top">
          <div className="proj-card-icon" style={{ background: meta.color + "18", color: meta.color, boxShadow: "0 0 20px " + meta.color + "22" }}>
            {meta.icon}
          </div>
          <div style={{ minWidth: 0, flex: 1, paddingRight: 20 }}>
            <h2 className="proj-card-name">{p.name}</h2>
            <span className="proj-card-tag" style={{ color: meta.color, background: meta.color + "14", border: "1px solid " + meta.color + "33" }}>{meta.tag}</span>
          </div>
        </div>
        {p.description ? <p className="proj-card-desc">{p.description}</p> : null}
        <div className="proj-card-mods">
          {activeMods.map(function(m) {
            return (
              <span key={m.id} className="proj-mod-pill" title={m.label} style={{ borderColor: meta.color + "22", color: meta.color + "cc" }}>
                {MODULE_ICONS[m.id] || "·"}
              </span>
            );
          })}
        </div>
        <div className="proj-card-metrics">
          <div className="proj-ring-wrap">
            {st.total > 0 ? (
              <>
                <div className="proj-ring" style={{ "--pc": meta.color, "--pct": donePct }}>
                  <div className="proj-ring-inner">{donePct}%</div>
                </div>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.35)" }}>
                  {st.pending} pend. · {st.total}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.28)" }}>Sem tarefas</span>
            )}
          </div>
          {st.hasInvestments && (
            <span className="proj-roi-pill" style={{
              color: st.roi >= 0 ? "#34D399" : "#FF6B35",
              background: st.roi >= 0 ? "rgba(52,211,153,0.1)" : "rgba(255,107,53,0.1)",
              border: "1px solid " + (st.roi >= 0 ? "rgba(52,211,153,0.25)" : "rgba(255,107,53,0.25)"),
            }}>
              ROI {(st.roi >= 0 ? "+" : "") + st.roi.toFixed(0) + "%"}
            </span>
          )}
        </div>
        <span className="proj-card-cta">Abrir →</span>
      </div>
    </article>
  );
}

export default function Projects() {
  var navigate = useNavigate();
  var vwS = useState(window.innerWidth);
  var isMobile = vwS[0] < 720;
  var projectsS = useState([]);
  var projects = projectsS[0], setProjects = projectsS[1];
  var loadedS = useState(false);
  var loaded = loadedS[0], setLoaded = loadedS[1];
  var modalOpenS = useState(false);
  var modalOpen = modalOpenS[0], setModalOpen = modalOpenS[1];
  var nameS = useState("");
  var name = nameS[0], setName = nameS[1];
  var descS = useState("");
  var description = descS[0], setDescription = descS[1];
  var modulesS = useState(Object.assign({}, synapseStore.DEFAULT_MODULES));
  var modules = modulesS[0], setModules = modulesS[1];
  var statsS = useState({});
  var stats = statsS[0], setStats = statsS[1];
  var queryS = useState("");
  var query = queryS[0], setQuery = queryS[1];
  var filterS = useState("all");
  var filter = filterS[0], setFilter = filterS[1];

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

  var totals = useMemo(function() {
    var pending = 0, totalTasks = 0, roiSum = 0, roiCount = 0;
    projects.forEach(function(p) {
      var st = stats[p.id] || {};
      pending += st.pending || 0;
      totalTasks += st.total || 0;
      if (st.hasInvestments) { roiSum += st.roi; roiCount++; }
    });
    return {
      count: projects.length,
      pending: pending,
      totalTasks: totalTasks,
      avgRoi: roiCount ? roiSum / roiCount : null,
    };
  }, [projects, stats]);

  var filtered = useMemo(function() {
    var q = query.trim().toLowerCase();
    return projects.filter(function(p) {
      var meta = projectTypeMeta(p);
      if (filter === "hardware" && meta.tag !== "Hardware") return false;
      if (filter === "resale" && meta.tag !== "Resale") return false;
      if (filter === "software" && meta.tag !== "Software") return false;
      if (filter === "active") {
        var st = stats[p.id] || {};
        if (!st.pending && !st.total) return false;
      }
      if (!q) return true;
      return ((p.name || "") + " " + (p.description || "") + " " + meta.tag).toLowerCase().indexOf(q) >= 0;
    });
  }, [projects, query, filter, stats]);

  var heroId = useMemo(function() {
    if (!filtered.length) return null;
    var best = filtered[0];
    var bestScore = -1;
    filtered.forEach(function(p) {
      var st = stats[p.id] || {};
      var score = (st.pending || 0) * 2 + (st.total || 0) + (st.hasInvestments ? 3 : 0);
      if (score > bestScore) { bestScore = score; best = p; }
    });
    return best.id;
  }, [filtered, stats]);

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
    setModalOpen(false);
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
    <div className="proj-page" data-scrollable style={{ color: text, fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{MODULE_ENTRY_CSS + PROJ_CSS}</style>

      <div className="proj-bg">
        <div className="proj-bg-grid" />
        <div className="proj-bg-orb" style={{ width: 420, height: 420, top: "-8%", left: "-6%", background: "rgba(255,61,138,0.12)", animationDelay: "0s" }} />
        <div className="proj-bg-orb" style={{ width: 360, height: 360, bottom: "-10%", right: "-4%", background: "rgba(0,255,200,0.08)", animationDelay: "-4s" }} />
        <div className="proj-bg-orb" style={{ width: 280, height: 280, top: "40%", left: "45%", background: "rgba(107,138,255,0.06)", animationDelay: "-7s" }} />
      </div>

      <header className="proj-header">
        <button type="button" onClick={function() { navigate("/"); }} className="proj-btn-ghost">← Hub</button>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: ACCENT, letterSpacing: 1.2 }}>PROJETOS</h1>
          <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.28)" }}>{totals.count}</span>
        </div>
        <div className="proj-header-search">
          <SearchIcon />
          <input value={query} onChange={function(e) { setQuery(e.target.value); }} placeholder="Filtrar projetos..." />
        </div>
        <button type="button" className="proj-btn-primary" onClick={function() { setModalOpen(true); }}>+ Novo</button>
      </header>

      <div className="proj-body">
        <aside className="proj-rail">
          <p className="proj-rail-title">PAINEL</p>
          <div className="proj-stat">
            <div className="proj-stat-icon" style={{ background: ACCENT + "18", color: ACCENT }}>◫</div>
            <div>
              <p className="proj-stat-val">{totals.count}</p>
              <p className="proj-stat-lbl">Projetos</p>
            </div>
          </div>
          <div className="proj-stat">
            <div className="proj-stat-icon" style={{ background: "#7B61FF22", color: "#7B61FF" }}>◎</div>
            <div>
              <p className="proj-stat-val">{totals.pending}</p>
              <p className="proj-stat-lbl">Tarefas pendentes</p>
            </div>
          </div>
          <div className="proj-stat">
            <div className="proj-stat-icon" style={{ background: CYAN + "18", color: CYAN }}>✓</div>
            <div>
              <p className="proj-stat-val">{totals.totalTasks}</p>
              <p className="proj-stat-lbl">Total tarefas</p>
            </div>
          </div>
          {totals.avgRoi != null && (
            <div className="proj-stat">
              <div className="proj-stat-icon" style={{ background: "rgba(52,211,153,0.12)", color: "#34D399" }}>€</div>
              <div>
                <p className="proj-stat-val" style={{ color: totals.avgRoi >= 0 ? "#34D399" : "#FF6B35" }}>
                  {(totals.avgRoi >= 0 ? "+" : "") + totals.avgRoi.toFixed(0) + "%"}
                </p>
                <p className="proj-stat-lbl">ROI médio</p>
              </div>
            </div>
          )}
          <p className="proj-rail-title" style={{ marginTop: 6 }}>FILTROS</p>
          <div className="proj-filter-row">
            {[
              { id: "all", label: "Todos" },
              { id: "active", label: "Ativos" },
              { id: "hardware", label: "HW" },
              { id: "resale", label: "Resale" },
              { id: "software", label: "Dev" },
            ].map(function(f) {
              return (
                <button type="button" key={f.id} className={"proj-filter-chip" + (filter === f.id ? " proj-filter-chip--on" : "")} onClick={function() { setFilter(f.id); }}>
                  {f.label}
                </button>
              );
            })}
          </div>
          {!isMobile && (
            <button type="button" className="proj-btn-primary" style={{ marginTop: "auto", width: "100%" }} onClick={function() { setModalOpen(true); }}>
              + Criar projeto
            </button>
          )}
        </aside>

        <main className="proj-main-area">
          {filtered.length === 0 ? (
            <div className="proj-empty">
              <p style={{ margin: "0 0 6px", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: ACCENT }}>Nenhum projeto encontrado</p>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                {query || filter !== "all" ? "Ajusta a pesquisa ou filtros." : "Cria o teu primeiro workspace modular."}
              </p>
              <button type="button" className="proj-btn-primary" onClick={function() { setModalOpen(true); }}>+ Criar projeto</button>
            </div>
          ) : (
            <div className="proj-bento">
              {filtered.map(function(p, idx) {
                var meta = projectTypeMeta(p);
                var activeMods = synapseStore.MODULE_META.filter(function(m) { return p.modules && p.modules[m.id]; });
                return (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    meta={meta}
                    stats={stats[p.id]}
                    activeMods={activeMods}
                    index={idx}
                    hero={!isMobile && p.id === heroId && filtered.length > 2}
                    onOpen={function() { openProject(p); }}
                    onDelete={function(e) { removeProject(e, p); }}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>

      {modalOpen && (
        <div className="proj-modal-backdrop" onClick={function(e) { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="proj-modal" onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: ACCENT, letterSpacing: 1 }}>NOVO PROJETO</p>
              <button type="button" className="proj-btn-ghost" onClick={function() { setModalOpen(false); }} style={{ padding: "4px 8px" }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={name} onChange={function(e) { setName(e.target.value); }} placeholder="Nome do projeto"
                style={inputStyle()} onKeyDown={function(e) { if (e.key === "Enter") createProject(); }} autoFocus />
              <textarea value={description} onChange={function(e) { setDescription(e.target.value); }} placeholder="Descrição — ex: Resale sneakers, SaaS, hardware..."
                rows={2} style={Object.assign({}, inputStyle(), { resize: "none", lineHeight: 1.45, fontSize: 13 })} />
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.32)", letterSpacing: 0.5 }}>MÓDULOS</p>
                <div className="proj-modal-mods">
                  {synapseStore.MODULE_META.map(function(m) {
                    var on = modules[m.id];
                    return (
                      <button type="button" key={m.id} className={"proj-modal-mod" + (on ? " proj-modal-mod--on" : "")} onClick={function() { toggleModule(m.id); }} title={m.desc}>
                        <div style={{ fontSize: 12, marginBottom: 2 }}>{MODULE_ICONS[m.id]}</div>
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" className="proj-btn-primary" style={{ flex: 1 }} onClick={createProject}>Criar e abrir</button>
                <button type="button" className="proj-btn-ghost" onClick={function() { setModalOpen(false); }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function inputStyle() {
  return { width: "100%", background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
}
