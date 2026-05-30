import { useEffect, useMemo, useRef, useState } from "react";
import * as projectModuleStore from "../lib/projectModuleStore";

var ACCENT = "#00FFC8";

function fmtEuro(n) {
  return (n || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

function panelStyle() {
  return { padding: isMobilePadding(), color: "#fff", fontFamily: "'IBM Plex Sans',sans-serif", height: "100%", overflow: "auto" };
}
function isMobilePadding() {
  return typeof window !== "undefined" && window.innerWidth < 720 ? "12px" : "18px 20px";
}
function inputSt() {
  return { width: "100%", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", padding: "9px 11px", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
}
function btnSt(color) {
  return { background: color + "18", border: "1px solid " + color + "45", borderRadius: 10, color: color, padding: "8px 14px", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 };
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
  var PAGE = 8;

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
    <div style={panelStyle()}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <h2 style={{ margin: "0 0 16px", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: ACCENT }}>Investimentos</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 20 }}>
        <MetricCard label="Injetado" value={fmtEuro(totals.injected)} color="#FF6B35" />
        <MetricCard label="Retorno" value={fmtEuro(totals.returned)} color="#34D399" />
        <MetricCard label="Saldo" value={fmtEuro(totals.net)} color={totals.net >= 0 ? ACCENT : "#FF6B35"} />
        <MetricCard label="ROI" value={(totals.roi >= 0 ? "+" : "") + totals.roi.toFixed(1) + "%"} color={totals.roi >= 0 ? ACCENT : "#FF6B35"} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 160px" }}>
          <label style={lbl()}>Descrição</label>
          <input value={title} onChange={function(e) { setTitle(e.target.value); }} style={inputSt()} placeholder="Ex: Hosting, ads..." />
        </div>
        <div style={{ flex: "0 0 100px" }}>
          <label style={lbl()}>Valor €</label>
          <input value={amount} onChange={function(e) { setAmount(e.target.value); }} style={inputSt()} inputMode="decimal" />
        </div>
        <div style={{ flex: "0 0 140px" }}>
          <label style={lbl()}>Tipo</label>
          <select value={type} onChange={function(e) { setType(e.target.value); }} style={inputSt()}>
            <option value="debit">Gasto / Injeção</option>
            <option value="credit">Retorno / Receita</option>
          </select>
        </div>
        <button type="button" onClick={addRow} style={btnSt(ACCENT)}>Registar</button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, textAlign: "left" }}>
            <th style={thSt()}>DATA</th><th style={thSt()}>DESCRIÇÃO</th><th style={thSt()}>TIPO</th><th style={thSt()}>VALOR</th><th style={thSt()}></th>
          </tr>
        </thead>
        <tbody>
          {slice.map(function(r) {
            return (
              <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={tdSt()}>{r.day}</td>
                <td style={tdSt()}>{r.title}</td>
                <td style={Object.assign({}, tdSt(), { color: r.type === "credit" ? "#34D399" : "#FF6B35" })}>{r.type === "credit" ? "Crédito" : "Débito"}</td>
                <td style={tdSt()}>{fmtEuro(r.amount)}</td>
                <td style={tdSt()}><button type="button" onClick={function() { removeRow(r.id); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>×</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {pages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
          <button type="button" disabled={page <= 0} onClick={function() { setPage(page - 1); }} style={btnSt(ACCENT)}>‹</button>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>{page + 1} / {pages}</span>
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
    <div style={panelStyle()}>
      <h2 style={{ margin: "0 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: ACCENT }}>Notas · Wiki</h2>
      <p style={{ margin: "0 0 12px", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Markdown simples — documentação, esquemas, progresso.</p>
      <textarea value={body} onChange={function(e) { onChange(e.target.value); }}
        placeholder="# Título&#10;&#10;Notas do projeto..."
        style={Object.assign({}, inputSt(), { minHeight: "min(70vh, 520px)", lineHeight: 1.6, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, resize: "vertical" })} />
    </div>
  );
}

export function ProjectAnalytics(props) {
  var projectId = props.projectId;
  var kpisS = useState([]);
  var kpis = kpisS[0], setKpis = kpisS[1];

  useEffect(function() {
    projectModuleStore.loadKpis(projectId).then(setKpis);
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

  return (
    <div style={panelStyle()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10 }}>
        <h2 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: ACCENT }}>Analytics</h2>
        <button type="button" onClick={addKpi} style={btnSt(ACCENT)}>+ KPI</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
        {kpis.map(function(k) {
          var pct = k.target > 0 ? Math.min(100, (k.current / k.target) * 100) : 0;
          return (
            <div key={k.id} style={{ padding: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <input value={k.label} onChange={function(e) { updateKpi(k.id, { label: e.target.value }); }} style={Object.assign({}, inputSt(), { fontSize: 12, padding: "6px 8px" })} />
                <button type="button" onClick={function() { removeKpi(k.id); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>×</button>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", marginBottom: 10, overflow: "hidden" }}>
                <div style={{ width: pct + "%", height: "100%", background: ACCENT, boxShadow: "0 0 10px " + ACCENT + "88" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <div>
                  <label style={lbl()}>Atual</label>
                  <input type="number" value={k.current} onChange={function(e) { updateKpi(k.id, { current: +e.target.value }); }} style={inputSt()} />
                </div>
                <div>
                  <label style={lbl()}>Meta</label>
                  <input type="number" value={k.target} onChange={function(e) { updateKpi(k.id, { target: +e.target.value }); }} style={inputSt()} />
                </div>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.35)" }}>{pct.toFixed(0)}% {k.unit ? "· " + k.unit : ""}</p>
            </div>
          );
        })}
      </div>
      {kpis.length === 0 && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Adiciona KPIs para monitorizar metas deste projeto.</p>}
    </div>
  );
}

export function ProjectInventory(props) {
  var projectId = props.projectId;
  var rowsS = useState([]);
  var rows = rowsS[0], setRows = rowsS[1];
  var pageS = useState(0);
  var page = pageS[0], setPage = pageS[1];
  var PAGE = 10;

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
    <div style={panelStyle()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: ACCENT }}>Inventário / Stock</h2>
        <button type="button" onClick={addItem} style={btnSt(ACCENT)}>+ Item</button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, textAlign: "left" }}>
            <th style={thSt()}>ITEM</th><th style={thSt()}>QTD</th><th style={thSt()}>ESTADO</th><th style={thSt()}>CUSTO UN.</th><th style={thSt()}></th>
          </tr>
        </thead>
        <tbody>
          {slice.map(function(r) {
            return (
              <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={tdSt()}><input value={r.name} onChange={function(e) { updateItem(r.id, { name: e.target.value }); }} style={Object.assign({}, inputSt(), { padding: "6px 8px" })} /></td>
                <td style={tdSt()}><input type="number" min={0} value={r.quantity} onChange={function(e) { updateItem(r.id, { quantity: +e.target.value }); }} style={Object.assign({}, inputSt(), { width: 64, padding: "6px 8px" })} /></td>
                <td style={tdSt()}>
                  <select value={r.status} onChange={function(e) { updateItem(r.id, { status: e.target.value }); }} style={Object.assign({}, inputSt(), { padding: "6px 8px", color: r.status === "acquired" ? "#34D399" : "#FFB800" })}>
                    <option value="missing">Em falta</option>
                    <option value="acquired">Adquirido</option>
                  </select>
                </td>
                <td style={tdSt()}><input type="number" min={0} step="0.01" value={r.unitCost} onChange={function(e) { updateItem(r.id, { unitCost: +e.target.value }); }} style={Object.assign({}, inputSt(), { width: 80, padding: "6px 8px" })} /></td>
                <td style={tdSt()}><button type="button" onClick={function() { removeItem(r.id); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>×</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {pages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
          <button type="button" disabled={page <= 0} onClick={function() { setPage(page - 1); }} style={btnSt(ACCENT)}>‹</button>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{page + 1} / {pages}</span>
          <button type="button" disabled={page >= pages - 1} onClick={function() { setPage(page + 1); }} style={btnSt(ACCENT)}>›</button>
        </div>
      )}
    </div>
  );
}

function MetricCard(props) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
      <p style={{ margin: 0, fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.35)" }}>{props.label}</p>
      <p style={{ margin: "6px 0 0", fontSize: 16, fontFamily: "'JetBrains Mono',monospace", color: props.color, fontWeight: 600 }}>{props.value}</p>
    </div>
  );
}

function lbl() {
  return { display: "block", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.35)", marginBottom: 4 };
}
function thSt() {
  return { padding: "8px 6px", borderBottom: "1px solid rgba(255,255,255,0.06)" };
}
function tdSt() {
  return { padding: "8px 6px", verticalAlign: "middle" };
}
