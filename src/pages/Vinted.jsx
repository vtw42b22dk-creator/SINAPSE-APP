import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HubBack, HUB_BACK_CSS } from "../components/HubBack";
import { PageLoader } from "../components/PageLoader";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { pageBg, pageText } from "../lib/ThemeContext";
import { moduleColor, moduleGlow, MODULE_GLOW_CSS, COLORS } from "../lib/theme";
import { lerPonte, ouvirPonte, pedirComando } from "../lib/vintedStore";

var ACCENT = moduleColor("vinted");
var LETRAS = ["S", "T", "Q", "Q", "S", "S", "D"];
var PORTAS = [
  { id: "mensagens", nome: "Mensagens", desc: "Modo vendedor, fixar e respostas rápidas" },
  { id: "venda", nome: "Modo venda", desc: "Publicar e acabar rascunhos" },
  { id: "analise", nome: "Análise", desc: "Há quanto tempo está cada anúncio" },
  { id: "compra", nome: "Modo de Compra", desc: "Caça sapatilhas e avisa no Telegram" },
];

var VIN_CSS = [
  MODULE_GLOW_CSS,
  ".vin-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:8px 2px;background:transparent;border:none;border-bottom:1px solid currentColor;color:#A0A0A8;cursor:pointer;font-family:'Manrope',sans-serif;font-size:11px;letter-spacing:.4px}",
  ".vin-btn:hover{color:#EDEDEF}.vin-btn:disabled{opacity:.4;cursor:default}",
  ".vin-lbl{margin:0;font-family:'Manrope',sans-serif;font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:#6E6A64}",
  ".vin-kpi{text-align:left;padding:16px 0 14px;border:none;border-bottom:1px solid rgba(255,255,255,.1);background:transparent;color:inherit;cursor:pointer;font-family:inherit;min-width:0}",
  ".vin-kpi b{display:block;font-family:'Syne',sans-serif;font-size:28px;letter-spacing:-.04em;line-height:1}",
  ".vin-kpi i{display:block;margin-top:8px;font-style:normal;font-size:12px;color:#A0988C}",
  ".vin-kpi.on{border-bottom-color:var(--mc)}",
  ".vin-door{text-align:left;padding:16px 0;border:none;border-bottom:1px solid rgba(255,255,255,.08);background:transparent;color:inherit;cursor:pointer;font-family:inherit;width:100%}",
  ".vin-door strong{display:block;font-family:'Syne',sans-serif;font-size:16px;font-weight:650;letter-spacing:-.03em}",
  ".vin-door span{display:block;margin-top:4px;font-size:12px;color:#6E6A64}",
  ".vin-door.on strong{color:var(--mc)}",
  ".vin-row{display:flex;align-items:center;gap:12px;width:100%;padding:12px 0;border:none;border-bottom:1px solid rgba(255,255,255,.06);background:none;color:inherit;text-align:left;text-decoration:none;font-family:inherit}",
  ".vin-row h3{margin:0;font-size:14px;font-weight:600;color:#EDE8DF}",
  ".vin-row p{margin:3px 0 0;font-size:12px;color:#6E6A64;line-height:1.4}",
  ".vin-foto{width:42px;height:42px;object-fit:cover;flex-shrink:0;background:rgba(255,255,255,.04)}",
  ".vin-field{width:100%;margin-top:8px;padding:10px 0;border:none;border-bottom:1px solid rgba(255,255,255,.16);background:transparent;color:#EDE8DF;font-family:'Manrope',sans-serif;font-size:14px;outline:none}",
  ".vin-field:focus{border-bottom-color:var(--mc)}",
  ".vin-sw{min-width:52px;padding:6px 0;border:none;border-bottom:1px solid currentColor;background:transparent;font-family:'Manrope',sans-serif;font-size:11px;letter-spacing:.4px;cursor:pointer}",
  "@media(max-width:719px){.vin-btn,.vin-sw{min-height:44px}}",
].join("");

