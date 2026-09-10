import { useEffect, useMemo, useRef, useState } from "react";
import * as projectModuleStore from "../lib/projectModuleStore";
import { ModuleShell, PrimaryBtn } from "./ProjectModules";
import { useCloudSync } from "../lib/useCloudSync";
import { pauseCloudPull, isCloudPullPaused } from "../lib/cloudSyncGuard";

var MC = "#8FA8C4";

var STOCK_CSS = [
  ".pm-wrap{padding:14px 16px 40px!important}",
  ".pm-head{margin-bottom:10px!important;align-items:center!important}",
  ".ps-actions{display:flex;gap:8px;flex-wrap:wrap}",
  ".ps-top{margin-bottom:8px}",
  ".ps-add{display:grid;grid-template-columns:1fr 110px auto;gap:8px;align-items:end}",
  ".ps-week{margin:0 0 10px}",
  ".ps-week-h{margin:0 0 2px;font-size:10px;font-family:'JetBrains Mono',monospace;color:#A0A0A8;letter-spacing:.4px;text-transform:uppercase}",
  ".ps-week-h span{color:#6E6E76;letter-spacing:0;text-transform:none;font-weight:400;margin-left:8px}",
  ".ps-week .ps-stats{grid-template-columns:repeat(3,minmax(0,1fr));margin:0}",
  ".ps-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 8px}",
  ".ps-stat{min-width:0;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.08)}",
  ".ps-stat p{margin:0;font-size:9px;font-family:'JetBrains Mono',monospace;color:#6E6E76;letter-spacing:.5px;text-transform:uppercase}",
  ".ps-stat b{display:block;margin-top:5px;font-size:16px;font-family:'JetBrains Mono',monospace;font-weight:600;line-height:1.15;word-break:break-word}",
  ".ps-meta{padding:8px 0;margin:0 0 8px;border-bottom:1px solid rgba(255,255,255,0.08)}",
  ".ps-meta-row{display:flex;align-items:center;justify-content:space-between;gap:12px}",
  ".ps-meta-bar{height:7px;border-radius:999px;background:rgba(255,255,255,0.08);overflow:hidden;margin:8px 0 0}",
  ".ps-meta-fill{height:100%;border-radius:999px;background:#8FA8C4}",
  ".ps-ghost{border:none;border-bottom:1px solid rgba(255,255,255,0.2);background:transparent;color:#A0A0A8;font-family:'JetBrains Mono',monospace;font-size:11px;padding:6px 2px;cursor:pointer}",
  ".ps-charts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 10px}",
  ".ps-chart h3{margin:0 0 4px;font-size:10px;font-family:'JetBrains Mono',monospace;color:#A0A0A8;letter-spacing:.4px}",
  ".ps-chart svg{width:100%;height:auto;display:block}",
  ".ps-tabs{display:flex;gap:8px;margin:0 0 6px}",
  ".ps-h{margin:0 0 2px;padding:0;font-size:11px;font-family:'JetBrains Mono',monospace;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:#A0A0A8}",
  ".ps-list{display:flex;flex-direction:column;margin:0}",
  ".ps-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.08)}",
  ".ps-card h4{margin:0;font-size:13.5px;font-weight:500;line-height:1.25;overflow-wrap:anywhere}",
  ".ps-card .meta{margin:3px 0 0;font-size:11px;font-family:'JetBrains Mono',monospace;color:#A0A0A8;line-height:1.35;overflow-wrap:anywhere}",
  ".ps-acts{display:flex;flex-direction:row;gap:14px;align-items:center;flex-wrap:wrap}",
  ".ps-link{border:none;background:none;padding:0;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;letter-spacing:.2px;cursor:pointer;color:#A0A0A8}",
  ".ps-link.sell{color:#8FB39B}",
  ".ps-link.del{color:#C08C8C}",
  ".ps-stat-sub{display:block;margin-top:4px;font-size:11px;font-family:'JetBrains Mono',monospace;font-weight:500;color:#A0A0A8}",
  ".ps-err{margin:0 0 8px;font-size:12px;color:#C08C8C;font-family:'JetBrains Mono',monospace}",
  ".ps-ok{margin:0 0 8px;font-size:12px;color:#8FB39B;font-family:'JetBrains Mono',monospace}",
  ".ps-empty{padding:10px 0;font-size:12px;color:#6E6E76}",
  ".ps-sheet-bk{position:fixed;inset:0;z-index:80;background:rgba(0,0,0,0.62);display:flex;align-items:flex-end;justify-content:center;padding:12px}",
  ".ps-sheet{width:min(440px,100%);background:#0E0E10;border:1px solid rgba(255,255,255,0.12);border-radius:18px 18px 12px 12px;padding:18px 16px 16px}",
  ".ps-sheet h3{margin:0 0 14px;font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:600}",
  ".ps-sheet .row{display:flex;flex-direction:column;gap:10px}",
  ".ps-sheet .acts{display:flex;gap:8px;margin-top:14px}",
  ".ps-more{margin:12px 0 0;font-size:11px;color:#6E6E76;background:none;border:none;cursor:pointer;font-family:'JetBrains Mono',monospace}",
  "@media(max-width:719px){",
  ".ps-add{grid-template-columns:1fr 1fr}.ps-add .pm-btn{grid-column:1/-1;justify-content:center;min-height:44px}",
  ".ps-stats{grid-template-columns:1fr 1fr;gap:6px}",
  ".ps-week .ps-stats{grid-template-columns:1fr 1fr}",
  ".ps-stat b{font-size:15px}",
  ".ps-charts{grid-template-columns:1fr;gap:8px}",
  ".ps-card{grid-template-columns:1fr;padding:8px 0 10px}",
  ".ps-link{min-height:32px;font-size:12px}",
  ".ps-sheet-bk{padding:0}.ps-sheet{border-radius:18px 18px 0 0;padding:18px 16px 22px}",
  "}",
  "@media(min-width:720px){.ps-sheet-bk{align-items:center}.ps-sheet{border-radius:16px}}",
].join("");

