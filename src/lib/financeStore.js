import {
  deleteRemoteIds,
  fetchRemoteRows,
  mergePullFromRemoteAsync,
  readLocal,
  replaceRows,
  safeWriteLocal,
  uid,
  writeLocal,
} from "./cloudStore";

var EXPENSE_TABLE = "expenses";
var EXPENSE_KEY = "expenses-v1";
var CAT_TABLE = "finance_categories";
var CAT_KEY = "finance-categories-v1";
var CAT_SEED_KEY = "finance-categories-seeded-v1";
var DEFAULT_CATEGORIES = ["Alimentação", "Casa", "Transportes", "Saúde", "Lazer", "Compras", "Subscrições", "Outro"];

function pad(n) { return n < 10 ? "0" + n : "" + n; }

export function todayKey() {
  var t = new Date();
  return t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate());
}

function sortCats(rows) {
  return (rows || []).slice().sort(function(a, b) { return (a.order_index || 0) - (b.order_index || 0); });
}

function normCat(r) {
  return {
    id: r.id || uid("fc"),
    name: r.name || "Outro",
    order_index: r.order_index != null ? r.order_index : 0,
    updated: r.updated || r.updated_at || Date.now(),
  };
}

function normalize(row) {
  var cats = row.categories;
  if (!cats || !cats.length) {
    cats = row.category ? [row.category] : ["Outro"];
  }
  if (typeof cats === "string") {
    try { cats = JSON.parse(cats); } catch (e) { cats = [cats]; }
  }
  cats = (cats || []).slice(0, 2);
  return {
    id: row.id || uid("ex"),
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

function catToDb(c) {
  return {
    id: c.id,
    name: c.name,
    order_index: c.order_index || 0,
    updated: c.updated || Date.now(),
  };
}

/** IDs fixos — evita “categorias aleatórias” ao reabrir a app. */
function defaultCategories() {
  return DEFAULT_CATEGORIES.map(function(name, i) {
    return {
      id: "fc-def-" + i,
      name: name,
      order_index: i,
      updated: Date.now(),
    };
  });
}

export async function loadCategoriesLocal() {
  var local = await readLocal(CAT_KEY, []);
  return sortCats(local);
}

async function seedDefaultsOnce() {
  var rows = defaultCategories();
  await writeLocal(CAT_KEY, rows);
  try { await writeLocal(CAT_SEED_KEY, true); } catch (e) {}
  saveCategories(rows).catch(function() {});
  return rows;
}

/** Só cria lista predefinida se não há nada local nem na nuvem. */
export async function ensureCategories() {
  var local = await readLocal(CAT_KEY, []);
  if (local.length) return sortCats(local);
  try {
    var remote = await fetchRemoteRows(CAT_TABLE, normCat);
    if (remote.length) {
      await writeLocal(CAT_KEY, remote);
      return sortCats(remote);
    }
  } catch (e) {}
  return seedDefaultsOnce();
}

export async function loadCategories() {
  var local = await loadCategoriesLocal();
  if (local.length) return local;
  return ensureCategories();
}

export async function saveCategories(categories) {
  if (!categories || !categories.length) return { ok: true, cloud: true, rows: [], skippedEmpty: true };
  return replaceRows(CAT_TABLE, CAT_KEY, (categories || []).map(catToDb), { pruneOrphans: true });
}

export async function deleteCategory(categoryId) {
  if (!categoryId) return { ok: true };
  return deleteRemoteIds(CAT_TABLE, [categoryId], CAT_KEY);
}

export async function pullExpenses() {
  try {
    var remote = await fetchRemoteRows(EXPENSE_TABLE, normalize);
    var local = await readLocal(EXPENSE_KEY, []);
    var merged = await mergePullFromRemoteAsync(local, remote, EXPENSE_KEY);
    await safeWriteLocal(EXPENSE_KEY, merged, local);
    return merged.sort(function(a, b) {
      return b.day.localeCompare(a.day) || (b.created || 0) - (a.created || 0);
    });
  } catch (e) {
    return loadExpenses();
  }
}

export async function pullCategories() {
  try {
    var local = await readLocal(CAT_KEY, []);
    var remote = await fetchRemoteRows(CAT_TABLE, normCat);
    var merged = await mergePullFromRemoteAsync(local, remote, CAT_KEY);
    if (!merged.length && local.length) merged = local;
    if (!merged.length) merged = await ensureCategories();
    await safeWriteLocal(CAT_KEY, merged, local);
    return sortCats(merged);
  } catch (e) {
    var local = await loadCategoriesLocal();
    return local.length ? local : ensureCategories();
  }
}

export async function loadExpenses() {
  var local = await readLocal(EXPENSE_KEY, []);
  return (local || []).map(normalize).sort(function(a, b) {
    return b.day.localeCompare(a.day) || (b.created || 0) - (a.created || 0);
  });
}

export async function saveExpenses(rows) {
  if (!rows || !rows.length) return { ok: true, cloud: true, rows: [], skippedEmpty: true };
  return replaceRows(EXPENSE_TABLE, EXPENSE_KEY, (rows || []).map(toDb), { pruneOrphans: true });
}

export async function deleteExpense(id) {
  if (!id) return { ok: true };
  return deleteRemoteIds(EXPENSE_TABLE, [id], EXPENSE_KEY);
}

export function newExpense(title, amount, categories, day) {
  var cats = (categories || ["Outro"]).slice(0, 2);
  return normalize({
    id: uid("ex"),
    title: title || "",
    amount: amount || 0,
    categories: cats,
    day: day || todayKey(),
    created: Date.now(),
  });
}

export function newCategory(name) {
  return {
    id: uid("fc"),
    name: name || "Nova categoria",
    order_index: Math.floor(Date.now() / 1000),
    updated: Date.now(),
  };
}

export function monthTotal(expenses, monthKey) {
  return (expenses || []).filter(function(e) {
    return e.day && e.day.indexOf(monthKey) === 0;
  }).reduce(function(sum, e) { return sum + (Number(e.amount) || 0); }, 0);
}
