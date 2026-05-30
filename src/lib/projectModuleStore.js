/* eslint-disable no-unused-vars, no-empty */
import { readLocal, writeLocal, uid, getUser, cloudErrorMessage } from "./cloudStore";
import { supabase } from "./supabase";

var PREFIX = "project-module-v1";
var TABLES = {
  investments: "project_investments",
  kpis: "project_kpis",
  inventory: "project_inventory",
  notes: "project_notes",
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
    if (!ex || rowUpdated(n) >= rowUpdated(ex)) map[n.id] = n;
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
      return Object.assign({}, toDb(r, projectId), {
        user_id: user.id,
        updated_at: new Date().toISOString(),
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
        if (remoteUpdated >= localUpdated) {
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
  ]);
}

export async function deleteProjectModules(projectId) {
  var modules = ["investments", "kpis", "inventory", "notes"];
  modules.forEach(function(m) {
    try { localStorage.removeItem(localKey(projectId, m)); } catch (e) {}
  });
  var user = await getUser();
  if (!supabase || !user) return;
  var tables = [TABLES.investments, TABLES.kpis, TABLES.inventory, TABLES.notes];
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
