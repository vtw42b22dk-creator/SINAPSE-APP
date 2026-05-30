import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as synapseStore from "../lib/synapseStore";
import * as projectModuleStore from "../lib/projectModuleStore";
import * as tasksStore from "../lib/tasksStore";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";

var ACCENT = "#FF3D8A";
var CYAN = "#00FFC8";
var PALETTE = ["#FF3D8A", "#00FFC8", "#6B8AFF", "#FFB800", "#34D399", "#FF6B35", "#B36BFF"];

var MODULE_ICONS = {
  documents: "✦",
  investments: "€",
  notes: "✎",
  analytics: "◈",
  inventory: "▦",
};

var PIN_KEY = "sinapse-pinned-projects-v1";
var VIEW_KEY = "sinapse-projects-view-v1";
var FILTER_KEY = "sinapse-project-filters-v1";

var DEFAULT_FILTERS = [
  { id: "cf_hw", label: "Hardware", kw: "hardware" },
  { id: "cf_resale", label: "Resale", kw: "resale" },
  { id: "cf_dev", label: "Dev", kw: "software" },
];

var PRESETS = [
  { id: "full", label: "Completo", mods: { documents: true, investments: true, notes: true, analytics: true, inventory: true } },
  { id: "fin", label: "Financeiro", mods: { documents: true, investments: true, notes: false, analytics: true, inventory: true } },
  { id: "simple", label: "Sem finanças", mods: { documents: true, investments: false, notes: true, analytics: false, inventory: false } },
];

function loadPins() {
  try { return JSON.parse(localStorage.getItem(PIN_KEY) || "[]"); } catch (e) { return []; }
}
function savePins(arr) {
  try { localStorage.setItem(PIN_KEY, JSON.stringify(arr)); } catch (e) {}
}
function loadFilters() {
  try {
    var v = localStorage.getItem(FILTER_KEY);
    if (v === null) return DEFAULT_FILTERS.slice();
    var arr = JSON.parse(v);
    return Array.isArray(arr) ? arr : DEFAULT_FILTERS.slice();
  } catch (e) { return DEFAULT_FILTERS.slice(); }
}
function saveFilters(arr) {
  try { localStorage.setItem(FILTER_KEY, JSON.stringify(arr)); } catch (e) {}
}

