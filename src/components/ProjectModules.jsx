import { useEffect, useMemo, useRef, useState } from "react";
import * as projectModuleStore from "../lib/projectModuleStore";

var ACCENT = "#00FFC8";
var MODULE_CSS = ".pm-panel{padding:12px 16px;color:#fff;font-family:'IBM Plex Sans',sans-serif;height:100%;overflow:auto;box-sizing:border-box}.pm-h2{margin:0 0 12px;font-family:'JetBrains Mono',monospace;font-size:13px;color:#00FFC8;letter-spacing:.5px}.pm-form-row{display:flex;flex-wrap:nowrap;gap:8px;align-items:flex-end;margin-bottom:10px}.pm-form-row input,.pm-form-row select{min-width:0}.pm-in-desc{flex:1 1 180px;max-width:320px}.pm-in-amt{flex:0 0 88px;width:88px}.pm-in-type{flex:0 0 130px;width:130px}.pm-ledger{width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed}.pm-ledger th{padding:5px 8px;border-bottom:1px solid rgba(255,255,255,0.07);font-family:'JetBrains Mono',monospace;font-size:8px;color:rgba(255,255,255,0.32);text-align:left;font-weight:500;letter-spacing:.4px}.pm-ledger td{padding:4px 8px;border-top:1px solid rgba(255,255,255,0.04);vertical-align:middle;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pm-ledger .pm-col-date{width:72px}.pm-ledger .pm-col-type{width:80px}.pm-ledger .pm-col-val{width:88px;text-align:right;font-family:'JetBrains Mono',monospace}.pm-ledger .pm-col-act{width:32px;text-align:center}.pm-badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:9px;font-family:'JetBrains Mono',monospace;font-weight:500;letter-spacing:.3px}.pm-badge--credit{color:#34D399;background:rgba(52,211,153,0.1)}.pm-badge--debit{color:#FF6B35;background:rgba(255,107,53,0.1)}.pm-inv-table{width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed}.pm-inv-table th{padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.07);font-family:'JetBrains Mono',monospace;font-size:8px;color:rgba(255,255,255,0.32);text-align:left}.pm-inv-table td{padding:5px 8px;border-top:1px solid rgba(255,255,255,0.04);vertical-align:middle}.pm-inv-item{width:100%;max-width:100%}.pm-inv-qty{width:56px;max-width:56px}.pm-inv-cost{width:72px;max-width:72px;font-family:'JetBrains Mono',monospace}.pm-status-select{appearance:none;border-radius:6px;padding:3px 22px 3px 8px;font-size:9px;font-family:'JetBrains Mono',monospace;font-weight:500;cursor:pointer;background-repeat:no-repeat;background-position:calc(100% - 6px) 50%;background-size:8px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cpath fill='rgba(255,255,255,0.4)' d='M1 2l3 3 3-3'/%3E%3C/svg%3E\")}.pm-kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}.pm-kpi-card{padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02)}.pm-kpi-bar{height:10px;border-radius:999px;background:rgba(255,255,255,0.06);margin:8px 0 10px;overflow:hidden}.pm-kpi-bar-fill{height:100%;border-radius:999px;background:#00FFC8;transition:width .35s ease}.pm-kpi-inputs{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:end}.pm-mono{font-family:'JetBrains Mono',monospace;font-size:12px}.pm-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:14px}.pm-sec{margin:18px 0 9px;font-size:9px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.3);letter-spacing:1.2px;display:flex;align-items:center;gap:8px}.pm-sec::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.06)}.pm-snap{display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:8px}.pm-snap-c{padding:10px 12px;border-radius:11px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02)}.pm-snap-l{margin:0;font-size:8px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.32);letter-spacing:.4px;text-transform:uppercase}.pm-snap-v{margin:5px 0 0;font-size:15px;font-family:'JetBrains Mono',monospace;font-weight:600;line-height:1}.pm-hero{display:flex;align-items:center;gap:16px;padding:14px 16px;border-radius:14px;border:1px solid rgba(0,255,200,0.18);background:linear-gradient(150deg,rgba(0,255,200,0.07),rgba(255,255,255,0.012));margin-bottom:4px}.pm-hero-ring{width:66px;height:66px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}.pm-hero-ring i{width:50px;height:50px;border-radius:50%;background:#070d0c;display:flex;flex-direction:column;align-items:center;justify-content:center;font-style:normal;font-family:'JetBrains Mono',monospace}.pm-kpi-status{display:inline-block;padding:2px 8px;border-radius:999px;font-size:8px;font-family:'JetBrains Mono',monospace;font-weight:600;letter-spacing:.3px}.pm-kpi-remain{margin:7px 0 0;font-size:9px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.38)}";

