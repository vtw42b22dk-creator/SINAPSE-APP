import { fetchRemoteRows, restoreFromBackups, writeLocal } from "./cloudStore";

export async function restoreTableFromCloud(table, localKey, normalizeFn) {
  try {
    var remote = await fetchRemoteRows(table, normalizeFn);
    if (!remote.length) return { ok: false, reason: "Nuvem vazia" };
    await writeLocal(localKey, remote);
    return { ok: true, count: remote.length, source: "nuvem" };
  } catch (e) {
    return { ok: false, reason: e.message || String(e) };
  }
}

function fmt(r) {
  if (!r || !r.ok) return (r && r.reason) || "nada";
  return r.count + " (" + (r.source || "ok") + ")";
}

export async function recoverJournal() {
  var backupBlocks = await restoreFromBackups("journal-blocks-v1");
  var backupSpaces = await restoreFromBackups("journal-spaces-v1");
  var cloudBlocks = await restoreTableFromCloud("journal_blocks", "journal-blocks-v1", null);
  var cloudSpaces = await restoreTableFromCloud("journal_spaces", "journal-spaces-v1", null);
  return {
    backupBlocks: backupBlocks,
    backupSpaces: backupSpaces,
    cloudBlocks: cloudBlocks,
    cloudSpaces: cloudSpaces,
    summary: "Backup textos: " + fmt(backupBlocks) + " · Backup temas: " + fmt(backupSpaces) + " · Nuvem textos: " + fmt(cloudBlocks) + " · Nuvem temas: " + fmt(cloudSpaces),
  };
}

export async function recoverWishlist() {
  var backupItems = await restoreFromBackups("wishlist-items-v1");
  var backupGroups = await restoreFromBackups("wishlist-groups-v1");
  var cloudItems = await restoreTableFromCloud("wishlist_items", "wishlist-items-v1", null);
  var cloudGroups = await restoreTableFromCloud("wishlist_groups", "wishlist-groups-v1", null);
  return {
    backupItems: backupItems,
    backupGroups: backupGroups,
    cloudItems: cloudItems,
    cloudGroups: cloudGroups,
    summary: "Backup itens: " + fmt(backupItems) + " · Backup grupos: " + fmt(backupGroups) + " · Nuvem: " + fmt(cloudItems) + " / " + fmt(cloudGroups),
  };
}

export async function recoverFinance() {
  var backupCats = await restoreFromBackups("finance-categories-v1");
  var backupExp = await restoreFromBackups("expenses-v1");
  var cloudCats = await restoreTableFromCloud("finance_categories", "finance-categories-v1", null);
  var cloudExp = await restoreTableFromCloud("expenses", "expenses-v1", null);
  return {
    backupCats: backupCats,
    backupExp: backupExp,
    cloudCats: cloudCats,
    cloudExp: cloudExp,
    summary: "Backup cat.: " + fmt(backupCats) + " · Backup gastos: " + fmt(backupExp) + " · Nuvem: " + fmt(cloudCats) + " / " + fmt(cloudExp),
  };
}

export async function recoverAll() {
  var j = await recoverJournal();
  var w = await recoverWishlist();
  var f = await recoverFinance();
  return { journal: j, wishlist: w, finance: f };
}
