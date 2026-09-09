import { useEffect, useMemo, useRef, useState } from "react";
import * as projectModuleStore from "../lib/projectModuleStore";
import { ModuleShell, PrimaryBtn, Stat, fmtEuro } from "./ProjectModules";

var MC = "#8FA8C4";

var STOCK_CSS = [
  ".ps-actions{display:flex;gap:8px;flex-wrap:wrap}",
  ".ps-actions .pm-btn{padding:9px 14px}",
  ".ps-form{display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;padding:16px 0 4px;margin-bottom:8px}",
  ".ps-form .pm-f-grow{flex:1 1 180px;min-width:0}",
  ".ps-form .pm-f-amt{flex:0 0 128px}",
  ".ps-form .pm-f-id{flex:0 0 110px}",
  ".ps-charts{display:grid;grid-template-columns:1fr;gap:18px;margin:8px 0 22px}",
  ".ps-chart{padding:14px 8px 8px;border-bottom:1px solid rgba(255,255,255,0.08)}",
  ".ps-chart h3{margin:0 0 10px;font-size:11px;font-family:'JetBrains Mono',monospace;font-weight:600;letter-spacing:.4px;color:#EDEDEF}",
  ".ps-chart svg{width:100%;height:auto;display:block}",
  ".ps-meta-bar{height:12px;border-radius:999px;background:rgba(255,255,255,0.08);overflow:hidden;margin:10px 0 0}",
  ".ps-meta-fill{height:100%;border-radius:999px;background:#8FA8C4;transition:width .4s ease}",
  ".ps-tabs{display:flex;gap:8px;margin:8px 0 14px;flex-wrap:wrap}",
  ".ps-err{margin:0 0 12px;font-size:12px;color:#C08C8C;font-family:'JetBrains Mono',monospace}",
  ".ps-ok{margin:0 0 12px;font-size:12px;color:#8FB39B;font-family:'JetBrains Mono',monospace}",
  ".ps-tablewrap{overflow-x:auto}",
  "@media(max-width:719px){.ps-form .pm-f-amt,.ps-form .pm-f-id{flex:1 1 calc(50% - 6px)}.ps-actions .pm-btn{flex:1 1 calc(50% - 4px);justify-content:center}}",
].join("");

