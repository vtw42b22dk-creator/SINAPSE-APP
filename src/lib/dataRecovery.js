import {
  clearLocalDeleted,
  fetchRemoteRows,
  forceWriteLocal,
  readLocal,
  restoreFromBackups,
  uid,
} from "./cloudStore";
import { markJustRecovered } from "./recoveryFlags";
import * as journalStore from "./journalStore";
import * as wishlistStore from "./wishlistStore";
import * as financeStore from "./financeStore";
import * as incomeStore from "./incomeStore";

function fmt(r) {
  if (!r || !r.ok) return (r && r.reason) || "nada";
  return r.count + " (" + (r.source || "ok") + ")";
}

async function restoreTableFromCloud(table, localKey, normalizeFn) {
  try {
    var remote = await fetchRemoteRows(table, normalizeFn);
    if (!remote.length) return { ok: false, reason: "Nuvem vazia" };
    var wrote = await forceWriteLocal(localKey, remote);
    if (!wrote.ok) return { ok: false, reason: wrote.error || "Falha ao gravar nuvem" };
    return { ok: true, count: wrote.count, source: "nuvem" };
  } catch (e) {
    return { ok: false, reason: e.message || String(e) };
  }
}

function reconcileJournalSpaces(spaces, blocks) {
  spaces = (spaces || []).slice();
  blocks = (blocks || []).slice();
  var ids = {};
  spaces.forEach(function(s) {
    if (s && s.id) ids[s.id] = true;
  });
  blocks.forEach(function(b) {
    if (!b || !b.space_id || ids[b.space_id]) return;
    spaces.push({
      id: b.space_id,
      title: "Recuperado",
      color: "#FFB800",
      updated: Date.now(),
    });
    ids[b.space_id] = true;
  });
  if (!spaces.length && blocks.length) {
    var sid = uid("js");
    spaces.push({ id: sid, title: "Recuperado", color: "#FFB800", updated: Date.now() });
    blocks = blocks.map(function(b) {
      return Object.assign({}, b, { space_id: sid });
    });
  }
  return { spaces: spaces, blocks: blocks };
}

function reconcileWishlistGroups(groups, items) {
  groups = (groups || []).slice();
  items = (items || []).slice();
  var ids = {};
  groups.forEach(function(g) {
    if (g && g.id) ids[g.id] = true;
  });
  items.forEach(function(it) {
    if (!it || !it.group_id || ids[it.group_id]) return;
    groups.push({
      id: it.group_id,
      name: "Recuperado",
      color: "#34D399",
      order_index: groups.length,
      updated: Date.now(),
    });
    ids[it.group_id] = true;
  });
  if (!groups.length && items.length) {
    var gid = uid("wg");
    groups.push({ id: gid, name: "Recuperado", color: "#34D399", order_index: 0, updated: Date.now() });
    items = items.map(function(it) {
      return Object.assign({}, it, { group_id: gid });
    });
  }
  return { groups: groups, items: items };
}

async function finalizeJournalRestore() {
  await clearLocalDeleted("journal-spaces-v1");
  await clearLocalDeleted("journal-blocks-v1");
  var spaces = await readLocal("journal-spaces-v1", []);
  var blocks = await readLocal("journal-blocks-v1", []);
  var fixed = reconcileJournalSpaces(spaces, blocks);
  await forceWriteLocal("journal-spaces-v1", fixed.spaces);
  await forceWriteLocal("journal-blocks-v1", fixed.blocks);
  try {
    await journalStore.saveAll(fixed.spaces, fixed.blocks);
  } catch (e) {}
  return fixed;
}

async function finalizeWishlistRestore() {
  await clearLocalDeleted("wishlist-groups-v1");
  await clearLocalDeleted("wishlist-items-v1");
  var groups = await readLocal("wishlist-groups-v1", []);
  var items = await readLocal("wishlist-items-v1", []);
  var fixed = reconcileWishlistGroups(groups, items);
  await forceWriteLocal("wishlist-groups-v1", fixed.groups);
  await forceWriteLocal("wishlist-items-v1", fixed.items);
  try {
    await wishlistStore.persistAll(fixed.groups, fixed.items);
  } catch (e) {}
  return fixed;
}

