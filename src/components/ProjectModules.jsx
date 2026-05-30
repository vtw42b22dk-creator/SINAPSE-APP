import { useEffect, useMemo, useRef, useState } from "react";
import * as projectModuleStore from "../lib/projectModuleStore";

var MC = {
  investments: "#34D399",
  notes: "#FFB800",
  analytics: "#00FFC8",
  inventory: "#6B8AFF",
};

var MODULE_CSS = [
  "@keyframes pmFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
  ".pm-root{height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;color:#fff;font-family:'IBM Plex Sans',sans-serif}",
  ".pm-wrap{max-width:940px;margin:0 auto;padding:26px 30px 64px;animation:pmFade .35s ease}",
  ".pm-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px;flex-wrap:wrap}",
  ".pm-head-t{display:flex;align-items:center;gap:14px;min-width:0}",
  ".pm-head-ic{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:21px;flex-shrink:0}",
  ".pm-head h2{margin:0;font-family:'JetBrains Mono',monospace;font-size:21px;font-weight:600;letter-spacing:.3px;line-height:1.1}",
  ".pm-head .sub{margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.42)}",
  ".pm-btn{display:inline-flex;align-items:center;gap:7px;padding:11px 19px;border-radius:12px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;transition:transform .15s,box-shadow .15s;white-space:nowrap}",
  ".pm-btn:hover{transform:translateY(-1px)}",
  ".pm-card{border-radius:17px;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(155deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012))}",
  ".pm-input{width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:11px;color:#fff;padding:11px 13px;font-size:14px;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .18s,box-shadow .18s}",
  ".pm-input:focus{border-color:var(--mc);box-shadow:0 0 0 3px var(--mcf)}",
  ".pm-label{display:block;font-size:9px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.4);margin-bottom:6px;letter-spacing:.6px;text-transform:uppercase}",
  ".pm-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:12px;margin-bottom:22px}",
  ".pm-stat{padding:16px 18px;border-radius:16px;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(155deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012))}",
  ".pm-stat-l{margin:0;font-size:9px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.4);letter-spacing:.6px;text-transform:uppercase}",
  ".pm-stat-v{margin:9px 0 0;font-size:23px;font-family:'JetBrains Mono',monospace;font-weight:600;line-height:1}",
  ".pm-form{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;padding:16px 18px;margin-bottom:20px}",
  ".pm-f-grow{flex:1 1 220px;min-width:0}",
  ".pm-f-amt{flex:0 0 128px}",
  ".pm-f-type{flex:0 0 148px}",
  ".pm-sec{margin:26px 0 12px;font-size:10px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.34);letter-spacing:1.4px;display:flex;align-items:center;gap:10px}",
  ".pm-sec::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.07)}",
  ".pm-tablecard{border-radius:16px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.018);overflow:hidden}",
  ".pm-table{width:100%;border-collapse:collapse;font-size:13px}",
  ".pm-table thead th{padding:13px 16px 11px;font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(255,255,255,0.36);letter-spacing:.7px;text-transform:uppercase;text-align:left;background:rgba(255,255,255,0.02)}",
  ".pm-table tbody td{padding:11px 16px;border-top:1px solid rgba(255,255,255,0.055);vertical-align:middle}",
  ".pm-table tbody tr{transition:background .14s}",
  ".pm-table tbody tr:hover{background:rgba(255,255,255,0.028)}",
  ".pm-num{font-family:'JetBrains Mono',monospace;text-align:right}",
  ".pm-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:999px;font-size:11px;font-family:'JetBrains Mono',monospace;font-weight:500;letter-spacing:.2px}",
  ".pm-del{width:30px;height:30px;border-radius:9px;border:1px solid transparent;background:transparent;color:rgba(255,255,255,0.3);cursor:pointer;font-size:16px;transition:all .15s;display:inline-flex;align-items:center;justify-content:center}",
  ".pm-del:hover{background:rgba(255,61,90,0.14);color:#FF3D5A;border-color:rgba(255,61,90,0.35)}",
  ".pm-status{appearance:none;border-radius:999px;padding:5px 28px 5px 13px;font-size:11px;font-family:'JetBrains Mono',monospace;font-weight:600;cursor:pointer;background-repeat:no-repeat;background-position:calc(100% - 9px) 50%;background-size:9px;outline:none}",
  ".pm-pager{display:flex;gap:10px;align-items:center;justify-content:center;margin-top:16px}",
  ".pm-pager button{width:36px;height:36px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.6);cursor:pointer;font-size:15px}",
  ".pm-pager button:disabled{opacity:.3;cursor:default}",
  ".pm-empty{padding:44px 20px;text-align:center;border-radius:16px;border:1px dashed rgba(255,255,255,0.12);background:rgba(255,255,255,0.015);color:rgba(255,255,255,0.4);font-size:13px}",
  ".pm-notes{width:100%;min-height:min(66vh,560px);background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.09);border-radius:17px;color:#fff;padding:20px 22px;font-family:'JetBrains Mono',monospace;font-size:14px;line-height:1.75;outline:none;resize:vertical;box-sizing:border-box;transition:border-color .18s}",
  ".pm-notes:focus{border-color:var(--mc)}",
  ".pm-notes-grid{display:grid;grid-template-columns:236px 1fr;gap:16px;align-items:start}",
  ".pm-notes-aside{display:flex;flex-direction:column;gap:7px}",
  ".pm-note-item{position:relative;display:flex;flex-direction:column;gap:3px;padding:11px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.022);cursor:pointer;transition:all .15s}",
  ".pm-note-item:hover{border-color:rgba(255,255,255,0.16);background:rgba(255,255,255,0.04)}",
  ".pm-note-item.on{border-color:var(--mc);background:var(--mcf)}",
  ".pm-note-item h4{margin:0;font-size:12px;font-family:'JetBrains Mono',monospace;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:18px}",
  ".pm-note-item p{margin:0;font-size:10px;color:rgba(255,255,255,0.36);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
  ".pm-note-del{position:absolute;top:8px;right:8px;width:22px;height:22px;border-radius:7px;border:none;background:transparent;color:rgba(255,255,255,0.3);cursor:pointer;font-size:13px;opacity:0;transition:all .15s}",
  ".pm-note-item:hover .pm-note-del{opacity:1}",
  ".pm-note-del:hover{background:rgba(255,61,90,0.16);color:#FF3D5A}",
  ".pm-seg{display:inline-flex;padding:3px;border-radius:12px;border:1px solid rgba(255,255,255,0.09);background:rgba(0,0,0,0.25);gap:3px}",
  ".pm-seg button{padding:8px 16px;border-radius:9px;border:none;background:transparent;color:rgba(255,255,255,0.5);font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap}",
  ".pm-seg button.on{color:#0b0b12}",
  "@media(max-width:719px){.pm-notes-grid{grid-template-columns:1fr}}",
  ".pm-hero{display:flex;align-items:center;gap:20px;padding:20px 22px;border-radius:17px;margin-bottom:8px;flex-wrap:wrap}",
  ".pm-hero-ring{width:78px;height:78px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}",
  ".pm-hero-ring i{width:60px;height:60px;border-radius:50%;background:#070d0c;display:flex;flex-direction:column;align-items:center;justify-content:center;font-style:normal;font-family:'JetBrains Mono',monospace}",
  ".pm-kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(248px,1fr));gap:14px}",
  ".pm-kpi{padding:16px 17px;border-radius:16px;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(155deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012));transition:border-color .18s,transform .18s}",
  ".pm-kpi:hover{transform:translateY(-2px)}",
  ".pm-kpi-status{display:inline-block;padding:3px 10px;border-radius:999px;font-size:9px;font-family:'JetBrains Mono',monospace;font-weight:600;letter-spacing:.3px}",
  ".pm-kpi-bar{height:12px;border-radius:999px;background:rgba(255,255,255,0.07);overflow:hidden;margin:10px 0 12px}",
  ".pm-kpi-bar-fill{height:100%;border-radius:999px;transition:width .4s ease}",
  ".pm-kpi-inputs{display:grid;grid-template-columns:1fr 1fr;gap:10px}",
  ".pm-kpi-remain{margin:10px 0 0;font-size:10px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.42)}",
  "@media(max-width:719px){.pm-wrap{padding:18px 16px 60px}.pm-head h2{font-size:18px}.pm-f-amt,.pm-f-type{flex:1 1 calc(50% - 6px)}.pm-form .pm-btn{flex:1 1 100%;justify-content:center}}",
].join("");