var STATUS_META = {
  missing: { label: "Em falta", color: "#FFB800", bg: "rgba(255,184,0,0.12)" },
  acquired: { label: "Adquirido", color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  depleted: { label: "Esgotado", color: "#FF3D5A", bg: "rgba(255,61,90,0.12)" },
};

function fmtEuro(n) {
  return (n || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

function inputSt(extra) {
  return Object.assign({
    width: "100%",
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    color: "#fff",
    padding: "7px 9px",
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  }, extra || {});
}

function btnSt(color) {
  return { background: color + "18", border: "1px solid " + color + "45", borderRadius: 8, color: color, padding: "7px 12px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 };
}

function lbl() {
  return { display: "block", fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.32)", marginBottom: 3, letterSpacing: 0.4 };
}

function FlowBadge(props) {
  var credit = props.type === "credit";
  return (
    <span className={"pm-badge " + (credit ? "pm-badge--credit" : "pm-badge--debit")}>
      {credit ? "Crédito" : "Débito"}
    </span>
  );
}

function StatusSelect(props) {
  var meta = STATUS_META[props.value] || STATUS_META.missing;
  return (
    <select
      value={props.value}
      onChange={function(e) { props.onChange(e.target.value); }}
      className="pm-status-select"
      style={{ color: meta.color, backgroundColor: meta.bg, border: "1px solid " + meta.color + "44" }}
    >
      <option value="missing">Em falta</option>
      <option value="acquired">Adquirido</option>
      <option value="depleted">Esgotado</option>
    </select>
  );
}

export function ProjectInvestments(props) {
  var projectId = props.projectId;
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
  var PAGE = 10;

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
    <div className="pm-panel">
      <style>{MODULE_CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <h2 className="pm-h2">Investimentos</h2>
      <div className="pm-metrics">
        <MetricCard label="Injetado" value={fmtEuro(totals.injected)} color="#FF6B35" />
        <MetricCard label="Retorno" value={fmtEuro(totals.returned)} color="#34D399" />
        <MetricCard label="Saldo" value={fmtEuro(totals.net)} color={totals.net >= 0 ? ACCENT : "#FF6B35"} />
        <MetricCard label="ROI" value={(totals.roi >= 0 ? "+" : "") + totals.roi.toFixed(1) + "%"} color={totals.roi >= 0 ? ACCENT : "#FF6B35"} />
      </div>
      <div className="pm-form-row">
        <div className="pm-in-desc">
          <label style={lbl()}>Descrição</label>
          <input value={title} onChange={function(e) { setTitle(e.target.value); }} style={inputSt()} placeholder="Hosting, ads..." onKeyDown={function(e) { if (e.key === "Enter") addRow(); }} />
        </div>
        <div className="pm-in-amt">
          <label style={lbl()}>Valor €</label>
          <input value={amount} onChange={function(e) { setAmount(e.target.value); }} style={inputSt({ fontFamily: "'JetBrains Mono',monospace" })} inputMode="decimal" />
        </div>
        <div className="pm-in-type">
          <label style={lbl()}>Tipo</label>
          <select value={type} onChange={function(e) { setType(e.target.value); }} style={inputSt()}>
            <option value="debit">Débito</option>
            <option value="credit">Crédito</option>
          </select>
        </div>
        <button type="button" onClick={addRow} style={Object.assign({}, btnSt(ACCENT), { alignSelf: "flex-end" })}>Registar</button>
      </div>
      <table className="pm-ledger">
        <thead>
          <tr>
            <th className="pm-col-date">DATA</th>
            <th>DESCRIÇÃO</th>
            <th className="pm-col-type">TIPO</th>
            <th className="pm-col-val">VALOR</th>
            <th className="pm-col-act"></th>
          </tr>
        </thead>
        <tbody>
          {slice.map(function(r) {
            return (
              <tr key={r.id}>
                <td className="pm-col-date" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{r.day}</td>
                <td>{r.title}</td>
                <td className="pm-col-type"><FlowBadge type={r.type} /></td>
                <td className="pm-col-val">{fmtEuro(r.amount)}</td>
                <td className="pm-col-act">
                  <button type="button" onClick={function() { removeRow(r.id); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.28)", cursor: "pointer", fontSize: 14 }}>×</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {pages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
          <button type="button" disabled={page <= 0} onClick={function() { setPage(page - 1); }} style={btnSt(ACCENT)}>‹</button>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", alignSelf: "center", fontFamily: "'JetBrains Mono',monospace" }}>{page + 1}/{pages}</span>
          <button type="button" disabled={page >= pages - 1} onClick={function() { setPage(page + 1); }} style={btnSt(ACCENT)}>›</button>
        </div>
      )}
    </div>
  );
}

export function ProjectNotes(props) {
  var projectId = props.projectId;
  var bodyS = useState("");
  var body = bodyS[0], setBody = bodyS[1];
  var saveTimer = useRef(null);

  useEffect(function() {
    projectModuleStore.loadNotes(projectId).then(function(d) { setBody(d.body || ""); });
  }, [projectId]);

  function onChange(val) {
    setBody(val);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(function() {
      projectModuleStore.saveNotes(projectId, { body: val });
    }, 500);
  }

  return (
    <div className="pm-panel">
      <style>{MODULE_CSS}</style>
      <h2 className="pm-h2">Notas · Wiki</h2>
      <p style={{ margin: "0 0 10px", fontSize: 10, color: "rgba(255,255,255,0.32)" }}>Markdown simples — documentação, esquemas, progresso.</p>
      <textarea value={body} onChange={function(e) { onChange(e.target.value); }}
        placeholder="# Título&#10;&#10;Notas do projeto..."
        style={Object.assign({}, inputSt(), { minHeight: "min(70vh, 520px)", lineHeight: 1.55, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, resize: "vertical" })} />
    </div>
  );
}

function kpiStatusMeta(pct) {
  if (pct >= 100) return { label: "Concluído", color: "#34D399" };
  if (pct >= 60) return { label: "Bom caminho", color: "#00FFC8" };
  if (pct >= 25) return { label: "Em progresso", color: "#FFB800" };
  return { label: "A iniciar", color: "#FF6B35" };
}

function fmtNum(n) {
  return (Math.round((n || 0) * 100) / 100).toLocaleString("pt-PT");
}

export function ProjectAnalytics(props) {
  var projectId = props.projectId;
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

  function addKpi() {
    persist(kpis.concat([projectModuleStore.newKpi()]));
  }

  function updateKpi(id, patch) {
    persist(kpis.map(function(k) { return k.id === id ? Object.assign({}, k, patch) : k; }));
  }

  function removeKpi(id) {
    persist(kpis.filter(function(k) { return k.id !== id; }));
  }

  var fin = useMemo(function() { return projectModuleStore.investmentTotals(investments); }, [investments]);
  var hasFin = fin.injected > 0 || fin.returned > 0;

  var invStats = useMemo(function() {
    var totalUnits = 0, totalCost = 0, missing = 0, acquired = 0, depleted = 0;
    items.forEach(function(r) {
      totalUnits += r.quantity || 0;
      totalCost += (r.quantity || 0) * (r.unitCost || 0);
      if (r.status === "acquired") acquired++;
      else if (r.status === "depleted") depleted++;
      else missing++;
    });
    return { count: items.length, totalUnits: totalUnits, totalCost: totalCost, missing: missing, acquired: acquired, depleted: depleted };
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
    <div className="pm-panel">
      <style>{MODULE_CSS}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }}>
        <h2 className="pm-h2" style={{ margin: 0 }}>Analytics</h2>
        <button type="button" onClick={addKpi} style={btnSt(ACCENT)}>+ KPI</button>
      </div>

      {kpis.length > 0 && (
        <div className="pm-hero">
          <div className="pm-hero-ring" style={{ background: "conic-gradient(" + ACCENT + " " + (kpiOverview.avg * 3.6) + "deg,rgba(255,255,255,0.08) 0)", boxShadow: "0 0 18px " + ACCENT + "33" }}>
            <i>
              <span style={{ fontSize: 15, fontWeight: 600, color: ACCENT }}>{kpiOverview.avg}%</span>
              <span style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>MÉDIA</span>
            </i>
          </div>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: 0, fontSize: 20, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: "#34D399" }}>{kpiOverview.reached}<span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>/{kpis.length}</span></p>
              <p style={{ margin: "3px 0 0", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.4)" }}>Metas atingidas</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 20, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{kpis.length - kpiOverview.reached}</p>
              <p style={{ margin: "3px 0 0", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.4)" }}>Em curso</p>
            </div>
          </div>
        </div>
      )}

      {hasFin && (
        <>
          <p className="pm-sec">RESUMO FINANCEIRO</p>
          <div className="pm-snap">
            <div className="pm-snap-c"><p className="pm-snap-l">Injetado</p><p className="pm-snap-v" style={{ color: "#FF6B35" }}>{fmtEuro(fin.injected)}</p></div>
            <div className="pm-snap-c"><p className="pm-snap-l">Retorno</p><p className="pm-snap-v" style={{ color: "#34D399" }}>{fmtEuro(fin.returned)}</p></div>
            <div className="pm-snap-c"><p className="pm-snap-l">Saldo</p><p className="pm-snap-v" style={{ color: fin.net >= 0 ? ACCENT : "#FF6B35" }}>{fmtEuro(fin.net)}</p></div>
            <div className="pm-snap-c"><p className="pm-snap-l">ROI</p><p className="pm-snap-v" style={{ color: fin.roi >= 0 ? ACCENT : "#FF6B35" }}>{(fin.roi >= 0 ? "+" : "") + fin.roi.toFixed(0) + "%"}</p></div>
          </div>
        </>
      )}

      {invStats.count > 0 && (
        <>
          <p className="pm-sec">INVENTÁRIO</p>
          <div className="pm-snap">
            <div className="pm-snap-c"><p className="pm-snap-l">Itens</p><p className="pm-snap-v">{invStats.count}</p></div>
            <div className="pm-snap-c"><p className="pm-snap-l">Unidades</p><p className="pm-snap-v">{invStats.totalUnits}</p></div>
            <div className="pm-snap-c"><p className="pm-snap-l">Valor stock</p><p className="pm-snap-v" style={{ color: ACCENT }}>{fmtEuro(invStats.totalCost)}</p></div>
            <div className="pm-snap-c"><p className="pm-snap-l">Em falta</p><p className="pm-snap-v" style={{ color: invStats.missing > 0 ? "#FFB800" : "rgba(255,255,255,0.5)" }}>{invStats.missing}</p></div>
          </div>
        </>
      )}

      <p className="pm-sec">METAS · KPIS</p>
      <div className="pm-kpi-grid">
        {kpiOverview.sorted.map(function(k) {
          var pct = k._pct;
          var sm = kpiStatusMeta(pct);
          var remaining = Math.max(0, (k.target || 0) - (k.current || 0));
          return (
            <div key={k.id} className="pm-kpi-card" style={{ borderColor: sm.color + "33" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 4, alignItems: "center" }}>
                <input value={k.label} onChange={function(e) { updateKpi(k.id, { label: e.target.value }); }} style={Object.assign({}, inputSt(), { fontSize: 11, padding: "5px 7px" })} />
                <button type="button" onClick={function() { removeKpi(k.id); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.28)", cursor: "pointer", flexShrink: 0, fontSize: 14 }}>×</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 6 }}>
                <span className="pm-kpi-status" style={{ color: sm.color, background: sm.color + "1a" }}>{sm.label}</span>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: sm.color }}>{pct.toFixed(0)}%</span>
              </div>
              <div className="pm-kpi-bar">
                <div className="pm-kpi-bar-fill" style={{ width: pct + "%", background: sm.color, boxShadow: "0 0 8px " + sm.color + ", 0 0 16px " + sm.color + "66" }} />
              </div>
              <div className="pm-kpi-inputs">
                <div>
                  <label style={lbl()}>Atual</label>
                  <input type="number" value={k.current} onChange={function(e) { updateKpi(k.id, { current: +e.target.value }); }} className="pm-mono" style={inputSt({ fontFamily: "'JetBrains Mono',monospace" })} />
                </div>
                <div>
                  <label style={lbl()}>Meta</label>
                  <input type="number" value={k.target} onChange={function(e) { updateKpi(k.id, { target: +e.target.value }); }} className="pm-mono" style={inputSt({ fontFamily: "'JetBrains Mono',monospace" })} />
                </div>
              </div>
              <p className="pm-kpi-remain">
                {pct >= 100 ? "Meta atingida ✓" : "Faltam " + fmtNum(remaining) + (k.unit ? " " + k.unit : "")}
              </p>
            </div>
          );
        })}
      </div>
      {kpis.length === 0 && <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 12, marginTop: 4 }}>Adiciona KPIs para monitorizar metas deste projeto. O resumo financeiro e de inventário aparece automaticamente.</p>}
    </div>
  );
}

export function ProjectInventory(props) {
  var projectId = props.projectId;
  var rowsS = useState([]);
  var rows = rowsS[0], setRows = rowsS[1];
  var pageS = useState(0);
  var page = pageS[0], setPage = pageS[1];
  var PAGE = 12;

  useEffect(function() {
    projectModuleStore.loadInventory(projectId).then(setRows);
  }, [projectId]);

  function persist(next) {
    setRows(next);
    projectModuleStore.saveInventory(projectId, next);
  }

  function addItem() {
    persist(rows.concat([projectModuleStore.newInventoryItem({ name: "Novo item" })]));
  }

  function updateItem(id, patch) {
    persist(rows.map(function(r) { return r.id === id ? Object.assign({}, r, patch) : r; }));
  }

  function removeItem(id) {
    persist(rows.filter(function(r) { return r.id !== id; }));
  }

  var pages = Math.max(1, Math.ceil(rows.length / PAGE));
  var slice = rows.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <div className="pm-panel">
      <style>{MODULE_CSS}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 className="pm-h2" style={{ margin: 0 }}>Inventário / Stock</h2>
        <button type="button" onClick={addItem} style={btnSt(ACCENT)}>+ Item</button>
      </div>
      <table className="pm-inv-table">
        <colgroup>
          <col style={{ width: "auto" }} />
          <col style={{ width: 64 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 88 }} />
          <col style={{ width: 36 }} />
        </colgroup>
        <thead>
          <tr>
            <th>ITEM</th>
            <th>QTD</th>
            <th>ESTADO</th>
            <th>CUSTO UN.</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {slice.map(function(r) {
            return (
              <tr key={r.id}>
                <td>
                  <input value={r.name} onChange={function(e) { updateItem(r.id, { name: e.target.value }); }} className="pm-inv-item" style={inputSt({ padding: "5px 7px" })} />
                </td>
                <td>
                  <input type="number" min={0} value={r.quantity} onChange={function(e) { updateItem(r.id, { quantity: +e.target.value }); }} className="pm-inv-qty" style={inputSt({ padding: "5px 7px", fontFamily: "'JetBrains Mono',monospace" })} />
                </td>
                <td>
                  <StatusSelect value={r.status} onChange={function(v) { updateItem(r.id, { status: v }); }} />
                </td>
                <td>
                  <input type="number" min={0} step="0.01" value={r.unitCost} onChange={function(e) { updateItem(r.id, { unitCost: +e.target.value }); }} className="pm-inv-cost" style={inputSt({ padding: "5px 7px" })} />
                </td>
                <td style={{ textAlign: "center" }}>
                  <button type="button" onClick={function() { removeItem(r.id); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.28)", cursor: "pointer" }}>×</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {pages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
          <button type="button" disabled={page <= 0} onClick={function() { setPage(page - 1); }} style={btnSt(ACCENT)}>‹</button>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono',monospace" }}>{page + 1}/{pages}</span>
          <button type="button" disabled={page >= pages - 1} onClick={function() { setPage(page + 1); }} style={btnSt(ACCENT)}>›</button>
        </div>
      )}
    </div>
  );
}

function MetricCard(props) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
      <p style={{ margin: 0, fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.32)", letterSpacing: 0.4 }}>{props.label}</p>
      <p style={{ margin: "4px 0 0", fontSize: 14, fontFamily: "'JetBrains Mono',monospace", color: props.color, fontWeight: 600 }}>{props.value}</p>
    </div>
  );
}
