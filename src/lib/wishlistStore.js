import {
  fetchRemoteRows,
  mergeRowsByTimestamp,
  readLocal,
  replaceRows,
  selectRowsMerged,
  uid,
  writeLocal,
} from "./cloudStore";

var TABLE = "wishlist_items";
var KEY = "wishlist-items-v1";
var GROUPS_TABLE = "wishlist_groups";
var GROUPS_KEY = "wishlist-groups-v1";
var DEFAULT_GROUP = "Geral";

function normalizeGroup(row) {
  return {
    id: row.id || uid("wg"),
    name: row.name || DEFAULT_GROUP,
    color: row.color || "#34D399",
    order_index: row.order_index != null ? row.order_index : 0,
    updated: row.updated_at ? new Date(row.updated_at).getTime() : (row.updated || 0),
  };
}

function normalize(row) {
  return {
    id: row.id || uid("wl"),
    title: row.title || "",
    url: row.url || "",
    price: row.price != null ? Number(row.price) : null,
    currency: row.currency || "EUR",
    priority: row.priority || "med",
    notes: row.notes || "",
    purchased: !!row.purchased,
    group_id: row.group_id || null,
    created: row.created || row.created_at || Date.now(),
    updated: row.updated || row.updated_at || row.created || Date.now(),
  };
}

function toDb(item) {
  return {
    id: item.id,
    title: item.title,
    url: item.url || "",
    price: item.price,
    currency: item.currency || "EUR",
    priority: item.priority || "med",
    notes: item.notes || "",
    purchased: !!item.purchased,
    group_id: item.group_id || null,
    updated: item.updated || Date.now(),
  };
}

function sortItems(rows) {
  return rows.sort(function(a, b) {
    if (a.purchased !== b.purchased) return a.purchased ? 1 : -1;
    return (b.updated || 0) - (a.updated || 0);
  });
}

export async function pullGroups() {
  var remote = await fetchRemoteRows(GROUPS_TABLE, normalizeGroup);
  var local = await readLocal(GROUPS_KEY, []);
  var merged = mergeRowsByTimestamp(local, remote);
  merged = merged.sort(function(a, b) { return a.order_index - b.order_index; });
  if (!merged.length) {
    merged = [normalizeGroup({ id: uid("wg"), name: DEFAULT_GROUP, color: "#34D399", order_index: 0 })];
  }
  await writeLocal(GROUPS_KEY, merged);
  return merged;
}

export async function pullItems() {
  var remote = await fetchRemoteRows(TABLE, normalize);
  var local = await readLocal(KEY, []);
  var merged = mergeRowsByTimestamp(local, remote);
  await writeLocal(KEY, merged);
  return sortItems(merged.map(normalize));
}

export async function loadGroups() {
  var groups = await selectRowsMerged(GROUPS_TABLE, GROUPS_KEY, [], normalizeGroup);
  groups = groups.sort(function(a, b) { return a.order_index - b.order_index; });
  if (!groups.length) {
    groups = [normalizeGroup({ id: uid("wg"), name: DEFAULT_GROUP, color: "#34D399", order_index: 0 })];
    await writeLocal(GROUPS_KEY, groups);
  }
  return groups;
}

export async function saveGroups(groups) {
  if (!groups || !groups.length) return { ok: true, cloud: true, rows: [], skippedEmpty: true };
  return replaceRows(
    GROUPS_TABLE,
    GROUPS_KEY,
    groups.map(function(g) {
      return {
        id: g.id,
        name: g.name,
        color: g.color || "#34D399",
        order_index: g.order_index || 0,
        updated: g.updated || Date.now(),
      };
    }),
    { pruneOrphans: true }
  );
}

export async function loadItems() {
  var rows = await selectRowsMerged(TABLE, KEY, [], normalize);
  return sortItems(rows);
}

export async function saveItems(items) {
  if (!items || !items.length) return { ok: true, cloud: true, rows: [], skippedEmpty: true };
  return replaceRows(TABLE, KEY, items.map(toDb), { pruneOrphans: true });
}

export async function persistAll(groups, items) {
  var gRes = await saveGroups(groups);
  var iRes = await saveItems(items);
  var ok = gRes.ok && iRes.ok;
  return {
    ok: ok,
    error: !gRes.ok ? gRes.error : !iRes.ok ? iRes.error : null,
    groups: gRes,
    items: iRes,
  };
}

export function newGroup(name) {
  return normalizeGroup({ id: uid("wg"), name: name || "Novo grupo", color: "#34D399", order_index: Math.floor(Date.now() / 1000) });
}

export function newItem(title, groupId) {
  var now = Date.now();
  return normalize({ id: uid("wl"), title: title || "", group_id: groupId || null, created: now, updated: now });
}