var STATUS_META = {
  missing: { label: "Em falta", color: "#FFB800" },
  acquired: { label: "Adquirido", color: "#34D399" },
  depleted: { label: "Esgotado", color: "#FF3D5A" },
};

function localId(prefix) {
  return (prefix || "n") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmtEuro(n) {
  return (n || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}
function fmtNum(n) {
  return (Math.round((n || 0) * 100) / 100).toLocaleString("pt-PT");
}

function mcVars(mc) {
  return { "--mc": mc, "--mcf": mc + "22" };
}

function ModuleShell(props) {
  var mc = props.mc;
  return (
    <div className="pm-root" style={mcVars(mc)}>
      <style>{MODULE_CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <div className="pm-wrap">
        <div className="pm-head">
          <div className="pm-head-t">
            <div className="pm-head-ic" style={{ background: mc + "1a", color: mc, boxShadow: "0 0 22px " + mc + "26" }}>{props.icon}</div>
            <div style={{ minWidth: 0 }}>
              <h2>{props.title}</h2>
              {props.subtitle && <p className="sub">{props.subtitle}</p>}
            </div>
          </div>
          {props.action || null}
        </div>
        {props.children}
      </div>
    </div>
  );
}

function PrimaryBtn(props) {
  var mc = props.mc;
  return (
    <button type="button" className="pm-btn" onClick={props.onClick}
      style={{ background: mc + "1e", border: "1px solid " + mc + "55", color: mc }}>
      {props.children}
    </button>
  );
}

function Stat(props) {
  return (
    <div className="pm-stat">
      <p className="pm-stat-l">{props.label}</p>
      <p className="pm-stat-v" style={{ color: props.color || "#fff" }}>{props.value}</p>
    </div>
  );
}

function FlowBadge(props) {
  var credit = props.type === "credit";
  var c = credit ? "#34D399" : "#FF6B35";
  return (
    <span className="pm-badge" style={{ color: c, background: c + "1a" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />
      {credit ? "Crédito" : "Débito"}
    </span>
  );
}

function StatusSelect(props) {
  var meta = STATUS_META[props.value] || STATUS_META.missing;
  var arrow = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 8 8'%3E%3Cpath fill='%23ffffff88' d='M1 2l3 3 3-3'/%3E%3C/svg%3E\")";
  return (
    <select value={props.value} onChange={function(e) { props.onChange(e.target.value); }} className="pm-status"
      style={{ color: meta.color, backgroundColor: meta.color + "1a", border: "1px solid " + meta.color + "44", backgroundImage: arrow }}>
      <option value="missing">Em falta</option>
      <option value="acquired">Adquirido</option>
      <option value="depleted">Esgotado</option>
    </select>
  );
}

export function ProjectInvestments(props) {
  var projectId = props.projectId;
  var mc = MC.investments;
  var rowsS = useState([]);
  var rows = rowsS[0], setRows = rowsS[1];
  var pageS = useState(0);
  var page = pageS[0], setPage = pageS[1];
  var titleS = useState("");
  var title = titleS[0], setTitle = titleS[1];
  var amountS = useState("");
  var amount = amountS[0], setAmount = amountS[1];
  var typeS = useState("debit");
  var type = typeS[0], setType = typeS[1];
  var PAGE = 12;

  useEffect(function() {
    projectModuleStore.loadInvestments(projectId).then(setRows);
  }, [projectId]);

  function persist(next) {
    setRows(next);
    projectModuleStore.saveInvestments(projectId, next);
  }

  function addRow() {
    var amt = parseFloat(String(amount).replace(",", "."));
    if (!title.trim() || isNaN(amt) || amt <= 0) return;
    persist([projectModuleStore.newInvestment({ title: title.trim(), amount: amt, type: type })].concat(rows));
    setTitle("");
    setAmount("");
  }

  function removeRow(id) {
    persist(rows.filter(function(r) { return r.id !== id; }));
  }

  var totals = useMemo(function() { return projectModuleStore.investmentTotals(rows); }, [rows]);
  var pages = Math.max(1, Math.ceil(rows.length / PAGE));
  var slice = rows.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <ModuleShell mc={mc} icon="€" title="Investimentos" subtitle="Ledger financeiro do projeto">
      <div className="pm-stats">
        <Stat label="Injetado" value={fmtEuro(totals.injected)} color="#FF6B35" />
        <Stat label="Retorno" value={fmtEuro(totals.returned)} color="#34D399" />
        <Stat label="Saldo" value={fmtEuro(totals.net)} color={totals.net >= 0 ? mc : "#FF6B35"} />
        <Stat label="ROI" value={(totals.roi >= 0 ? "+" : "") + totals.roi.toFixed(1) + "%"} color={totals.roi >= 0 ? mc : "#FF6B35"} />
      </div>

      <div className="pm-card pm-form">
        <div className="pm-f-grow">
          <label className="pm-label">Descrição</label>
          <input className="pm-input" value={title} onChange={function(e) { setTitle(e.target.value); }} placeholder="Hosting, anúncios, venda..." onKeyDown={function(e) { if (e.key === "Enter") addRow(); }} />
        </div>
        <div className="pm-f-amt">
          <label className="pm-label">Valor €</label>
          <input className="pm-input" value={amount} onChange={function(e) { setAmount(e.target.value); }} inputMode="decimal" placeholder="0,00" style={{ fontFamily: "'JetBrains Mono',monospace" }} />
        </div>
        <div className="pm-f-type">
          <label className="pm-label">Tipo</label>
          <select className="pm-input" value={type} onChange={function(e) { setType(e.target.value); }}>
            <option value="debit">Débito (gasto)</option>
            <option value="credit">Crédito (receita)</option>
          </select>
        </div>
        <PrimaryBtn mc={mc} onClick={addRow}>+ Registar</PrimaryBtn>
      </div>

      {rows.length === 0 ? (
        <div className="pm-empty">Ainda sem movimentos. Regista o primeiro acima.</div>
      ) : (
        <div className="pm-tablecard">
          <table className="pm-table">
            <colgroup>
              <col style={{ width: 96 }} />
              <col />
              <col style={{ width: 116 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 56 }} />
            </colgroup>
            <thead>
              <tr><th>Data</th><th>Descrição</th><th>Tipo</th><th style={{ textAlign: "right" }}>Valor</th><th></th></tr>
            </thead>
            <tbody>
              {slice.map(function(r) {
                return (
                  <tr key={r.id}>
                    <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{r.day}</td>
                    <td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 0 }}>{r.title}</td>
                    <td><FlowBadge type={r.type} /></td>
                    <td className="pm-num" style={{ fontWeight: 600, color: r.type === "credit" ? "#34D399" : "#fff" }}>{r.type === "credit" ? "+" : "−"}{fmtEuro(r.amount).replace("−", "")}</td>
                    <td style={{ textAlign: "center" }}><button type="button" className="pm-del" onClick={function() { removeRow(r.id); }}>×</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="pm-pager">
          <button type="button" disabled={page <= 0} onClick={function() { setPage(page - 1); }}>‹</button>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono',monospace" }}>{page + 1} / {pages}</span>
          <button type="button" disabled={page >= pages - 1} onClick={function() { setPage(page + 1); }}>›</button>
        </div>
      )}
    </ModuleShell>
  );
}

function parseNotesList(body) {
  if (!body) return [];
  if (body.charAt(0) === "[") {
    try {
      var arr = JSON.parse(body);
      if (Array.isArray(arr)) {
        return arr.map(function(n) {
          return { id: n.id || localId("note"), title: n.title || "Sem título", body: n.body || "", updated: n.updated || Date.now() };
        });
      }
    } catch (e) {}
  }
  // Conteúdo antigo (texto simples) → uma única nota
  return [{ id: localId("note"), title: "Nota", body: body, updated: Date.now() }];
}

export function ProjectNotes(props) {
  var projectId = props.projectId;
  var mc = MC.notes;
  var notesS = useState([]);
  var notes = notesS[0], setNotes = notesS[1];
  var activeS = useState(null);
  var activeId = activeS[0], setActiveId = activeS[1];
  var savedS = useState(true);
  var saved = savedS[0], setSaved = savedS[1];
  var saveTimer = useRef(null);

  useEffect(function() {
    projectModuleStore.loadNotes(projectId).then(function(d) {
      var list = parseNotesList(d.body || "");
      setNotes(list);
      setActiveId(list.length ? list[0].id : null);
      setSaved(true);
    });
  }, [projectId]);

  function persist(next) {
    setNotes(next);
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(function() {
      projectModuleStore.saveNotes(projectId, { body: JSON.stringify(next) });
      setSaved(true);
    }, 500);
  }

  function addNote() {
    var n = { id: localId("note"), title: "Nova nota", body: "", updated: Date.now() };
    var next = [n].concat(notes);
    persist(next);
    setActiveId(n.id);
  }

  function updateNote(id, patch) {
    persist(notes.map(function(n) { return n.id === id ? Object.assign({}, n, patch, { updated: Date.now() }) : n; }));
  }

  function removeNote(e, id) {
    e.stopPropagation();
    if (!window.confirm("Apagar esta nota?")) return;
    var next = notes.filter(function(n) { return n.id !== id; });
    persist(next);
    if (activeId === id) setActiveId(next.length ? next[0].id : null);
  }

  var active = notes.find(function(n) { return n.id === activeId; }) || null;
  var words = active && active.body.trim() ? active.body.trim().split(/\s+/).length : 0;

  return (
    <ModuleShell mc={mc} icon="✎" title="Notas · Wiki" subtitle={notes.length + (notes.length === 1 ? " nota" : " notas") + " · Markdown simples"}
      action={(
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="pm-badge" style={{ color: saved ? "#34D399" : mc, background: (saved ? "#34D399" : mc) + "18" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: saved ? "#34D399" : mc }} />
            {saved ? "Guardado" : "A guardar…"}
          </span>
          <PrimaryBtn mc={mc} onClick={addNote}>+ Nota</PrimaryBtn>
        </div>
      )}>
      {notes.length === 0 ? (
        <div className="pm-empty">Sem notas ainda. Cria a primeira com "+ Nota".</div>
      ) : (
        <div className="pm-notes-grid">
          <div className="pm-notes-aside">
            {notes.map(function(n) {
              var preview = (n.body || "").replace(/[#*`>\-]/g, "").trim().slice(0, 40) || "Vazia";
              return (
                <div key={n.id} className={"pm-note-item" + (n.id === activeId ? " on" : "")} onClick={function() { setActiveId(n.id); }}>
                  <button type="button" className="pm-note-del" onClick={function(e) { removeNote(e, n.id); }} title="Apagar">×</button>
                  <h4>{n.title || "Sem título"}</h4>
                  <p>{preview}</p>
                </div>
              );
            })}
          </div>
          {active && (
            <div>
              <input className="pm-input" value={active.title} onChange={function(e) { updateNote(active.id, { title: e.target.value }); }}
                placeholder="Título da nota" style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, fontSize: 15, marginBottom: 12 }} />
              <textarea className="pm-notes" style={{ minHeight: "min(58vh,480px)" }} value={active.body}
                onChange={function(e) { updateNote(active.id, { body: e.target.value }); }}
                placeholder={"# " + (active.title || "Nota") + "\n\n- Ideia\n- Tarefa\n- Link"} />
              <p style={{ margin: "12px 2px 0", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.32)" }}>
                {words} palavras · {active.body.length} caracteres
              </p>
            </div>
          )}
        </div>
      )}
    </ModuleShell>
  );
}

function kpiStatusMeta(pct) {
  if (pct >= 100) return { label: "Concluído", color: "#34D399" };
  if (pct >= 60) return { label: "Bom caminho", color: "#00FFC8" };
  if (pct >= 25) return { label: "Em progresso", color: "#FFB800" };
  return { label: "A iniciar", color: "#FF6B35" };
}

export function ProjectAnalytics(props) {
  var projectId = props.projectId;
  var mc = MC.analytics;
  var kpisS = useState([]);
  var kpis = kpisS[0], setKpis = kpisS[1];
  var invS = useState([]);
  var investments = invS[0], setInvestments = invS[1];
  var itemsS = useState([]);
  var items = itemsS[0], setItems = itemsS[1];

  useEffect(function() {
    projectModuleStore.loadKpis(projectId).then(setKpis);
    projectModuleStore.loadInvestments(projectId).then(setInvestments);
    projectModuleStore.loadInventory(projectId).then(setItems);
  }, [projectId]);

  function persist(next) {
    setKpis(next);
    projectModuleStore.saveKpis(projectId, next);
  }
  function addKpi() { persist(kpis.concat([projectModuleStore.newKpi()])); }
  function updateKpi(id, patch) { persist(kpis.map(function(k) { return k.id === id ? Object.assign({}, k, patch) : k; })); }
  function removeKpi(id) { persist(kpis.filter(function(k) { return k.id !== id; })); }

  var fin = useMemo(function() { return projectModuleStore.investmentTotals(investments); }, [investments]);
  var hasFin = fin.injected > 0 || fin.returned > 0;

  var invStats = useMemo(function() {
    var capital = 0, circ = 0, missing = 0;
    items.forEach(function(r) {
      var v = (r.quantity || 0) * (r.unitCost || 0);
      if (r.category === "capital") capital += v; else circ += v;
      if (r.status === "missing") missing++;
    });
    return { count: items.length, capital: capital, circ: circ, total: capital + circ, missing: missing };
  }, [items]);

  var kpiOverview = useMemo(function() {
    if (!kpis.length) return { avg: 0, reached: 0, sorted: [] };
    var sum = 0, reached = 0;
    var withPct = kpis.map(function(k) {
      var pct = k.target > 0 ? Math.min(100, (k.current / k.target) * 100) : 0;
      sum += pct;
      if (pct >= 100) reached++;
      return Object.assign({}, k, { _pct: pct });
    });
    withPct.sort(function(a, b) { return b._pct - a._pct; });
    return { avg: Math.round(sum / kpis.length), reached: reached, sorted: withPct };
  }, [kpis]);

  return (
    <ModuleShell mc={mc} icon="◈" title="Analytics" subtitle="Visão geral de metas, finanças e stock"
      action={<PrimaryBtn mc={mc} onClick={addKpi}>+ Nova meta</PrimaryBtn>}>

      {kpis.length > 0 && (
        <div className="pm-hero pm-card" style={{ border: "1px solid " + mc + "2e", background: "linear-gradient(150deg," + mc + "12,rgba(255,255,255,0.012))" }}>
          <div className="pm-hero-ring" style={{ background: "conic-gradient(" + mc + " " + (kpiOverview.avg * 3.6) + "deg,rgba(255,255,255,0.08) 0)", boxShadow: "0 0 22px " + mc + "33" }}>
            <i>
              <span style={{ fontSize: 18, fontWeight: 600, color: mc }}>{kpiOverview.avg}%</span>
              <span style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>MÉDIA</span>
            </i>
          </div>
          <div style={{ display: "flex", gap: 30, flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, fontSize: 26, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: "#34D399" }}>{kpiOverview.reached}<span style={{ fontSize: 15, color: "rgba(255,255,255,0.3)" }}>/{kpis.length}</span></p>
              <p style={{ margin: "5px 0 0", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.42)" }}>Metas atingidas</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 26, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{kpis.length - kpiOverview.reached}</p>
              <p style={{ margin: "5px 0 0", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.42)" }}>Em curso</p>
            </div>
          </div>
        </div>
      )}

      {hasFin && (
        <>
          <p className="pm-sec">RESUMO FINANCEIRO</p>
          <div className="pm-stats" style={{ marginBottom: 0 }}>
            <Stat label="Injetado" value={fmtEuro(fin.injected)} color="#FF6B35" />
            <Stat label="Retorno" value={fmtEuro(fin.returned)} color="#34D399" />
            <Stat label="Saldo" value={fmtEuro(fin.net)} color={fin.net >= 0 ? mc : "#FF6B35"} />
            <Stat label="ROI" value={(fin.roi >= 0 ? "+" : "") + fin.roi.toFixed(0) + "%"} color={fin.roi >= 0 ? mc : "#FF6B35"} />
          </div>
        </>
      )}

      {invStats.count > 0 && (
        <>
          <p className="pm-sec">INVENTÁRIO</p>
          <div className="pm-stats" style={{ marginBottom: 0 }}>
            <Stat label="Capital fixo" value={fmtEuro(invStats.capital)} color="#34D399" />
            <Stat label="Stock circulante" value={fmtEuro(invStats.circ)} color="#6B8AFF" />
            <Stat label="Valor total" value={fmtEuro(invStats.total)} color={mc} />
            <Stat label="Em falta" value={invStats.missing} color={invStats.missing > 0 ? "#FFB800" : "rgba(255,255,255,0.85)"} />
          </div>
        </>
      )}

      <p className="pm-sec">METAS · KPIS</p>
      {kpis.length === 0 ? (
        <div className="pm-empty">Cria a primeira meta. O resumo financeiro e de inventário aparece automaticamente quando registas dados nos outros módulos.</div>
      ) : (
        <div className="pm-kpi-grid">
          {kpiOverview.sorted.map(function(k) {
            var pct = k._pct;
            var sm = kpiStatusMeta(pct);
            var remaining = Math.max(0, (k.target || 0) - (k.current || 0));
            return (
              <div key={k.id} className="pm-kpi" style={{ borderColor: sm.color + "33" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <input className="pm-input" value={k.label} onChange={function(e) { updateKpi(k.id, { label: e.target.value }); }} style={{ fontSize: 13, padding: "8px 10px" }} />
                  <button type="button" className="pm-del" onClick={function() { removeKpi(k.id); }}>×</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span className="pm-kpi-status" style={{ color: sm.color, background: sm.color + "1a" }}>{sm.label}</span>
                  <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: sm.color }}>{pct.toFixed(0)}%</span>
                </div>
                <div className="pm-kpi-bar">
                  <div className="pm-kpi-bar-fill" style={{ width: pct + "%", background: sm.color, boxShadow: "0 0 8px " + sm.color + ", 0 0 18px " + sm.color + "66" }} />
                </div>
                <div className="pm-kpi-inputs">
                  <div>
                    <label className="pm-label">Atual</label>
                    <input type="number" className="pm-input" value={k.current} onChange={function(e) { updateKpi(k.id, { current: +e.target.value }); }} style={{ fontFamily: "'JetBrains Mono',monospace" }} />
                  </div>
                  <div>
                    <label className="pm-label">Meta</label>
                    <input type="number" className="pm-input" value={k.target} onChange={function(e) { updateKpi(k.id, { target: +e.target.value }); }} style={{ fontFamily: "'JetBrains Mono',monospace" }} />
                  </div>
                </div>
                <p className="pm-kpi-remain">{pct >= 100 ? "Meta atingida ✓" : "Faltam " + fmtNum(remaining) + (k.unit ? " " + k.unit : "")}</p>
              </div>
            );
          })}
        </div>
      )}
    </ModuleShell>
  );
}

var INV_CATS = {
  circulating: { label: "Stock circulante", color: "#6B8AFF", hint: "Custo por produto / consumíveis" },
  capital: { label: "Capital", color: "#34D399", hint: "Equipamento e ativos fixos" },
};

export function ProjectInventory(props) {
  var projectId = props.projectId;
  var mc = MC.inventory;
  var rowsS = useState([]);
  var rows = rowsS[0], setRows = rowsS[1];
  var catS = useState("circulating");
  var cat = catS[0], setCat = catS[1];

  useEffect(function() {
    projectModuleStore.loadInventory(projectId).then(setRows);
  }, [projectId]);

  function persist(next) {
    setRows(next);
    projectModuleStore.saveInventory(projectId, next);
  }
  function addItem() { persist([projectModuleStore.newInventoryItem({ name: "Novo item", category: cat })].concat(rows)); }
  function updateItem(id, patch) { persist(rows.map(function(r) { return r.id === id ? Object.assign({}, r, patch) : r; })); }
  function removeItem(id) { persist(rows.filter(function(r) { return r.id !== id; })); }

  var totals = useMemo(function() {
    var capital = 0, circ = 0, missing = 0;
    rows.forEach(function(r) {
      var v = (r.quantity || 0) * (r.unitCost || 0);
      if (r.category === "capital") capital += v; else circ += v;
      if (r.status === "missing") missing++;
    });
    return { capital: capital, circ: circ, missing: missing, total: capital + circ };
  }, [rows]);

  var catMeta = INV_CATS[cat];
  var visible = rows.filter(function(r) { return (r.category || "circulating") === cat; });

  return (
    <ModuleShell mc={mc} icon="▦" title="Inventário · Stock" subtitle="Capital fixo e stock circulante"
      action={<PrimaryBtn mc={mc} onClick={addItem}>+ Item em {catMeta.label}</PrimaryBtn>}>
      <div className="pm-stats">
        <Stat label="Capital (fixo)" value={fmtEuro(totals.capital)} color={INV_CATS.capital.color} />
        <Stat label="Stock circulante" value={fmtEuro(totals.circ)} color={INV_CATS.circulating.color} />
        <Stat label="Valor total" value={fmtEuro(totals.total)} color={mc} />
        <Stat label="Em falta" value={totals.missing} color={totals.missing > 0 ? "#FFB800" : "rgba(255,255,255,0.85)"} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div className="pm-seg">
          {["circulating", "capital"].map(function(c) {
            var m = INV_CATS[c];
            var on = cat === c;
            return (
              <button type="button" key={c} className={on ? "on" : ""} onClick={function() { setCat(c); }}
                style={on ? { background: m.color, boxShadow: "0 0 16px " + m.color + "55" } : null}>
                {m.label}
              </button>
            );
          })}
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", fontFamily: "'JetBrains Mono',monospace" }}>{catMeta.hint}</span>
      </div>

      {visible.length === 0 ? (
        <div className="pm-empty">Sem itens em "{catMeta.label}". Adiciona o primeiro acima.</div>
      ) : (
        <div className="pm-tablecard">
          <table className="pm-table">
            <colgroup>
              <col />
              <col style={{ width: 84 }} />
              <col style={{ width: 142 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 56 }} />
            </colgroup>
            <thead>
              <tr><th>Item</th><th>Qtd</th><th>Estado</th><th style={{ textAlign: "right" }}>Custo un.</th><th style={{ textAlign: "right" }}>Subtotal</th><th></th></tr>
            </thead>
            <tbody>
              {visible.map(function(r) {
                var sub = (r.quantity || 0) * (r.unitCost || 0);
                return (
                  <tr key={r.id}>
                    <td><input className="pm-input" value={r.name} onChange={function(e) { updateItem(r.id, { name: e.target.value }); }} style={{ padding: "8px 11px", fontSize: 13 }} /></td>
                    <td><input type="number" min={0} className="pm-input" value={r.quantity} onChange={function(e) { updateItem(r.id, { quantity: +e.target.value }); }} style={{ padding: "8px 10px", fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }} /></td>
                    <td><StatusSelect value={r.status} onChange={function(v) { updateItem(r.id, { status: v }); }} /></td>
                    <td><input type="number" min={0} step="0.01" className="pm-input" value={r.unitCost} onChange={function(e) { updateItem(r.id, { unitCost: +e.target.value }); }} style={{ padding: "8px 10px", fontFamily: "'JetBrains Mono',monospace", textAlign: "right" }} /></td>
                    <td className="pm-num" style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{fmtEuro(sub)}</td>
                    <td style={{ textAlign: "center" }}><button type="button" className="pm-del" onClick={function() { removeItem(r.id); }}>×</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ModuleShell>
  );
}
