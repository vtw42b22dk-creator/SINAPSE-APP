import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as synapseStore from "../lib/synapseStore";
import * as projectModuleStore from "../lib/projectModuleStore";
import * as tasksStore from "../lib/tasksStore";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";

var ACCENT = "#FF3D8A";
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

var PROJ_CSS = [
  "@keyframes pjFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}",
  "@keyframes pjGlow{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:.75;transform:scale(1.04)}}",
  ".pj-page{position:relative;display:flex;flex-direction:column;height:100vh;min-height:100vh;overflow:hidden;background:#06060b;color:#fff;font-family:'IBM Plex Sans',sans-serif}",
  ".pj-page::before{content:'';position:fixed;inset:0;pointer-events:none;background:radial-gradient(70% 55% at 50% 0%,rgba(255,61,138,0.11) 0%,transparent 55%),radial-gradient(45% 40% at 85% 75%,rgba(0,255,200,0.05) 0%,transparent 50%),linear-gradient(180deg,#0c0c14 0%,#06060b 100%);z-index:0}",
  ".pj-page::after{content:'';position:fixed;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px);background-size:28px 28px;mask-image:radial-gradient(ellipse 80% 70% at 50% 40%,#000 20%,transparent 75%);z-index:0}",
  ".pj-top{position:relative;z-index:2;flex-shrink:0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 18px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(8,8,14,0.82);backdrop-filter:blur(18px)}",
  ".pj-brand{display:flex;align-items:baseline;gap:8px}",
  ".pj-brand h1{margin:0;font-family:'JetBrains Mono',monospace;font-size:13px;color:#FF3D8A;letter-spacing:1.5px}",
  ".pj-brand span{font-size:10px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.28);padding:2px 7px;border-radius:999px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03)}",
  ".pj-search{flex:1;min-width:140px;max-width:300px;position:relative;display:flex;align-items:center}",
  ".pj-search svg{position:absolute;left:11px;opacity:.35;pointer-events:none}",
  ".pj-search input{width:100%;padding:7px 12px 7px 32px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.3);color:#fff;font-size:12px;outline:none;font-family:inherit;transition:border-color .2s,box-shadow .2s}",
  ".pj-search input:focus{border-color:rgba(255,61,138,0.45);box-shadow:0 0 0 3px rgba(255,61,138,0.1)}",
  ".pj-viewtog{display:flex;border-radius:10px;border:1px solid rgba(255,255,255,0.08);overflow:hidden}",
  ".pj-viewtog button{width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);border:none;color:rgba(255,255,255,0.4);cursor:pointer;transition:all .18s}",
  ".pj-viewtog button.on{background:rgba(255,61,138,0.14);color:#FF3D8A}",
  ".pj-new{padding:8px 14px;border-radius:10px;border:1px solid rgba(255,61,138,0.5);background:linear-gradient(135deg,rgba(255,61,138,0.25),rgba(255,61,138,0.08));color:#FF3D8A;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;cursor:pointer;transition:transform .15s,box-shadow .15s;white-space:nowrap}",
  ".pj-new:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(255,61,138,0.22)}",
  ".pj-preset{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px}",
  ".pj-preset button{flex:1;min-width:90px;padding:9px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.025);color:rgba(255,255,255,0.5);font-size:10px;font-family:'JetBrains Mono',monospace;cursor:pointer;transition:all .15s}",
  ".pj-preset button.on{border-color:rgba(255,61,138,0.5);background:rgba(255,61,138,0.12);color:#FF3D8A}",
  ".pj-scroll{position:relative;z-index:1;flex:1;min-height:0;overflow-y:auto;padding:0 18px 24px;-webkit-overflow-scrolling:touch}",
  ".pj-body{width:100%;max-width:920px;margin:0 auto;padding-top:18px}",
  ".pj-body.dense{max-width:1180px}",
  ".pj-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px;padding:16px 18px;border-radius:16px;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(135deg,rgba(255,61,138,0.08),rgba(255,255,255,0.02));position:relative;overflow:hidden}",
  ".pj-hero::before{content:'';position:absolute;right:-40px;top:-40px;width:140px;height:140px;border-radius:50%;background:radial-gradient(circle,rgba(255,61,138,0.22),transparent 70%);animation:pjGlow 6s ease-in-out infinite}",
  ".pj-hero h2{margin:0;font-family:'JetBrains Mono',monospace;font-size:clamp(18px,3vw,24px);font-weight:600;letter-spacing:-.02em}",
  ".pj-hero p{margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.42);line-height:1.45;max-width:420px}",
  ".pj-chips{display:flex;gap:8px;flex-wrap:wrap;align-items:center}",
  ".pj-chip{padding:6px 11px;border-radius:999px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.28);font-size:10px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.55);white-space:nowrap}",
  ".pj-chip strong{color:#fff;font-weight:600}",
  ".pj-sech{margin:0 0 10px;font-size:9px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.28);letter-spacing:1.5px;display:flex;align-items:center;gap:8px}",
  ".pj-sech::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.06)}",
  ".pj-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;align-content:start;justify-content:center}",
  ".pj-grid.sparse{grid-template-columns:repeat(auto-fit,minmax(280px,420px));justify-content:center;gap:14px}",
  ".pj-grid.sparse .pj-card{border-radius:18px}",
  ".pj-grid.sparse .pj-card-in{min-height:148px;padding:16px 17px 15px;gap:11px}",
  ".pj-grid.sparse .pj-card-ic{width:48px;height:48px;font-size:21px;border-radius:14px}",
  ".pj-grid.sparse .pj-card-name{font-size:16px}",
  ".pj-grid.sparse .pj-card-desc{font-size:12px;-webkit-line-clamp:3}",
  ".pj-list{display:flex;flex-direction:column;gap:8px;max-width:760px;margin:0 auto}",
  ".pj-card{position:relative;border-radius:15px;cursor:pointer;overflow:hidden;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(155deg,rgba(255,255,255,0.055),rgba(255,255,255,0.014));transition:transform .2s cubic-bezier(.2,.8,.2,1),box-shadow .2s,border-color .2s;animation:pjFade .4s ease both}",
  ".pj-card:hover{transform:translateY(-3px);border-color:var(--pcb);box-shadow:0 16px 38px rgba(0,0,0,0.4)}",
  ".pj-card-bar{height:3px;background:var(--pc)}",
  ".pj-card-in{padding:13px 14px 12px;display:flex;flex-direction:column;gap:9px;min-height:118px}",
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
  ".pj-card:hover .pj-act,.pj-rowcard:hover .pj-act{opacity:1}",
  ".pj-act button{width:25px;height:25px;border-radius:7px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.45);color:rgba(255,255,255,0.5);cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;transition:all .15s}",
  ".pj-act button:hover{color:#fff;border-color:rgba(255,255,255,0.25)}",
  ".pj-act button.del:hover{background:rgba(255,61,90,0.18);color:#FF3D5A;border-color:rgba(255,61,90,0.4)}",
  ".pj-pin{position:absolute;top:9px;left:9px;font-size:11px;color:#FFB800;z-index:1;text-shadow:0 0 8px rgba(255,184,0,0.5)}",
  ".pj-addcard{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:148px;border-radius:18px;border:1px dashed rgba(255,61,138,0.32);background:rgba(255,61,138,0.04);cursor:pointer;transition:all .18s;color:rgba(255,255,255,0.45);animation:pjFade .4s ease both}",
  ".pj-addcard:hover{border-color:rgba(255,61,138,0.55);background:rgba(255,61,138,0.09);color:#FF3D8A;transform:translateY(-2px)}",
  ".pj-addcard span:first-child{font-size:28px;line-height:1;color:#FF3D8A;opacity:.85}",
  ".pj-addcard span:last-child{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.5px}",
  ".pj-rowcard{display:flex;align-items:center;gap:13px;padding:11px 14px;border-radius:13px;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(120deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012));cursor:pointer;transition:transform .16s,border-color .16s,box-shadow .16s;animation:pjFade .4s ease both;position:relative;overflow:hidden}",
  ".pj-rowcard:hover{transform:translateX(3px);border-color:var(--pcb);box-shadow:0 10px 26px rgba(0,0,0,0.34)}",
  ".pj-rowcard::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--pc)}",
  ".pj-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 20px;border-radius:18px;border:1px dashed rgba(255,61,138,0.25);background:rgba(255,61,138,0.04);text-align:center;max-width:480px;margin:40px auto 0}",
  ".pj-mbk{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,0.66);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;animation:pjFade .22s ease}",
  ".pj-modal{width:min(450px,100%);border-radius:17px;border:1px solid rgba(255,61,138,0.3);background:linear-gradient(160deg,#11111b,#0a0a12);box-shadow:0 30px 80px rgba(0,0,0,0.55);padding:18px;animation:pjFade .28s ease}",
  ".pj-mods-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}",
  ".pj-mods-grid button{padding:9px 4px;border-radius:9px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.35);font-size:8px;font-family:'JetBrains Mono',monospace;cursor:pointer;text-align:center;transition:all .15s}",
  ".pj-mods-grid button.on{border-color:rgba(255,61,138,0.5);background:rgba(255,61,138,0.13);color:#FF3D8A}",
  ".pj-pal{display:flex;gap:7px;flex-wrap:wrap}",
  ".pj-pal button{width:26px;height:26px;border-radius:8px;border:2px solid transparent;cursor:pointer;transition:transform .15s}",
  ".pj-pal button:hover{transform:scale(1.12)}",
  ".pj-ghost{padding:8px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.55);font-size:11px;cursor:pointer}",
  "@media(max-width:719px){.pj-scroll{padding:0 12px 20px}.pj-body{padding-top:12px}.pj-hero{padding:14px;margin-bottom:12px}.pj-search{order:5;max-width:none;flex-basis:100%}.pj-grid,.pj-grid.sparse{grid-template-columns:1fr}.pj-chips{width:100%}.pj-title{font-size:1.35rem!important}.pj-card-title{font-size:1rem!important}.pj-card-meta{font-size:0.88rem!important}}",
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
  var viewS = useState(function() { try { return localStorage.getItem(VIEW_KEY) || "grid"; } catch (e) { return "grid"; } });
  var view = viewS[0], setView = viewS[1];
  var pinsS = useState(loadPins);
  var pins = pinsS[0], setPins = pinsS[1];
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

  var filtered = useMemo(function() {
    var q = query.trim().toLowerCase();
    var list = projects.filter(function(p) {
      if (!q) return true;
      var meta = projectTypeMeta(p);
      var text = ((p.name || "") + " " + (p.description || "") + " " + meta.tag).toLowerCase();
      return text.indexOf(q) >= 0;
    });
    return list.slice().sort(function(a, b) {
      var pa = pins.indexOf(a.id) >= 0, pb = pins.indexOf(b.id) >= 0;
      if (pa !== pb) return pa ? -1 : 1;
      return (b.created || 0) - (a.created || 0) || (a.name || "").localeCompare(b.name || "");
    });
  }, [projects, query, pins]);

  var overview = useMemo(function() {
    var pending = 0, total = 0, withRoi = 0;
    filtered.forEach(function(p) {
      var st = stats[p.id];
      if (!st) return;
      pending += st.pending || 0;
      total += st.total || 0;
      if (st.hasInvestments) withRoi += 1;
    });
    return { pending: pending, total: total, withRoi: withRoi };
  }, [filtered, stats]);

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
  var isSparse = filtered.length > 0 && filtered.length <= 4 && !query;
  var showSplitSections = pinnedItems.length > 0 && !query && filtered.length > 4;

  function renderAddCard(idx) {
    if (!isSparse || view === "list") return null;
    return (
      <button type="button" key="add-card" className="pj-addcard" style={{ animationDelay: (idx * 0.04) + "s" }} onClick={openModal}>
        <span>+</span>
        <span>Novo projeto</span>
      </button>
    );
  }

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
        <div className="pj-brand"><h1>PROJETOS</h1><span>{projects.length}</span></div>
        <div className="pj-search">
          <SearchIcon />
          <input value={query} onChange={function(e) { setQuery(e.target.value); }} placeholder="Procurar projeto..." />
        </div>
        <div className="pj-viewtog">
          <button type="button" className={view === "grid" ? "on" : ""} onClick={function() { setViewPersist("grid"); }} title="Grelha"><GridIcon /></button>
          <button type="button" className={view === "list" ? "on" : ""} onClick={function() { setViewPersist("list"); }} title="Lista"><ListIcon /></button>
        </div>
        <button type="button" className="pj-new" onClick={openModal}>+ Novo</button>
      </header>

      <div className="pj-scroll">
        <div className={"pj-body" + (isSparse ? "" : " dense")}>
          {filtered.length > 0 && isSparse ? (
            <div className="pj-hero">
              <div>
                <h2>{filtered.length === 1 ? "O teu workspace" : filtered.length + " workspaces"}</h2>
                <p>{filtered.length === 1 ? "Abre o projeto ou cria mais um workspace modular." : "Escolhe um projeto para continuar ou cria outro."}</p>
              </div>
              <div className="pj-chips">
                <span className="pj-chip"><strong>{overview.pending}</strong> tarefas por fazer</span>
                {overview.total > 0 ? <span className="pj-chip"><strong>{overview.total}</strong> no total</span> : null}
                {overview.withRoi > 0 ? <span className="pj-chip"><strong>{overview.withRoi}</strong> com ROI</span> : null}
              </div>
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <div className="pj-empty">
              <p style={{ margin: "0 0 6px", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: ACCENT }}>Nenhum projeto encontrado</p>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                {query ? "Ajusta a pesquisa." : "Cria o teu primeiro workspace modular."}
              </p>
              <button type="button" className="pj-new" onClick={openModal}>+ Criar projeto</button>
            </div>
          ) : showSplitSections ? (
            <>
              <p className="pj-sech">FIXADOS</p>
              <div className={view === "list" ? "pj-list" : "pj-grid"} style={{ marginBottom: 16 }}>
                {pinnedItems.map(function(p, idx) { return renderItem(p, idx); })}
              </div>
              <p className="pj-sech">TODOS OS PROJETOS</p>
              <div className={view === "list" ? "pj-list" : "pj-grid"}>
                {otherItems.map(function(p, idx) { return renderItem(p, idx); })}
              </div>
            </>
          ) : (
            <div className={(view === "list" ? "pj-list" : "pj-grid") + (isSparse && view !== "list" ? " sparse" : "")}>
              {filtered.map(function(p, idx) { return renderItem(p, idx); })}
              {renderAddCard(filtered.length)}
            </div>
          )}
        </div>
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
