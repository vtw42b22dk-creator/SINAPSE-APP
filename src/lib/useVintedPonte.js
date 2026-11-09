import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { lerPonte, ouvirPonte, pedirComando } from "./vintedStore";

function ehSync(c) {
  if (!c) return false;
  if (c.tipo === "sincronizar") return true;
  return c.tipo === "acao" && c.payload && (c.payload.acao === "atualizar" || c.payload.acao === "sync-anuncios" || c.payload.acao === "reler-historico");
}

function idadeCmd(c, agora) {
  var t = Date.parse(c && (c.updated_at || c.created_at) || 0);
  if (!Number.isFinite(t)) return 999999999;
  return agora - t;
}

export function useVintedPonte() {
  var dataS = useState({ loading: true, erro: "", estado: null, comandos: [], agora: 0 });
  var data = dataS[0], setData = dataS[1];
  var busyS = useState(false);
  var busy = busyS[0], setBusy = busyS[1];
  var avisoS = useState("");
  var aviso = avisoS[0], setAviso = avisoS[1];
  var confS = useState("");
  var conf = confS[0], setConf = confS[1];
  var localS = useState(null);
  var localPatch = localS[0], setLocalPatch = localS[1];
  var timerRef = useRef(0);
  var lastPayloadRef = useRef("");

  var carregar = useCallback(function(forcar) {
    lerPonte().then(function(res) {
      var payload = res.estado && res.estado.payload ? res.estado.payload : null;
      var chave = "";
      try { chave = JSON.stringify(payload || {}) + "|" + (res.comandos || []).map(function(c) { return c.id + ":" + c.estado; }).join(","); } catch (e) { chave = String(Date.now()); }
      if (!forcar && chave === lastPayloadRef.current && res.estado) {
        setData(function(prev) {
          return {
            loading: false,
            erro: res.erro || "",
            estado: Object.assign({}, prev.estado || {}, res.estado, { payload: (prev.estado && prev.estado.payload) || res.estado.payload }),
            comandos: res.comandos || [],
            agora: Date.now(),
          };
        });
        return;
      }
      lastPayloadRef.current = chave;
      setData({
        loading: false,
        erro: res.erro || "",
        estado: res.estado,
        comandos: res.comandos || [],
        agora: Date.now(),
      });
    }).catch(function() {
      setData({ loading: false, erro: "Não consegui ler a ponte.", estado: null, comandos: [], agora: Date.now() });
    });
  }, [setData]);

  useEffect(function() {
    carregar(true);
    var parar = ouvirPonte(function() { carregar(false); });
    function agendar() {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(function() { carregar(false); }, 12000);
    }
    agendar();
    return function() {
      parar();
      clearInterval(timerRef.current);
    };
  }, [carregar]);

  var basePayload = (data.estado && data.estado.payload) || {};
  var payload = localPatch
    ? Object.assign({}, basePayload, localPatch, {
        mensagens: Object.assign({}, basePayload.mensagens || {}, localPatch.mensagens || {}),
        compra: Object.assign({}, basePayload.compra || {}, localPatch.compra || {}),
      })
    : basePayload;
  var visto = data.estado && data.estado.visto_em;
  var ligado = Boolean(visto && data.agora && data.agora - new Date(visto).getTime() < 150000);
  var syncPendente = (data.comandos || []).find(function(c) {
    if (!ehSync(c)) return false;
    if (c.estado !== "pedido" && c.estado !== "a-correr") return false;
    return idadeCmd(c, data.agora) < 90000;
  });
  var aCorrer = Boolean(payload.aCorrer) || Boolean(syncPendente);
  var ultimo = (data.comandos || [])[0];

  useEffect(function() {
    if (!localPatch) return;
    var t = setTimeout(function() { setLocalPatch(null); }, 5000);
    return function() { clearTimeout(t); };
  }, [localPatch, setLocalPatch]);

  useEffect(function() {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(function() { carregar(false); }, aCorrer ? 2500 : 15000);
    return function() { clearInterval(timerRef.current); };
  }, [aCorrer, carregar]);

  var pedir = useCallback(function(acao, extra) {
    setAviso("");
    setBusy(true);
    var patch = {};
    if (acao === "compra") patch = { compra: { ativo: Boolean(extra && extra.ativo) } };
    if (acao === "modo-vendedor") {
      var vOn = Boolean(extra && extra.ligado);
      patch = { mensagens: { vendedor: vOn, auto: vOn ? Boolean((basePayload.mensagens || {}).auto) : false, vivo: vOn ? Boolean((basePayload.mensagens || {}).vivo) : false } };
    }
    if (acao === "auto-envio") {
      var aOn = Boolean(extra && extra.ligado);
      patch = { mensagens: { auto: aOn, vendedor: aOn ? true : Boolean((basePayload.mensagens || {}).vendedor) } };
    }
    if (acao === "fixar-modo") patch = { mensagens: { fixar: Boolean(extra && extra.ligado) } };
    if (acao === "fixar-min") patch = { mensagens: { fixarMin: Boolean(extra && extra.ligado) } };
    if (acao === "modo-escuro") patch = { mensagens: { escuro: Boolean(extra && extra.ligado) } };
    if (Object.keys(patch).length) setLocalPatch(patch);

    return pedirComando("acao", Object.assign({ acao: acao }, extra || {})).then(function() {
      setAviso(ligado ? "Feito no computador." : "Pedido guardado. Corre quando o Chrome e a Vinted estiverem abertos.");
      setTimeout(function() { carregar(true); }, 800);
      setBusy(false);
    }).catch(function(e) {
      setLocalPatch(null);
      setAviso(e.message || "Não consegui enviar o pedido.");
      setBusy(false);
    });
  }, [carregar, ligado, basePayload, setAviso, setBusy, setLocalPatch]);

  function confirmar(chave, fn) {
    if (conf !== chave) {
      setConf(chave);
      return;
    }
    setConf("");
    fn();
  }

  return useMemo(function() {
    return {
      loading: data.loading,
      erro: data.erro,
      payload: payload,
      comandos: data.comandos || [],
      agora: data.agora,
      ligado: ligado,
      aCorrer: aCorrer,
      busy: busy,
      aviso: aviso,
      ultimoErro: ultimo && ultimo.estado === "erro" && ultimo.resultado ? ultimo.resultado.erro : "",
      origem: payload.origem || "https://www.vinted.pt",
      conf: conf,
      confirmar: confirmar,
      pedir: pedir,
      carregar: carregar,
    };
  }, [data, payload, ligado, aCorrer, busy, aviso, ultimo, conf, pedir, carregar]);
}
