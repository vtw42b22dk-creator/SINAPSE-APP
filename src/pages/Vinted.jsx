import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HubBack, HUB_BACK_CSS } from "../components/HubBack";
import { PageLoader } from "../components/PageLoader";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { pageBg, pageText } from "../lib/ThemeContext";
import { moduleColor, moduleGlow, MODULE_GLOW_CSS, COLORS } from "../lib/theme";
import { lerPonte, ouvirPonte, pedirComando } from "../lib/vintedStore";

var ACCENT = moduleColor("vinted");
var DIAS = ["S", "T", "Q", "Q", "S", "S", "D"];
var ABAS = [
  { id: "anuncios", nome: "Anúncios" },
  { id: "vendas", nome: "Vendas" },
  { id: "compras", nome: "Compras" },
  { id: "envios", nome: "Envios" },
  { id: "mensagens", nome: "Mensagens" },
];

var VIN_CSS = [
  MODULE_GLOW_CSS,
  ".vin-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:8px 2px;",
  "background:transparent;border:none;border-bottom:1px solid currentColor;color:#A0A0A8;",
  "cursor:pointer;font-family:'Manrope',sans-serif;font-size:11px;letter-spacing:.4px}",
  ".vin-btn:hover{color:#EDEDEF}",
  ".vin-btn:disabled{opacity:.45;cursor:default}",
  ".vin-lbl{margin:0;font-family:'Manrope',sans-serif;font-size:10px;line-height:1.5;letter-spacing:1.8px;text-transform:uppercase;color:#6E6E76}",
  ".vin-num{font-family:'Manrope',sans-serif;font-variant-numeric:tabular-nums}",
  ".vin-row{display:flex;align-items:center;gap:14px;width:100%;padding:14px 0;border:none;border-bottom:1px solid rgba(255,255,255,.06);background:none;color:inherit;text-align:left;font-family:inherit}",
  ".vin-row h3{margin:0;font-size:14px;font-weight:600;color:#EDE8DF;letter-spacing:-.02em}",
  ".vin-row p{margin:4px 0 0;font-size:12px;color:#6E6A64;line-height:1.4}",
  ".vin-foto{width:44px;height:44px;object-fit:cover;flex-shrink:0;background:rgba(255,255,255,.04)}",
  ".vin-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}",
  ".vin-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin-top:18px}",
  ".vin-day{text-align:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.08)}",
  ".vin-day b{display:block;font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:#EDE8DF}",
  ".vin-day span{display:block;margin-top:4px;font-size:10px;letter-spacing:1px;color:#6E6A64}",
  "@media(max-width:719px){.vin-btn{min-height:44px;font-size:12px}}",
].join("");

