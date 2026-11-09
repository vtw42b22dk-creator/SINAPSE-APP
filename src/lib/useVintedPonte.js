import { useCallback, useEffect, useMemo, useState } from "react";
import { lerPonte, ouvirPonte, pedirComando } from "./vintedStore";

export function useVintedPonte() {
  var dataS = useState({ loading: true, erro: "", estado: null, comandos: [], agora: 0 });
  var data = dataS[0], setData = dataS[1];
  var busyS = useState(false);
  var busy = busyS[0], setBusy = busyS[1];
  var avisoS = useState("");
  var aviso = avisoS[0], setAviso = avisoS[1];
  var confS = useState("");
  var conf = confS[0], setConf = confS[1];

  var carregar = useCallback(function() {
    lerPonte().then(function(res) {
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
    carregar();
    var parar = ouvirPonte(carregar);
    var id = setInterval(carregar, 8000);
    return function() {
      parar();
      clearInterval(id);
    };
  }, [carregar]);

  var payload = (data.estado && data.estado.payload) || {};
  var visto = data.estado && data.estado.visto_em;
  var ligado = Boolean(visto && data.agora && data.agora - new Date(visto).getTime() < 150000);
  var comando = (data.comandos || []).find(function(c) { return c.estado === "pedido" || c.estado === "a-correr"; });
  var ultimo = (data.comandos || [])[0];
  var aCorrer = Boolean(payload.aCorrer) || Boolean(comando);

  var pedir = useCallback(function(acao, extra) {
    setAviso("");
    setBusy(true);
    return pedirComando("acao", Object.assign({ acao: acao }, extra || {})).then(function() {
      setAviso(ligado ? "O computador está a tratar disto." : "Pedido guardado. Corre quando o Chrome e a Vinted estiverem abertos.");
      carregar();
      setBusy(false);
    }).catch(function(e) {
      setAviso(e.message || "Não consegui enviar o pedido.");
      setBusy(false);
    });
  }, [carregar, ligado]);

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
