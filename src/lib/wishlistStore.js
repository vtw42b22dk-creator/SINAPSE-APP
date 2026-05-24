import {
  deleteRemoteIds,
  readLocal,
  replaceRows,
  selectRowsMerged,
  uid,
  writeLocal,
} from "./cloudStore";
import { safePullMerge } from "./syncEngine";

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

export async function loadGroupsLocal() {
  var local = await readLocal(GROUPS_KEY, []);
  local = (local || []).sort(function(a, b) { return a.order_index - b.order_index; });
  if (!local.length) {
    var items = await readLocal(KEY, []);
    var seen = {};
    (items || []).forEach(function(it) {
      if (it && it.group_id) seen[it.group_id] = true;
    });
    local = Object.keys(seen).map(function(id, i) {
      return normalizeGroup({ id: id, name: "Recuperado", color: "#34D399", order_index: i });
    });
    if (local.length) await writeLocal(GROUPS_KEY, local);
  }
  if (!local.length) {
    local = [normalizeGroup({ id: uid("wg"), name: DEFAULT_GROUP, color: "#34D399", order_index: 0 })];
  }
  return local;
}

export async function loadItemsLocal() {
  var local = await readLocal(KEY, []);
  return sortItems((local || []).map(normalize));
}

export async function pullGroups() {
  try {
    var merged = await safePullMerge(GROUPS_KEY, GROUPS_TABLE, normalizeGroup);
    merged = merged.sort(function(a, b) { return a.order_index - b.order_index; });
    if (!merged.length) return loadGroupsLocal();
    return merged;
  } catch (e) {
    return loadGroupsLocal();
  }
}

export async function pullItems() {
  try {
    var merged = await safePullMerge(KEY, TABLE, normalize);
    return sortItems(merged.map(normalize));
  } catch (e) {
    return loadItemsLocal();
  }
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
    { pruneOrphans: false }
  );
}

export async function loadItems() {
  var rows = await selectRowsMerged(TABLE, KEY, [], normalize);
  return sortItems(rows);
}

export async function saveItems(items) {
  if (!items || !items.length) return { ok: true, cloud: true, rows: [], skippedEmpty: true };
  return replaceRows(TABLE, KEY, items.map(toDb), { pruneOrphans: false });
}

export async function deleteGroup(groupId) {
  if (!groupId) return { ok: true };
  return deleteRemoteIds(GROUPS_TABLE, [groupId], GROUPS_KEY);
}

export async function deleteItem(itemId) {
  if (!itemId) return { ok: true };
  return deleteRemoteIds(TABLE, [itemId], KEY);
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