function parseMoney(raw) {
  if (raw == null || String(raw).trim() === "") return 0;
  var n = parseFloat(String(raw).replace("€", "").replace(/\s/g, "").replace(",", "."));
  return isNaN(n) ? NaN : n;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function ChartFrame(props) {
  var labels = props.labels || [];
  var values = props.values || [];
  var color = props.color || MC;
  var kind = props.kind || "line";
  var w = 640, h = 200, padL = 44, padR = 16, padT = 16, padB = 36;
  var innerW = w - padL - padR, innerH = h - padT - padB;
  var max = Math.max.apply(null, values.concat([0]));
  var min = Math.min.apply(null, values.concat([0]));
  if (max === min) { max = min + 1; }
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
  var barW = labels.length ? Math.min(36, innerW / labels.length * 0.5) : 20;

  return (
    <svg viewBox={"0 0 " + w + " " + h} role="img" aria-label={props.title}>
      <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="rgba(255,255,255,0.12)" />
      <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke="rgba(255,255,255,0.12)" />
      {[0, 0.5, 1].map(function(t) {
        var y = padT + (1 - t) * innerH;
        var val = min + t * (max - min);
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
            <text x={padL - 8} y={y + 3} fill="#6E6E76" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono,monospace">{Math.round(val)}</text>
          </g>
        );
      })}
      {kind === "line" && values.length > 0 && (
        <g>
          <polygon points={area} fill={color} opacity="0.2" />
          <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" />
          {values.map(function(v, i) {
            return <circle key={i} cx={xAt(i)} cy={yAt(v)} r="4.5" fill={color} />;
          })}
        </g>
      )}
      {kind === "bar" && values.map(function(v, i) {
        var x = xAt(i) - barW / 2;
        var y = yAt(Math.max(v, 0));
        var bh = Math.abs(yAt(0) - yAt(v));
        return <rect key={i} x={x} y={v >= 0 ? y : yAt(0)} width={barW} height={Math.max(bh, 1)} fill={color} opacity="0.75" rx="3" />;
      })}
      {labels.map(function(label, i) {
        return (
          <text key={label + i} x={xAt(i)} y={h - 10} fill="#A0A0A8" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono,monospace">
            {label}
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
  var modeS = useState("comprar");
  var mode = modeS[0], setMode = modeS[1];
  var tabS = useState("stock");
  var tab = tabS[0], setTab = tabS[1];
  var msgS = useState(null);
  var msg = msgS[0], setMsg = msgS[1];
  var nomeS = useState("");
  var nome = nomeS[0], setNome = nomeS[1];
  var compraS = useState("");
  var compra = compraS[0], setCompra = compraS[1];
  var itemIdS = useState("");
  var itemId = itemIdS[0], setItemId = itemIdS[1];
  var vendaS = useState("");
  var venda = vendaS[0], setVenda = vendaS[1];
  var extraS = useState("0");
  var extra = extraS[0], setExtra = extraS[1];
  var campoS = useState("nome");
  var campo = campoS[0], setCampo = campoS[1];
  var novoS = useState("");
  var novo = novoS[0], setNovo = novoS[1];
  var metaS = useState("");
  var metaVal = metaS[0], setMetaVal = metaS[1];
  var fileRef = useRef(null);

  useEffect(function() {
    projectModuleStore.loadStock(projectId).then(function(d) {
      setData(d);
      setMetaVal(String(d.meta_lucro || 1000));
    });
  }, [projectId]);

  function persist(next) {
    var saved = next;
    setData(next);
    projectModuleStore.saveStock(projectId, next).then(function(d) { saved = d; setData(d); });
    return saved;
  }

  function flash(text, kind) {
    setMsg({ text: text, kind: kind || "ok" });
  }

  function addCompra() {
    var val = parseMoney(compra);
    if (!nome.trim() || isNaN(val) || val < 0) { flash("Preço de compra inválido.", "err"); return; }
    var next = Object.assign({}, data, { items: data.items.slice(), next_id: data.next_id });
    var id = next.next_id;
    next.next_id = id + 1;
    next.items.push({
      id: id, nome: nome.trim(), compra: val, venda: 0, custo_adicional: 0,
      status: "Disponível", data_venda: null, data_compra: todayKey(),
    });
    persist(next);
    setNome(""); setCompra("");
    flash("Artigo " + nome.trim() + " adicionado (#ID " + id + ").");
  }

  function registarVenda() {
    var idVal = parseInt(String(itemId).trim(), 10);
    var vendaVal = parseMoney(venda);
    var extraVal = extra ? parseMoney(extra) : 0;
    if (isNaN(idVal) || isNaN(vendaVal) || isNaN(extraVal)) { flash("Valores inválidos.", "err"); return; }
    var item = data.items.find(function(i) { return i.id === idVal; });
    if (!item) { flash("ID #" + idVal + " não encontrado.", "err"); return; }
    var next = Object.assign({}, data, {
      items: data.items.map(function(i) {
        if (i.id !== idVal) return i;
        return Object.assign({}, i, {
          venda: vendaVal,
          custo_adicional: extraVal > 0 ? extraVal : i.custo_adicional,
          status: "Vendido",
          data_venda: todayKey(),
        });
      }),
    });
    persist(next);
    setItemId(""); setVenda(""); setExtra("0");
    flash("Venda do ID #" + idVal + " registada.");
  }

  function editarArtigo() {
    var idVal = parseInt(String(itemId).trim(), 10);
    if (isNaN(idVal)) { flash("ID inválido.", "err"); return; }
    var item = data.items.find(function(i) { return i.id === idVal; });
    if (!item) { flash("ID não encontrado.", "err"); return; }
    var valStr = novo.trim();
    if (!valStr) { flash("Indica o novo valor.", "err"); return; }
    var nextItem = Object.assign({}, item);
    if (campo === "nome" || campo === "artigo") nextItem.nome = valStr;
    else if (campo === "compra") {
      var c = parseMoney(valStr); if (isNaN(c)) { flash("Compra inválida.", "err"); return; } nextItem.compra = c;
    } else if (campo === "venda") {
      var v = parseMoney(valStr); if (isNaN(v)) { flash("Venda inválida.", "err"); return; }
      nextItem.venda = v;
      nextItem.status = v > 0 ? "Vendido" : "Disponível";
      nextItem.data_venda = v > 0 ? todayKey() : null;
    } else if (campo === "custo" || campo === "custos") {
      var x = parseMoney(valStr); if (isNaN(x)) { flash("Custo inválido.", "err"); return; } nextItem.custo_adicional = x;
    }
    persist(Object.assign({}, data, {
      items: data.items.map(function(i) { return i.id === idVal ? nextItem : i; }),
    }));
    setNovo("");
    flash("Artigo #" + idVal + " atualizado.");
  }

  function removerArtigo() {
    var idVal = parseInt(String(itemId).trim(), 10);
    if (isNaN(idVal)) { flash("ID inválido.", "err"); return; }
    persist(Object.assign({}, data, {
      items: data.items.filter(function(i) { return i.id !== idVal; }),
    }));
    setItemId("");
    flash("Artigo #" + idVal + " removido.");
  }

  function definirMeta() {
    var val = parseMoney(metaVal);
    if (isNaN(val) || val <= 0) { flash("Meta inválida.", "err"); return; }
    persist(Object.assign({}, data, { meta_lucro: val, meta_data_inicio: todayKey() }));
    flash("Meta de lucro atualizada para " + fmtEuro(val) + ".");
  }

  function importJsonFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function() {
      var imported = projectModuleStore.importStockPayload(String(reader.result || ""));
      if (!imported || !imported.items.length) {
        flash("JSON inválido. Usa o stock_data.json do bot.", "err");
        return;
      }
      persist(imported);
      setMetaVal(String(imported.meta_lucro || 1000));
      flash(imported.items.length + " artigos importados do histórico.");
    };
    reader.readAsText(file, "utf-8");
  }

  var stats = useMemo(function() { return data ? projectModuleStore.stockStats(data) : null; }, [data]);
  var weekly = useMemo(function() { return data ? projectModuleStore.stockWeeklySeries(data) : { labels: ["Semana Atual"], lucros: [0], compras: [0] }; }, [data]);
  var disponiveis = data ? data.items.filter(function(i) { return i.status === "Disponível"; }) : [];
  var vendidos = data ? data.items.filter(function(i) { return i.status === "Vendido"; }) : [];
  var blocos = stats ? Math.floor(stats.percentagem / 10) : 0;
  var barra = "█".repeat(blocos) + "░".repeat(10 - blocos);

  if (!data || !stats) {
    return (
      <ModuleShell mc={MC} icon="◎" title="Loja · Stock" subtitle="A carregar…">
        <style>{STOCK_CSS}</style>
      </ModuleShell>
    );
  }

  return (
    <ModuleShell mc={MC} icon="◎" title="Loja · Stock" subtitle="Compras, vendas, lucro semanal e meta — o painel completo da loja"
      action={(
        <div className="ps-actions">
          {[
            ["comprar", "➕ Comprar"],
            ["vender", "💰 Vender"],
            ["editar", "✏️ Editar"],
            ["remover", "🗑️ Remover"],
            ["meta", "🎯 Meta"],
            ["importar", "📥 Importar"],
          ].map(function(pair) {
            var on = mode === pair[0];
            return (
              <button key={pair[0]} type="button" className="pm-btn" onClick={function() { setMode(pair[0]); setMsg(null); }}
                style={on ? { background: "#1A1A1D", border: "1px solid rgba(255,255,255,0.28)", color: "#EDEDEF" } : { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#A0A0A8" }}>
                {pair[1]}
              </button>
            );
          })}
        </div>
      )}>
      <style>{STOCK_CSS}</style>

      {mode === "comprar" && (
        <div className="ps-form">
          <div className="pm-f-grow">
            <label className="pm-label">Nome do artigo</label>
            <input className="pm-input" value={nome} onChange={function(e) { setNome(e.target.value); }} placeholder="Ex: Casaco Nike"
              onKeyDown={function(e) { if (e.key === "Enter") addCompra(); }} />
          </div>
          <div className="pm-f-amt">
            <label className="pm-label">Preço de compra €</label>
            <input className="pm-input" value={compra} onChange={function(e) { setCompra(e.target.value); }} inputMode="decimal" placeholder="16,00"
              style={{ fontFamily: "'JetBrains Mono',monospace" }} />
          </div>
          <PrimaryBtn onClick={addCompra}>Adicionar</PrimaryBtn>
        </div>
      )}
      {mode === "vender" && (
        <div className="ps-form">
          <div className="pm-f-grow">
            <label className="pm-label">Artigo em stock</label>
            <select className="pm-input" value={itemId} onChange={function(e) { setItemId(e.target.value); }}>
              <option value="">Escolher por ID…</option>
              {disponiveis.map(function(item) {
                return <option key={item.id} value={String(item.id)}>#{item.id} · {item.nome}</option>;
              })}
            </select>
          </div>
          <div className="pm-f-amt">
            <label className="pm-label">Preço de venda €</label>
            <input className="pm-input" value={venda} onChange={function(e) { setVenda(e.target.value); }} inputMode="decimal" placeholder="55,00"
              style={{ fontFamily: "'JetBrains Mono',monospace" }} />
          </div>
          <div className="pm-f-amt">
            <label className="pm-label">Custos extra €</label>
            <input className="pm-input" value={extra} onChange={function(e) { setExtra(e.target.value); }} inputMode="decimal" placeholder="2,50"
              style={{ fontFamily: "'JetBrains Mono',monospace" }} />
          </div>
          <PrimaryBtn onClick={registarVenda}>Registar venda</PrimaryBtn>
        </div>
      )}
      {mode === "editar" && (
        <div className="ps-form">
          <div className="pm-f-grow">
            <label className="pm-label">Artigo</label>
            <select className="pm-input" value={itemId} onChange={function(e) { setItemId(e.target.value); }}>
              <option value="">Escolher por ID…</option>
              {data.items.map(function(item) {
                return <option key={item.id} value={String(item.id)}>#{item.id} · {item.nome}</option>;
              })}
            </select>
          </div>
          <div className="pm-f-amt">
            <label className="pm-label">Campo</label>
            <select className="pm-input" value={campo} onChange={function(e) { setCampo(e.target.value); }}>
              <option value="nome">nome</option>
              <option value="compra">compra</option>
              <option value="venda">venda</option>
              <option value="custos">custos</option>
            </select>
          </div>
          <div className="pm-f-grow">
            <label className="pm-label">Novo valor</label>
            <input className="pm-input" value={novo} onChange={function(e) { setNovo(e.target.value); }} placeholder="Casaco Adidas / 20.00" />
          </div>
          <PrimaryBtn onClick={editarArtigo}>Guardar</PrimaryBtn>
        </div>
      )}
      {mode === "remover" && (
        <div className="ps-form">
          <div className="pm-f-grow">
            <label className="pm-label">Artigo a remover</label>
            <select className="pm-input" value={itemId} onChange={function(e) { setItemId(e.target.value); }}>
              <option value="">Escolher por ID…</option>
              {data.items.map(function(item) {
                return <option key={item.id} value={String(item.id)}>#{item.id} · {item.nome}</option>;
              })}
            </select>
          </div>
          <PrimaryBtn onClick={removerArtigo}>Remover</PrimaryBtn>
        </div>
      )}
      {mode === "meta" && (
        <div className="ps-form">
          <div className="pm-f-amt">
            <label className="pm-label">Meta de lucro €</label>
            <input className="pm-input" value={metaVal} onChange={function(e) { setMetaVal(e.target.value); }} inputMode="decimal" placeholder="1000"
              style={{ fontFamily: "'JetBrains Mono',monospace" }} />
          </div>
          <PrimaryBtn onClick={definirMeta}>Definir meta</PrimaryBtn>
        </div>
      )}
      {mode === "importar" && (
        <div className="ps-form">
          <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }}
            onChange={function(e) { importJsonFile(e.target.files && e.target.files[0]); e.target.value = ""; }} />
          <p style={{ margin: 0, flex: "1 1 220px", fontSize: 13, color: "#A0A0A8", lineHeight: 1.5 }}>
            O histórico do bot já entra automaticamente na primeira abertura. Podes voltar a carregar o <code>stock_data.json</code> se atualizares o Discord.
          </p>
          <PrimaryBtn onClick={function() { if (fileRef.current) fileRef.current.click(); }}>Escolher JSON</PrimaryBtn>
        </div>
      )}

      {msg && <p className={msg.kind === "err" ? "ps-err" : "ps-ok"}>{msg.text}</p>}

      <p className="pm-sec">PAINEL DE ESTATÍSTICAS</p>
      <div className="pm-hero pm-card" style={{ marginBottom: 16 }}>
        <div>
          <p className="pm-stat-l">Meta de lucro</p>
          <p style={{ margin: "8px 0 0", fontSize: 22, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
            {fmtEuro(stats.lucroTotal)} <span style={{ fontSize: 13, color: "#6E6E76" }}>/ {fmtEuro(stats.meta)}</span>
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: "#A0A0A8" }}>
            {stats.percentagem.toFixed(1)}% · [{barra}] · {stats.dias} dia(s) desde {stats.inicio}
          </p>
          <div className="ps-meta-bar"><div className="ps-meta-fill" style={{ width: stats.percentagem + "%" }} /></div>
        </div>
      </div>
      <div className="pm-stats">
        <Stat label="Peças registadas" value={stats.items + " (" + stats.disponiveis + " ativas)"} />
        <Stat label="Capital em stock" value={fmtEuro(stats.capitalAtivo)} color="#C4A57C" />
        <Stat label="Custos extra" value={fmtEuro(stats.extrasTotais)} color="#C08C8C" />
        <Stat label="Faturação bruta" value={fmtEuro(stats.totalFaturado)} />
        <Stat label="Lucro líquido" value={fmtEuro(stats.lucroTotal)} color={stats.lucroTotal >= 0 ? "#8FB39B" : "#C08C8C"} />
        <Stat label="Média / peça" value={fmtEuro(stats.mediaLucro)} />
        <Stat label="Margem global" value={stats.margemMedia.toFixed(1) + "%"} color={MC} />
        <Stat label="Vendidas" value={String(stats.vendidos)} />
      </div>

      <p className="pm-sec">GRÁFICOS SEMANAIS</p>
      <div className="ps-charts">
        <div className="ps-chart">
          <h3>Evolução de lucro semanal (€)</h3>
          <ChartFrame title="Lucro semanal" kind="line" color="#8FA8C4" labels={weekly.labels} values={weekly.lucros} />
        </div>
        <div className="ps-chart">
          <h3>Quantidade de compras por semana</h3>
          <ChartFrame title="Compras semanais" kind="bar" color="#8FB39B" labels={weekly.labels} values={weekly.compras} />
        </div>
      </div>

      <div className="ps-tabs">
        <div className="pm-seg">
          <button type="button" className={tab === "stock" ? "on" : ""} onClick={function() { setTab("stock"); }}
            style={tab === "stock" ? { background: "#E6E6E9" } : null}>Stock disponível</button>
          <button type="button" className={tab === "vendas" ? "on" : ""} onClick={function() { setTab("vendas"); }}
            style={tab === "vendas" ? { background: "#E6E6E9" } : null}>Histórico de vendas</button>
        </div>
      </div>

      {tab === "stock" && (
        disponiveis.length === 0 ? (
          <div className="pm-empty">Nenhum artigo em stock neste momento.</div>
        ) : (
          <div className="pm-tablecard ps-tablewrap">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>ID</th><th>Artigo</th>
                  <th style={{ textAlign: "right" }}>Compra</th>
                  <th style={{ textAlign: "right" }}>Custos extra</th>
                  <th>Data compra</th>
                </tr>
              </thead>
              <tbody>
                {disponiveis.map(function(item) {
                  return (
                    <tr key={item.id} onClick={function() { setItemId(String(item.id)); setMode("vender"); }} style={{ cursor: "pointer" }}>
                      <td className="pm-num">{item.id}</td>
                      <td>{item.nome}</td>
                      <td className="pm-num">{fmtEuro(item.compra)}</td>
                      <td className="pm-num">{fmtEuro(item.custo_adicional)}</td>
                      <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#6E6E76" }}>{item.data_compra}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === "vendas" && (
        vendidos.length === 0 ? (
          <div className="pm-empty">Nenhuma venda registada ainda.</div>
        ) : (
          <div className="pm-tablecard ps-tablewrap">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>ID</th><th>Artigo</th>
                  <th style={{ textAlign: "right" }}>Compra</th>
                  <th style={{ textAlign: "right" }}>Venda</th>
                  <th style={{ textAlign: "right" }}>Extra</th>
                  <th style={{ textAlign: "right" }}>Lucro líq.</th>
                </tr>
              </thead>
              <tbody>
                {vendidos.map(function(item) {
                  var lucro = projectModuleStore.stockItemProfit(item);
                  return (
                    <tr key={item.id}>
                      <td className="pm-num">{item.id}</td>
                      <td>{item.nome}</td>
                      <td className="pm-num">{fmtEuro(item.compra)}</td>
                      <td className="pm-num">{fmtEuro(item.venda)}</td>
                      <td className="pm-num">{fmtEuro(item.custo_adicional)}</td>
                      <td className="pm-num" style={{ fontWeight: 600, color: lucro >= 0 ? "#8FB39B" : "#C08C8C" }}>
                        {(lucro >= 0 ? "+" : "") + fmtEuro(lucro)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </ModuleShell>
  );
}
