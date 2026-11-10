import { supabase } from "./supabase";
import { getUser } from "./cloudStore";

function textoErro(error) {
  if (!error) return "";
  return error.message || error.details || String(error);
}

function jwtExpirado(error) {
  return /jwt expired|invalid jwt|token is expired|token has expired/i.test(textoErro(error));
}

function erroLegivel(error) {
  var msg = textoErro(error);
  if (!msg) return "";
  if (jwtExpirado(error)) return "A sessão expirou. Entra outra vez na conta.";
  if (/vinted_estado|vinted_comandos|schema cache|does not exist|PGRST/i.test(msg)) {
    return "Falta criar as tabelas. No Supabase, abre o SQL Editor e corre supabase/vinted-bridge.sql.";
  }
  return msg;
}

var renovacao = null;
var renovarBloqueadoAte = 0;
function renovarSessao() {
  if (!supabase) return Promise.resolve(false);
  if (Date.now() < renovarBloqueadoAte) return Promise.resolve(false);
  if (renovacao) return renovacao;
  renovacao = supabase.auth.refreshSession().then(function(res) {
    var ok = Boolean(res && res.data && res.data.session && !res.error);
    if (!ok) renovarBloqueadoAte = Date.now() + 90000;
    return ok;
  }).catch(function() {
    renovarBloqueadoAte = Date.now() + 90000;
    return false;
  }).finally(function() {
    renovacao = null;
  });
  return renovacao;
}

export async function lerPonte() {
  if (!supabase) return { erro: "Supabase não está configurado.", estado: null, comandos: [] };
  var user = await getUser();
  if (!user) return { erro: "Entra na conta para ver a Vinted.", estado: null, comandos: [] };
  var estado = await supabase.from("vinted_estado").select("*").eq("user_id", user.id).maybeSingle();
  var comandos = await supabase.from("vinted_comandos").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8);
  if (jwtExpirado(estado.error) || jwtExpirado(comandos.error)) {
    var renovou = await renovarSessao();
    if (renovou) {
      estado = await supabase.from("vinted_estado").select("*").eq("user_id", user.id).maybeSingle();
      comandos = await supabase.from("vinted_comandos").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8);
    }
  }
  var falha = estado.error || comandos.error;
  return {
    erro: erroLegivel(falha),
    estado: falha ? null : (estado.data || null),
    comandos: falha ? [] : (comandos.data || []),
  };
}

export async function pedirComando(tipo, payload) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  var user = await getUser();
  if (!user) throw new Error("Entra na conta primeiro.");
  var id = "cmd" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  var corpo = {
    id: id,
    user_id: user.id,
    tipo: tipo,
    payload: payload || {},
    estado: "pedido",
  };
  var res = await supabase.from("vinted_comandos").insert(corpo);
  if (jwtExpirado(res.error) && await renovarSessao()) {
    res = await supabase.from("vinted_comandos").insert(corpo);
  }
  if (res.error) throw new Error(erroLegivel(res.error));
  return id;
}

export function ouvirPonte(onChange) {
  if (!supabase) return function() {};
  var channel = supabase
    .channel("vinted-ponte-" + Math.random().toString(36).slice(2, 8))
    .on("postgres_changes", { event: "*", schema: "public", table: "vinted_estado" }, function(payload) {
      onChange({ tipo: "estado", row: payload && payload.new });
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "vinted_comandos" }, function(payload) {
      onChange({ tipo: "comando", row: payload && payload.new });
    })
    .subscribe();
  return function() { supabase.removeChannel(channel); };
}
