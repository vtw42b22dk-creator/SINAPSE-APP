import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { lerPonte, ouvirPonte, pedirComando } from "./vintedStore";

var RAPIDA = {
  compra: true,
  "compra-busca": true,
  "compra-filtros": true,
  "modo-vendedor": true,
  "auto-envio": true,
  "fixar-modo": true,
  "fixar-min": true,
  "modo-escuro": true,
  "msg-auto": true,
};

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

function patchDe(acao, extra, vis) {
  var msgs = (vis && vis.mensagens) || {};
  if (acao === "compra") return { compraAtivo: Boolean(extra && extra.ativo) };
  if (acao === "modo-vendedor") {
    var vOn = Boolean(extra && extra.ligado);
    return { mensagens: { vendedor: vOn, auto: vOn ? Boolean(msgs.auto) : false } };
  }
  if (acao === "auto-envio") {
    var aOn = Boolean(extra && extra.ligado);
    return { mensagens: { auto: aOn, vendedor: aOn ? true : Boolean(msgs.vendedor) } };
  }
  if (acao === "fixar-modo") return { mensagens: { fixar: Boolean(extra && extra.ligado) } };
  if (acao === "fixar-min") return { mensagens: { fixarMin: Boolean(extra && extra.ligado) } };
  if (acao === "modo-escuro") return { mensagens: { escuro: Boolean(extra && extra.ligado) } };
  if (acao === "msg-auto") return { mensagens: { texto: String((extra && extra.texto) || "") } };
  return null;
}

function combina(base, esp) {
  if (!esp) return true;
  var raiz = base || {};
  if (esp.compraAtivo !== undefined && Boolean(raiz.compra && raiz.compra.ativo) !== Boolean(esp.compraAtivo)) return false;
  var m = raiz.mensagens || {};
  var e = esp.mensagens || {};
  var chaves = Object.keys(e);
  for (var i = 0; i < chaves.length; i++) {
    var k = chaves[i];
    if (k === "texto") {
      if (String(m.texto || "") !== String(e.texto || "")) return false;
    } else if (Boolean(m[k]) !== Boolean(e[k])) return false;
  }
  return true;
}

function marca(row) {
  var t = Date.parse((row && row.updated_at) || "");
  return Number.isFinite(t) ? t : 0;
}