var PROJ_CSS = [
  "@keyframes pjFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}",
  ".pj-page{position:relative;display:flex;flex-direction:column;height:100vh;min-height:100vh;overflow:hidden;background:radial-gradient(120% 80% at 50% -10%,#11121c 0%,#08080f 55%,#06060b 100%);color:#fff;font-family:'IBM Plex Sans',sans-serif}",
  ".pj-top{flex-shrink:0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(8,8,14,0.7);backdrop-filter:blur(18px);z-index:10}",
  ".pj-brand{display:flex;align-items:baseline;gap:8px}",
  ".pj-brand h1{margin:0;font-family:'JetBrains Mono',monospace;font-size:14px;color:#FF3D8A;letter-spacing:1.5px}",
  ".pj-brand span{font-size:11px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.3)}",
  ".pj-search{flex:1;min-width:140px;max-width:340px;position:relative;display:flex;align-items:center}",
  ".pj-search svg{position:absolute;left:11px;opacity:.35;pointer-events:none}",
  ".pj-search input{width:100%;padding:8px 12px 8px 32px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.3);color:#fff;font-size:12px;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s}",
  ".pj-search input:focus{border-color:rgba(255,61,138,0.45);box-shadow:0 0 0 3px rgba(255,61,138,0.1)}",
  ".pj-select{padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.3);color:rgba(255,255,255,0.7);font-size:11px;font-family:'JetBrains Mono',monospace;outline:none;cursor:pointer}",
  ".pj-viewtog{display:flex;border-radius:10px;border:1px solid rgba(255,255,255,0.08);overflow:hidden}",
  ".pj-viewtog button{width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);border:none;color:rgba(255,255,255,0.4);cursor:pointer;transition:all .18s}",
  ".pj-viewtog button.on{background:rgba(255,61,138,0.14);color:#FF3D8A}",
  ".pj-new{padding:9px 16px;border-radius:10px;border:1px solid rgba(255,61,138,0.5);background:linear-gradient(135deg,rgba(255,61,138,0.25),rgba(255,61,138,0.08));color:#FF3D8A;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;cursor:pointer;transition:transform .15s,box-shadow .15s;white-space:nowrap}",
  ".pj-new:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(255,61,138,0.22)}",
  ".pj-strip{flex-shrink:0;display:flex;gap:10px;flex-wrap:wrap;padding:12px 16px 0}",
  ".pj-kpi{flex:1;min-width:120px;display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:13px;border:1px solid rgba(255,255,255,0.06);background:linear-gradient(150deg,rgba(255,255,255,0.05),rgba(255,255,255,0.012))}",
  ".pj-kpi-ic{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}",
  ".pj-kpi-v{margin:0;font-family:'JetBrains Mono',monospace;font-size:17px;font-weight:600;line-height:1}",
  ".pj-kpi-l{margin:3px 0 0;font-size:8px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.34);letter-spacing:.6px;text-transform:uppercase}",
  ".pj-chips{flex-shrink:0;display:flex;gap:6px;flex-wrap:wrap;padding:12px 16px 4px}",
  ".pj-chip{padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.42);font-size:10px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all .16s}",
  ".pj-chip:hover{color:rgba(255,255,255,0.7);border-color:rgba(255,255,255,0.16)}",
  ".pj-chip.on{border-color:rgba(255,61,138,0.5);background:rgba(255,61,138,0.13);color:#FF3D8A}",
  ".pj-chip-cf{display:inline-flex;align-items:center;gap:6px}",
  ".pj-chip-cf b{font-weight:inherit}",
  ".pj-chip-x{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border-radius:5px;background:rgba(255,255,255,0.08);font-size:11px;line-height:1;cursor:pointer}",
  ".pj-chip-x:hover{background:rgba(255,61,90,0.3);color:#fff}",
  ".pj-chip-add{border-style:dashed;color:rgba(255,255,255,0.45)}",
  ".pj-preset{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px}",
  ".pj-preset button{flex:1;min-width:90px;padding:9px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.025);color:rgba(255,255,255,0.5);font-size:10px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all .15s}",
  ".pj-preset button.on{border-color:rgba(255,61,138,0.5);background:rgba(255,61,138,0.12);color:#FF3D8A}",
  ".pj-scroll{flex:1;min-height:0;overflow-y:auto;padding:14px 16px 28px;-webkit-overflow-scrolling:touch}",
  ".pj-sech{margin:6px 2px 10px;font-size:9px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.3);letter-spacing:1.5px;display:flex;align-items:center;gap:8px}",
  ".pj-sech::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.06)}",
  ".pj-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:12px;align-content:start}",
  ".pj-list{display:flex;flex-direction:column;gap:8px}",
  ".pj-card{position:relative;border-radius:15px;cursor:pointer;overflow:hidden;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(155deg,rgba(255,255,255,0.052),rgba(255,255,255,0.014));transition:transform .2s cubic-bezier(.2,.8,.2,1),box-shadow .2s,border-color .2s;animation:pjFade .4s ease both}",
  ".pj-card:hover{transform:translateY(-3px);border-color:var(--pcb);box-shadow:0 16px 38px rgba(0,0,0,0.4)}",
  ".pj-card-bar{height:3px;background:var(--pc)}",
  ".pj-card-in{padding:13px 14px 12px;display:flex;flex-direction:column;gap:9px;min-height:128px}",
  ".pj-card-row{display:flex;align-items:flex-start;gap:11px}",
  ".pj-card-ic{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0}",
  ".pj-card-name{margin:0;font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".pj-card-tag{display:inline-block;margin-top:4px;padding:2px 8px;border-radius:999px;font-size:8px;font-family:'JetBrains Mono',monospace;letter-spacing:.5px}",
  ".pj-card-desc{margin:0;font-size:11px;color:rgba(255,255,255,0.4);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
  ".pj-mods{display:flex;flex-wrap:wrap;gap:4px}",
  ".pj-mod{width:23px;height:23px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.22)}",
  ".pj-card-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05)}",
  ".pj-ring{position:relative;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}",
  ".pj-ring i{position:absolute;inset:4px;border-radius:50%;background:#0b0b12;display:flex;align-items:center;justify-content:center;font-size:8px;font-style:normal;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.6)}",
  ".pj-roi{padding:3px 9px;border-radius:999px;font-size:9px;font-family:'JetBrains Mono',monospace;font-weight:600}",
  ".pj-act{position:absolute;top:9px;right:9px;display:flex;gap:5px;opacity:0;transition:opacity .18s;z-index:2}",
  ".pj-card:hover .pj-act{opacity:1}",
  ".pj-act button{width:25px;height:25px;border-radius:7px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.45);color:rgba(255,255,255,0.5);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;transition:all .15s}",
  ".pj-act button:hover{color:#fff;border-color:rgba(255,255,255,0.25)}",
  ".pj-act button.del:hover{background:rgba(255,61,90,0.18);color:#FF3D5A;border-color:rgba(255,61,90,0.4)}",
  ".pj-pin{position:absolute;top:9px;left:9px;font-size:11px;color:#FFB800;z-index:1;text-shadow:0 0 8px rgba(255,184,0,0.5)}",
  ".pj-rowcard{display:flex;align-items:center;gap:13px;padding:11px 14px;border-radius:13px;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(120deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012));cursor:pointer;transition:transform .16s,border-color .16s,box-shadow .16s;animation:pjFade .4s ease both;position:relative;overflow:hidden}",
  ".pj-rowcard:hover{transform:translateX(3px);border-color:var(--pcb);box-shadow:0 10px 26px rgba(0,0,0,0.34)}",
  ".pj-rowcard::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--pc)}",
  ".pj-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 20px;border-radius:18px;border:1px dashed rgba(255,61,138,0.25);background:rgba(255,61,138,0.04);text-align:center}",
  ".pj-mbk{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,0.66);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;animation:pjFade .22s ease}",
  ".pj-modal{width:min(450px,100%);border-radius:17px;border:1px solid rgba(255,61,138,0.3);background:linear-gradient(160deg,#11111b,#0a0a12);box-shadow:0 30px 80px rgba(0,0,0,0.55);padding:18px;animation:pjFade .28s ease}",
  ".pj-mods-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}",
  ".pj-mods-grid button{padding:9px 4px;border-radius:9px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.35);font-size:8px;font-family:'JetBrains Mono',monospace;cursor:pointer;text-align:center;transition:all .15s}",
  ".pj-mods-grid button.on{border-color:rgba(255,61,138,0.5);background:rgba(255,61,138,0.13);color:#FF3D8A}",
  ".pj-pal{display:flex;gap:7px;flex-wrap:wrap}",
  ".pj-pal button{width:26px;height:26px;border-radius:8px;border:2px solid transparent;cursor:pointer;transition:transform .15s}",
  ".pj-pal button:hover{transform:scale(1.12)}",
  ".pj-ghost{padding:9px 13px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.55);font-size:11px;cursor:pointer}",
  "@media(max-width:719px){.pj-strip{padding:10px 12px 0}.pj-kpi{min-width:calc(50% - 5px)}.pj-search{order:5;max-width:none;flex-basis:100%}.pj-grid{grid-template-columns:1fr}}",
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
  var color = p.color || ACCENT;
  if (/hardware|chip|pcb|arduino|component|invent/i.test(t)) return { icon: "◈", tag: "Hardware", color: color };
  if (/resale|sneaker|sapatilha|venda|flip|streetwear|stock/i.test(t)) return { icon: "◇", tag: "Resale", color: color };
  if (/software|app|web|code|dev|saas/i.test(t)) return { icon: "⌘", tag: "Software", color: color };
  return { icon: "✦", tag: "Projeto", color: color };
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7"/><path d="M20 20l-3-3"/>
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="4" width="18" height="3" rx="1.5"/><rect x="3" y="10.5" width="18" height="3" rx="1.5"/><rect x="3" y="17" width="18" height="3" rx="1.5"/>
    </svg>
  );
}