function eur(v) {
  return (Number(v) || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}
function ha(ts, agora) {
  var n = Number(ts);
  if (!n || !agora) return "";
  var d = agora - n;
  if (d < 60000) return "agora";
  if (d < 3600000) return Math.floor(d / 60000) + " min";
  if (d < 86400000) return Math.floor(d / 3600000) + " h";
  return new Date(n).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}
function corDe(cor) {
  if (cor === "vermelho") return COLORS.negative;
  if (cor === "amarelo") return COLORS.warning;
  if (cor === "verde") return COLORS.positive;
  return COLORS.faint;
}

export default function Vinted() {
  var navigate = useNavigate();
  var vwS = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  var isMobile = vwS[0] < 720;
  var setVw = vwS[1];
  var dataS = useState({ loading: true, erro: "", estado: null, comandos: [], agora: 0 });
  var data = dataS[0], setData = dataS[1];
  var secaoS = useState("mensagens");
  var secao = secaoS[0], setSecao = secaoS[1];
  var subS = useState("conversas");
  var sub = subS[0], setSub = subS[1];
  var gavetaS = useState("");
  var gaveta = gavetaS[0], setGaveta = gavetaS[1];
  var filtroS = useState("todos");
  var filtro = filtroS[0], setFiltro = filtroS[1];
  var qS = useState("");
  var q = qS[0], setQ = qS[1];
  var confS = useState("");
  var conf = confS[0], setConf = confS[1];
  var aPedirS = useState(false);
  var aPedir = aPedirS[0], setAPedir = aPedirS[1];
  var avisoS = useState("");
  var aviso = avisoS[0], setAviso = avisoS[1];
  var msgS = useState("");
  var msg = msgS[0], setMsg = msgS[1];
  var qrS = useState({ titulo: "", texto: "", i: -1, edTitulo: "", edTexto: "" });
  var qr = qrS[0], setQr = qrS[1];
  var buscaS = useState({ nome: "", texto: "" });
  var busca = buscaS[0], setBusca = buscaS[1];

  var carregar = useCallback(function() {
    lerPonte().then(function(res) {
      setData({ loading: false, erro: res.erro || "", estado: res.estado, comandos: res.comandos || [], agora: Date.now() });
    }).catch(function() {
      setData({ loading: false, erro: "Não consegui ler a ponte.", estado: null, comandos: [], agora: Date.now() });
    });
  }, [setData]);

  useEffect(function() {
    carregar();
    var parar = ouvirPonte(carregar);
    var id = setInterval(carregar, 8000);
    return function() { parar(); clearInterval(id); };
  }, [carregar]);

  useEffect(function() {
    function onResize() { setVw(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, [setVw]);

  var payload = (data.estado && data.estado.payload) || {};
  var msgRemota = (payload.mensagens && payload.mensagens.texto) || "";
  useEffect(function() {
    setMsg(function(atual) {
      return document.activeElement && document.activeElement.id === "vin-msg" ? atual : msgRemota;
    });
  }, [msgRemota, setMsg]);

  var visto = data.estado && data.estado.visto_em;
  var ligado = Boolean(visto && data.agora && data.agora - new Date(visto).getTime() < 150000);
  var origem = payload.origem || "https://www.vinted.pt";
  var semana = payload.semana || {};
  var kpis = payload.kpis || {};
  var msgs = payload.mensagens || {};
  var compra = payload.compra || {};
  var contagem = payload.contagem || {};
  var comando = (data.comandos || []).find(function(c) { return c.estado === "pedido" || c.estado === "a-correr"; });
  var ultimo = (data.comandos || [])[0];
  var aCorrer = Boolean(payload.aCorrer) || Boolean(comando);

  function pedir(acao, extra) {
    setAviso("");
    setAPedir(true);
    var corpo = Object.assign({ acao: acao }, extra || {});
    pedirComando("acao", corpo).then(function() {
      setAviso(ligado ? "O computador está a tratar disto." : "Pedido guardado. Corre quando o Chrome e a Vinted estiverem abertos.");
      carregar();
      setAPedir(false);
    }).catch(function(e) {
      setAviso(e.message || "Não consegui enviar o pedido.");
      setAPedir(false);
    });
  }

  function confirmar(chave, fn) {
    if (conf !== chave) { setConf(chave); return; }
    setConf("");
    fn();
  }

  var bg = pageBg();
  var text = pageText();
  var porDia = Array.isArray(semana.porDia) ? semana.porDia : [0, 0, 0, 0, 0, 0, 0];

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'Manrope',sans-serif", position: "relative", overflowX: "hidden" }}>
      <style>{MODULE_ENTRY_CSS + HUB_BACK_CSS + VIN_CSS}</style>
      <div className="mod-glow" style={{ top: -90, right: "4%", background: moduleGlow(ACCENT) }} aria-hidden="true" />
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "#0A0A0B", borderBottom: "1px solid rgba(255,255,255,.08)", padding: isMobile ? "12px" : "14px 20px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <HubBack onClick={function() { navigate("/"); }} />
            <div>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 22 : 26, fontWeight: 700, letterSpacing: "-0.04em", color: ACCENT, margin: 0 }}>Central</h1>
              <p className="vin-lbl" style={{ marginTop: 4 }}>{ligado ? "Computador ligado" : "Computador fechado"}{payload.at ? " · " + ha(payload.at, data.agora) : ""}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <a className="vin-btn" href={origem + "/"} target="_blank" rel="noreferrer">Vinted</a>
            <button type="button" className="vin-btn" disabled={aPedir || aCorrer} onClick={function() { pedir("atualizar"); }} style={{ color: ACCENT, borderBottomColor: ACCENT }}>
              {aCorrer ? "A actualizar" : "Actualizar"}
            </button>
          </div>
        </div>
      </header>

      <main className="mod-main" style={{ maxWidth: 980, margin: "0 auto", padding: isMobile ? "8px 16px 96px" : "12px 24px 72px" }}>
        {data.loading ? <PageLoader accent={ACCENT} /> : null}
        {!data.loading && data.erro ? <p style={{ color: COLORS.muted, fontSize: 14, lineHeight: 1.5 }}>{data.erro}</p> : null}
        {aviso ? <p style={{ color: COLORS.muted, fontSize: 13 }}>{aviso}</p> : null}
        {ultimo && ultimo.estado === "erro" && ultimo.resultado && ultimo.resultado.erro ? <p style={{ color: COLORS.negative, fontSize: 13 }}>{ultimo.resultado.erro}</p> : null}

        {!data.loading && !data.erro ? (
          <div>
            {aCorrer && (payload.passos || []).length ? (
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", padding: "10px 0 4px" }}>
                {(payload.passos || []).map(function(p) {
                  return <span key={p.id} className="vin-lbl" style={{ color: p.estado === "erro" ? COLORS.negative : p.estado === "ok" ? COLORS.positive : COLORS.muted }}>{p.nome}{p.msg ? " · " + p.msg : ""}</span>;
                })}
              </div>
            ) : null}

            <p className="vin-lbl" style={{ marginTop: 18 }}>{semana.rotulo || "Esta semana"}</p>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,minmax(0,1fr))", gap: 18 }}>
              <Kpi on={gaveta === "vendas"} titulo="Vendas da semana" valor={String(semana.vendas || 0)} sub={eur(semana.valorVendas)} onClick={function() { setGaveta(gaveta === "vendas" ? "" : "vendas"); }} />
              <Kpi on={gaveta === "compras"} titulo="Compras da semana" valor={String(semana.compras || 0)} sub={eur(semana.valorCompras)} onClick={function() { setGaveta(gaveta === "compras" ? "" : "compras"); }} />
              <Kpi on={gaveta === "total"} titulo="Faturação total" valor={eur(kpis.faturacao)} sub={(kpis.vendasTotal || 0) + " vendas"} onClick={function() { setGaveta(gaveta === "total" ? "" : "total"); }} />
              <Kpi on={gaveta === "gasto"} titulo="Compras totais" valor={String(kpis.comprasTotal || 0)} sub={eur(kpis.valorCompras)} onClick={function() { setGaveta(gaveta === "gasto" ? "" : "gasto"); }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 6, marginTop: 8 }}>
              {LETRAS.map(function(l, i) {
                return <div key={l + i} style={{ textAlign: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.08)" }}><b style={{ fontFamily: "'Syne',sans-serif" }}>{porDia[i] || 0}</b><div className="vin-lbl" style={{ marginTop: 4 }}>{l}</div></div>;
              })}
            </div>
            {gaveta ? <Gaveta gaveta={gaveta} payload={payload} agora={data.agora} origem={origem} /> : null}

            <Secao titulo="O que mudou">
              {(payload.novidades || []).length ? (payload.novidades || []).map(function(n, i) {
                return (
                  <div key={i} className="vin-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3>{n.texto}</h3>
                      {n.sub ? <p>{n.sub}</p> : null}
                    </div>
                    {n.podeRelaunch ? <button type="button" className="vin-btn" disabled={aPedir} onClick={function() { pedir("relaunch", { id: n.id, titulo: n.titulo }); }}>Republicar</button> : null}
                    {n.href ? <a className="vin-btn" href={n.href} target="_blank" rel="noreferrer">Abrir</a> : null}
                  </div>
                );
              }) : <Vazio>Nada de novo desde a última visita à Central.</Vazio>}
            </Secao>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 0, marginTop: 28 }}>
              {PORTAS.map(function(p) {
                var badge = "";
                if (p.id === "mensagens" && (msgs.porResponder || []).length) badge = (msgs.porResponder || []).length + " por responder";
                if (p.id === "venda") badge = (payload.rascunhos || []).length + " rascunhos";
                if (p.id === "analise") badge = (contagem.vermelho || 0) + " a republicar";
                if (p.id === "compra") badge = compra.ativo ? "ON" : "OFF";
                return (
                  <button key={p.id} type="button" className={"vin-door" + (secao === p.id ? " on" : "")} style={{ "--mc": ACCENT }} onClick={function() { setSecao(secao === p.id ? "" : p.id); }}>
                    <strong>{p.nome}</strong>
                    <span>{p.desc}{badge ? " · " + badge : ""}</span>
                  </button>
                );
              })}
            </div>

            {secao === "mensagens" ? (
              <Painel titulo="Mensagens" texto="O que mudares aplica-se na Vinted quando o computador está aberto.">
                <Tabs atual={sub} set={setSub} itens={[["conversas", "Conversas"], ["vendedor", "Modo vendedor"], ["fixar", "Fixar"], ["respostas", "Respostas rápidas"]]} />
                {sub === "conversas" ? (
                  <div>
                    <p className="vin-lbl">{(msgs.porResponder || []).length + " por responder · " + (msgs.propostas || 0) + " propostas · " + (msgs.grupos || 0) + " com conversa"}</p>
                    <Lista links={(msgs.porResponder || [])} agora={data.agora} vazio="Está tudo respondido." />
                    <LinhaBotoes>
                      <button type="button" className="vin-btn" disabled={aPedir} onClick={function() { pedir("mesa"); }}>Análise de mensagens</button>
                      <button type="button" className="vin-btn" disabled={aPedir} onClick={function() { pedir("dar-lida"); }}>Marcar por responder como lidas</button>
                      <a className="vin-btn" href={origem + "/inbox"} target="_blank" rel="noreferrer">Caixa de mensagens</a>
                    </LinhaBotoes>
                  </div>
                ) : null}
                {sub === "vendedor" ? (
                  <div>
                    <Interruptor nome="Envio automático" ligado={msgs.auto} detalhe={msgs.vivo ? "A correr agora" : "Parado"} disabled={aPedir} onClick={function() { pedir("auto-envio", { ligado: !msgs.auto }); }} />
                    <p className="vin-lbl" style={{ marginTop: 16 }}>{(msgs.contador || 0) + " enviadas · " + ((msgs.fila || []).length) + " à espera de confirmação"}</p>
                    <label className="vin-lbl" htmlFor="vin-msg" style={{ display: "block", marginTop: 16 }}>Mensagem automática</label>
                    <textarea id="vin-msg" className="vin-field" rows={4} value={msg} onChange={function(e) { setMsg(e.target.value); }} placeholder="Vazia: vai a mensagem padrão." />
                    <LinhaBotoes>
                      <button type="button" className="vin-btn" style={{ color: ACCENT, borderBottomColor: ACCENT }} disabled={aPedir} onClick={function() { pedir("msg-auto", { texto: msg }); }}>Guardar mensagem</button>
                      <a className="vin-btn" href={origem + "/member/notifications"} target="_blank" rel="noreferrer">Abrir modo vendedor</a>
                    </LinhaBotoes>
                    {(msgs.fila || []).map(function(f, i) {
                      return <div key={i} className="vin-row"><div style={{ flex: 1 }}><h3>{"Já falaste com " + f.nome}</h3></div>{f.url ? <a className="vin-btn" href={f.url} target="_blank" rel="noreferrer">Ver</a> : null}</div>;
                    })}
                  </div>
                ) : null}
                {sub === "fixar" ? (
                  <div>
                    <Interruptor nome="Modo fixar" ligado={msgs.fixar} detalhe="Botão Fixar em cada conversa" disabled={aPedir} onClick={function() { pedir("fixar-modo", { ligado: !msgs.fixar }); }} />
                    <Interruptor nome="Minimizar fixadas" ligado={msgs.fixarMin} detalhe="Barra no topo da caixa" disabled={aPedir} onClick={function() { pedir("fixar-min", { ligado: !msgs.fixarMin }); }} />
                    {(msgs.fixadas || []).map(function(f, i, arr) {
                      return (
                        <div key={f.id} className="vin-row">
                          {f.foto ? <img className="vin-foto" src={f.foto} alt="" /> : null}
                          <div style={{ flex: 1, minWidth: 0 }}><h3>{f.titulo}</h3><p>{f.previa}</p></div>
                          <button type="button" className="vin-btn" disabled={aPedir || i === 0} onClick={function() { pedir("fix-subir", { id: f.id }); }}>Subir</button>
                          <button type="button" className="vin-btn" disabled={aPedir || i === arr.length - 1} onClick={function() { pedir("fix-descer", { id: f.id }); }}>Descer</button>
                          <button type="button" className="vin-btn" disabled={aPedir} onClick={function() { pedir("fix-tirar", { id: f.id }); }}>Tirar</button>
                        </div>
                      );
                    })}
                    {(msgs.fixadas || []).length ? null : <Vazio>Ainda não tens conversas fixadas.</Vazio>}
                  </div>
                ) : null}
                {sub === "respostas" ? (
                  <div>
                    {(msgs.respostas || []).map(function(r, i) {
                      var aEditar = qr.i === i;
                      return (
                        <div key={r.id || i} style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                          {aEditar ? (
                            <div>
                              <input className="vin-field" value={qr.edTitulo} onChange={function(e) { setQr(Object.assign({}, qr, { edTitulo: e.target.value })); }} />
                              <textarea className="vin-field" rows={3} value={qr.edTexto} onChange={function(e) { setQr(Object.assign({}, qr, { edTexto: e.target.value })); }} />
                              <LinhaBotoes>
                                <button type="button" className="vin-btn" style={{ color: ACCENT }} disabled={aPedir} onClick={function() { pedir("qr-guardar", { i: i, titulo: qr.edTitulo, texto: qr.edTexto }); setQr(Object.assign({}, qr, { i: -1 })); }}>Guardar</button>
                                <button type="button" className="vin-btn" onClick={function() { setQr(Object.assign({}, qr, { i: -1 })); }}>Cancelar</button>
                              </LinhaBotoes>
                            </div>
                          ) : (
                            <div>
                              <h3 style={{ margin: 0, fontSize: 14 }}>{r.titulo}</h3>
                              <p style={{ margin: "6px 0 0", fontSize: 13, color: COLORS.muted, whiteSpace: "pre-wrap" }}>{r.texto}</p>
                              <LinhaBotoes>
                                <button type="button" className="vin-btn" onClick={function() { setQr({ titulo: qr.titulo, texto: qr.texto, i: i, edTitulo: r.titulo, edTexto: r.texto }); }}>Editar</button>
                                <button type="button" className="vin-btn" disabled={aPedir} onClick={function() { confirmar("qr-" + i, function() { pedir("qr-apagar", { i: i }); }); }}>{conf === "qr-" + i ? "Confirmar" : "Apagar"}</button>
                              </LinhaBotoes>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <p className="vin-lbl" style={{ marginTop: 18 }}>Nova resposta</p>
                    <input className="vin-field" placeholder="Título" value={qr.titulo} onChange={function(e) { setQr(Object.assign({}, qr, { titulo: e.target.value })); }} />
                    <textarea className="vin-field" rows={3} placeholder="Texto que vai ser escrito na conversa" value={qr.texto} onChange={function(e) { setQr(Object.assign({}, qr, { texto: e.target.value })); }} />
                    <LinhaBotoes>
                      <button type="button" className="vin-btn" style={{ color: ACCENT }} disabled={aPedir} onClick={function() { pedir("qr-guardar", { novo: true, titulo: qr.titulo, texto: qr.texto }); setQr(Object.assign({}, qr, { titulo: "", texto: "" })); }}>Adicionar</button>
                      <button type="button" className="vin-btn" disabled={aPedir} onClick={function() { confirmar("qr-repor", function() { pedir("qr-repor"); }); }}>{conf === "qr-repor" ? "Confirmar" : "Repor as originais"}</button>
                    </LinhaBotoes>
                  </div>
                ) : null}
              </Painel>
            ) : null}

            {secao === "venda" ? (
              <Painel titulo="Modo venda" texto="Publicar um artigo novo ou acabar um rascunho. O relaunch está na Análise.">
                <LinhaBotoes>
                  <button type="button" className="vin-btn" disabled={aPedir} onClick={function() { pedir("sync-anuncios"); }}>Sincronizar anúncios</button>
                  <a className="vin-btn" href={origem + "/items/new"} target="_blank" rel="noreferrer">Publicar artigo novo</a>
                </LinhaBotoes>
                {payload.quota ? <p className="vin-lbl" style={{ marginTop: 8 }}>IA hoje · rápido {payload.quota.rapido.used}/{payload.quota.rapido.limit} · qualidade {payload.quota.qualidade.used}/{payload.quota.qualidade.limit}</p> : null}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 18 }}>
                  <p className="vin-lbl">Rascunhos · {(payload.rascunhos || []).length}</p>
                  {(payload.rascunhos || []).length ? <button type="button" className="vin-btn" style={{ color: ACCENT }} disabled={aPedir} onClick={function() { pedir("publicar-rascunhos"); }}>Publicar, um a um</button> : null}
                </div>
                {(payload.rascunhos || []).map(function(r) {
                  return (
                    <div key={r.id} className="vin-row">
                      {r.foto ? <img className="vin-foto" src={r.foto} alt="" /> : null}
                      <div style={{ flex: 1 }}><h3>{r.titulo}</h3><p>{[r.preco != null ? eur(r.preco) : "", r.marca, r.tamanho].filter(Boolean).join(" · ")}</p></div>
                      <a className="vin-btn" href={r.url} target="_blank" rel="noreferrer">Editar</a>
                    </div>
                  );
                })}
                {(payload.rascunhos || []).length ? null : <Vazio>Sem rascunhos. Aparecem depois de sincronizar os anúncios.</Vazio>}
              </Painel>
            ) : null}

            {secao === "analise" ? (
              <Painel titulo="Análise" texto="A lista começa nos que precisam de republicar.">
                <LinhaBotoes>
                  <button type="button" className="vin-btn" disabled={aPedir} onClick={function() { pedir("analise-conta"); }}>Análise de conta</button>
                  <button type="button" className="vin-btn" disabled={aPedir} onClick={function() { pedir("analytics"); }}>Views e favoritos</button>
                </LinhaBotoes>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12 }}>
                  {[["vermelho", "Republicar", contagem.vermelho], ["amarelo", "Atenção", contagem.amarelo], ["verde", "Em dia", contagem.verde], ["ocultos", "Ocultos", contagem.ocultos], ["todos", "Todos", (payload.anuncios || []).length]].map(function(f) {
                    var on = filtro === f[0];
                    return <button key={f[0]} type="button" className="vin-btn" onClick={function() { setFiltro(f[0]); }} style={on ? { color: corDe(f[0] === "ocultos" ? "" : f[0]), borderBottomColor: "currentColor" } : null}>{f[1] + " " + (f[2] || 0)}</button>;
                  })}
                </div>
                <input className="vin-field" placeholder="Procurar por título, marca ou tamanho" value={q} onChange={function(e) { setQ(e.target.value); }} />
                <ListaAnuncios itens={payload.anuncios || []} filtro={filtro} q={q} aPedir={aPedir} onRelaunch={function(a) { pedir("relaunch", { id: a.id, titulo: a.titulo }); }} />
                <p className="vin-lbl" style={{ marginTop: 22 }}>Compras a caminho</p>
                <Lista links={payload.envios || []} agora={data.agora} vazio="Nenhuma compra a caminho." envio />
              </Painel>
            ) : null}

            {secao === "compra" ? (
              <Painel titulo="Modo de Compra" texto={compra.resumo || "Liga a caça. O computador tem de estar com a Vinted aberta."}>
                <Interruptor nome={compra.ativo ? "Ligado" : "Desligado"} ligado={compra.ativo} detalhe={(compra.alertasHoje || 0) + " alertas hoje · a cada " + (compra.intervaloSeg || 6) + " s"} disabled={aPedir} onClick={function() { pedir("compra", { ativo: !compra.ativo }); }} />
                <p className="vin-lbl" style={{ marginTop: 18 }}>Buscas</p>
                {(compra.buscas || []).map(function(b) {
                  return (
                    <div key={b.id} className="vin-row">
                      <div style={{ flex: 1 }}><h3>{b.nome || b.texto}</h3>{b.texto && b.texto !== b.nome ? <p>{b.texto}</p> : null}</div>
                      <button type="button" className="vin-btn" disabled={aPedir} onClick={function() { confirmar("b-" + b.id, function() { pedir("compra-busca", { remover: true, id: b.id }); }); }}>{conf === "b-" + b.id ? "Confirmar" : "Tirar"}</button>
                    </div>
                  );
                })}
                {(compra.buscas || []).length ? null : <Vazio>Ainda não há buscas.</Vazio>}
                <input className="vin-field" placeholder="Nome da busca" value={busca.nome} onChange={function(e) { setBusca({ nome: e.target.value, texto: busca.texto }); }} />
                <input className="vin-field" placeholder="O que procurar na Vinted" value={busca.texto} onChange={function(e) { setBusca({ nome: busca.nome, texto: e.target.value }); }} />
                <LinhaBotoes>
                  <button type="button" className="vin-btn" style={{ color: ACCENT }} disabled={aPedir || !busca.texto.trim()} onClick={function() { pedir("compra-busca", { nome: busca.nome, texto: busca.texto }); setBusca({ nome: "", texto: "" }); }}>Adicionar busca</button>
                </LinhaBotoes>
                <p className="vin-lbl" style={{ marginTop: 18 }}>Últimos alertas</p>
                {(compra.feed || []).map(function(f) {
                  return (
                    <a key={f.id || f.at} className="vin-row" href={f.url || undefined} target="_blank" rel="noreferrer">
                      {f.foto ? <img className="vin-foto" src={f.foto} alt="" /> : null}
                      <div style={{ flex: 1 }}><h3>{f.titulo}</h3><p>{[f.preco != null ? eur(f.preco) : "", ha(f.at, data.agora)].filter(Boolean).join(" · ")}</p></div>
                    </a>
                  );
                })}
              </Painel>
            ) : null}

            <Secao titulo="Mais">
              <Interruptor nome="Modo escuro na Vinted" ligado={msgs.escuro} detalhe="A Central do site já é escura" disabled={aPedir} onClick={function() { pedir("modo-escuro", { ligado: !msgs.escuro }); }} />
              <LinhaBotoes>
                <button type="button" className="vin-btn" disabled={aPedir} onClick={function() { confirmar("cache", function() { pedir("limpar-cache"); }); }}>{conf === "cache" ? "Confirmar limpeza" : "Limpar cache do bot"}</button>
                <button type="button" className="vin-btn" disabled={aPedir} onClick={function() { confirmar("reler", function() { pedir("reler-historico"); }); }}>{conf === "reler" ? "Confirmar releitura" : "Reler vendas e compras"}</button>
                <a className="vin-btn" href={origem + "/my_orders?order_type=sold"} target="_blank" rel="noreferrer">Vendidos</a>
                <a className="vin-btn" href={origem + "/my_orders?order_type=purchased"} target="_blank" rel="noreferrer">Comprados</a>
              </LinhaBotoes>
            </Secao>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function Kpi(props) {
  return (
    <button type="button" className={"vin-kpi" + (props.on ? " on" : "")} style={{ "--mc": ACCENT }} onClick={props.onClick}>
      <span className="vin-lbl">{props.titulo}</span>
      <b>{props.valor}</b>
      <i>{props.sub}</i>
    </button>
  );
}
function Secao(props) {
  return <section style={{ marginTop: 32 }}><p className="vin-lbl">{props.titulo}</p>{props.children}</section>;
}
function Painel(props) {
  return (
    <section style={{ marginTop: 8, paddingTop: 8 }}>
      <h2 style={{ margin: "12px 0 4px", fontFamily: "'Syne',sans-serif", fontSize: 22, letterSpacing: "-0.04em" }}>{props.titulo}</h2>
      <p style={{ margin: "0 0 8px", fontSize: 13, color: COLORS.muted, lineHeight: 1.5 }}>{props.texto}</p>
      {props.children}
    </section>
  );
}
function Tabs(props) {
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "8px 0 12px" }}>
      {props.itens.map(function(it) {
        var on = props.atual === it[0];
        return <button key={it[0]} type="button" className="vin-btn" onClick={function() { props.set(it[0]); }} style={on ? { color: ACCENT, borderBottomColor: ACCENT } : null}>{it[1]}</button>;
      })}
    </div>
  );
}
function LinhaBotoes(props) {
  return <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>{props.children}</div>;
}
function Interruptor(props) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
      <div><strong style={{ fontWeight: 600 }}>{props.nome}</strong><p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.faint }}>{props.detalhe}</p></div>
      <button type="button" className="vin-sw" disabled={props.disabled} onClick={props.onClick} style={{ color: props.ligado ? COLORS.positive : COLORS.faint }}>{props.ligado ? "ON" : "OFF"}</button>
    </div>
  );
}
function Vazio(props) {
  return <p style={{ margin: "14px 0", fontSize: 13, color: COLORS.faint }}>{props.children}</p>;
}
function Gaveta(props) {
  var lista = props.gaveta === "vendas" ? (props.payload.vendasSemana || [])
    : props.gaveta === "compras" ? (props.payload.comprasSemana || [])
    : props.gaveta === "total" ? (props.payload.vendas || [])
    : (props.payload.compras || []);
  var vazio = props.gaveta === "compras" || props.gaveta === "gasto" ? "Ainda não há compras nesta leitura." : "Ainda não há vendas nesta leitura.";
  return <Lista links={lista} agora={props.agora} vazio={vazio} />;
}
function Lista(props) {
  var itens = props.links || [];
  if (!itens.length) return <Vazio>{props.vazio}</Vazio>;
  return (
    <div>
      {itens.map(function(e, i) {
        var titulo = e.titulo || e.comprador || "Artigo";
        var sub = props.envio
          ? [e.estado === "por-enviar" ? "por enviar" : "a caminho", e.nota].filter(Boolean).join(" · ")
          : [e.comprador && e.artigo ? e.comprador + " · " + e.artigo : "", e.valor != null ? eur(e.valor) : "", e.oferta ? "proposta " + eur(e.oferta) : e.previa, e.estado === "curso" ? "em curso" : "", ha(e.ts || e.quando, props.agora)].filter(Boolean).join(" · ");
        var miolo = (<div style={{ flex: 1, minWidth: 0 }}><h3>{titulo}</h3>{sub ? <p>{sub}</p> : null}</div>);
        if (!e.url) return <div key={e.id || i} className="vin-row">{e.foto ? <img className="vin-foto" src={e.foto} alt="" /> : null}{miolo}</div>;
        return <a key={e.id || i} className="vin-row" href={e.url} target="_blank" rel="noreferrer">{e.foto ? <img className="vin-foto" src={e.foto} alt="" /> : null}{miolo}</a>;
      })}
    </div>
  );
}
function ListaAnuncios(props) {
  var texto = String(props.q || "").toLowerCase();
  var itens = (props.itens || []).filter(function(a) {
    if (props.filtro === "ocultos") { if (!a.oculto) return false; }
    else if (props.filtro !== "todos" && (a.oculto || a.cor !== props.filtro)) return false;
    if (!texto) return true;
    return (a.titulo + " " + (a.marca || "") + " " + (a.tamanho || "")).toLowerCase().indexOf(texto) >= 0;
  });
  if (!itens.length) return <Vazio>Nenhum anúncio neste filtro.</Vazio>;
  return (
    <div>
      {itens.map(function(a) {
        return (
          <div key={a.id} className="vin-row">
            {a.foto ? <img className="vin-foto" src={a.foto} alt="" /> : <span style={{ width: 8, height: 8, borderRadius: "50%", background: corDe(a.cor), flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3>{a.titulo}</h3>
              <p>{[a.preco != null ? eur(a.preco) : "", a.dias != null ? a.dias + " dias" : "", (a.favs || 0) + " fav", (a.views || 0) + " views"].filter(Boolean).join(" · ")}</p>
            </div>
            <button type="button" className="vin-btn" disabled={props.aPedir} onClick={function() { props.onRelaunch(a); }}>Relaunch</button>
          </div>
        );
      })}
    </div>
  );
}
