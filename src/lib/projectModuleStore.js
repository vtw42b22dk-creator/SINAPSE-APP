/* eslint-disable no-unused-vars, no-empty */
import { readLocal, writeLocal, uid, getUser, cloudErrorMessage } from "./cloudStore";
import { supabase } from "./supabase";
import { STOCK_HISTORY_SEED } from "./stockHistorySeed";
import { pauseCloudPull, isCloudPullPaused } from "./cloudSyncGuard";
import { ensureWriteSession } from "./safeCloudWrite";

var PREFIX = "project-module-v1";
var TABLES = {
  investments: "project_investments",
  kpis: "project_kpis",
  inventory: "project_inventory",
  notes: "project_notes",
  stock: "project_stock",
};

function localKey(projectId, module) {
  return PREFIX + ":" + module + ":" + projectId;
}

function rowUpdated(row) {
  if (row.updated) return Number(row.updated);
  if (row.updated_at) return new Date(row.updated_at).getTime();
  if (row.created) return Number(row.created);
  return 0;
}

function mergeRows(local, remote, normalize) {
  var map = {};
  (remote || []).forEach(function(r) {
    var n = normalize(r);
    map[n.id] = n;
  });
  (local || []).forEach(function(r) {
    var n = normalize(r);
    var ex = map[n.id];
    if (!ex || rowUpdated(n) > rowUpdated(ex)) map[n.id] = n;
  });
  return Object.values(map);
}

async function fetchProjectRows(table, projectId, fromDb) {
  var user = await getUser();
  if (!supabase || !user) return [];
  try {
    var res = await supabase.from(table).select("*").eq("user_id", user.id).eq("project_id", projectId);
    if (res.error) throw res.error;
    return (res.data || []).map(fromDb);
  } catch (e) {
    console.warn("[Projetos] leitura", table, cloudErrorMessage(e));
    return [];
  }
}

async function upsertProjectRows(table, projectId, rows, toDb) {
  var user = await getUser();
  if (!supabase || !user) return { ok: false, cloud: false };
  try {
    var payload = (rows || []).map(function(r) {
      var ms = rowUpdated(r) || Date.now();
      return Object.assign({}, toDb(r, projectId), {
        user_id: user.id,
        updated_at: new Date(ms).toISOString(),
      });
    });
    if (payload.length) {
      var res = await supabase.from(table).upsert(payload, { onConflict: "id" });
      if (res.error) throw res.error;
    }
    var existing = await supabase.from(table).select("id").eq("user_id", user.id).eq("project_id", projectId);
    if (existing.error) throw existing.error;
    var keep = new Set((rows || []).map(function(r) { return r.id; }));
    var stale = (existing.data || []).map(function(r) { return r.id; }).filter(function(id) { return !keep.has(id); });
    if (stale.length) {
      var del = await supabase.from(table).delete().eq("user_id", user.id).in("id", stale);
      if (del.error) throw del.error;
    }
    return { ok: true, cloud: true };
  } catch (e) {
    console.warn("[Projetos] gravação", table, cloudErrorMessage(e));
    return { ok: false, cloud: false, error: cloudErrorMessage(e) };
  }
}

