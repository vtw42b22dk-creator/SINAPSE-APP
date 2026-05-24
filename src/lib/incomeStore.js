import { fetchRemoteRows, mergePullFromRemote, readLocal, replaceRows, uid, writeLocal } from "./cloudStore";
import { todayKey } from "./financeStore";

var TABLE = "incomes";
var KEY = "incomes-v1";
var CAT_TABLE = "income_categories";
var CAT_KEY = "income-categories-v1";
var DEFAULT_CATEGORIES = ["Salário", "Freelance", "Investimentos", "Reembolsos", "Outro"];

function normCat(r) {
  return { id: r.id || uid("ic"), name: r.name || "Outro", order_index: r.order_index != null ? r.order_index : 0 };
}

function normalize(row) {
  var cats = row.categories;
  if (!cats || !cats.length) cats = row.category ? [row.category] : ["Outro"];
  if (typeof cats === "string") {
    try { cats = JSON.parse(cats); } catch (e) { cats = [cats]; }
  }
  cats = (cats || []).slice(0, 2);
  return {
    id: row.id || uid("in"),
    title: row.title || "",
    amount: row.amount != null ? Number(row.amount) : 0,
    categories: cats,
    category: cats[0] || "Outro",
    day: row.day || row.day_key || todayKey(),
    notes: row.notes || "",
    created: row.created || row.created_at || Date.now(),
  };
}

function toDb(row) {
  var cats = (row.categories || [row.category || "Outro"]).slice(0, 2);
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    category: cats.join(" · "),
    categories: cats,
    day_key: row.day,
    notes: row.notes || "",
  };
}

function defaultCategories() {
  return DEFAULT_CATEGORIES.map(function(name, i) {
    return { id: uid("ic"), name: name, order_index: i };
  });
}

export async function loadCategories() {
  var local = await readLocal(CAT_KEY, []);
  if (local.length) {
    return local.slice().sort(function(a, b) { return (a.order_index || 0) - (b.order_index || 0); });
  }
  var rows = defaultCategories();
  await writeLocal(CAT_KEY, rows);
  saveCategories(rows).catch(function() {});
  return rows;
}

export async function saveCategories(categories) {
  if (!categories || !categories.length) return { ok: true, cloud: true, rows: [], skippedEmpty: true };
  return replaceRows(CAT_TABLE, CAT_KEY, (categories || []).map(function(c) {
    return { id: c.id, name: c.name, order_index: c.order_index || 0 };
  }), { pruneOrphans: true });
}

export async function pullIncomes() {
  var remote = [];
  try {
    remote = await fetchRemoteRows(TABLE, normalize);
  } catch (e) {
    return loadIncomes();
  }
  var local = await readLocal(KEY, []);
  var merged = mergePullFromRemote(local, remote);
  await writeLocal(KEY, merged);
  return merged.sort(function(a, b) {
    return b.day.localeCompare(a.day) || (b.created || 0) - (a.created || 0);
  });
}

export async function pullCategories() {
  var remote = [];
  try {
    remote = await fetchRemoteRows(CAT_TABLE, normCat);
  } catch (e) {
    return loadCategories();
  }
  var local = await readLocal(CAT_KEY, []);
  var merged = mergePullFromRemote(local, remote);
  if (!merged.length) return loadCategories();
  await writeLocal(CAT_KEY, merged);
  return merged.slice().sort(function(a, b) { return (a.order_index || 0) - (b.order_index || 0); });
}

export async function loadIncomes() {
  var local = await readLocal(KEY, []);
  return (local || []).map(normalize).sort(function(a, b) {
    return b.day.localeCompare(a.day) || (b.created || 0) - (a.created || 0);
  });
}

export async function saveIncomes(rows) {
  if (!rows || !rows.length) return { ok: true, cloud: true, rows: [], skippedEmpty: true };
  return replaceRows(TABLE, KEY, (rows || []).map(toDb), { pruneOrphans: true });
}

export function newIncome(title, amount, categories, day) {
  var cats = (categories || ["Outro"]).slice(0, 2);
  return normalize({
    id: uid("in"),
    title: title || "",
    amount: amount || 0,
    categories: cats,
    day: day || todayKey(),
    created: Date.now(),
  });
}

export function newCategory(name) {
  return { id: uid("ic"), name: name || "Nova categoria", order_index: Date.now() };
}

export function monthTotal(incomes, monthKey) {
  return (incomes || []).filter(function(e) {
    return e.day && e.day.indexOf(monthKey) === 0;
  }).reduce(function(sum, e) { return sum + (Number(e.amount) || 0); }, 0);
}