function eur(v) {
  return (Number(v) || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

function hora(ts) {
  var n = Number(ts);
  if (!n) return "";
  var d = new Date(n);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function quando(ts) {
  var n = Number(ts);
  if (!n) return "";
  var d = Date.now() - n;
  if (d < 60000) return "agora";
  if (d < 3600000) return Math.floor(d / 60000) + " min";
  if (d < 86400000) return Math.floor(d / 3600000) + " h";
  return new Date(n).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

function corIdade(cor) {
  if (cor === "vermelho") return COLORS.negative;
  if (cor === "amarelo") return COLORS.warning;
  if (cor === "verde") return COLORS.positive;
  return COLORS.faint;
}

function estadoTxt(estado) {
  if (estado === "curso") return "em curso";
  if (estado === "concluida") return "concluída";
  if (estado === "por-enviar") return "à espera de envio";
  if (estado === "caminho" || estado === "enviado") return "a caminho";
  return estado || "";
}

export default function Vinted() {
  var navigate = useNavigate();
  var vwS = useState(window.innerWidth);
  var isMobile = vwS[0] < 720;
  var setVw = vwS[1];
  var abaS = useState("anuncios");
  var aba = abaS[0], setAba = abaS[1];
  var dataS = useState({ loading: true, erro: "", estado: null, comandos: [], agora: 0 });
  var data = dataS[0], setData = dataS[1];
  var aPedirS = useState(false);
  var aPedir = aPedirS[0], setAPedir = aPedirS[1];
  var avisoS = useState("");
  var aviso = avisoS[0], setAviso = avisoS[1];

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
    return function() {
      parar();
      clearInterval(id);
    };
  }, [carregar]);

  useEffect(function() {
    function onResize() { setVw(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, [setVw]);

  var payload = (data.estado && data.estado.payload) || {};
  var visto = data.estado && data.estado.visto_em;
  var ligado = Boolean(visto && data.agora && data.agora - new Date(visto).getTime() < 150000);
  var semana = payload.semana || {};
  var porDia = Array.isArray(semana.porDia) ? semana.porDia : [0, 0, 0, 0, 0, 0, 0];
  var comando = (data.comandos || []).find(function(c) { return c.estado === "pedido" || c.estado === "a-correr"; });
  var ultimo = (data.comandos || [])[0];
  var aCorrer = Boolean(payload.aCorrer) || Boolean(comando);

  async function pedir(tipo, body) {
    setAviso("");
    setAPedir(true);
    try {
      await pedirComando(tipo, body || {});
      setAviso(ligado ? "Pedido enviado ao computador." : "Pedido guardado. Corre quando o Chrome e a Vinted estiverem abertos.");
      carregar();
    } catch (e) {
      setAviso(e.message || "Não consegui enviar o pedido.");
    }
    setAPedir(false);
  }

  var bg = pageBg();
  var text = pageText();

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'Manrope',sans-serif", position: "relative", overflowX: "hidden" }}>
      <style>{MODULE_ENTRY_CSS + HUB_BACK_CSS + VIN_CSS}</style>
      <div className="mod-glow" style={{ top: -90, right: "6%", background: moduleGlow(ACCENT) }} aria-hidden="true" />
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "#0A0A0B", borderBottom: "1px solid var(--border-subtle)", padding: isMobile ? "12px" : "14px 20px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <HubBack onClick={function() { navigate("/"); }} />
            <h1 className="mod-h1" style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 22 : 24, fontWeight: 700, letterSpacing: "-0.04em", color: ACCENT, margin: 0 }}>Vinted</h1>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", width: isMobile ? "100%" : "auto", flexWrap: "wrap" }}>
            <p className="vin-lbl" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="vin-dot" style={{ background: ligado ? COLORS.positive : COLORS.faint }} />
              {ligado ? "Computador ligado" : "Computador fechado"}
              {payload.at ? " · lido " + hora(payload.at) : ""}
            </p>
            <button className="vin-btn" disabled={aPedir || aCorrer} onClick={function() { pedir("sincronizar"); }} style={{ color: ACCENT, borderBottomColor: ACCENT }}>
              {aCorrer ? "A actualizar" : "Actualizar"}
            </button>
          </div>
        </div>
      </header>

      <main className="mod-main" data-scrollable style={{ maxWidth: 920, margin: "0 auto", padding: isMobile ? "16px 12px 88px" : "24px 20px 56px" }}>
        {data.loading ? <PageLoader accent={ACCENT} /> : null}
        {!data.loading && data.erro ? <p style={{ margin: "12px 0 24px", fontSize: 14, lineHeight: 1.5, color: COLORS.muted }}>{data.erro}</p> : null}
        {!data.loading && aviso ? <p style={{ margin: "0 0 18px", fontSize: 13, color: COLORS.muted }}>{aviso}</p> : null}
        {!data.loading && ultimo && ultimo.estado === "erro" && ultimo.resultado && ultimo.resultado.erro ? (
          <p style={{ margin: "0 0 18px", fontSize: 13, color: COLORS.negative }}>{ultimo.resultado.erro}</p>
        ) : null}

        {!data.loading && !data.erro ? (
          <div>
            <div style={{ padding: "4px 0 22px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="vin-lbl">{semana.rotulo || "Esta semana"}</p>
              <p className="vin-num" style={{ margin: "10px 0 0", fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 36 : 48, fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 1 }}>
                {eur(semana.valorVendas)}
              </p>
              <p style={{ margin: "10px 0 0", fontSize: 13, color: COLORS.muted }}>
                {(semana.vendas || 0) + " vendas · " + eur(semana.valorCompras) + " em compras · " + (semana.emCurso || 0) + " em curso"}
              </p>
              <div className="vin-week">
                {DIAS.map(function(letra, i) {
                  return (
                    <div key={letra + i} className="vin-day">
                      <b>{porDia[i] || 0}</b>
                      <span>{letra}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {(payload.novidades || []).length ? (
              <section style={{ marginTop: 28 }}>
                <p className="vin-lbl">Desde a última visita</p>
                {(payload.novidades || []).map(function(n, i) {
                  return (
                    <div key={i} className="vin-row">
                      <div style={{ minWidth: 0 }}>
                        <h3>{n.texto}</h3>
                        {n.sub ? <p>{n.sub}</p> : null}
                      </div>
                    </div>
                  );
                })}
              </section>
            ) : null}

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 28 }}>
              {ABAS.map(function(item) {
                var on = aba === item.id;
                return (
                  <button key={item.id} type="button" className="vin-btn" onClick={function() { setAba(item.id); }} style={on ? { color: ACCENT, borderBottomColor: ACCENT } : null}>
                    {item.nome}
                  </button>
                );
              })}
            </div>

            <section style={{ marginTop: 8 }}>
              {aba === "anuncios" ? (
                <ListaAnuncios itens={payload.anuncios || []} rascunhos={payload.rascunhos || []} aPedir={aPedir} onRepublicar={function(a) { pedir("relaunch", { id: a.id, titulo: a.titulo }); }} onPublicar={function() { pedir("publicar-rascunhos"); }} />
              ) : null}
              {aba === "vendas" ? <ListaEncomendas itens={payload.vendas || []} vazio="Ainda não há vendas nesta leitura." /> : null}
              {aba === "compras" ? <ListaEncomendas itens={payload.compras || []} vazio="Ainda não há compras nesta leitura." /> : null}
              {aba === "envios" ? <ListaEnvios itens={payload.envios || []} /> : null}
              {aba === "mensagens" ? <ListaMensagens itens={payload.mensagens || []} /> : null}
            </section>

            {!payload.at ? (
              <p style={{ marginTop: 28, fontSize: 13, lineHeight: 1.55, color: COLORS.faint }}>
                Ainda não chegou nenhuma leitura. Abre o Sinapse uma vez neste Chrome, com a extensão actualizada, e deixa a Vinted aberta. A partir daí cada actualização do bot aparece aqui.
              </p>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}

function ListaAnuncios(props) {
  var itens = props.itens || [];
  var rascunhos = props.rascunhos || [];
  if (!itens.length && !rascunhos.length) {
    return <p style={{ margin: "18px 0", fontSize: 13, color: COLORS.faint }}>Nenhum anúncio nesta leitura.</p>;
  }
  return (
    <div>
      {rascunhos.length ? (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.muted }}>{rascunhos.length + (rascunhos.length === 1 ? " rascunho" : " rascunhos")} à espera</p>
          <button type="button" className="vin-btn" disabled={props.aPedir} onClick={props.onPublicar} style={{ color: ACCENT, borderBottomColor: ACCENT }}>Publicar</button>
        </div>
      ) : null}
      {itens.map(function(a) {
        var repost = a.cor === "vermelho" || a.cor === "amarelo";
        return (
          <div key={a.id} className="vin-row">
            {a.foto ? <img className="vin-foto" src={a.foto} alt="" /> : <span className="vin-dot" style={{ background: corIdade(a.cor) }} />}
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3>{a.titulo}</h3>
              <p>{[a.preco != null ? eur(a.preco) : "", (a.dias != null ? a.dias + " dias" : ""), (a.favs || 0) + " fav", (a.views || 0) + " views"].filter(Boolean).join(" · ")}</p>
            </div>
            {repost ? (
              <button type="button" className="vin-btn" disabled={props.aPedir} onClick={function() { props.onRepublicar(a); }}>Republicar</button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ListaEncomendas(props) {
  var itens = props.itens || [];
  if (!itens.length) return <p style={{ margin: "18px 0", fontSize: 13, color: COLORS.faint }}>{props.vazio}</p>;
  return (
    <div>
      {itens.map(function(e) {
        return (
          <a key={e.id} className="vin-row" href={e.url || undefined} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            {e.foto ? <img className="vin-foto" src={e.foto} alt="" /> : null}
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3>{e.titulo}</h3>
              <p>{[e.valor != null ? eur(e.valor) : "", estadoTxt(e.estado), quando(e.ts)].filter(Boolean).join(" · ")}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function ListaEnvios(props) {
  var itens = props.itens || [];
  if (!itens.length) return <p style={{ margin: "18px 0", fontSize: 13, color: COLORS.faint }}>Nada pendente de envio.</p>;
  return (
    <div>
      {itens.map(function(e) {
        var miolo = (
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3>{e.titulo}</h3>
            <p>{[estadoTxt(e.estado), e.nota].filter(Boolean).join(" · ")}</p>
          </div>
        );
        if (!e.url) return <div key={e.id} className="vin-row">{miolo}</div>;
        return <a key={e.id} className="vin-row" href={e.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>{miolo}</a>;
      })}
    </div>
  );
}

function ListaMensagens(props) {
  var itens = props.itens || [];
  if (!itens.length) return <p style={{ margin: "18px 0", fontSize: 13, color: COLORS.faint }}>Nada à espera de resposta.</p>;
  return (
    <div>
      {itens.map(function(m) {
        return (
          <a key={m.id} className="vin-row" href={m.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3>{m.comprador}{m.artigo ? " · " + m.artigo : ""}</h3>
              <p>{[m.oferta ? "Proposta " + eur(m.oferta) : m.previa, quando(m.quando)].filter(Boolean).join(" · ")}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
}