function parseMoney(raw) {
  if (raw == null || String(raw).trim() === "") return 0;
  var n = parseFloat(String(raw).replace("€", "").replace(/\s/g, "").replace(",", "."));
  return isNaN(n) ? NaN : n;
}

function todayKey() {
  var t = new Date();
  var m = t.getMonth() + 1;
  var d = t.getDate();
  return t.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d);
}

function fmtShort(n) {
  return (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("pt-PT", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + "€";
}

function fmtDay(iso) {
  if (!iso) return "";
  var p = String(iso).split("-");
  if (p.length !== 3) return iso;
  return p[2] + "/" + p[1];
}

function ChartFrame(props) {
  var labels = props.labels || [];
  var values = props.values || [];
  var color = props.color || MC;
  var kind = props.kind || "line";
  var w = 640, h = 168, padL = 36, padR = 10, padT = 12, padB = 28;
  var innerW = w - padL - padR, innerH = h - padT - padB;
  var max = Math.max.apply(null, values.concat([0]));
  var min = Math.min.apply(null, values.concat([0]));
  if (max === min) max = min + 1;
  function xAt(i) {
    if (labels.length <= 1) return padL + innerW / 2;
    return padL + (i / (labels.length - 1)) * innerW;
  }
  function yAt(v) {
    return padT + (1 - ((v - min) / (max - min))) * innerH;
  }
  var points = values.map(function(v, i) { return xAt(i) + "," + yAt(v); }).join(" ");
  var area = values.length
    ? (padL + "," + yAt(0) + " " + points + " " + (labels.length <= 1 ? padL + innerW / 2 : padL + innerW) + "," + yAt(0))
    : "";
  var barW = labels.length ? Math.min(28, innerW / labels.length * 0.45) : 16;
  var showEvery = labels.length > 8 ? 2 : 1;

  return (
    <svg viewBox={"0 0 " + w + " " + h} role="img" aria-label={props.title}>
      <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke="rgba(255,255,255,0.1)" />
      {kind === "line" && values.length > 0 && (
        <g>
          <polygon points={area} fill={color} opacity="0.18" />
          <polyline points={points} fill="none" stroke={color} strokeWidth="2.4" />
        </g>
      )}
      {kind === "bar" && values.map(function(v, i) {
        var y = yAt(Math.max(v, 0));
        var bh = Math.abs(yAt(0) - yAt(v));
        return <rect key={i} x={xAt(i) - barW / 2} y={v >= 0 ? y : yAt(0)} width={barW} height={Math.max(bh, 1)} fill={color} opacity="0.75" rx="3" />;
      })}
      {labels.map(function(label, i) {
        if (i % showEvery !== 0 && i !== labels.length - 1) return null;
        return (
          <text key={label + i} x={xAt(i)} y={h - 8} fill="#6E6E76" fontSize="8" textAnchor="middle" fontFamily="JetBrains Mono,monospace">
            {String(label).replace("Sem ", "")}
          </text>
        );
      })}
    </svg>
  );
}

export function ProjectStock(props) {
  var projectId = props.projectId;
  var dataS = useState(null);
  var data = dataS[0], setData = dataS[1];
  var dataRef = useRef(null);
  var msgS = useState(null);
  var msg = msgS[0], setMsg = msgS[1];
  var nomeS = useState("");
  var nome = nomeS[0], setNome = nomeS[1];
  var compraS = useState("");
  var compra = compraS[0], setCompra = compraS[1];
  var sheetS = useState(null);
  var sheet = sheetS[0], setSheet = sheetS[1];
  var vendaS = useState("");
  var venda = vendaS[0], setVenda = vendaS[1];
  var extraS = useState("0");
  var extra = extraS[0], setExtra = extraS[1];
  var editNomeS = useState("");
  var editNome = editNomeS[0], setEditNome = editNomeS[1];
  var editCompraS = useState("");
  var editCompra = editCompraS[0], setEditCompra = editCompraS[1];
  var editExtraS = useState("");
  var editExtra = editExtraS[0], setEditExtra = editExtraS[1];
  var metaValS = useState("");
  var metaVal = metaValS[0], setMetaVal = metaValS[1];
  var fileRef = useRef(null);
  var showMoreS = useState(false);
  var showMore = showMoreS[0], setShowMore = showMoreS[1];
  var tabS = useState("stock");
  var tab = tabS[0], setTab = tabS[1];
  var sheetRef = useRef(null);
  sheetRef.current = sheet;

  function applyData(d) {
    dataRef.current = d;
    setData(d);
    if (d && d.meta_lucro) setMetaVal(String(d.meta_lucro));
  }

  useEffect(function() {
    projectModuleStore.loadStock(projectId).then(applyData);
  }, [projectId]);

  useCloudSync({
    tables: ["project_stock"],
    intervalMs: 2500,
    shouldSkip: function() { return isCloudPullPaused("project_stock") || !!sheetRef.current; },
    onPull: function() {
      if (isCloudPullPaused("project_stock") || sheetRef.current) return Promise.resolve();
      return projectModuleStore.loadStock(projectId).then(applyData);
    },
  });

  function persist(next) {
    var payload = Object.assign({}, next, { seeded: true, updated: Date.now() });
    pauseCloudPull(8000, "project_stock");
    applyData(payload);
    return projectModuleStore.saveStock(projectId, payload).then(function(saved) {
      if (saved) applyData(saved);
      return saved;
    });
  }

  function flash(text, kind) {
    setMsg({ text: text, kind: kind || "ok" });
  }

  function addCompra() {
    var src = dataRef.current || data;
    var val = parseMoney(compra);
    if (!src || !Array.isArray(src.items) || !nome.trim() || isNaN(val) || val < 0) {
      flash("Preço de compra inválido.", "err");
      return;
    }
    var next = Object.assign({}, src, { items: src.items.slice(), next_id: src.next_id, deleted_ids: (src.deleted_ids || []).slice() });
    var id = next.next_id;
    next.next_id = id + 1;
    next.items.push({
      id: id, nome: nome.trim(), compra: val, venda: 0, custo_adicional: 0,
      status: "Disponível", data_venda: null, data_compra: todayKey(),
    });
    persist(next);
    setNome(""); setCompra("");
    flash(nome.trim() + " adicionado.");
  }

  function openSell(item) {
    setSheet({ type: "sell", id: item.id });
    setVenda("");
    setExtra(item.custo_adicional ? String(item.custo_adicional) : "0");
    setMsg(null);
  }

  function openEdit(item) {
    setSheet({ type: "edit", id: item.id });
    setEditNome(item.nome);
    setEditCompra(String(item.compra));
    setEditExtra(String(item.custo_adicional || 0));
    setVenda(item.venda ? String(item.venda) : "");
    setMsg(null);
  }

  function confirmSell() {
    var idVal = sheet && sheet.id;
    var vendaVal = parseMoney(venda);
    var extraVal = extra ? parseMoney(extra) : 0;
    if (isNaN(vendaVal) || vendaVal <= 0 || isNaN(extraVal)) { flash("Valores inválidos.", "err"); return; }
    var src = dataRef.current || data;
    persist(Object.assign({}, src, {
      items: src.items.map(function(i) {
        if (i.id !== idVal) return i;
        return Object.assign({}, i, {
          venda: vendaVal,
          custo_adicional: extraVal,
          status: "Vendido",
          data_venda: todayKey(),
        });
      }),
    }));
    setSheet(null);
    flash("Venda registada.");
  }

  function confirmEdit() {
    var idVal = sheet && sheet.id;
    var c = parseMoney(editCompra);
    var x = parseMoney(editExtra);
    if (!editNome.trim() || isNaN(c) || isNaN(x)) { flash("Valores inválidos.", "err"); return; }
    var vendaVal = venda.trim() === "" ? null : parseMoney(venda);
    if (vendaVal != null && isNaN(vendaVal)) { flash("Venda inválida.", "err"); return; }
    var src = dataRef.current || data;
    persist(Object.assign({}, src, {
      items: src.items.map(function(i) {
        if (i.id !== idVal) return i;
        var sold = vendaVal != null && vendaVal > 0;
        return Object.assign({}, i, {
          nome: editNome.trim(),
          compra: c,
          custo_adicional: x,
          venda: sold ? vendaVal : 0,
          status: sold ? "Vendido" : "Disponível",
          data_venda: sold ? (i.data_venda || todayKey()) : null,
        });
      }),
    }));
    setSheet(null);
    flash("Artigo atualizado.");
  }

  function removeItem(item) {
    if (!window.confirm("Remover " + item.nome + "?")) return;
    var src = dataRef.current || data;
    persist(Object.assign({}, src, {
      items: src.items.filter(function(i) { return i.id !== item.id; }),
      deleted_ids: (src.deleted_ids || []).concat([item.id]),
    }));
    flash("Removido.");
  }

  function definirMeta() {
    var val = parseMoney(metaVal);
    if (isNaN(val) || val <= 0) { flash("Meta inválida.", "err"); return; }
    persist(Object.assign({}, dataRef.current || data, { meta_lucro: val, meta_ativa: true, meta_data_inicio: todayKey() }));
    setSheet(null);
    flash("Meta ativada.");
  }

  function retirarMeta() {
    persist(Object.assign({}, dataRef.current || data, { meta_ativa: false }));
    flash("Meta retirada.");
  }

  function importJsonFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function() {
      var imported = projectModuleStore.importStockPayload(String(reader.result || ""));
      if (!imported || !imported.items.length) {
        flash("JSON inválido.", "err");
        return;
      }
      persist(Object.assign({}, imported, { seeded: true, meta_ativa: imported.meta_lucro > 0 }));
      flash(imported.items.length + " artigos importados.");
    };
    reader.readAsText(file, "utf-8");
  }

  function xmlEsc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function moneyPt(v) {
    if (v == null || v === "") return "";
    var n = Number(v);
    if (isNaN(n)) return "";
    return String(Math.round(n * 100) / 100).replace(".", ",");
  }

  function itemCells(item, withProfit) {
    var lucro = withProfit ? projectModuleStore.stockItemProfit(item) : "";
    return [
      item.id,
      item.nome,
      item.status,
      moneyPt(item.compra),
      item.venda ? moneyPt(item.venda) : "",
      moneyPt(item.custo_adicional || 0),
      withProfit ? moneyPt(lucro) : "",
      item.data_compra || "",
      item.data_venda || "",
    ];
  }

  function htmlTable(title, headers, rows) {
    var head = headers.map(function(h) { return "<th>" + xmlEsc(h) + "</th>"; }).join("");
    var body = rows.map(function(r) {
      return "<tr>" + r.map(function(c) { return "<td>" + xmlEsc(c) + "</td>"; }).join("") + "</tr>";
    }).join("");
    return "<h2>" + xmlEsc(title) + "</h2><table border=\"1\" cellspacing=\"0\" cellpadding=\"4\"><thead><tr>" + head + "</tr></thead><tbody>" + body + "</tbody></table>";
  }

  function exportExcel() {
    var src = dataRef.current || data;
    if (!src || !src.items || !src.items.length) { flash("Ainda sem dados para exportar.", "err"); return; }
    var statsNow = projectModuleStore.stockStats(src);
    var weeklyNow = projectModuleStore.stockWeeklySeries(src);
    var stockItems = src.items.filter(function(i) { return i.status === "Disponível"; });
    var soldItems = src.items.filter(function(i) { return i.status === "Vendido"; });
    var header = ["ID", "Nome", "Estado", "Compra", "Venda", "Custos extra", "Lucro", "Data compra", "Data venda"];

    var html = [
      "<html xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:x=\"urn:schemas-microsoft-com:office:excel\">",
      "<head><meta charset=\"UTF-8\"><title>Loja backup</title></head><body>",
      htmlTable("Stock (" + stockItems.length + ")", header, stockItems.map(function(item) { return itemCells(item, false); })),
      htmlTable("Vendidos (" + soldItems.length + ")", header, soldItems.map(function(item) { return itemCells(item, true); })),
      htmlTable("Tudo (" + src.items.length + ")", header, src.items.map(function(item) { return itemCells(item, item.status === "Vendido"); })),
      htmlTable("Resumo", ["Campo", "Valor"], [
        ["Peças registadas", statsNow.items],
        ["Em stock", statsNow.disponiveis],
        ["Vendidas", statsNow.vendidos],
        ["Lucro líquido", moneyPt(statsNow.lucroTotal)],
        ["Faturação", moneyPt(statsNow.totalFaturado)],
        ["Capital em stock", moneyPt(statsNow.capitalAtivo)],
        ["Custos extra", moneyPt(statsNow.extrasTotais)],
        ["Média por peça", moneyPt(statsNow.mediaLucro)],
        ["Margem %", moneyPt(statsNow.margemMedia)],
        ["Meta ativa", statsNow.metaAtiva ? "Sim" : "Não"],
        ["Meta", moneyPt(statsNow.meta || 0)],
        ["Progresso %", moneyPt(statsNow.percentagem)],
        ["Desde", statsNow.inicio || ""],
        ["Exportado em", todayKey()],
      ]),
      htmlTable("Semanas", ["Semana", "Lucro", "Compras"], weeklyNow.labels.map(function(label, i) {
        return [label, moneyPt(weeklyNow.lucros[i] || 0), weeklyNow.compras[i] || 0];
      })),
      "</body></html>",
    ].join("");

    var blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "loja-backup-" + todayKey() + ".xls";
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 800);
    flash(src.items.length + " artigos exportados para Excel.");
  }

  var stats = useMemo(function() { return data ? projectModuleStore.stockStats(data) : null; }, [data]);
  var week = useMemo(function() { return data ? projectModuleStore.stockThisWeek(data) : null; }, [data]);
  var weekly = useMemo(function() { return data ? projectModuleStore.stockWeeklySeries(data) : { labels: ["Semana Atual"], lucros: [0], compras: [0] }; }, [data]);
  var disponiveis = useMemo(function() {
    if (!data) return [];
    return projectModuleStore.sortStockByPurchaseDate(data.items.filter(function(i) { return i.status === "Disponível"; }));
  }, [data]);
  var vendidos = useMemo(function() {
    if (!data) return [];
    return projectModuleStore.sortStockBySaleDate(data.items.filter(function(i) { return i.status === "Vendido"; }));
  }, [data]);
  var sheetItem = sheet && data ? data.items.find(function(i) { return i.id === sheet.id; }) : null;

  if (!data || !stats) {
    return (
      <ModuleShell mc={MC} icon="◎" title="Loja" subtitle="A carregar…">
        <style>{STOCK_CSS}</style>
      </ModuleShell>
    );
  }

  return (
    <ModuleShell mc={MC} icon="◎" title="Loja" subtitle={stats.disponiveis + " em stock · " + stats.vendidos + " vendidas"}
      action={(
        <div className="ps-actions">
          <PrimaryBtn onClick={function() { setSheet({ type: "meta" }); setMsg(null); }}>+ Meta</PrimaryBtn>
          <button type="button" className="ps-ghost" onClick={exportExcel}>Excel</button>
        </div>
      )}>
      <style>{STOCK_CSS}</style>

      <div className="ps-top">
        <div className="ps-add">
          <div>
            <label className="pm-label">Artigo</label>
            <input id="ps-nome" className="pm-input" value={nome} onChange={function(e) { setNome(e.target.value); }} placeholder="Nome"
              onKeyDown={function(e) { if (e.key === "Enter") addCompra(); }} />
          </div>
          <div>
            <label className="pm-label">Compra</label>
            <input className="pm-input" value={compra} onChange={function(e) { setCompra(e.target.value); }} inputMode="decimal" placeholder="0€"
              style={{ fontFamily: "'JetBrains Mono',monospace" }} />
          </div>
          <PrimaryBtn onClick={addCompra}>Guardar</PrimaryBtn>
        </div>
      </div>

      {msg && <p className={msg.kind === "err" ? "ps-err" : "ps-ok"}>{msg.text}</p>}

      {week ? (
        <div className="ps-week">
          <h3 className="ps-week-h">Esta semana<span>{fmtDay(week.start)} – {fmtDay(week.end)}</span></h3>
          <div className="ps-stats">
            <div className="ps-stat">
              <p>Lucro</p>
              <b style={{ color: week.lucro >= 0 ? "#8FB39B" : "#C08C8C" }}>{fmtShort(week.lucro)}</b>
            </div>
            <div className="ps-stat">
              <p>Vendas</p>
              <b>{fmtShort(week.vendas)}</b>
              <span className="ps-stat-sub">{week.nVendas} {week.nVendas === 1 ? "venda" : "vendas"}</span>
            </div>
            <div className="ps-stat">
              <p>Compras</p>
              <b>{fmtShort(week.compras)}</b>
              <span className="ps-stat-sub">{week.nCompras} {week.nCompras === 1 ? "artigo" : "artigos"}</span>
            </div>
          </div>
        </div>
      ) : null}

      <h3 className="ps-week-h">Total</h3>
      <div className="ps-stats">
        <div className="ps-stat"><p>Lucro</p><b style={{ color: stats.lucroTotal >= 0 ? "#8FB39B" : "#C08C8C" }}>{fmtShort(stats.lucroTotal)}</b></div>
        <div className="ps-stat"><p>Faturação</p><b>{fmtShort(stats.totalFaturado)}</b></div>
        <div className="ps-stat"><p>Em stock</p><b style={{ color: "#C4A57C" }}>{fmtShort(stats.capitalAtivo)}</b></div>
        <div className="ps-stat">
          <p>Margem</p>
          <b>{stats.margemMedia.toFixed(0)}%</b>
          <span className="ps-stat-sub">média {fmtShort(stats.mediaLucro)}</span>
        </div>
      </div>

      {stats.metaAtiva ? (
        <div className="ps-meta">
          <div className="ps-meta-row">
            <div>
              <p className="pm-label" style={{ marginBottom: 4 }}>Meta de lucro</p>
              <p style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 16, fontWeight: 600 }}>
                {fmtShort(stats.lucroTotal)} <span style={{ color: "#6E6E76", fontSize: 12 }}>/ {fmtShort(stats.meta)}</span>
              </p>
              <p style={{ margin: "5px 0 0", fontSize: 11, color: "#A0A0A8", fontFamily: "'JetBrains Mono',monospace" }}>
                {stats.percentagem.toFixed(0)}% · {stats.dias} dias
              </p>
            </div>
            <button type="button" className="ps-ghost" onClick={retirarMeta}>Retirar</button>
          </div>
          <div className="ps-meta-bar"><div className="ps-meta-fill" style={{ width: stats.percentagem + "%" }} /></div>
        </div>
      ) : null}

      <div className="ps-charts">
        <div className="ps-chart">
          <h3>Lucro / semana</h3>
          <ChartFrame title="Lucro semanal" kind="line" color="#8FA8C4" labels={weekly.labels} values={weekly.lucros} />
        </div>
        <div className="ps-chart">
          <h3>Compras / semana</h3>
          <ChartFrame title="Compras semanais" kind="bar" color="#8FB39B" labels={weekly.labels} values={weekly.compras} />
        </div>
      </div>

      <div className="ps-tabs">
        <div className="pm-seg">
          <button type="button" className={tab === "stock" ? "on" : ""} onClick={function() { setTab("stock"); }}
            style={tab === "stock" ? { background: "#E6E6E9" } : null}>Stock · {disponiveis.length}</button>
          <button type="button" className={tab === "vendas" ? "on" : ""} onClick={function() { setTab("vendas"); }}
            style={tab === "vendas" ? { background: "#E6E6E9" } : null}>Vendidos · {vendidos.length}</button>
        </div>
      </div>

      {tab === "stock" && (
        disponiveis.length === 0 ? (
          <p className="ps-empty">Nada em stock. Adiciona uma compra acima.</p>
        ) : (
          <div className="ps-list">
            {disponiveis.map(function(item) {
              return (
                <article key={item.id} className="ps-card">
                  <div>
                    <h4>{item.nome}</h4>
                    <p className="meta">#{item.id} · compra {fmtShort(item.compra)}{item.custo_adicional ? " · extra " + fmtShort(item.custo_adicional) : ""} · {fmtDay(item.data_compra)}</p>
                  </div>
                  <div className="ps-acts">
                    <button type="button" className="ps-link sell" onClick={function() { openSell(item); }}>Vender</button>
                    <button type="button" className="ps-link" onClick={function() { openEdit(item); }}>Editar</button>
                    <button type="button" className="ps-link del" onClick={function() { removeItem(item); }}>Remover</button>
                  </div>
                </article>
              );
            })}
          </div>
        )
      )}

      {tab === "vendas" && (
        vendidos.length === 0 ? (
          <p className="ps-empty">Ainda sem vendas.</p>
        ) : (
          <div className="ps-list">
            {vendidos.map(function(item) {
              var lucro = projectModuleStore.stockItemProfit(item);
              return (
                <article key={item.id} className="ps-card">
                  <div>
                    <h4>{item.nome}</h4>
                    <p className="meta">
                      #{item.id} · {fmtShort(item.compra)} → {fmtShort(item.venda)}
                      {item.custo_adicional ? " · extra " + fmtShort(item.custo_adicional) : ""}
                      {" · "}
                      <span style={{ color: lucro >= 0 ? "#8FB39B" : "#C08C8C", fontWeight: 600 }}>{(lucro >= 0 ? "+" : "") + fmtShort(lucro)}</span>
                      {item.data_venda ? " · " + fmtDay(item.data_venda) : ""}
                    </p>
                  </div>
                  <div className="ps-acts">
                    <button type="button" className="ps-link" onClick={function() { openEdit(item); }}>Editar</button>
                    <button type="button" className="ps-link del" onClick={function() { removeItem(item); }}>Remover</button>
                  </div>
                </article>
              );
            })}
          </div>
        )
      )}

      <button type="button" className="ps-more" onClick={function() { setShowMore(!showMore); }}>
        {showMore ? "Esconder extras" : "Importar JSON"}
      </button>
      {showMore && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }}
            onChange={function(e) { importJsonFile(e.target.files && e.target.files[0]); e.target.value = ""; }} />
          <PrimaryBtn onClick={function() { if (fileRef.current) fileRef.current.click(); }}>Importar stock_data.json</PrimaryBtn>
        </div>
      )}

      {sheet && (
        <div className="ps-sheet-bk" onClick={function(e) { if (e.target === e.currentTarget) setSheet(null); }}>
          <div className="ps-sheet">
            {sheet.type === "sell" && sheetItem && (
              <>
                <h3>Vender · {sheetItem.nome}</h3>
                <div className="row">
                  <div>
                    <label className="pm-label">Preço de venda</label>
                    <input className="pm-input" value={venda} onChange={function(e) { setVenda(e.target.value); }} inputMode="decimal" placeholder="55" autoFocus
                      style={{ fontFamily: "'JetBrains Mono',monospace" }} />
                  </div>
                  <div>
                    <label className="pm-label">Custos extra</label>
                    <input className="pm-input" value={extra} onChange={function(e) { setExtra(e.target.value); }} inputMode="decimal"
                      style={{ fontFamily: "'JetBrains Mono',monospace" }} />
                  </div>
                </div>
                <div className="acts">
                  <PrimaryBtn onClick={confirmSell}>Registar venda</PrimaryBtn>
                  <button type="button" className="ps-ghost" onClick={function() { setSheet(null); }}>Cancelar</button>
                </div>
              </>
            )}
            {sheet.type === "edit" && sheetItem && (
              <>
                <h3>Editar · #{sheetItem.id}</h3>
                <div className="row">
                  <div>
                    <label className="pm-label">Nome</label>
                    <input className="pm-input" value={editNome} onChange={function(e) { setEditNome(e.target.value); }} />
                  </div>
                  <div>
                    <label className="pm-label">Compra</label>
                    <input className="pm-input" value={editCompra} onChange={function(e) { setEditCompra(e.target.value); }} inputMode="decimal"
                      style={{ fontFamily: "'JetBrains Mono',monospace" }} />
                  </div>
                  <div>
                    <label className="pm-label">Custos extra</label>
                    <input className="pm-input" value={editExtra} onChange={function(e) { setEditExtra(e.target.value); }} inputMode="decimal"
                      style={{ fontFamily: "'JetBrains Mono',monospace" }} />
                  </div>
                  <div>
                    <label className="pm-label">Venda (vazio = em stock)</label>
                    <input className="pm-input" value={venda} onChange={function(e) { setVenda(e.target.value); }} inputMode="decimal"
                      style={{ fontFamily: "'JetBrains Mono',monospace" }} />
                  </div>
                </div>
                <div className="acts">
                  <PrimaryBtn onClick={confirmEdit}>Guardar</PrimaryBtn>
                  <button type="button" className="ps-ghost" onClick={function() { setSheet(null); }}>Cancelar</button>
                </div>
              </>
            )}
            {sheet.type === "meta" && (
              <>
                <h3>{stats.metaAtiva ? "Alterar meta" : "Nova meta"}</h3>
                <div className="row">
                  <div>
                    <label className="pm-label">Objetivo de lucro €</label>
                    <input className="pm-input" value={metaVal} onChange={function(e) { setMetaVal(e.target.value); }} inputMode="decimal" placeholder="500"
                      style={{ fontFamily: "'JetBrains Mono',monospace" }} />
                  </div>
                </div>
                <div className="acts">
                  <PrimaryBtn onClick={definirMeta}>Ativar</PrimaryBtn>
                  <button type="button" className="ps-ghost" onClick={function() { setSheet(null); }}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </ModuleShell>
  );
}