function ProgressRing(props) {
  var pct = props.pct;
  var color = props.color;
  return (
    <div className="pj-ring" style={{ background: "conic-gradient(" + color + " " + (pct * 3.6) + "deg,rgba(255,255,255,0.08) 0)" }}>
      <i>{pct}%</i>
    </div>
  );
}

function RoiPill(props) {
  var roi = props.roi;
  var pos = roi >= 0;
  return (
    <span className="pj-roi" style={{
      color: pos ? "#34D399" : "#FF6B35",
      background: pos ? "rgba(52,211,153,0.1)" : "rgba(255,107,53,0.1)",
      border: "1px solid " + (pos ? "rgba(52,211,153,0.25)" : "rgba(255,107,53,0.25)"),
    }}>
      ROI {(pos ? "+" : "") + roi.toFixed(0) + "%"}
    </span>
  );
}

function ProjectCard(props) {
  var p = props.project, meta = props.meta, st = props.stats || {}, activeMods = props.activeMods;
  var donePct = st.total > 0 ? Math.round(((st.total - st.pending) / st.total) * 100) : 0;
  return (
    <article className="pj-card" style={{ "--pc": meta.color, "--pcb": meta.color + "55", animationDelay: (props.index * 0.04) + "s" }} onClick={props.onOpen}>
      <div className="pj-card-bar" />
      {props.pinned && <span className="pj-pin" title="Fixado">★</span>}
      <div className="pj-act">
        <button type="button" title={props.pinned ? "Desafixar" : "Fixar"} onClick={props.onPin} style={props.pinned ? { color: "#FFB800", borderColor: "rgba(255,184,0,0.4)" } : null}>★</button>
        <button type="button" className="del" title="Apagar" onClick={props.onDelete}>×</button>
      </div>
      <div className="pj-card-in">
        <div className="pj-card-row">
          <div className="pj-card-ic" style={{ background: meta.color + "1a", color: meta.color, boxShadow: "0 0 18px " + meta.color + "22" }}>{meta.icon}</div>
          <div style={{ minWidth: 0, flex: 1, paddingRight: 44 }}>
            <h2 className="pj-card-name">{p.name}</h2>
            <span className="pj-card-tag" style={{ color: meta.color, background: meta.color + "14", border: "1px solid " + meta.color + "33" }}>{meta.tag}</span>
          </div>
        </div>
        {p.description ? <p className="pj-card-desc">{p.description}</p> : null}
        <div className="pj-mods">
          {activeMods.map(function(m) {
            return <span key={m.id} className="pj-mod" title={m.label} style={{ borderColor: meta.color + "22", color: meta.color + "cc" }}>{MODULE_ICONS[m.id] || "·"}</span>;
          })}
        </div>
        <div className="pj-card-foot">
          {st.total > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ProgressRing pct={donePct} color={meta.color} />
              <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.38)" }}>{st.pending} por fazer</span>
            </div>
          ) : (
            <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.28)" }}>Sem tarefas</span>
          )}
          {st.hasInvestments && <RoiPill roi={st.roi} />}
        </div>
      </div>
    </article>
  );
}