export async function recoverJournal() {
  var backupBlocks = await restoreFromBackups("journal-blocks-v1");
  var backupSpaces = await restoreFromBackups("journal-spaces-v1");
  var cloudBlocks = await restoreTableFromCloud("journal_blocks", "journal-blocks-v1", null);
  var cloudSpaces = await restoreTableFromCloud("journal_spaces", "journal-spaces-v1", null);
  var fixed = await finalizeJournalRestore();
  markJustRecovered();
  return {
    backupBlocks: backupBlocks,
    backupSpaces: backupSpaces,
    cloudBlocks: cloudBlocks,
    cloudSpaces: cloudSpaces,
    applied: { spaces: fixed.spaces.length, blocks: fixed.blocks.length },
    summary:
      "Textos: " + fmt(backupBlocks) + " · Temas: " + fmt(backupSpaces) +
      " · Nuvem: " + fmt(cloudBlocks) + "/" + fmt(cloudSpaces) +
      " · Aplicado: " + fixed.blocks.length + " textos, " + fixed.spaces.length + " temas. Abre o Diário.",
  };
}

export async function recoverWishlist() {
  var backupItems = await restoreFromBackups("wishlist-items-v1");
  var backupGroups = await restoreFromBackups("wishlist-groups-v1");
  var cloudItems = await restoreTableFromCloud("wishlist_items", "wishlist-items-v1", null);
  var cloudGroups = await restoreTableFromCloud("wishlist_groups", "wishlist-groups-v1", null);
  var fixed = await finalizeWishlistRestore();
  markJustRecovered();
  return {
    backupItems: backupItems,
    backupGroups: backupGroups,
    cloudItems: cloudItems,
    cloudGroups: cloudGroups,
    applied: { groups: fixed.groups.length, items: fixed.items.length },
    summary:
      "Itens: " + fmt(backupItems) + " · Grupos: " + fmt(backupGroups) +
      " · Nuvem: " + fmt(cloudItems) + "/" + fmt(cloudGroups) +
      " · Aplicado: " + fixed.items.length + " itens. Abre a Wishlist.",
  };
}

export async function recoverFinance() {
  var backupCats = await restoreFromBackups("finance-categories-v1");
  var backupExp = await restoreFromBackups("expenses-v1");
  var backupIncCats = await restoreFromBackups("income-categories-v1");
  var backupInc = await restoreFromBackups("incomes-v1");
  var cloudCats = await restoreTableFromCloud("finance_categories", "finance-categories-v1", null);
  var cloudExp = await restoreTableFromCloud("expenses", "expenses-v1", null);
  var cloudIncCats = await restoreTableFromCloud("income_categories", "income-categories-v1", null);
  var cloudInc = await restoreTableFromCloud("incomes", "incomes-v1", null);
  await clearLocalDeleted("finance-categories-v1");
  await clearLocalDeleted("expenses-v1");
  await clearLocalDeleted("income-categories-v1");
  await clearLocalDeleted("incomes-v1");
  var cats = await readLocal("finance-categories-v1", []);
  var exp = await readLocal("expenses-v1", []);
  if (cats.length) await forceWriteLocal("finance-categories-v1", cats);
  if (exp.length) await forceWriteLocal("expenses-v1", exp);
  try {
    if (cats.length) await financeStore.saveCategories(cats);
    if (exp.length) await financeStore.saveExpenses(exp);
  } catch (e) {}
  var incCats = await readLocal("income-categories-v1", []);
  var inc = await readLocal("incomes-v1", []);
  if (incCats.length) await forceWriteLocal("income-categories-v1", incCats);
  if (inc.length) await forceWriteLocal("incomes-v1", inc);
  try {
    if (incCats.length) await incomeStore.saveCategories(incCats);
    if (inc.length) await incomeStore.saveIncomes(inc);
  } catch (e) {}
  markJustRecovered();
  return {
    backupCats: backupCats,
    backupExp: backupExp,
    cloudCats: cloudCats,
    cloudExp: cloudExp,
    summary:
      "Gastos: " + fmt(backupExp) + " · Cat.: " + fmt(backupCats) +
      " · Receitas: " + fmt(backupInc) +
      " · Aplicado: " + exp.length + " gastos. Abre o Financeiro.",
  };
}

export async function recoverAll() {
  var j = await recoverJournal();
  var w = await recoverWishlist();
  var f = await recoverFinance();
  markJustRecovered();
  return { journal: j, wishlist: w, finance: f };
}
