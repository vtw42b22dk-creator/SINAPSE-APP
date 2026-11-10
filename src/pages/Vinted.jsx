import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageLoader } from "../components/PageLoader";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { MICRO_CSS, trackSpotlight } from "../lib/microUi";
import { GLASS_CSS } from "../lib/glassUi";
import { moduleGlow, COLORS } from "../lib/theme";
import { useVintedPonte } from "../lib/useVintedPonte";
import {
  VINTED_ACCENT,
  VINTED_SECTIONS,
  eur,
  haQuanto,
  corIdade,
} from "../lib/vintedNav";

var ACCENT = VINTED_ACCENT;
var LETRAS = ["S", "T", "Q", "Q", "S", "S", "D"];

var VIN_CSS = [
  MODULE_ENTRY_CSS,
  MICRO_CSS,
  GLASS_CSS,
  ".vin-root{height:100%;max-height:100%;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:none;overscroll-behavior-y:none;touch-action:pan-y;position:relative;background:transparent;color:" + COLORS.text + ";font-family:'Manrope',sans-serif;width:100%;max-width:100%}",
  ".vin-inner{max-width:1080px;width:100%;margin:0 auto;padding:40px 28px 96px;position:relative;z-index:1;box-sizing:border-box;min-width:0}",
  ".vin-glow{position:absolute;border-radius:50%;pointer-events:none;filter:blur(70px);z-index:0;max-width:none}",
  ".vin-top{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:36px}",
  ".vin-kicker{margin:0 0 12px;font-size:10px;letter-spacing:2.4px;text-transform:uppercase;color:" + COLORS.faint + ";display:flex;align-items:center;gap:8px}",
  ".vin-live{width:6px;height:6px;border-radius:50%;background:var(--mc);flex-shrink:0;animation:hubPulse 2.2s ease-in-out infinite}",
  "@keyframes hubPulse{0%,100%{opacity:1}50%{opacity:.35}}",
  ".vin-hello{margin:0;font-family:'Syne',sans-serif;font-weight:700;font-size:clamp(32px,5vw,56px);letter-spacing:-.05em;line-height:.95;color:" + COLORS.text + "}",
  ".vin-hello span{display:block;margin-top:10px;font-size:.42em;font-weight:500;letter-spacing:-.02em;color:" + COLORS.muted + ";max-width:28ch}",
  ".vin-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end}",
  ".vin-glass-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:10px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.045);backdrop-filter:blur(22px) saturate(2);-webkit-backdrop-filter:blur(22px) saturate(2);color:" + COLORS.text + ";cursor:pointer;font-family:'Manrope',sans-serif;font-size:12px;letter-spacing:.3px;text-decoration:none;transition:border-color .2s ease,background .2s ease,transform .15s ease}",
  ".vin-glass-btn:hover{border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.08)}",
  ".vin-glass-btn:disabled{opacity:.45;cursor:default}",
  ".vin-glass-btn.primary{border-color:color-mix(in srgb,var(--mc) 45%,transparent);background:color-mix(in srgb,var(--mc) 14%,rgba(255,255,255,.03));color:var(--mc)}",
  ".vin-glass-btn.soft{color:" + COLORS.muted + "}",
  ".vin-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 28px}",
  ".vin-stat{position:relative;padding:18px 16px 16px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.045);text-align:left;cursor:pointer;color:inherit;font-family:inherit;min-width:0;backdrop-filter:blur(22px) saturate(2.1);-webkit-backdrop-filter:blur(22px) saturate(2.1);overflow:hidden;border-radius:16px}",
  ".vin-stat::before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.14),transparent 48%)}",
  ".vin-stat:hover{border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.07)}",
  ".vin-stat.is-on{border-color:color-mix(in srgb,var(--mc) 50%,transparent)}",
  ".vin-stat b{display:block;font-family:'Syne',sans-serif;font-size:clamp(22px,3vw,28px);font-weight:700;letter-spacing:-.04em;line-height:1}",
  ".vin-stat i{display:block;margin-top:8px;font-style:normal;font-size:11px;letter-spacing:.35px;color:" + COLORS.faint + ";text-transform:uppercase}",
  ".vin-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin:0 0 28px}",
  ".vin-day{text-align:center;padding:12px 0;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}",
  ".vin-day b{display:block;font-family:'Syne',sans-serif;font-size:16px}",
  ".vin-day span{display:block;margin-top:4px;font-size:10px;letter-spacing:1px;color:" + COLORS.faint + "}",
  ".vin-card{padding:18px 18px 8px;border-radius:18px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);backdrop-filter:blur(22px) saturate(1.9);-webkit-backdrop-filter:blur(22px) saturate(1.9);margin-bottom:18px}",
  ".vin-card h2{margin:0 0 4px;font-family:'Syne',sans-serif;font-size:18px;letter-spacing:-.03em}",
  ".vin-card .lead{margin:0 0 14px;font-size:13px;line-height:1.5;color:" + COLORS.muted + "}",
  ".vin-row{display:flex;flex-wrap:wrap;align-items:center;gap:12px;width:100%;max-width:100%;min-width:0;padding:12px 0;border:none;border-bottom:1px solid rgba(255,255,255,.06);background:none;color:inherit;text-align:left;text-decoration:none;font-family:inherit;box-sizing:border-box}",
  ".vin-row:last-child{border-bottom:none}",
  ".vin-row>div{min-width:0;flex:1 1 140px}",
  ".vin-row h3{margin:0;font-size:14px;font-weight:600;color:" + COLORS.text + ";overflow:hidden;text-overflow:ellipsis}",
  ".vin-row p{margin:3px 0 0;font-size:12px;color:" + COLORS.faint + ";line-height:1.4;overflow:hidden;text-overflow:ellipsis}",
  ".vin-foto{width:44px;height:44px;object-fit:cover;flex-shrink:0;border-radius:10px;background:rgba(255,255,255,.04)}",
  ".vin-field{width:100%;max-width:100%;box-sizing:border-box;margin-top:8px;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:" + COLORS.text + ";font-family:'Manrope',sans-serif;font-size:14px;outline:none}",
  ".vin-field:focus{border-color:color-mix(in srgb,var(--mc) 55%,#fff 20%)}",
  ".vin-seg{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}",
  ".vin-chip{min-height:36px;padding:8px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:" + COLORS.muted + ";cursor:pointer;font-family:'Manrope',sans-serif;font-size:11px;letter-spacing:.3px}",
  ".vin-chip.is-on{color:var(--mc);border-color:color-mix(in srgb,var(--mc) 45%,transparent);background:color-mix(in srgb,var(--mc) 12%,transparent)}",
  ".vin-sw{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.06)}",
  ".vin-sw:last-child{border-bottom:none}",
  ".vin-sw strong{display:block;font-weight:600}",
  ".vin-sw span{display:block;margin-top:4px;font-size:12px;color:" + COLORS.faint + "}",
  ".vin-empty{margin:8px 0 14px;font-size:13px;color:" + COLORS.faint + ";line-height:1.5}",
  ".vin-note{margin:0 0 16px;font-size:13px;color:" + COLORS.muted + ";line-height:1.5}",
  ".vin-note.err{color:" + COLORS.negative + "}",
  ".vin-age{border-radius:14px;border:1px solid rgba(255,255,255,.08);padding:2px 0;margin:0 0 8px;transition:border-color .25s var(--ease),background .25s var(--ease)}",
  ".vin-age.is-verde{border-color:color-mix(in srgb,#8FB39B 45%,transparent);background:color-mix(in srgb,#8FB39B 8%,transparent)}",
  ".vin-age.is-amarelo{border-color:color-mix(in srgb,#C4A57C 50%,transparent);background:color-mix(in srgb,#C4A57C 10%,transparent)}",
  ".vin-age.is-vermelho{border-color:color-mix(in srgb,#C08C8C 55%,transparent);background:color-mix(in srgb,#C08C8C 12%,transparent)}",
  ".vin-age.is-oculto{border-color:rgba(255,255,255,.1);background:rgba(255,255,255,.02);opacity:.72}",
  ".vin-legenda{display:flex;flex-wrap:wrap;gap:10px 14px;margin:0 0 14px;font-size:11px;color:" + COLORS.faint + "}",
  ".vin-legenda span{display:inline-flex;align-items:center;gap:6px}",
  ".vin-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}",
  ".vin-cal{margin:0 0 18px}",
  ".vin-cal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 12px}",
  ".vin-cal-dow{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin:0 0 6px}",
  ".vin-cal-dow span{text-align:center;font-size:10px;letter-spacing:.4px;color:" + COLORS.faint + "}",
  ".vin-cal-week{margin:0 0 10px}",
  ".vin-cal-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}",
  ".vin-cal-cell{min-height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;color:" + COLORS.muted + "}",
  ".vin-cal-cell.is-out{opacity:.28}",
  ".vin-cal-cell.is-today{color:var(--mc);font-weight:700}",
  ".vin-cal-lane{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin-top:4px;min-height:22px}",
  ".vin-cal-bar{height:22px;border-radius:999px;display:flex;align-items:center;padding:0 8px;font-size:11px;font-weight:600;color:#0c0c0e;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-decoration:none;min-width:0}",
  "@media(max-width:1100px){.vin-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.vin-top{flex-direction:column}}",
  "@media(max-width:719px){.vin-root{overflow-x:hidden;overscroll-behavior:none;touch-action:pan-y}.vin-inner{padding:22px 16px max(96px,env(safe-area-inset-bottom));overflow-x:hidden}.vin-actions{width:100%;justify-content:stretch}.vin-glass-btn{flex:1 1 auto;min-width:0}.vin-stats{grid-template-columns:1fr 1fr;gap:10px}.vin-stat:last-child:nth-child(odd){grid-column:1/-1}.vin-week{gap:4px}.vin-day{padding:10px 0;min-width:0}.vin-day b{font-size:14px}.vin-glow{opacity:.7}}",
].join("");