function ProjectRow(props) {
  var p = props.project, meta = props.meta, st = props.stats || {}, activeMods = props.activeMods;
  var donePct = st.total > 0 ? Math.round(((st.total - st.pending) / st.total) * 100) : 0;
  return (
    <div className="pj-rowcard" style={{ "--pc": meta.color, "--pcb": meta.color + "55", animationDelay: (props.index * 0.03) + "s" }} onClick={props.onOpen}>
      <div className="pj-card-ic" style={{ width: 36, height: 36, borderRadius: 10, background: meta.color + "1a", color: meta.color, fontSize: 16 }}>{meta.icon}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {props.pinned && <span style={{ color: "#FFB800", fontSize: 10 }}>★</span>}
          <h2 className="pj-card-name" style={{ fontSize: 13 }}>{p.name}</h2>
          <span className="pj-card-tag" style={{ marginTop: 0, color: meta.color, background: meta.color + "14", border: "1px solid " + meta.color + "33" }}>{meta.tag}</span>
        </div>
        {p.description ? <p className="pj-card-desc" style={{ WebkitLineClamp: 1, marginTop: 3 }}>{p.description}</p> : null}
      </div>
      <div className="pj-mods" style={{ flexShrink: 0 }}>
        {activeMods.slice(0, 5).map(function(m) {
          return <span key={m.id} className="pj-mod" title={m.label} style={{ borderColor: meta.color + "22", color: meta.color + "cc" }}>{MODULE_ICONS[m.id] || "·"}</span>;
        })}
      </div>
      {st.total > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
          <ProgressRing pct={donePct} color={meta.color} />
          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.38)", width: 52 }}>{st.pending} restam</span>
        </div>
      )}
      {st.hasInvestments && <RoiPill roi={st.roi} />}
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        <button type="button" title={props.pinned ? "Desafixar" : "Fixar"} onClick={props.onPin}
          style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)", color: props.pinned ? "#FFB800" : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12 }}>★</button>
        <button type="button" title="Apagar" onClick={props.onDelete}
          style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13 }}>×</button>
      </div>
    </div>
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
  var colorS = useState(PALETTE[0]);
  var color = colorS[0], setColor = colorS[1];
  var modulesS = useState(Object.assign({}, synapseStore.DEFAULT_MODULES));
  var modules = modulesS[0], setModules = modulesS[1];
  var statsS = useState({});
  var stats = statsS[0], setStats = statsS[1];
  var queryS = useState("");
  var query = queryS[0], setQuery = queryS[1];
  var filterS = useState("all");
  var filter = filterS[0], setFilter = filterS[1];
  var sortS = useState("destaque");
  var sort = sortS[0], setSort = sortS[1];
  var viewS = useState(function() { try { return localStorage.getItem(VIEW_KEY) || "grid"; } catch (e) { return "grid"; } });
  var view = viewS[0], setView = viewS[1];
  var pinsS = useState(loadPins);
  var pins = pinsS[0], setPins = pinsS[1];
  var cfS = useState(loadFilters);
  var customFilters = cfS[0], setCustomFilters = cfS[1];
  var manageS = useState(false);
  var manageFilters = manageS[0], setManageFilters = manageS[1];
  var presetS = useState("full");
  var preset = presetS[0], setPreset = presetS[1];

  useEffect(function() {
    function onResize() { vwS[1](window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  useEffect(function() {
    synapseStore.loadProjects().then(function(list) {
      if (list.length) { setProjects(list); setLoaded(true); return; }
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
      var tasks = results[0], invRows = results[1], next = {};
      projects.forEach(function(p) {
        var inv = invRows.find(function(d) { return d.id === p.id; });
        var projTasks = tasks.filter(function(t) { return t.synapse_project_id === p.id; });
        var pending = projTasks.filter(function(t) { return t.column !== "done"; }).length;
        next[p.id] = {
          roi: inv ? inv.totals.roi : 0,
          net: inv ? inv.totals.net : 0,
          hasInvestments: inv ? inv.totals.injected > 0 || inv.totals.returned > 0 : false,
          pending: pending,
          total: projTasks.length,
        };
      });
      setStats(next);
    });
  }, [projects]);

  function setViewPersist(v) { setView(v); try { localStorage.setItem(VIEW_KEY, v); } catch (e) {} }

  function addFilter() {
    var label = window.prompt("Nome do novo filtro:");
    if (!label || !label.trim()) return;
    var kw = window.prompt("Palavra-chave a procurar (no nome, descrição ou tipo):", label.trim());
    if (kw === null) return;
    var f = { id: "cf_" + Date.now().toString(36), label: label.trim(), kw: (kw || "").trim().toLowerCase() };
    var next = customFilters.concat([f]);
    setCustomFilters(next); saveFilters(next);
  }
  function editFilter(e, f) {
    e.stopPropagation();
    var label = window.prompt("Nome do filtro:", f.label);
    if (label === null) return;
    var kw = window.prompt("Palavra-chave:", f.kw);
    if (kw === null) return;
    var next = customFilters.map(function(x) { return x.id === f.id ? Object.assign({}, x, { label: label.trim() || x.label, kw: (kw || "").trim().toLowerCase() }) : x; });
    setCustomFilters(next); saveFilters(next);
  }
  function deleteFilter(e, id) {
    e.stopPropagation();
    var next = customFilters.filter(function(x) { return x.id !== id; });
    setCustomFilters(next); saveFilters(next);
    if (filter === id) setFilter("all");
  }
  function applyPreset(pr) {
    setPreset(pr.id);
    setModules(Object.assign({}, synapseStore.DEFAULT_MODULES, pr.mods));
  }

  function togglePin(e, id) {
    e.stopPropagation();
    setPins(function(prev) {
      var next = prev.indexOf(id) >= 0 ? prev.filter(function(x) { return x !== id; }) : prev.concat([id]);
      savePins(next);
      return next;
    });
  }

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
      donePct: totalTasks > 0 ? Math.round(((totalTasks - pending) / totalTasks) * 100) : 0,
      hasTasks: totalTasks > 0,
      avgRoi: roiCount ? roiSum / roiCount : null,
    };
  }, [projects, stats]);

  var filtered = useMemo(function() {
    var q = query.trim().toLowerCase();
    var cf = customFilters.find(function(x) { return x.id === filter; });
    var list = projects.filter(function(p) {
      var meta = projectTypeMeta(p);
      var text = ((p.name || "") + " " + (p.description || "") + " " + meta.tag).toLowerCase();
      if (filter === "pinned" && pins.indexOf(p.id) < 0) return false;
      if (filter === "active") {
        var st = stats[p.id] || {};
        if (!st.pending && !st.total) return false;
      }
      if (cf && cf.kw && text.indexOf(cf.kw) < 0) return false;
      if (!q) return true;
      return text.indexOf(q) >= 0;
    });
    function score(p) {
      var st = stats[p.id] || {};
      var done = st.total > 0 ? (st.total - st.pending) / st.total : 0;
      if (sort === "nome") return p.name.toLowerCase();
      if (sort === "pendentes") return -(st.pending || 0);
      if (sort === "progresso") return -done;
      if (sort === "roi") return -(st.hasInvestments ? st.roi : -9999);
      return -((st.pending || 0) * 2 + (st.total || 0) + (st.hasInvestments ? 3 : 0));
    }
    return list.slice().sort(function(a, b) {
      var pa = pins.indexOf(a.id) >= 0, pb = pins.indexOf(b.id) >= 0;
      if (pa !== pb) return pa ? -1 : 1;
      var sa = score(a), sb = score(b);
      if (typeof sa === "string") return sa.localeCompare(sb);
      return sa - sb;
    });
  }, [projects, query, filter, stats, sort, pins, customFilters]);

  function toggleModule(id) {
    setPreset("custom");
    setModules(function(prev) {
      var next = Object.assign({}, prev);
      next[id] = !next[id];
      if (!Object.keys(next).some(function(k) { return next[k]; })) next.documents = true;
      return next;
    });
  }

  function openModal() {
    setColor(PALETTE[projects.length % PALETTE.length]);
    setPreset("full");
    setModules(Object.assign({}, synapseStore.DEFAULT_MODULES));
    setModalOpen(true);
  }

  function createProject() {
    if (!name.trim()) return;
    var p = synapseStore.newProject(name.trim(), { description: description.trim(), modules: modules, color: color });
    var next = projects.concat([p]);
    setProjects(next);
    synapseStore.saveProjects(next);
    setName(""); setDescription(""); setColor(PALETTE[0]);
    setModules(Object.assign({}, synapseStore.DEFAULT_MODULES));
    setModalOpen(false);
    navigate("/projects/" + p.id);
  }

  function removeProject(e, p) {
    e.stopPropagation();
    if (!window.confirm("Apagar o projeto \"" + p.name + "\"?")) return;
    synapseStore.deleteProject(p.id, projects).then(function(next) { setProjects(next); });
  }

  function openProject(p) { navigate("/projects/" + p.id); }

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: "#06060b", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", color: ACCENT, opacity: 0.5 }}>A carregar projetos...</p>
      </div>
    );
  }

  var pinnedItems = filtered.filter(function(p) { return pins.indexOf(p.id) >= 0; });
  var otherItems = filtered.filter(function(p) { return pins.indexOf(p.id) < 0; });

  function renderItem(p, idx) {
    var meta = projectTypeMeta(p);
    var activeMods = synapseStore.MODULE_META.filter(function(m) { return p.modules && p.modules[m.id]; });
    var pinned = pins.indexOf(p.id) >= 0;
    var common = {
      key: p.id, project: p, meta: meta, stats: stats[p.id], activeMods: activeMods, index: idx, pinned: pinned,
      onOpen: function() { openProject(p); },
      onDelete: function(e) { removeProject(e, p); },
      onPin: function(e) { togglePin(e, p.id); },
    };
    return view === "list" ? <ProjectRow {...common} /> : <ProjectCard {...common} />;
  }

  return (
    <div className="pj-page" data-scrollable>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{MODULE_ENTRY_CSS + PROJ_CSS}</style>

      <header className="pj-top">
        <button type="button" onClick={function() { navigate("/"); }} className="pj-ghost">← Hub</button>
        <div className="pj-brand"><h1>PROJETOS</h1><span>{totals.count}</span></div>
        <div className="pj-search">
          <SearchIcon />
          <input value={query} onChange={function(e) { setQuery(e.target.value); }} placeholder="Procurar projeto..." />
        </div>
        <select className="pj-select" value={sort} onChange={function(e) { setSort(e.target.value); }} title="Ordenar">
          <option value="destaque">Destaque</option>
          <option value="nome">Nome A–Z</option>
          <option value="progresso">Progresso</option>
          <option value="pendentes">Mais pendentes</option>
          <option value="roi">Melhor ROI</option>
        </select>
        <div className="pj-viewtog">
          <button type="button" className={view === "grid" ? "on" : ""} onClick={function() { setViewPersist("grid"); }} title="Grelha"><GridIcon /></button>
          <button type="button" className={view === "list" ? "on" : ""} onClick={function() { setViewPersist("list"); }} title="Lista"><ListIcon /></button>
        </div>
        <button type="button" className="pj-new" onClick={openModal}>+ Novo</button>
      </header>

      {projects.length > 0 && (
        <div className="pj-strip">
          <div className="pj-kpi">
            <div className="pj-kpi-ic" style={{ background: ACCENT + "1a", color: ACCENT }}>◫</div>
            <div><p className="pj-kpi-v">{totals.count}</p><p className="pj-kpi-l">Projetos</p></div>
          </div>
          <div className="pj-kpi">
            <div className="pj-kpi-ic" style={{ background: "#7B61FF22", color: "#7B61FF" }}>◎</div>
            <div><p className="pj-kpi-v">{totals.pending}</p><p className="pj-kpi-l">Por fazer</p></div>
          </div>
          {totals.hasTasks && (
            <div className="pj-kpi">
              <div className="pj-kpi-ic" style={{ background: CYAN + "1a", color: CYAN }}>✓</div>
              <div><p className="pj-kpi-v" style={{ color: CYAN }}>{totals.donePct}%</p><p className="pj-kpi-l">Concluído</p></div>
            </div>
          )}
          {totals.avgRoi != null && (
            <div className="pj-kpi">
              <div className="pj-kpi-ic" style={{ background: "rgba(52,211,153,0.12)", color: "#34D399" }}>€</div>
              <div><p className="pj-kpi-v" style={{ color: totals.avgRoi >= 0 ? "#34D399" : "#FF6B35" }}>{(totals.avgRoi >= 0 ? "+" : "") + totals.avgRoi.toFixed(0) + "%"}</p><p className="pj-kpi-l">ROI médio</p></div>
            </div>
          )}
        </div>
      )}

      <div className="pj-chips">
        {[
          { id: "all", label: "Todos" },
          { id: "pinned", label: "★ Fixados" },
          { id: "active", label: "Ativos" },
        ].map(function(f) {
          return <button type="button" key={f.id} className={"pj-chip" + (filter === f.id ? " on" : "")} onClick={function() { setFilter(f.id); }}>{f.label}</button>;
        })}
        {customFilters.map(function(f) {
          return (
            <button type="button" key={f.id} className={"pj-chip pj-chip-cf" + (filter === f.id ? " on" : "")} onClick={function() { setFilter(f.id); }}>
              <b>{f.label}</b>
              {manageFilters && (
                <>
                  <span className="pj-chip-x" title="Editar" onClick={function(e) { editFilter(e, f); }}>✎</span>
                  <span className="pj-chip-x" title="Apagar" onClick={function(e) { deleteFilter(e, f.id); }}>×</span>
                </>
              )}
            </button>
          );
        })}
        {manageFilters && <button type="button" className="pj-chip pj-chip-add" onClick={addFilter}>+ Filtro</button>}
        <button type="button" className={"pj-chip" + (manageFilters ? " on" : "")} onClick={function() { setManageFilters(!manageFilters); }} title="Gerir filtros">
          {manageFilters ? "✓ Concluir" : "✎ Filtros"}
        </button>
      </div>

      <div className="pj-scroll">
        {filtered.length === 0 ? (
          <div className="pj-empty">
            <p style={{ margin: "0 0 6px", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: ACCENT }}>Nenhum projeto encontrado</p>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              {query || filter !== "all" ? "Ajusta a pesquisa ou filtros." : "Cria o teu primeiro workspace modular."}
            </p>
            <button type="button" className="pj-new" onClick={openModal}>+ Criar projeto</button>
          </div>
        ) : pinnedItems.length > 0 && filter === "all" && !query ? (
          <>
            <p className="pj-sech">FIXADOS</p>
            <div className={view === "list" ? "pj-list" : "pj-grid"} style={{ marginBottom: 18 }}>
              {pinnedItems.map(function(p, idx) { return renderItem(p, idx); })}
            </div>
            <p className="pj-sech">TODOS OS PROJETOS</p>
            <div className={view === "list" ? "pj-list" : "pj-grid"}>
              {otherItems.map(function(p, idx) { return renderItem(p, idx); })}
            </div>
          </>
        ) : (
          <div className={view === "list" ? "pj-list" : "pj-grid"}>
            {filtered.map(function(p, idx) { return renderItem(p, idx); })}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="pj-mbk" onClick={function(e) { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="pj-modal" onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: ACCENT, letterSpacing: 1 }}>NOVO PROJETO</p>
              <button type="button" className="pj-ghost" onClick={function() { setModalOpen(false); }} style={{ padding: "4px 9px" }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <input value={name} onChange={function(e) { setName(e.target.value); }} placeholder="Nome do projeto"
                style={inputStyle()} onKeyDown={function(e) { if (e.key === "Enter") createProject(); }} autoFocus />
              <textarea value={description} onChange={function(e) { setDescription(e.target.value); }} placeholder="Descrição — ex: Resale sneakers, SaaS, hardware..."
                rows={2} style={Object.assign({}, inputStyle(), { resize: "none", lineHeight: 1.45, fontSize: 13 })} />
              <div>
                <p style={lblMini()}>TIPO DE PROJETO</p>
                <div className="pj-preset">
                  {PRESETS.map(function(pr) {
                    return <button type="button" key={pr.id} className={preset === pr.id ? "on" : ""} onClick={function() { applyPreset(pr); }}>{pr.label}</button>;
                  })}
                </div>
              </div>
              <div>
                <p style={lblMini()}>COR</p>
                <div className="pj-pal">
                  {PALETTE.map(function(c) {
                    return <button type="button" key={c} onClick={function() { setColor(c); }} style={{ background: c + "33", borderColor: color === c ? c : "transparent", boxShadow: color === c ? "0 0 10px " + c + "66" : "none" }} title={c}>
                      <span style={{ display: "block", width: "100%", height: "100%", borderRadius: 5, background: c }} />
                    </button>;
                  })}
                </div>
              </div>
              <div>
                <p style={lblMini()}>MÓDULOS</p>
                <div className="pj-mods-grid">
                  {synapseStore.MODULE_META.map(function(m) {
                    return <button type="button" key={m.id} className={modules[m.id] ? "on" : ""} onClick={function() { toggleModule(m.id); }} title={m.desc}>
                      <div style={{ fontSize: 12, marginBottom: 2 }}>{MODULE_ICONS[m.id]}</div>{m.label}
                    </button>;
                  })}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" className="pj-new" style={{ flex: 1 }} onClick={createProject}>Criar e abrir</button>
                <button type="button" className="pj-ghost" onClick={function() { setModalOpen(false); }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function inputStyle() {
  return { width: "100%", background: "rgba(0,0,0,0.32)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
}
function lblMini() {
  return { margin: "0 0 6px", fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.32)", letterSpacing: 0.5 };
}