function normInvestment(row) {
  return {
    id: row.id || uid("pi"),
    title: row.title || "",
    amount: Number(row.amount) || 0,
    type: row.type === "credit" ? "credit" : "debit",
    day: row.day || row.day_key || new Date().toISOString().slice(0, 10),
    notes: row.notes || "",
    created: row.created || (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
    updated: rowUpdated(row) || Date.now(),
  };
}

function invToDb(r, projectId) {
  return {
    id: r.id,
    project_id: projectId,
    title: r.title,
    amount: r.amount,
    type: r.type,
    day_key: r.day,
    notes: r.notes || "",
  };
}

function invFromDb(r) {
  return normInvestment(r);
}

function parseInventoryMeta(row) {
  // Categoria e nota livre são guardadas no campo `notes` (texto) para evitar
  // alterar o esquema do Supabase. Formato: JSON {"c":"capital","n":"..."}.
  if (row.category) return { category: row.category === "capital" ? "capital" : "circulating", note: row.notes || "" };
  var raw = row.notes;
  if (raw && typeof raw === "string" && raw.charAt(0) === "{") {
    try {
      var obj = JSON.parse(raw);
      return { category: obj.c === "capital" ? "capital" : "circulating", note: obj.n || "" };
    } catch (e) {}
  }
  return { category: "circulating", note: raw || "" };
}

function normInventory(row) {
  var meta = parseInventoryMeta(row);
  return {
    id: row.id || uid("pv"),
    name: row.name || "",
    quantity: Number(row.quantity) || 0,
    status: row.status === "acquired" ? "acquired" : row.status === "depleted" ? "depleted" : "missing",
    unitCost: Number(row.unit_cost != null ? row.unit_cost : row.unitCost) || 0,
    category: meta.category,
    notes: meta.note,
    created: row.created || (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
    updated: rowUpdated(row) || Date.now(),
  };
}

function inventoryToDb(r, projectId) {
  return {
    id: r.id,
    project_id: projectId,
    name: r.name,
    quantity: r.quantity,
    status: r.status,
    unit_cost: r.unitCost,
    notes: JSON.stringify({ c: r.category === "capital" ? "capital" : "circulating", n: r.notes || "" }),
  };
}

function normKpi(row) {
  return {
    id: row.id || uid("pk"),
    label: row.label || "Meta",
    target: Number(row.target) || 0,
    current: Number(row.current) || 0,
    unit: row.unit || "",
    created: row.created || (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
    updated: rowUpdated(row) || Date.now(),
  };
}

function kpiToDb(r, projectId) {
  return {
    id: r.id,
    project_id: projectId,
    label: r.label,
    target: r.target,
    current: r.current,
    unit: r.unit || "",
  };
}

async function syncListModule(projectId, module, table, normalize, toDb, fromDb, sortFn) {
  var key = localKey(projectId, module);
  var local = (await readLocal(key, [])).map(normalize);
  var remote = await fetchProjectRows(table, projectId, fromDb);
  var merged = mergeRows(local, remote, normalize);
  if (sortFn) merged = sortFn(merged);
  await writeLocal(key, merged);
  return merged;
}

async function saveListModule(projectId, module, table, rows, normalize, toDb) {
  var key = localKey(projectId, module);
  var normalized = (rows || []).map(normalize);
  await writeLocal(key, normalized);
  pauseCloudPull(6000, table);
  await upsertProjectRows(table, projectId, normalized, toDb);
  return normalized;
}

export async function loadInvestments(projectId) {
  return syncListModule(
    projectId, "investments", TABLES.investments, normInvestment, invToDb, invFromDb,
    function(rows) { return rows.sort(function(a, b) { return b.created - a.created; }); }
  );
}

export async function saveInvestments(projectId, rows) {
  return saveListModule(projectId, "investments", TABLES.investments, rows, normInvestment, invToDb);
}

export function investmentTotals(rows) {
  var injected = 0;
  var returned = 0;
  (rows || []).forEach(function(r) {
    if (r.type === "credit") returned += r.amount;
    else injected += r.amount;
  });
  var net = returned - injected;
  var roi = injected > 0 ? ((returned - injected) / injected) * 100 : 0;
  return { injected: injected, returned: returned, net: net, roi: roi };
}

export async function loadNotes(projectId) {
  var key = localKey(projectId, "notes");
  var localRaw = await readLocal(key, { body: "" });
  var local = typeof localRaw === "string" ? { body: localRaw, updated: 0 } : (localRaw || { body: "" });
  var user = await getUser();
  if (supabase && user) {
    try {
      var res = await supabase.from(TABLES.notes).select("*").eq("user_id", user.id).eq("project_id", projectId).maybeSingle();
      if (!res.error && res.data) {
        var remoteBody = res.data.body || "";
        var remoteUpdated = res.data.updated_at ? new Date(res.data.updated_at).getTime() : 0;
        var localUpdated = local.updated || 0;
        var keepLocal = isCloudPullPaused("project_notes") && localUpdated > remoteUpdated;
        if (!keepLocal) {
          local = { body: remoteBody, updated: remoteUpdated, id: res.data.id };
        }
      }
    } catch (e) {}
  }
  await writeLocal(key, local);
  return { body: local.body || "" };
}

export async function saveNotes(projectId, data) {
  var key = localKey(projectId, "notes");
  var payload = { body: data.body || "", updated: Date.now(), id: projectId + "-notes" };
  await writeLocal(key, payload);
  pauseCloudPull(6000, "project_notes");
  var user = await getUser();
  if (supabase && user) {
    try {
      await supabase.from(TABLES.notes).upsert({
        id: projectId + "-notes",
        user_id: user.id,
        project_id: projectId,
        body: payload.body,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
    } catch (e) {
      console.warn("[Projetos] notas", cloudErrorMessage(e));
    }
  }
}

export async function loadKpis(projectId) {
  return syncListModule(projectId, "kpis", TABLES.kpis, normKpi, kpiToDb, normKpi, null);
}

export async function saveKpis(projectId, rows) {
  return saveListModule(projectId, "kpis", TABLES.kpis, rows, normKpi, kpiToDb);
}

export async function loadInventory(projectId) {
  return syncListModule(
    projectId, "inventory", TABLES.inventory, normInventory, inventoryToDb, normInventory,
    function(rows) { return rows.sort(function(a, b) { return a.name.localeCompare(b.name); }); }
  );
}

export async function saveInventory(projectId, rows) {
  return saveListModule(projectId, "inventory", TABLES.inventory, rows, normInventory, inventoryToDb);
}

export async function pullProjectModules(projectId) {
  await Promise.all([
    loadInvestments(projectId),
    loadNotes(projectId),
    loadKpis(projectId),
    loadInventory(projectId),
    loadStock(projectId),
  ]);
}

export async function deleteProjectModules(projectId) {
  var modules = ["investments", "kpis", "inventory", "notes", "stock"];
  modules.forEach(function(m) {
    try { localStorage.removeItem(localKey(projectId, m)); } catch (e) {}
  });
  var user = await getUser();
  if (!supabase || !user) return;
  var tables = [TABLES.investments, TABLES.kpis, TABLES.inventory, TABLES.notes, TABLES.stock];
  for (var i = 0; i < tables.length; i++) {
    try {
      await supabase.from(tables[i]).delete().eq("user_id", user.id).eq("project_id", projectId);
    } catch (e) {}
  }
}

export function newInvestment(partial) {
  return normInvestment(Object.assign({ type: "debit", amount: 0, title: "" }, partial || {}));
}

export function newInventoryItem(partial) {
  return normInventory(Object.assign({ status: "missing", quantity: 1, category: "circulating" }, partial || {}));
}

export function newKpi(partial) {
  return normKpi(Object.assign({ label: "Nova meta", target: 100, current: 0 }, partial || {}));
}

function pad2(n) {
  return n < 10 ? "0" + n : String(n);
}

function todayKey() {
  var t = new Date();
  return t.getFullYear() + "-" + pad2(t.getMonth() + 1) + "-" + pad2(t.getDate());
}

function emptyStock() {
  return {
    next_id: 1,
    meta_lucro: 0,
    meta_ativa: false,
    meta_data_inicio: todayKey(),
    items: [],
    deleted_ids: [],
    seeded: false,
    updated: Date.now(),
  };
}

function normDeletedIds(src) {
  var seen = {};
  var out = [];
  (src && src.deleted_ids ? src.deleted_ids : []).forEach(function(id) {
    var n = Number(id);
    if (!n || seen[n]) return;
    seen[n] = true;
    out.push(n);
  });
  if (out.length > 800) out = out.slice(-800);
  return out;
}

function normStockItem(row) {
  var status = row.status === "Vendido" || Number(row.venda) > 0 ? "Vendido" : "Disponível";
  var dataCompra = row.data_compra || row.dataCompra || todayKey();
  var dataVenda = row.data_venda || row.dataVenda || null;
  if (status === "Vendido" && !dataVenda) dataVenda = dataCompra;
  return {
    id: Number(row.id) || 0,
    nome: row.nome || row.name || "",
    compra: Number(row.compra != null ? row.compra : row.buy) || 0,
    venda: Number(row.venda != null ? row.venda : row.sell) || 0,
    custo_adicional: Number(row.custo_adicional != null ? row.custo_adicional : row.custoAdicional) || 0,
    status: status,
    data_venda: status === "Vendido" ? dataVenda : null,
    data_compra: dataCompra,
  };
}

export function importStockPayload(raw) {
  var src = raw;
  if (typeof raw === "string") {
    try { src = JSON.parse(raw); } catch (e) { return null; }
  }
  if (!src || typeof src !== "object") return null;
  if (!Array.isArray(src.items)) return null;
  return normStock(src);
}

function normStock(raw) {
  var src = raw && typeof raw === "object" ? raw : emptyStock();
  var items = (src.items || []).map(normStockItem);
  var deletedIds = normDeletedIds(src);
  var deleted = {};
  deletedIds.forEach(function(id) { deleted[id] = true; });
  items = items.filter(function(it) { return it && it.id && !deleted[it.id]; });
  var nextId = Number(src.next_id != null ? src.next_id : src.nextId) || 1;
  items.forEach(function(it) { if (it.id >= nextId) nextId = it.id + 1; });
  deletedIds.forEach(function(id) { if (id >= nextId) nextId = id + 1; });
  var metaLucro = Number(src.meta_lucro != null ? src.meta_lucro : src.metaLucro) || 0;
  var metaAtiva = src.meta_ativa != null ? !!src.meta_ativa : src.metaAtiva != null ? !!src.metaAtiva : metaLucro > 0;
  return {
    next_id: nextId,
    meta_lucro: metaLucro,
    meta_ativa: metaAtiva,
    meta_data_inicio: src.meta_data_inicio || src.metaDataInicio || todayKey(),
    items: items,
    deleted_ids: deletedIds,
    seeded: !!src.seeded,
    updated: Number(src.updated) || (src.updated_at ? new Date(src.updated_at).getTime() : Date.now()),
  };
}

function stockFingerprint(data) {
  return (data && data.items ? data.items : []).map(function(i) {
    return i.id + ":" + i.status + ":" + (Number(i.venda) || 0);
  }).sort().join("|");
}

function parseRemoteStockRow(row) {
  if (!row) return null;
  var parsed = {};
  try { parsed = JSON.parse(row.body || "{}"); } catch (e) { parsed = {}; }
  var updated = Math.max(
    row.updated_at ? new Date(row.updated_at).getTime() : 0,
    Number(parsed.updated) || 0
  );
  var data = normStock(Object.assign({}, parsed, { seeded: true, updated: updated }));
  data._rowId = row.id;
  return data;
}

function soldCount(data) {
  return (data.items || []).filter(function(i) { return i.status === "Vendido"; }).length;
}

function isStockSeed(data) {
  var seedItems = STOCK_HISTORY_SEED.items || [];
  if (!data || !data.items || data.items.length !== seedItems.length) return false;
  var seedIds = {};
  seedItems.forEach(function(it) { seedIds[it.id] = true; });
  return data.items.every(function(it) { return seedIds[it.id]; });
}

function pickPrimaryStock(blobs) {
  return blobs.slice().sort(function(a, b) {
    var ds = soldCount(b) - soldCount(a);
    if (ds) return ds;
    var aSeed = isStockSeed(a) ? 1 : 0;
    var bSeed = isStockSeed(b) ? 1 : 0;
    if (aSeed !== bSeed) return aSeed - bSeed;
    var di = (b.items || []).length - (a.items || []).length;
    if (di) return di;
    return (b.updated || 0) - (a.updated || 0);
  })[0];
}

function pickStockItem(a, b) {
  var aSold = a.status === "Vendido";
  var bSold = b.status === "Vendido";
  if (bSold && !aSold) return b;
  if (aSold && !bSold) return a;
  if ((Number(b.venda) || 0) !== (Number(a.venda) || 0)) {
    return (Number(b.venda) || 0) > (Number(a.venda) || 0) ? b : a;
  }
  if ((b.data_venda || "") !== (a.data_venda || "")) {
    return (b.data_venda || "") > (a.data_venda || "") ? b : a;
  }
  return b;
}

function mergeStockBlobs(blobs) {
  blobs = (blobs || []).filter(function(b) { return b && Array.isArray(b.items); });
  if (!blobs.length) return emptyStock();
  var primary = pickPrimaryStock(blobs);
  var deleted = {};
  blobs.forEach(function(blob) {
    (blob.deleted_ids || []).forEach(function(id) { deleted[id] = true; });
  });
  var map = {};
  (primary.items || []).forEach(function(it) {
    if (it && it.id && !deleted[it.id]) map[it.id] = it;
  });
  blobs.forEach(function(blob) {
    var fromSeed = isStockSeed(blob) && !isStockSeed(primary);
    (blob.items || []).forEach(function(it) {
      if (!it || !it.id || deleted[it.id]) return;
      var ex = map[it.id];
      if (!ex) {
        if (it.status === "Vendido" || !fromSeed) map[it.id] = it;
        return;
      }
      map[it.id] = pickStockItem(ex, it);
    });
  });
  var items = Object.keys(map).map(function(k) { return map[k]; });
  var nextId = 1;
  blobs.forEach(function(b) { if ((Number(b.next_id) || 1) > nextId) nextId = Number(b.next_id); });
  items.forEach(function(it) { if (it.id >= nextId) nextId = it.id + 1; });
  var newestMeta = blobs.slice().sort(function(a, b) { return (b.updated || 0) - (a.updated || 0); })[0];
  var merged = normStock({
    next_id: nextId,
    meta_lucro: newestMeta.meta_lucro,
    meta_ativa: newestMeta.meta_ativa,
    meta_data_inicio: newestMeta.meta_data_inicio,
    items: items,
    deleted_ids: Object.keys(deleted).map(function(id) { return Number(id); }),
    seeded: true,
    updated: Math.max.apply(null, blobs.map(function(b) { return b.updated || 0; })),
  });
  merged._rowId = primary._rowId || newestMeta._rowId;
  return merged;
}

function stockBody(payload) {
  var copy = Object.assign({}, payload);
  delete copy._rowId;
  return JSON.stringify(copy);
}

export async function loadStock(projectId) {
  var key = localKey(projectId, "stock");
  var local = normStock(await readLocal(key, emptyStock()));
  var remoteBlobs = [];
  var fetchOk = false;
  var user = await getUser();
  if (supabase && user) {
    try {
      var res = await supabase.from(TABLES.stock).select("*").eq("user_id", user.id).eq("project_id", projectId);
      if (res.error) throw res.error;
      fetchOk = true;
      (res.data || []).forEach(function(row) {
        var parsed = parseRemoteStockRow(row);
        if (parsed) remoteBlobs.push(parsed);
      });
    } catch (e) {
      console.warn("[Projetos] stock leitura", cloudErrorMessage(e));
    }
  }

  local = normStock(await readLocal(key, emptyStock()));
  if (isCloudPullPaused("project_stock")) return local;

  var merged = local;
  if (remoteBlobs.length) {
    merged = mergeStockBlobs([local].concat(remoteBlobs));
  } else if (fetchOk && !local.items.length && !local.seeded) {
    var seeded = importStockPayload(Object.assign({}, STOCK_HISTORY_SEED, { seeded: true, meta_ativa: true }));
    if (seeded && seeded.items.length) {
      merged = seeded;
      await writeLocal(key, merged);
      return merged;
    }
  }

  var latest = normStock(await readLocal(key, emptyStock()));
  if (isCloudPullPaused("project_stock") || (latest.updated || 0) > (local.updated || 0)) {
    return latest;
  }

  await writeLocal(key, merged);

  if (isCloudPullPaused("project_stock")) {
    return normStock(await readLocal(key, emptyStock()));
  }

  if (fetchOk && remoteBlobs.length && stockFingerprint(merged) !== stockFingerprint(pickPrimaryStock(remoteBlobs))) {
    saveStock(projectId, merged).catch(function() {});
  } else if (fetchOk && !remoteBlobs.length && (merged.items || []).length && !isStockSeed(merged)) {
    saveStock(projectId, merged).catch(function() {});
  }

  return merged;
}

export async function saveStock(projectId, data) {
  var key = localKey(projectId, "stock");
  pauseCloudPull(8000, "project_stock");
  var payload = normStock(Object.assign({}, data, { updated: Date.now(), seeded: true }));
  payload._rowId = data && data._rowId;
  await writeLocal(key, payload);

  var session = await ensureWriteSession();
  if (!supabase || !session.canWriteCloud || !session.user) return payload;

  try {
    var existing = await supabase.from(TABLES.stock).select("id,updated_at").eq("user_id", session.user.id).eq("project_id", projectId);
    if (existing.error) throw existing.error;
    var ids = ((existing.data || []).map(function(r) { return r.id; })).filter(Boolean);
    var rowId = ids[0] || payload._rowId || (projectId + "-stock");
    var upsert = await supabase.from(TABLES.stock).upsert({
      id: rowId,
      user_id: session.user.id,
      project_id: projectId,
      body: stockBody(payload),
      updated_at: new Date(payload.updated).toISOString(),
    }, { onConflict: "id" });
    if (upsert.error) throw upsert.error;
    payload._rowId = rowId;
    var extras = ids.filter(function(id) { return id !== rowId; });
    if (extras.length) {
      await supabase.from(TABLES.stock).delete().eq("user_id", session.user.id).in("id", extras);
    }
  } catch (e) {
    console.warn("[Projetos] stock", cloudErrorMessage(e));
  }
  return payload;
}

export function stockItemProfit(item) {
  return (Number(item.venda) || 0) - (Number(item.compra) || 0) - (Number(item.custo_adicional) || 0);
}

export function stockStats(data) {
  var items = (data && data.items) || [];
  var vendidos = items.filter(function(i) { return i.status === "Vendido"; });
  var disponiveis = items.filter(function(i) { return i.status === "Disponível"; });
  var totalFaturado = vendidos.reduce(function(s, i) { return s + (Number(i.venda) || 0); }, 0);
  var custoCompraVendidos = vendidos.reduce(function(s, i) { return s + (Number(i.compra) || 0); }, 0);
  var extrasVendidos = vendidos.reduce(function(s, i) { return s + (Number(i.custo_adicional) || 0); }, 0);
  var extrasTotais = items.reduce(function(s, i) { return s + (Number(i.custo_adicional) || 0); }, 0);
  var lucroTotal = totalFaturado - custoCompraVendidos - extrasVendidos;
  var mediaLucro = vendidos.length ? lucroTotal / vendidos.length : 0;
  var margemMedia = totalFaturado > 0 ? (lucroTotal / totalFaturado) * 100 : 0;
  var meta = Number(data && data.meta_lucro) || 0;
  var metaAtiva = !!(data && data.meta_ativa && meta > 0);
  var percentagem = metaAtiva && meta > 0 ? Math.min((lucroTotal / meta) * 100, 100) : 0;
  var inicio = (data && data.meta_data_inicio) || todayKey();
  var dias = Math.max(0, Math.floor((Date.now() - new Date(inicio + "T00:00:00").getTime()) / 86400000));
  var capitalAtivo = disponiveis.reduce(function(s, i) { return s + (Number(i.compra) || 0); }, 0);
  return {
    items: items.length,
    disponiveis: disponiveis.length,
    vendidos: vendidos.length,
    totalFaturado: totalFaturado,
    lucroTotal: lucroTotal,
    mediaLucro: mediaLucro,
    margemMedia: margemMedia,
    extrasTotais: extrasTotais,
    capitalAtivo: capitalAtivo,
    meta: meta,
    metaAtiva: metaAtiva,
    percentagem: percentagem,
    inicio: inicio,
    dias: dias,
  };
}

function localKeyFromDate(d) {
  if (!d || isNaN(d.getTime())) return "";
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

function itemDayKey(raw) {
  if (raw == null || raw === "") return "";
  if (typeof raw === "number" && isFinite(raw)) return localKeyFromDate(new Date(raw));
  var s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return localKeyFromDate(new Date(Date.parse(s)));
}

export function stockItemPurchaseDay(item) {
  return itemDayKey(item && (item.data_compra || item.dataCompra)) || "";
}

export function stockItemSaleDay(item) {
  return itemDayKey(item && (item.data_venda || item.dataVenda)) || stockItemPurchaseDay(item);
}

function mondaySundayRange(now) {
  now = now || new Date();
  var dow = (now.getDay() + 6) % 7;
  var mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow);
  var sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
  return { start: localKeyFromDate(mon), end: localKeyFromDate(sun) };
}

function dayInRange(day, start, end) {
  return !!day && day >= start && day <= end;
}

function compareDayDesc(a, b) {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a > b ? -1 : 1;
}

export function sortStockByPurchaseDate(items) {
  return (items || []).slice().sort(function(a, b) {
    var byDay = compareDayDesc(stockItemPurchaseDay(a), stockItemPurchaseDay(b));
    if (byDay) return byDay;
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });
}

export function sortStockBySaleDate(items) {
  return (items || []).slice().sort(function(a, b) {
    var byDay = compareDayDesc(stockItemSaleDay(a), stockItemSaleDay(b));
    if (byDay) return byDay;
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });
}

export function stockThisWeek(data, now) {
  var range = mondaySundayRange(now);
  var items = (data && data.items) || [];
  var lucro = 0;
  var vendas = 0;
  var compras = 0;
  var nVendas = 0;
  var nCompras = 0;
  items.forEach(function(item) {
    if (dayInRange(stockItemPurchaseDay(item), range.start, range.end)) {
      compras += Number(item.compra) || 0;
      nCompras += 1;
    }
    if (item.status === "Vendido" && dayInRange(stockItemSaleDay(item), range.start, range.end)) {
      vendas += Number(item.venda) || 0;
      lucro += stockItemProfit(item);
      nVendas += 1;
    }
  });
  return {
    start: range.start,
    end: range.end,
    lucro: lucro,
    vendas: vendas,
    compras: compras,
    nVendas: nVendas,
    nCompras: nCompras,
  };
}

function weekKeyFromDate(dateStr) {
  try {
    var dt = new Date(dateStr + "T12:00:00");
    if (isNaN(dt.getTime())) return "Outros";
    var jan1 = new Date(dt.getFullYear(), 0, 1);
    var days = Math.floor((dt - jan1) / 86400000);
    var week = Math.floor((days + jan1.getDay()) / 7);
    var ww = week < 10 ? "0" + week : String(week);
    return "Sem " + ww + "/" + dt.getFullYear();
  } catch (e) {
    return "Outros";
  }
}

export function stockWeeklySeries(data) {
  var items = (data && data.items) || [];
  var lucroPorSemana = {};
  var comprasPorSemana = {};
  items.forEach(function(item) {
    if (item.status === "Vendido" && item.data_venda) {
      var sk = weekKeyFromDate(item.data_venda);
      lucroPorSemana[sk] = (lucroPorSemana[sk] || 0) + stockItemProfit(item);
    }
    var ck = weekKeyFromDate(item.data_compra || todayKey());
    comprasPorSemana[ck] = (comprasPorSemana[ck] || 0) + 1;
  });
  var semanas = Object.keys(lucroPorSemana).concat(Object.keys(comprasPorSemana)).filter(function(v, i, a) { return a.indexOf(v) === i; });
  semanas.sort(function(a, b) {
    function parts(s) {
      var m = String(s).match(/(\d+)\s*\/\s*(\d+)/);
      return m ? [Number(m[2]), Number(m[1])] : [0, 0];
    }
    var pa = parts(a), pb = parts(b);
    return pa[0] !== pb[0] ? pa[0] - pb[0] : pa[1] - pb[1];
  });
  if (!semanas.length) semanas = ["Semana Atual"];
  return {
    labels: semanas,
    lucros: semanas.map(function(s) { return lucroPorSemana[s] || 0; }),
    compras: semanas.map(function(s) { return comprasPorSemana[s] || 0; }),
  };
}
