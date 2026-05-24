import { cloudErrorMessage, getUser, uid } from "./cloudStore";
import { supabase } from "./supabase";

export var SYNC_REV = typeof __APP_SYNC_REV__ !== "undefined" ? __APP_SYNC_REV__ : "desconhecida";

var TABLES = [
  { table: "journal_spaces", label: "Diário (temas)" },
  { table: "journal_blocks", label: "Diário (texto)" },
  { table: "wishlist_groups", label: "Wishlist (grupos)" },
  { table: "wishlist_items", label: "Wishlist (itens)" },
  { table: "expenses", label: "Gastos" },
];

export async function probeCloudTables() {
  if (!supabase) return { ok: false, detail: "Supabase NÃO está no site. GitHub → Settings → Secrets → VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY." };
  var user = await getUser();
  if (!user) return { ok: false, detail: "Inicia sessão para sincronizar." };

  var problems = [];
  for (var i = 0; i < TABLES.length; i++) {
    var t = TABLES[i];
    var res = await supabase.from(t.table).select("id").eq("user_id", user.id).limit(1);
    if (res.error) problems.push(t.label + ": " + cloudErrorMessage(res.error));
  }

  if (problems.length) {
    return {
      ok: false,
      detail: problems.join(" · ") + " — Corre SQL no Supabase (ficheiro supabase/SETUP-TUDO.sql).",
    };
  }

  var testId = uid("probe");
  var write = await supabase.from("journal_blocks").upsert({
    id: testId,
    user_id: user.id,
    space_id: "probe",
    type: "text",
    content: "teste sinapse",
    meta: {},
    order_index: 0,
  });
  if (write.error) {
    return { ok: false, detail: "Escrita bloqueada: " + cloudErrorMessage(write.error) };
  }
  await supabase.from("journal_blocks").delete().eq("user_id", user.id).eq("id", testId);

  var lastErr = "";
  try {
    lastErr = sessionStorage.getItem("sinapse-last-cloud-error") || "";
  } catch (e) {}
  if (lastErr) {
    return { ok: false, detail: "Último erro: " + lastErr };
  }

  return { ok: true, detail: "Nuvem OK · podes sincronizar · " + SYNC_REV };
}