function maisRecente(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return marca(a) >= marca(b) ? a : b;
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
  var esperaS = useState(null);
  var espera = esperaS[0], setEspera = esperaS[1];
  var timerRef = useRef(0);
  var visivelRef = useRef({});
  var esperaRef = useRef(null);
  var baseRef = useRef({});
  var ligadoRef = useRef(false);
  esperaRef.current = espera;

  var aplicarLeitura = useCallback(function(res) {
    setData(function(prev) {
      var estado = maisRecente(res && res.estado, prev.estado) || (res && res.estado) || prev.estado;
      var comandos = (res && res.comandos) || prev.comandos || [];
      if (res && res.comandos && prev.comandos) {
        var mapa = {};
        prev.comandos.forEach(function(c) { if (c && c.id) mapa[c.id] = c; });
        res.comandos.forEach(function(c) {
          if (!c || !c.id) return;
          mapa[c.id] = maisRecente(c, mapa[c.id]) || c;
        });
        comandos = Object.keys(mapa).map(function(id) { return mapa[id]; });
        comandos.sort(function(a, b) { return Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0); });
        comandos = comandos.slice(0, 8);
      }
      return {
        loading: false,
        erro: (res && res.erro) || "",
        estado: estado,
        comandos: comandos,
        agora: Date.now(),
      };
    });
  }, [setData]);

  var carregar = useCallback(function() {
    return lerPonte().then(aplicarLeitura).catch(function() {
      setData(function(prev) {
        return Object.assign({}, prev, { loading: false, erro: prev.estado ? "" : "Não consegui ler a ponte.", agora: Date.now() });
      });
    });
  }, [aplicarLeitura, setData]);

  useEffect(function() {
    carregar();
    var parar = ouvirPonte(function(ev) {
      if (!ev || !ev.row) {
        carregar();
        return;
      }
      if (ev.tipo === "estado") {
        setData(function(prev) {
          var row = ev.row.payload
            ? ev.row
            : Object.assign({}, prev.estado || {}, ev.row, { payload: prev.estado && prev.estado.payload });
          return Object.assign({}, prev, {
            loading: false,
            estado: maisRecente(row, prev.estado) || row,
            agora: Date.now(),
          });
        });
        return;
      }
      if (ev.tipo === "comando" && ev.row.id) {
        setData(function(prev) {
          var lista = (prev.comandos || []).filter(function(c) { return c.id !== ev.row.id; });
          lista.unshift(ev.row);
          return Object.assign({}, prev, { comandos: lista.slice(0, 8), agora: Date.now() });
        });
        if (ev.row.estado === "feito" || ev.row.estado === "erro") carregar();
      }
    });
    return function() { parar(); };
  }, [carregar, setData]);

  var basePayload = (data.estado && data.estado.payload) || {};
  var payload = espera
    ? Object.assign({}, basePayload, {
        mensagens: Object.assign({}, basePayload.mensagens || {}, espera.mensagens || {}),
        compra: Object.assign({}, basePayload.compra || {}, espera.compraAtivo === undefined ? {} : {
          ativo: espera.compraAtivo,
          resumo: espera.compraAtivo ? "Monitor ligado." : "Monitor desligado.",
        }),
      })
    : basePayload;
  visivelRef.current = payload;
  baseRef.current = basePayload;

  var visto = data.estado && data.estado.visto_em;
  var ligado = Boolean(visto && data.agora && data.agora - new Date(visto).getTime() < 40000);
  var syncPendente = (data.comandos || []).find(function(c) {
    if (!ehSync(c)) return false;
    if (c.estado !== "pedido" && c.estado !== "a-correr") return false;
    return idadeCmd(c, data.agora) < 90000;
  });
  var aCorrer = Boolean(payload.aCorrer) || Boolean(syncPendente);
  var ultimo = (data.comandos || [])[0];
  ligadoRef.current = ligado;

  useEffect(function() {
    if (!espera) return;
    if (combina(basePayload, espera)) setEspera(null);
  }, [espera, basePayload, setEspera]);

  useEffect(function() {
    if (!espera || !(espera.ids || []).length) return;
    var ids = espera.ids;
    var relacionados = (data.comandos || []).filter(function(c) { return ids.indexOf(c.id) >= 0; });
    if (relacionados.length < ids.length) return;
    var aberto = relacionados.some(function(c) { return c.estado === "pedido" || c.estado === "a-correr"; });
    if (aberto) return;
    var erro = relacionados.find(function(c) { return c.estado === "erro"; });
    if (erro && !combina(basePayload, espera)) {
      setEspera(null);
      setAviso((erro.resultado && erro.resultado.erro) || "Não consegui aplicar no computador.");
    }
  }, [data.comandos, espera, basePayload, setEspera, setAviso]);

  useEffect(function() {
    if (!espera) return;
    var em = espera.em;
    var t = setTimeout(function() {
      var atual = esperaRef.current;
      if (!atual || atual.em !== em) return;
      if (!combina(baseRef.current, atual)) {
        setAviso("O computador não confirmou. Recarrega a extensão no Chrome e deixa a Vinted aberta.");
      }
      setEspera(function(valor) {
        if (!valor || valor.em !== em) return valor;
        return null;
      });
    }, 12000);
    return function() { clearTimeout(t); };
  }, [espera && espera.em, setEspera, setAviso]);

  useEffect(function() {
    function ritmo() {
      if (typeof document !== "undefined" && document.hidden) return 8000;
      return esperaRef.current ? 1000 : 2500;
    }
    function agendar() {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(function() { carregar(); }, ritmo());
    }
    agendar();
    function aoVoltar() {
      agendar();
      if (!document.hidden) carregar();
    }
    document.addEventListener("visibilitychange", aoVoltar);
    return function() {
      clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [carregar, Boolean(espera)]);

  var pedir = useCallback(function(acao, extra) {
    setAviso("");
    var pedaco = patchDe(acao, extra, visivelRef.current);
    if (pedaco) {
      setEspera(function(prev) {
        var base = prev || { em: Date.now(), ids: [] };
        return {
          em: Date.now(),
          ids: base.ids || [],
          compraAtivo: pedaco.compraAtivo !== undefined ? pedaco.compraAtivo : base.compraAtivo,
          mensagens: Object.assign({}, base.mensagens || {}, pedaco.mensagens || {}),
        };
      });
    }
    var pesada = !RAPIDA[acao];
    if (pesada) setBusy(true);
    return pedirComando("acao", Object.assign({ acao: acao }, extra || {})).then(function(id) {
      if (pedaco) {
        setEspera(function(prev) {
          if (!prev) return prev;
          var ids = (prev.ids || []).concat(id);
          return Object.assign({}, prev, { ids: ids });
        });
      }
      if (!ligadoRef.current) setAviso("Pedido guardado. Aplica quando o Chrome e a Vinted estiverem abertos.");
      setTimeout(function() { carregar(); }, 400);
      if (pesada) setBusy(false);
    }).catch(function(e) {
      if (pedaco) setEspera(null);
      setAviso(e.message || "Não consegui enviar o pedido.");
      if (pesada) setBusy(false);
    });
  }, [carregar, setAviso, setBusy, setEspera]);

  function confirmar(chave, fn) {
    if (conf !== chave) {
      setConf(chave);
      return;
    }
    setConf("");
    fn();
  }

  var ultimoErro = "";
  if (ultimo && ultimo.estado === "erro" && ultimo.resultado && idadeCmd(ultimo, data.agora) < 20000) {
    ultimoErro = ultimo.resultado.erro || "";
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
      pendente: Boolean(espera),
      busy: busy,
      aviso: aviso,
      ultimoErro: ultimoErro,
      origem: payload.origem || "https://www.vinted.pt",
      conf: conf,
      confirmar: confirmar,
      pedir: pedir,
      carregar: carregar,
    };
  }, [data, payload, ligado, aCorrer, espera, busy, aviso, ultimoErro, conf, pedir, carregar]);
}
