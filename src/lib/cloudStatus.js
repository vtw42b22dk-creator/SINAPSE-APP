import { getUser } from "./cloudStore";
import { supabase } from "./supabase";

/** Versão visível no Hub — confirma que o telemóvel/PC tem o código novo. */
export var SYNC_REV = typeof __APP_SYNC_REV__ !== "undefined" ? __APP_SYNC_REV__ : "desconhecida";

var PROBE_TABLES = [
  { table: "journal_blocks", label: "Diário (texto)" },
  { table: "wishlist_items", label: "Wishlist (itens)" },
  { table: "expenses", label: "Gastos" },
];

export async function probeCloudTables() {
  if (!supabase) return { ok: false, detail: "Supabase não configurado no site." };
  var user = await getUser();
  if (!user) return { ok: false, detail: "Inicia sessão para sincronizar." };
  var problems = [];
  for (var i = 0; i < PROBE_TABLES.length; i++) {
    var t = PROBE_TABLES[i];
    try {
      var res = await supabase.from(t.table).select("id").eq("user_id", user.id).limit(1);
      if (res.error) problems.push(t.label + ": " + (res.error.message || "erro"));
    } catch (e) {
      problems.push(t.label + ": " + (e.message || "erro"));
    }
  }
  if (problems.length) return { ok: false, detail: problems.join(" · ") };
  return { ok: true, detail: "Nuvem OK · rev. " + SYNC_REV };
}