export default function Vinted() {
  var navigate = useNavigate();
  var params = useParams();
  var secao = params.secao || "overview";
  if (secao !== "overview" && !VINTED_SECTIONS.some(function(s) { return s.id === secao; })) secao = "overview";
  var ponte = useVintedPonte();
  var vwS = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  var isMobile = vwS[0] < 720;

  useEffect(function() {
    function onResize() { vwS[1](window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, [vwS]);

  var meta = VINTED_SECTIONS.find(function(s) { return s.id === secao; }) || VINTED_SECTIONS[0];
  var payload = ponte.payload || {};
  var semana = payload.semana || {};
  var kpis = payload.kpis || {};
  var msgs = payload.mensagens || {};
  var porDia = Array.isArray(semana.porDia) ? semana.porDia : [0, 0, 0, 0, 0, 0, 0];

  return (
    <div className="vin-root" data-scrollable style={{ "--mc": ACCENT }}>
      <style>{VIN_CSS}</style>
      <div className="vin-glow" style={{ width: "min(520px,70vw)", height: "min(520px,70vw)", top: "-8%", right: "-10%", background: moduleGlow(ACCENT, "55") }} aria-hidden="true" />
      <div className="vin-glow" style={{ width: "min(380px,50vw)", height: "min(380px,50vw)", top: "18%", left: "-14%", background: moduleGlow("#8FA8C4", "40"), animationDelay: "-8s" }} aria-hidden="true" />

      <div className="vin-inner ui-fade-in">
        <header className="vin-top">
          <div>
            <p className="vin-kicker">
              <span className={"vin-live"} style={{ background: ponte.ligado ? COLORS.positive : COLORS.faint }} />
              {ponte.ligado ? "Vinted aberta no computador" : "Vinted desligada no computador"}
              {payload.at ? " · " + haQuanto(payload.at, ponte.agora) : ""}
            </p>
            <h1 className="vin-hello">
              {meta.label}
              <span>{meta.desc}</span>
            </h1>
          </div>
          <div className="vin-actions">
            <a className="vin-glass-btn soft ui-tap" href={ponte.origem + "/"} target="_blank" rel="noreferrer">Vinted</a>
            <button
              type="button"
              className="vin-glass-btn primary ui-tap"
              disabled={ponte.busy || ponte.aCorrer}
              onClick={function() { ponte.pedir("atualizar"); }}
            >
              {ponte.aCorrer ? (ponte.ligado ? "A ler a Vinted…" : "À espera do PC…") : "Actualizar"}
            </button>
          </div>
        </header>

        {ponte.loading ? <PageLoader accent={ACCENT} /> : null}
        {!ponte.loading && ponte.erro ? <p className="vin-note">{ponte.erro}</p> : null}
        {ponte.aviso ? <p className="vin-note">{ponte.aviso}</p> : null}
        {ponte.ultimoErro ? <p className="vin-note err">{ponte.ultimoErro}</p> : null}
        {!ponte.loading && !ponte.ligado ? (
          <p className="vin-note">O computador não está na Vinted. Abre o Chrome com a Vinted para ligar, desligar e enviar daqui. Enquanto estiver fechado, isto fica desligado.</p>
        ) : null}

        {!ponte.loading && !ponte.erro ? (
          secao === "overview" ? (
            <Overview
              payload={payload}
              semana={semana}
              kpis={kpis}
              porDia={porDia}
              agora={ponte.agora}
              isMobile={isMobile}
              busy={ponte.busy}
              onRelaunch={function(n) { ponte.pedir("relaunch", { id: n.id, titulo: n.titulo }); }}
              onGo={function(id) { navigate(id === "overview" ? "/vinted" : "/vinted/" + id); }}
            />
          ) : secao === "mensagens" ? (
            <Mensagens ponte={ponte} msgs={msgs} isMobile={isMobile} />
          ) : secao === "venda" ? (
            <Venda ponte={ponte} payload={payload} isMobile={isMobile} />
          ) : secao === "analise" ? (
            <Analise ponte={ponte} payload={payload} isMobile={isMobile} />
          ) : (
            <Compra ponte={ponte} compra={payload.compra || {}} />
          )
        ) : null}
      </div>
    </div>
  );
}

function Overview(props) {
  var isMobile = Boolean(props.isMobile);
  var gavetaS = useState("");
  var gaveta = gavetaS[0], setGaveta = gavetaS[1];
  var lista = gaveta === "vendas" ? (props.payload.vendasSemana || [])
    : gaveta === "compras" ? (props.payload.comprasSemana || [])
    : gaveta === "total" ? (props.payload.vendas || [])
    : gaveta === "gasto" ? (props.payload.compras || [])
    : [];

  return (
    <div>
      <p className="vin-kicker" style={{ marginBottom: 10 }}>{props.semana.rotulo || "Esta semana"}</p>
      <div className="vin-stats">
        <Stat on={gaveta === "vendas"} titulo="Vendas" valor={String(props.semana.vendas || 0)} sub={eur(props.semana.valorVendas)} onClick={function() { setGaveta(gaveta === "vendas" ? "" : "vendas"); }} />
        <Stat on={gaveta === "compras"} titulo="Compras" valor={String(props.semana.compras || 0)} sub={eur(props.semana.valorCompras)} onClick={function() { setGaveta(gaveta === "compras" ? "" : "compras"); }} />
        <Stat on={gaveta === "total"} titulo="Faturação" valor={eur(props.kpis.faturacao)} sub={(props.kpis.vendasTotal || 0) + " vendas"} onClick={function() { setGaveta(gaveta === "total" ? "" : "total"); }} />
        <Stat on={gaveta === "gasto"} titulo="Investido" valor={eur(props.kpis.valorCompras)} sub={(props.kpis.comprasTotal || 0) + " compras"} onClick={function() { setGaveta(gaveta === "gasto" ? "" : "gasto"); }} />
      </div>
      <div className="vin-week">
        {LETRAS.map(function(l, i) {
          return <div key={l + i} className="vin-day"><b>{props.porDia[i] || 0}</b><span>{l}</span></div>;
        })}
      </div>
      {gaveta ? (
        <Card titulo="Detalhe" lead={lista.length ? lista.length + " entradas" : "Sem entradas nesta leitura."}>
          <Lista itens={lista} agora={props.agora} />
        </Card>
      ) : null}

      <Card titulo="O que mudou" lead="Desde a última visita à Central no computador.">
        {(props.payload.novidades || []).length ? (props.payload.novidades || []).map(function(n, i) {
          return (
            <div key={i} className="vin-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3>{n.texto}</h3>
                {n.sub ? <p>{n.sub}</p> : null}
              </div>
              {n.podeRelaunch ? <button type="button" className="vin-glass-btn ui-tap" disabled={props.busy} onClick={function() { props.onRelaunch(n); }}>Republicar</button> : null}
              {n.href ? <a className="vin-glass-btn soft ui-tap" href={n.href} target="_blank" rel="noreferrer">Abrir</a> : null}
            </div>
          );
        }) : <p className="vin-empty">Nada de novo.</p>}
      </Card>

      <div className="vin-stats" style={{ marginTop: 8 }}>
        {VINTED_SECTIONS.filter(function(s) {
          if (s.id === "overview") return false;
          if (isMobile && s.id === "venda") return false;
          return true;
        }).map(function(s) {
          return (
            <button key={s.id} type="button" className="vin-stat ui-spot" onMouseMove={trackSpotlight} onClick={function() { props.onGo(s.id); }}>
              <b style={{ fontSize: 18 }}>{s.icon} {s.label}</b>
              <i>{s.desc}</i>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Mensagens(props) {
  var msgs = props.msgs || {};
  var isMobile = Boolean(props.isMobile);
  var subS = useState("conversas");
  var sub = subS[0], setSub = subS[1];
  var msgS = useState(msgs.texto || "");
  var msg = msgS[0], setMsg = msgS[1];
  var qrS = useState({ titulo: "", texto: "", i: -1, edTitulo: "", edTexto: "" });
  var qr = qrS[0], setQr = qrS[1];
  var ponte = props.ponte;
  var tabs = [["conversas", "Conversas"], ["vendedor", "Modo vendedor"], ["fixar", "Fixar"], ["respostas", "Respostas"]];
  if (isMobile) tabs = tabs.filter(function(it) { return it[0] !== "fixar"; });

  useEffect(function() {
    if (isMobile && sub === "fixar") setSub("conversas");
  }, [isMobile, sub]);

  useEffect(function() {
    setMsg(function(atual) {
      return document.activeElement && document.activeElement.id === "vin-msg" ? atual : (msgs.texto || "");
    });
  }, [msgs.texto]);

  return (
    <div>
      <div className="vin-seg">
        {tabs.map(function(it) {
          return <button key={it[0]} type="button" className={"vin-chip" + (sub === it[0] ? " is-on" : "")} onClick={function() { setSub(it[0]); }}>{it[1]}</button>;
        })}
      </div>

      {sub === "conversas" ? (
        <Card titulo="Por responder" lead={(msgs.porResponder || []).length + " · " + (msgs.propostas || 0) + " propostas"}>
          <Lista itens={msgs.porResponder || []} agora={ponte.agora} conversa />
          <div className="vin-actions" style={{ justifyContent: "flex-start", margin: "8px 0 12px" }}>
            <button type="button" className="vin-glass-btn ui-tap" disabled={ponte.busy} onClick={function() { ponte.pedir("mesa"); }}>Análise de mensagens</button>
            <button type="button" className="vin-glass-btn soft ui-tap" disabled={ponte.busy} onClick={function() { ponte.pedir("dar-lida"); }}>Marcar como lidas</button>
            <a className="vin-glass-btn soft ui-tap" href={ponte.origem + "/inbox"} target="_blank" rel="noreferrer">Caixa</a>
          </div>
        </Card>
      ) : null}

      {sub === "vendedor" ? (
        <Card titulo="Modo vendedor" lead={msgs.vivo ? "A correr agora" : "Parado"}>
          <Switch
            nome="Modo vendedor"
            detalhe={ponte.pendente ? "A aplicar no computador…" : (msgs.vendedor ? "A página de notificações monitoriza favoritos." : "Parado — não envia a quem põe favorito.")}
            ligado={Boolean(msgs.vendedor)}
            onClick={function() { ponte.pedir("modo-vendedor", { ligado: !msgs.vendedor }); }}
          />
          <Switch
            nome="Envio automático"
            detalhe={(msgs.contador || 0) + " enviadas · " + ((msgs.fila || []).length) + " à espera"}
            ligado={Boolean(msgs.auto)}
            disabled={!msgs.vendedor}
            onClick={function() { ponte.pedir("auto-envio", { ligado: !msgs.auto }); }}
          />
          <label className="vin-kicker" htmlFor="vin-msg" style={{ marginTop: 16, display: "block" }}>Mensagem automática</label>
          <textarea id="vin-msg" className="vin-field" rows={4} value={msg} onChange={function(e) { setMsg(e.target.value); }} placeholder="Vazia: vai a mensagem padrão." />
          <div className="vin-actions" style={{ justifyContent: "flex-start", margin: "12px 0" }}>
            <button type="button" className="vin-glass-btn primary ui-tap" disabled={ponte.busy} onClick={function() { ponte.pedir("msg-auto", { texto: msg }); }}>Guardar</button>
          </div>
        </Card>
      ) : null}

      {sub === "fixar" && !isMobile ? (
        <Card titulo="Fixar mensagens" lead="As fixadas aparecem no topo da caixa.">
          <Switch nome="Modo fixar" detalhe="Botão Fixar em cada conversa" ligado={Boolean(msgs.fixar)} onClick={function() { ponte.pedir("fixar-modo", { ligado: !msgs.fixar }); }} />
          <Switch nome="Minimizar fixadas" detalhe="Barra compacta no topo" ligado={Boolean(msgs.fixarMin)} onClick={function() { ponte.pedir("fixar-min", { ligado: !msgs.fixarMin }); }} />
          {(msgs.fixadas || []).map(function(f, i, arr) {
            return (
              <div key={f.id} className="vin-row">
                {f.foto ? <img className="vin-foto" src={f.foto} alt="" /> : null}
                <div style={{ flex: 1, minWidth: 0 }}><h3>{f.titulo}</h3><p>{f.previa}</p></div>
                <button type="button" className="vin-glass-btn soft ui-tap" disabled={ponte.busy || i === 0} onClick={function() { ponte.pedir("fix-subir", { id: f.id }); }}>↑</button>
                <button type="button" className="vin-glass-btn soft ui-tap" disabled={ponte.busy || i === arr.length - 1} onClick={function() { ponte.pedir("fix-descer", { id: f.id }); }}>↓</button>
                <button type="button" className="vin-glass-btn soft ui-tap" disabled={ponte.busy} onClick={function() { ponte.pedir("fix-tirar", { id: f.id }); }}>Tirar</button>
              </div>
            );
          })}
          {(msgs.fixadas || []).length ? null : <p className="vin-empty">Ainda não há conversas fixadas.</p>}
        </Card>
      ) : null}

      {sub === "respostas" ? (
        <Card titulo="Respostas rápidas" lead="Aparecem ao lado de cada conversa na Vinted.">
          {(msgs.respostas || []).map(function(r, i) {
            var aEditar = qr.i === i;
            return (
              <div key={r.id || i} className="vin-row" style={{ alignItems: "flex-start" }}>
                {aEditar ? (
                  <div style={{ flex: 1 }}>
                    <input className="vin-field" value={qr.edTitulo} onChange={function(e) { setQr(Object.assign({}, qr, { edTitulo: e.target.value })); }} />
                    <textarea className="vin-field" rows={3} value={qr.edTexto} onChange={function(e) { setQr(Object.assign({}, qr, { edTexto: e.target.value })); }} />
                    <div className="vin-actions" style={{ justifyContent: "flex-start", marginTop: 10 }}>
                      <button type="button" className="vin-glass-btn primary ui-tap" disabled={ponte.busy} onClick={function() { ponte.pedir("qr-guardar", { i: i, titulo: qr.edTitulo, texto: qr.edTexto }); setQr(Object.assign({}, qr, { i: -1 })); }}>Guardar</button>
                      <button type="button" className="vin-glass-btn soft ui-tap" onClick={function() { setQr(Object.assign({}, qr, { i: -1 })); }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1 }}><h3>{r.titulo}</h3><p style={{ whiteSpace: "pre-wrap" }}>{r.texto}</p></div>
                    <button type="button" className="vin-glass-btn soft ui-tap" onClick={function() { setQr({ titulo: qr.titulo, texto: qr.texto, i: i, edTitulo: r.titulo, edTexto: r.texto }); }}>Editar</button>
                    <button type="button" className="vin-glass-btn soft ui-tap" disabled={ponte.busy} onClick={function() { ponte.confirmar("qr-" + i, function() { ponte.pedir("qr-apagar", { i: i }); }); }}>{ponte.conf === "qr-" + i ? "Confirmar" : "Apagar"}</button>
                  </>
                )}
              </div>
            );
          })}
          <p className="vin-kicker" style={{ marginTop: 12 }}>Nova resposta</p>
          <input className="vin-field" placeholder="Título" value={qr.titulo} onChange={function(e) { setQr(Object.assign({}, qr, { titulo: e.target.value })); }} />
          <textarea className="vin-field" rows={3} placeholder="Texto" value={qr.texto} onChange={function(e) { setQr(Object.assign({}, qr, { texto: e.target.value })); }} />
          <div className="vin-actions" style={{ justifyContent: "flex-start", margin: "12px 0" }}>
            <button type="button" className="vin-glass-btn primary ui-tap" disabled={ponte.busy} onClick={function() { ponte.pedir("qr-guardar", { novo: true, titulo: qr.titulo, texto: qr.texto }); setQr(Object.assign({}, qr, { titulo: "", texto: "" })); }}>Adicionar</button>
            <button type="button" className="vin-glass-btn soft ui-tap" disabled={ponte.busy} onClick={function() { ponte.confirmar("qr-repor", function() { ponte.pedir("qr-repor"); }); }}>{ponte.conf === "qr-repor" ? "Confirmar" : "Repor originais"}</button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function Venda(props) {
  var payload = props.payload || {};
  var ponte = props.ponte;
  var isMobile = Boolean(props.isMobile);
  return (
    <div>
      {isMobile ? null : (
        <Card titulo="Publicar" lead="Na página de venda tens a IA e o agendamento.">
          <div className="vin-actions" style={{ justifyContent: "flex-start", marginBottom: 8 }}>
            <a className="vin-glass-btn primary ui-tap" href={ponte.origem + "/items/new"} target="_blank" rel="noreferrer">Artigo novo</a>
            <button type="button" className="vin-glass-btn soft ui-tap" disabled={ponte.busy} onClick={function() { ponte.pedir("sync-anuncios"); }}>Sincronizar anúncios</button>
          </div>
          {payload.quota ? <p className="vin-empty">IA hoje · rápido {payload.quota.rapido.used}/{payload.quota.rapido.limit} · qualidade {payload.quota.qualidade.used}/{payload.quota.qualidade.limit}</p> : null}
        </Card>
      )}
      <Card titulo="Rascunhos" lead={(payload.rascunhos || []).length + " à espera"}>
        {isMobile ? (
          <div className="vin-actions" style={{ justifyContent: "flex-start", marginBottom: 8 }}>
            <button type="button" className="vin-glass-btn soft ui-tap" disabled={ponte.busy} onClick={function() { ponte.pedir("sync-anuncios"); }}>Sincronizar anúncios</button>
          </div>
        ) : null}
        {(payload.rascunhos || []).length && !isMobile ? (
          <div className="vin-actions" style={{ justifyContent: "flex-start", marginBottom: 8 }}>
            <button type="button" className="vin-glass-btn primary ui-tap" disabled={ponte.busy} onClick={function() { ponte.pedir("publicar-rascunhos"); }}>Publicar um a um</button>
          </div>
        ) : null}
        <Lista itens={payload.rascunhos || []} agora={ponte.agora} rascunho />
        {(payload.rascunhos || []).length ? null : <p className="vin-empty">Sem rascunhos nesta leitura.</p>}
      </Card>
    </div>
  );
}

function corAnuncio(a) {
  if (a && a.oculto) return "oculto";
  if (a && a.cor) return a.cor;
  var d = a && a.dias;
  if (d == null || !Number.isFinite(Number(d))) return "sem";
  if (d >= 5) return "vermelho";
  if (d >= 4) return "amarelo";
  return "verde";
}

function Analise(props) {
  var payload = props.payload || {};
  var ponte = props.ponte;
  var isMobile = Boolean(props.isMobile);
  var contagem = payload.contagem || {};
  var itens = payload.anuncios || [];
  var envios = payload.envios || [];
  var aCaminho = envios.filter(function(e) { return e && e.estado !== "por-enviar"; });
  var porEnviar = envios.filter(function(e) { return e && e.estado === "por-enviar"; });

  return (
    <div>
      <div className="vin-actions" style={{ justifyContent: "flex-start", marginBottom: 14 }}>
        <button type="button" className="vin-glass-btn soft ui-tap" disabled={ponte.busy} onClick={function() { ponte.pedir("analise-conta"); }}>Análise de conta</button>
        <button type="button" className="vin-glass-btn soft ui-tap" disabled={ponte.busy} onClick={function() { ponte.pedir("analytics"); }}>Views e favoritos</button>
      </div>
      <div className="vin-legenda">
        <span><i className="vin-dot" style={{ background: corIdade("verde") }} />Em dia {contagem.verde || 0}</span>
        <span><i className="vin-dot" style={{ background: corIdade("amarelo") }} />Em atenção {contagem.amarelo || 0}</span>
        <span><i className="vin-dot" style={{ background: corIdade("vermelho") }} />Republicar {contagem.vermelho || 0}</span>
        <span><i className="vin-dot" style={{ background: corIdade("oculto") }} />Ocultos {contagem.ocultos || 0}</span>
      </div>
      <Card titulo="Anúncios" lead={itens.length + " no total"}>
        {itens.map(function(a) {
          var faixa = corAnuncio(a);
          return (
            <div key={a.id} className={"vin-age is-" + faixa}>
              <div className="vin-row" style={{ borderBottom: "none", padding: "10px 12px" }}>
                {a.foto ? <img className="vin-foto" src={a.foto} alt="" /> : <span style={{ width: 10, height: 10, borderRadius: "50%", background: corIdade(faixa), flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>{a.titulo}</h3>
                  <p>{[a.preco != null ? eur(a.preco) : "", a.dias != null ? a.dias + " dias" : "", (a.favs || 0) + " fav", (a.views || 0) + " views", faixa === "oculto" ? "oculto" : ""].filter(Boolean).join(" · ")}</p>
                </div>
                <button type="button" className="vin-glass-btn ui-tap" disabled={ponte.busy} onClick={function() { ponte.pedir("relaunch", { id: a.id, titulo: a.titulo }); }}>Relaunch</button>
              </div>
            </div>
          );
        })}
        {itens.length ? null : <p className="vin-empty">Nenhum anúncio para mostrar.</p>}
      </Card>
      <Card titulo="Envios" lead="Calendário das chegadas · por enviar fica em baixo">
        <EnviosCalendario itens={aCaminho} />
        {porEnviar.length ? (
          <div style={{ marginTop: 16 }}>
            <p className="vin-kicker" style={{ marginBottom: 8 }}>Por enviar · {porEnviar.length}</p>
            <Lista itens={porEnviar} agora={ponte.agora} envio />
          </div>
        ) : <p className="vin-empty">Nada por enviar.</p>}
      </Card>
      {isMobile ? null : (
        <Card titulo="Mais">
          <Switch nome="Modo escuro na Vinted" detalhe="A Central do site já é escura" ligado={Boolean((payload.mensagens || {}).escuro)} onClick={function() { ponte.pedir("modo-escuro", { ligado: !(payload.mensagens || {}).escuro }); }} />
          <div className="vin-actions" style={{ justifyContent: "flex-start", margin: "10px 0 8px" }}>
            <button type="button" className="vin-glass-btn soft ui-tap" disabled={ponte.busy} onClick={function() { ponte.confirmar("cache", function() { ponte.pedir("limpar-cache"); }); }}>{ponte.conf === "cache" ? "Confirmar limpeza" : "Limpar cache"}</button>
            <button type="button" className="vin-glass-btn soft ui-tap" disabled={ponte.busy} onClick={function() { ponte.confirmar("reler", function() { ponte.pedir("reler-historico"); }); }}>{ponte.conf === "reler" ? "Confirmar releitura" : "Reler histórico"}</button>
          </div>
        </Card>
      )}
    </div>
  );
}

var COMPRA_ESTADOS = ["Novo com etiquetas", "Novo sem etiquetas", "Muito bom", "Bom"];
var COMPRA_INTERVALOS = ["6", "8", "10", "15", "30"];

function Compra(props) {
  var compra = props.compra || {};
  var ponte = props.ponte;
  var buscaS = useState({ nome: "", texto: "" });
  var busca = buscaS[0], setBusca = buscaS[1];
  var editS = useState(null);
  var edit = editS[0], setEdit = editS[1];
  var filtS = useState(function() {
    return {
      intervaloSeg: String(compra.intervaloSeg || 6),
      precoMin: compra.precoMin == null ? "" : String(compra.precoMin),
      precoMax: compra.precoMax == null ? "" : String(compra.precoMax),
      tamanhos: Array.isArray(compra.tamanhos) ? compra.tamanhos.join(", ") : "",
      estados: Array.isArray(compra.estados) ? compra.estados.slice() : [],
      excluir: Array.isArray(compra.excluir) ? compra.excluir.join(", ") : "",
    };
  });
  var filt = filtS[0];
  var setFilt = filtS[1];
  var filtAssinatura = [
    compra.intervaloSeg,
    compra.precoMin,
    compra.precoMax,
    (compra.tamanhos || []).join(","),
    (compra.estados || []).join("|"),
    (compra.excluir || []).join("|"),
  ].join("::");

  useEffect(function() {
    var el = typeof document !== "undefined" ? document.activeElement : null;
    if (el && el.classList && el.classList.contains("vin-field")) return;
    setFilt({
      intervaloSeg: String(compra.intervaloSeg || 6),
      precoMin: compra.precoMin == null ? "" : String(compra.precoMin),
      precoMax: compra.precoMax == null ? "" : String(compra.precoMax),
      tamanhos: Array.isArray(compra.tamanhos) ? compra.tamanhos.join(", ") : "",
      estados: Array.isArray(compra.estados) ? compra.estados.slice() : [],
      excluir: Array.isArray(compra.excluir) ? compra.excluir.join(", ") : "",
    });
  }, [filtAssinatura]);

  function guardarFiltros() {
    if (!filt) return;
    var tamanhos = String(filt.tamanhos || "").split(/[,;\s]+/).map(function(x) { return x.trim(); }).filter(Boolean).slice(0, 20);
    var excluir = String(filt.excluir || "").split(/[,;]+/).map(function(x) { return x.trim(); }).filter(Boolean).slice(0, 40);
    var precoMin = String(filt.precoMin || "").trim() === "" ? null : Number(filt.precoMin);
    var precoMax = String(filt.precoMax || "").trim() === "" ? null : Number(filt.precoMax);
    ponte.pedir("compra-filtros", {
      intervaloSeg: Number(filt.intervaloSeg) || 6,
      precoMin: Number.isFinite(precoMin) ? precoMin : null,
      precoMax: Number.isFinite(precoMax) ? precoMax : null,
      tamanhos: tamanhos,
      estados: filt.estados || [],
      excluir: excluir,
    });
  }

  function guardarEdicao() {
    if (!edit || !edit.id) return;
    ponte.pedir("compra-busca", {
      editar: true,
      id: edit.id,
      nome: edit.nome,
      texto: edit.texto,
    });
    setEdit(null);
  }

  return (
    <div>
      <Card titulo="Monitor" lead={compra.resumo || "Liga a caça com a Vinted aberta no computador."}>
        <Switch
          nome={compra.ativo ? "Ligado" : "Desligado"}
          detalhe={ponte.pendente ? "A aplicar no computador…" : ((compra.alertasHoje || 0) + " alertas hoje · a cada " + (compra.intervaloSeg || 6) + " s")}
          ligado={Boolean(compra.ativo)}
          onClick={function() { ponte.pedir("compra", { ativo: !compra.ativo }); }}
        />
      </Card>
      <Card titulo="Filtros gerais" lead="Aplicam-se a todas as buscas">
        {filt ? (
          <div>
            <label className="vin-kicker" style={{ display: "block", marginTop: 4 }}>Intervalo (s)</label>
            <div className="vin-seg">
              {COMPRA_INTERVALOS.map(function(v) {
                return <button key={v} type="button" className={"vin-chip" + (filt.intervaloSeg === v ? " is-on" : "")} onClick={function() { setFilt(Object.assign({}, filt, { intervaloSeg: v })); }}>{v}s</button>;
              })}
            </div>
            <label className="vin-kicker" style={{ display: "block" }}>Preço mín / máx</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input className="vin-field" style={{ marginTop: 0 }} placeholder="Mín" value={filt.precoMin} onChange={function(e) { setFilt(Object.assign({}, filt, { precoMin: e.target.value })); }} />
              <input className="vin-field" style={{ marginTop: 0 }} placeholder="Máx" value={filt.precoMax} onChange={function(e) { setFilt(Object.assign({}, filt, { precoMax: e.target.value })); }} />
            </div>
            <label className="vin-kicker" style={{ display: "block", marginTop: 10 }}>Tamanhos</label>
            <input className="vin-field" style={{ marginTop: 0 }} placeholder="ex. 42, 42.5, 43" value={filt.tamanhos} onChange={function(e) { setFilt(Object.assign({}, filt, { tamanhos: e.target.value })); }} />
            <label className="vin-kicker" style={{ display: "block", marginTop: 10 }}>Estados</label>
            <div className="vin-seg">
              {COMPRA_ESTADOS.map(function(nome) {
                var on = (filt.estados || []).indexOf(nome) >= 0;
                return (
                  <button
                    key={nome}
                    type="button"
                    className={"vin-chip" + (on ? " is-on" : "")}
                    onClick={function() {
                      var next = (filt.estados || []).slice();
                      var i = next.indexOf(nome);
                      if (i >= 0) next.splice(i, 1);
                      else next.push(nome);
                      setFilt(Object.assign({}, filt, { estados: next }));
                    }}
                  >{nome}</button>
                );
              })}
            </div>
            <label className="vin-kicker" style={{ display: "block" }}>Excluir palavras</label>
            <input className="vin-field" style={{ marginTop: 0 }} placeholder="réplica, fake, defeito" value={filt.excluir} onChange={function(e) { setFilt(Object.assign({}, filt, { excluir: e.target.value })); }} />
            <div className="vin-actions" style={{ justifyContent: "flex-start", margin: "12px 0" }}>
              <button type="button" className="vin-glass-btn primary ui-tap" disabled={ponte.busy} onClick={guardarFiltros}>Guardar filtros</button>
            </div>
          </div>
        ) : null}
      </Card>
      <Card titulo="Buscas" lead={(compra.buscas || []).length + " activas"}>
        {(compra.buscas || []).map(function(b) {
          var aEditar = edit && edit.id === b.id;
          return (
            <div key={b.id} className="vin-row" style={{ alignItems: "flex-start" }}>
              {aEditar ? (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input className="vin-field" style={{ marginTop: 0 }} value={edit.nome} onChange={function(e) { setEdit(Object.assign({}, edit, { nome: e.target.value })); }} placeholder="Nome" />
                  <input className="vin-field" value={edit.texto} onChange={function(e) { setEdit(Object.assign({}, edit, { texto: e.target.value })); }} placeholder="O que procurar" />
                  <div className="vin-actions" style={{ justifyContent: "flex-start", marginTop: 10 }}>
                    <button type="button" className="vin-glass-btn primary ui-tap" disabled={ponte.busy || !String(edit.texto || "").trim()} onClick={guardarEdicao}>Guardar</button>
                    <button type="button" className="vin-glass-btn soft ui-tap" onClick={function() { setEdit(null); }}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1 }}><h3>{b.nome || b.texto}</h3>{b.texto && b.texto !== b.nome ? <p>{b.texto}</p> : null}</div>
                  <button type="button" className="vin-glass-btn soft ui-tap" onClick={function() { setEdit({ id: b.id, nome: b.nome || "", texto: b.texto || "" }); }}>Editar</button>
                  <button type="button" className="vin-glass-btn soft ui-tap" disabled={ponte.busy} onClick={function() { ponte.confirmar("b-" + b.id, function() { ponte.pedir("compra-busca", { remover: true, id: b.id }); }); }}>{ponte.conf === "b-" + b.id ? "Confirmar" : "Tirar"}</button>
                </>
              )}
            </div>
          );
        })}
        {(compra.buscas || []).length ? null : <p className="vin-empty">Ainda não há buscas.</p>}
        <p className="vin-kicker" style={{ marginTop: 12 }}>Nova busca</p>
        <input className="vin-field" placeholder="Nome" value={busca.nome} onChange={function(e) { setBusca({ nome: e.target.value, texto: busca.texto }); }} />
        <input className="vin-field" placeholder="O que procurar" value={busca.texto} onChange={function(e) { setBusca({ nome: busca.nome, texto: e.target.value }); }} />
        <div className="vin-actions" style={{ justifyContent: "flex-start", margin: "12px 0" }}>
          <button type="button" className="vin-glass-btn primary ui-tap" disabled={ponte.busy || !busca.texto.trim()} onClick={function() { ponte.pedir("compra-busca", { nome: busca.nome, texto: busca.texto }); setBusca({ nome: "", texto: "" }); }}>Adicionar</button>
        </div>
      </Card>
      <Card titulo="Últimos alertas">
        <Lista itens={compra.feed || []} agora={ponte.agora} />
      </Card>
    </div>
  );
}

function inicioMes(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function chaveDia(ts) {
  var d = new Date(ts);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function meiaNoite(ts) {
  var d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function semanasDoMes(y, m) {
  var primeiro = new Date(y, m, 1);
  var cursor = new Date(y, m, 1 - ((primeiro.getDay() + 6) % 7));
  var semanas = [];
  var fimMes = new Date(y, m + 1, 0).getTime();
  while (semanas.length < 6) {
    var dias = [];
    var i;
    for (i = 0; i < 7; i++) {
      dias.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    semanas.push(dias);
    if (cursor.getTime() > fimMes && cursor.getMonth() !== m) break;
  }
  return semanas;
}

function EnviosCalendario(props) {
  var itens = props.itens || [];
  var mesS = useState(function() { return inicioMes(new Date()); });
  var mes = mesS[0], setMes = mesS[1];
  var y = mes.getFullYear();
  var m = mes.getMonth();
  var hoje = chaveDia(Date.now());
  var cores = ["#8FA8C4", "#8FB39B", "#C4A57C", "#C08C8C", "#A0A0A8", "#7BA3B8", "#D4A0B0", "#9BB8A4"];
  var envios = itens.map(function(e, idx) {
    var a = Number(e.inicioTs) || Number(e.fimTs) || 0;
    var b = Number(e.fimTs) || Number(e.inicioTs) || 0;
    if (a && a < 1e12) a *= 1000;
    if (b && b < 1e12) b *= 1000;
    if (!a && !b) return null;
    if (!a) a = b;
    if (!b) b = a;
    if (b < a) { var t = a; a = b; b = t; }
    return {
      id: e.id || String(idx),
      titulo: e.titulo || "Envio",
      url: e.url || "",
      cor: cores[idx % cores.length],
      inicio: meiaNoite(a),
      fim: meiaNoite(b),
    };
  }).filter(Boolean).sort(function(a, b) { return a.inicio - b.inicio; });
  var faixas = [];
  envios.forEach(function(envio) {
    var i;
    for (i = 0; i < faixas.length; i++) {
      if (faixas[i] < envio.inicio) break;
    }
    envio.faixa = i;
    faixas[i] = envio.fim;
  });
  var semanas = semanasDoMes(y, m);
  var rotulo = mes.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  var algum = false;

  return (
    <div className="vin-cal">
      <div className="vin-cal-head">
        <button type="button" className="vin-glass-btn soft ui-tap" onClick={function() { setMes(new Date(y, m - 1, 1)); }}>‹</button>
        <strong style={{ textTransform: "capitalize" }}>{rotulo}</strong>
        <button type="button" className="vin-glass-btn soft ui-tap" onClick={function() { setMes(new Date(y, m + 1, 1)); }}>›</button>
      </div>
      <div className="vin-cal-dow">
        {["S", "T", "Q", "Q", "S", "S", "D"].map(function(d, i) { return <span key={d + i}>{d}</span>; })}
      </div>
      {semanas.map(function(dias, si) {
        var nFaixas = 0;
        var segmentos = [];
        envios.forEach(function(envio) {
          var de = -1;
          var ate = -1;
          dias.forEach(function(d, col) {
            var ts = meiaNoite(d.getTime());
            if (ts >= envio.inicio && ts <= envio.fim && d.getMonth() === m) {
              if (de < 0) de = col;
              ate = col;
            }
          });
          if (de < 0) return;
          algum = true;
          if (envio.faixa + 1 > nFaixas) nFaixas = envio.faixa + 1;
          segmentos.push({ envio: envio, de: de, ate: ate, primeiro: meiaNoite(dias[de].getTime()) === envio.inicio || (de === 0 && dias[de].getMonth() === m) });
        });
        var lanes = [];
        var li;
        for (li = 0; li < nFaixas; li++) lanes.push([]);
        segmentos.forEach(function(seg) { lanes[seg.envio.faixa].push(seg); });
        return (
          <div key={si} className="vin-cal-week">
            <div className="vin-cal-days">
              {dias.map(function(d) {
                var k = chaveDia(d.getTime());
                var fora = d.getMonth() !== m;
                return <div key={k} className={"vin-cal-cell" + (fora ? " is-out" : "") + (k === hoje ? " is-today" : "")}>{fora ? "" : d.getDate()}</div>;
              })}
            </div>
            {lanes.map(function(segs, faixa) {
              return (
                <div key={faixa} className="vin-cal-lane">
                  {segs.map(function(seg) {
                    var estilo = { gridColumn: (seg.de + 1) + " / " + (seg.ate + 2), background: seg.envio.cor };
                    var nome = seg.primeiro ? seg.envio.titulo : "";
                    if (seg.envio.url) {
                      return <a key={seg.envio.id} className="vin-cal-bar" href={seg.envio.url} target="_blank" rel="noreferrer" style={estilo} title={seg.envio.titulo}>{nome}</a>;
                    }
                    return <div key={seg.envio.id} className="vin-cal-bar" style={estilo} title={seg.envio.titulo}>{nome}</div>;
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
      {algum ? null : <p className="vin-empty">Sem envios a caminho com datas neste mês.</p>}
    </div>
  );
}

function Stat(props) {
  return (
    <button type="button" className={"vin-stat ui-spot" + (props.on ? " is-on" : "")} onMouseMove={trackSpotlight} onClick={props.onClick}>
      <b>{props.valor}</b>
      <i>{props.titulo} · {props.sub}</i>
    </button>
  );
}

function Card(props) {
  return (
    <section className="vin-card glass-in">
      {props.titulo ? <h2>{props.titulo}</h2> : null}
      {props.lead ? <p className="lead">{props.lead}</p> : null}
      {props.children}
    </section>
  );
}

function Switch(props) {
  return (
    <div className="vin-sw">
      <div><strong>{props.nome}</strong><span>{props.detalhe}</span></div>
      <button type="button" className={"vin-glass-btn ui-tap" + (props.ligado ? " primary" : " soft")} disabled={props.disabled} onClick={props.onClick}>
        {props.ligado ? "ON" : "OFF"}
      </button>
    </div>
  );
}

function Lista(props) {
  var itens = props.itens || [];
  if (!itens.length) return <p className="vin-empty">Nada para mostrar.</p>;
  return (
    <div>
      {itens.map(function(e, i) {
        var titulo = props.conversa
          ? ((e.comprador || "Comprador") + (e.artigo ? " · " + e.artigo : ""))
          : (e.titulo || "Artigo");
        var sub = props.envio
          ? [e.estado === "por-enviar" ? "por enviar" : "a caminho", e.nota].filter(Boolean).join(" · ")
          : props.conversa
            ? [e.oferta ? "proposta " + eur(e.oferta) : e.previa, haQuanto(e.quando, props.agora)].filter(Boolean).join(" · ")
            : props.rascunho
              ? [e.preco != null ? eur(e.preco) : "", e.marca, e.tamanho].filter(Boolean).join(" · ")
              : [e.valor != null ? eur(e.valor) : e.preco != null ? eur(e.preco) : "", e.estado === "curso" ? "em curso" : "", haQuanto(e.ts || e.at || e.quando, props.agora)].filter(Boolean).join(" · ");
        var miolo = (<div style={{ flex: 1, minWidth: 0 }}><h3>{titulo}</h3>{sub ? <p>{sub}</p> : null}</div>);
        if (!e.url) return <div key={e.id || i} className="vin-row">{e.foto ? <img className="vin-foto" src={e.foto} alt="" /> : null}{miolo}</div>;
        return <a key={e.id || i} className="vin-row" href={e.url} target="_blank" rel="noreferrer">{e.foto ? <img className="vin-foto" src={e.foto} alt="" /> : null}{miolo}</a>;
      })}
    </div>
  );
}
