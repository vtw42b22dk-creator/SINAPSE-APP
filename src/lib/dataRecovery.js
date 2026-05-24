import { clearLocalDeleted, fetchRemoteRows, getUser, readLocal, writeLocal } from "./cloudStore";

/** Procura cópias antigas no browser (várias chaves / utilizadores). */
export function findLocalSnapshots(baseKey) {
  var out = [];
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf(baseKey) < 0) continue;
      try {
        var data = JSON.parse(localStorage.getItem(k) || "null");
        if (Array.isArray(data) && data.length) {
          out.push({ storageKey: k, count: data.length, data: data });
        }
      } catch (e) {}
    }
  } catch (e) {}
  out.sort(function(a, b) { return b.count - a.count; });
  return out;
}

export async function restoreSnapshotToKey(localKey, snapshot) {
  if (!snapshot || !snapshot.data || !snapshot.data.length) return { ok: false, reason: "Sem cópia local" };
  await writeLocal(localKey, snapshot.data);
  await clearLocalDeleted(localKey);
  return { ok: true, count: snapshot.data.length, from: snapshot.storageKey };
}

export async function restoreTableFromCloud(table, localKey, normalizeFn) {
  var user = await getUser();
  if (!user) return { ok: false, reason: "Sem sessão" };
  try {
    var remote = await fetchRemoteRows(table, normalizeFn);
    if (!remote.length) return { ok: false, reason: "Nuvem vazia nesta tabela" };
    await writeLocal(localKey, remote);
    await clearLocalDeleted(localKey);
    return { ok: true, count: remote.length };
  } catch (e) {
    return { ok: false, reason: e.message || String(e) };
  }
}

export async function recoverJournal() {
  var blocksSnaps = findLocalSnapshots("journal-blocks");
  var spacesSnaps = findLocalSnapshots("journal-spaces");
  var cloudBlocks = await restoreTableFromCloud("journal_blocks", "journal-blocks-v1", null);
  var cloudSpaces = await restoreTableFromCloud("journal_spaces", "journal-spaces-v1", null);
  var localBlocks = blocksSnaps[0] ? await restoreSnapshotToKey("journal-blocks-v1", blocksSnaps[0]) : { ok: false };
  var localSpaces = spacesSnaps[0] ? await restoreSnapshotToKey("journal-spaces-v1", spacesSnaps[0]) : { ok: false };
  return { cloudBlocks: cloudBlocks, cloudSpaces: cloudSpaces, localBlocks: localBlocks, localSpaces: localSpaces };
}

export async function recoverFinance() {
  var catSnaps = findLocalSnapshots("finance-categories");
  var expSnaps = findLocalSnapshots("expenses-v");
  var incCatSnaps = findLocalSnapshots("income-categories");
  var incSnaps = findLocalSnapshots("incomes-v");
  var cloudCats = await restoreTableFromCloud("finance_categories", "finance-categories-v1", null);
  var cloudExp = await restoreTableFromCloud("expenses", "expenses-v1", null);
  var cloudIncCats = await restoreTableFromCloud("income_categories", "income-categories-v1", null);
  var cloudInc = await restoreTableFromCloud("incomes", "incomes-v1", null);
  return {
    cloudCats: cloudCats,
    cloudExp: cloudExp,
    cloudIncCats: cloudIncCats,
    cloudInc: cloudInc,
    localCats: catSnaps[0] ? await restoreSnapshotToKey("finance-categories-v1", catSnaps[0]) : { ok: false },
    localExp: expSnaps[0] ? await restoreSnapshotToKey("expenses-v1", expSnaps[0]) : { ok: false },
  };
}

export async function recoverWishlist() {
  var itemSnaps = findLocalSnapshots("wishlist-items");
  var groupSnaps = findLocalSnapshots("wishlist-groups");
  var cloudItems = await restoreTableFromCloud("wishlist_items", "wishlist-items-v1", null);
  var cloudGroups = await restoreTableFromCloud("wishlist_groups", "wishlist-groups-v1", null);
  var localItems = itemSnaps[0] ? await restoreSnapshotToKey("wishlist-items-v1", itemSnaps[0]) : { ok: false };
  var localGroups = groupSnaps[0] ? await restoreSnapshotToKey("wishlist-groups-v1", groupSnaps[0]) : { ok: false };
  return { cloudItems: cloudItems, cloudGroups: cloudGroups, localItems: localItems, localGroups: localGroups };
}
