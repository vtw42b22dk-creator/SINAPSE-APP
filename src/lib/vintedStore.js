import { supabase } from "./supabase";
import { getUser } from "./cloudStore";

function erroLegivel(error) {
  if (!error) return "";
  var msg = error.message || error.details || String(error);
  if (/vinted_estado|vinted_comandos|schema cache|does not exist|PGRST/i.test(msg)) {
    return "Falta criar as tabelas. No Supabase, abre o SQL Editor e corre supabase/vinted-bridge.sql.";
  }
  return msg;
}

export async function lerPonte() {
  if (!supabase) return { erro: "Supabase não está configurado.", estado: null, comandos: [] };
  var user = await getUser();
  if (!user) return { erro: "Entra na conta para ver a Vinted.", estado: null, comandos: [] };
  var estado = await supabase.from("vinted_estado").select("*").eq("user_id", user.id).maybeSingle();
  var comandos = await supabase.from("vinted_comandos").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8);
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
  var res = await supabase.from("vinted_comandos").insert({
    id: id,
    user_id: user.id,
    tipo: tipo,
    payload: payload || {},
    estado: "pedido",
  });
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
