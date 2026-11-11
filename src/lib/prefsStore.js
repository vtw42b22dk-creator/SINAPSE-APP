/* eslint-disable no-empty */
import { fetchRemoteState, readLocal, replaceRows, writeLocal } from "./cloudStore";

var KEY = "user-prefs-v1";
var TABLE = "user_prefs";
var ROW_ID = "prefs";
var ORDER_KEY = "sinapse-hub-order-v1";
var HIDDEN_KEY = "sinapse-hub-hidden-v1";
var PIN_KEY = "sinapse-pinned-projects-v1";
var SHELF_KEY = "focus-project-shelf-v1";

var memory = null;
var saveTimer = 0;

function emptyPrefs() {
  return {
    id: ROW_ID,
    hubOrder: [],
    hubHidden: [],
    projectPins: [],
    focusShelf: { order: [], archived: [] },
    updated: 0,
  };
}

function asList(value) {
  return Array.isArray(value) ? value.filter(function(item) { return typeof item === "string" && item; }) : [];
}

function asShelf(value) {
  var shelf = value && typeof value === "object" ? value : {};
  return { order: asList(shelf.order), archived: asList(shelf.archived) };
}

function readJson(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

/** Aceita a linha da nuvem (payload) e a cópia já normalizada. */
export function normalizePrefs(row) {
  if (!row) return emptyPrefs();
  var payload = row.payload != null ? row.payload : row.data;
  if (typeof payload === "string") {
    try { payload = JSON.parse(payload); } catch (e) { payload = null; }
  }
  var top = payload && typeof payload === "object" ? payload : row;
  var updated = row.updated || (row.updated_at ? new Date(row.updated_at).getTime() : 0) || top.updated || 0;
  return {
    id: row.id || ROW_ID,
    hubOrder: asList(top.hubOrder),
    hubHidden: asList(top.hubHidden),
    projectPins: asList(top.projectPins),
    focusShelf: asShelf(top.focusShelf),
    updated: updated || 0,
  };
}

function toDb(prefs) {
  var p = prefs || emptyPrefs();
  return {
    id: ROW_ID,
    payload: {
      hubOrder: asList(p.hubOrder),
      hubHidden: asList(p.hubHidden),
      projectPins: asList(p.projectPins),
      focusShelf: asShelf(p.focusShelf),
      updated: p.updated || Date.now(),
    },
    updated: p.updated || Date.now(),
  };
}

function score(prefs) {
  var shelf = asShelf(prefs && prefs.focusShelf);
  return asList(prefs && prefs.hubOrder).length
    + asList(prefs && prefs.hubHidden).length
    + asList(prefs && prefs.projectPins).length
    + shelf.order.length
    + shelf.archived.length;
}

function sameBody(a, b) {
  return JSON.stringify(toDb(a).payload) === JSON.stringify(toDb(b).payload);
}

function seedFromDevice() {
  var shelf = readJson(SHELF_KEY, null);
  return normalizePrefs({
    id: ROW_ID,
    payload: {
      hubOrder: readJson(ORDER_KEY, []),
      hubHidden: readJson(HIDDEN_KEY, []),
      projectPins: readJson(PIN_KEY, []),
      focusShelf: shelf || { order: [], archived: [] },
    },
    updated: 0,
  });
}

function applyPrefs(prefs) {
  var p = normalizePrefs(prefs);
  try {
    if (p.hubOrder.length) localStorage.setItem(ORDER_KEY, JSON.stringify(p.hubOrder));
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(p.hubHidden));
    localStorage.setItem(PIN_KEY, JSON.stringify(p.projectPins));
    if (p.focusShelf.order.length || p.focusShelf.archived.length) {
      localStorage.setItem(SHELF_KEY, JSON.stringify(p.focusShelf));
    }
  } catch (e) {}
  try { window.dispatchEvent(new Event("sinapse-nav-change")); } catch (e) {}
  try { window.dispatchEvent(new Event("sinapse-prefs")); } catch (e) {}
  return p;
}

function pickPrefs(localRow, remoteRow) {
  var local = normalizePrefs(localRow);
  var remote = normalizePrefs(remoteRow);
  if (score(remote) === 0 && score(local) > 0) return local;
  if (score(local) === 0 && score(remote) > 0) return remote;
  if ((local.updated || 0) === (remote.updated || 0)) {
    return score(local) >= score(remote) ? local : remote;
  }
  return (local.updated || 0) > (remote.updated || 0) ? local : remote;
}

async function savePrefsNow(prefs) {
  var row = toDb(prefs);
  memory = normalizePrefs(row);
  await writeLocal(KEY, [row]);
  return replaceRows(TABLE, KEY, [row], { pruneOrphans: false });
}

export function patchPrefs(partial) {
  var base = memory || seedFromDevice();
  var next = normalizePrefs({
    id: ROW_ID,
    payload: {
      hubOrder: partial && partial.hubOrder != null ? partial.hubOrder : base.hubOrder,
      hubHidden: partial && partial.hubHidden != null ? partial.hubHidden : base.hubHidden,
      projectPins: partial && partial.projectPins != null ? partial.projectPins : base.projectPins,
      focusShelf: partial && partial.focusShelf != null ? partial.focusShelf : base.focusShelf,
      updated: Date.now(),
    },
    updated: Date.now(),
  });
  memory = next;
  writeLocal(KEY, [toDb(next)]).catch(function() {});
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function() {
    savePrefsNow(memory || next).catch(function() {});
  }, 500);
  return next;
}

export async function pullPrefs() {
  var rows = await readLocal(KEY, []);
  var stored = rows && rows[0] ? normalizePrefs(rows[0]) : null;
  var localRow = stored && (stored.updated || score(stored)) ? stored : seedFromDevice();
  if (memory && (memory.updated || 0) > (localRow.updated || 0)) localRow = memory;

  var remoteRow = emptyPrefs();
  var state = await fetchRemoteState(TABLE, normalizePrefs);
  if (state.authoritative) {
    var found = (state.rows || []).find(function(row) { return row && row.id === ROW_ID; });
    if (found) remoteRow = normalizePrefs(found);
  } else {
    memory = localRow;
    return localRow;
  }

  var picked = pickPrefs(localRow, remoteRow);
  var remoteEmpty = score(remoteRow) === 0 && score(picked) > 0;
  if (!sameBody(picked, remoteRow) && ((picked.updated || 0) > (remoteRow.updated || 0) || remoteEmpty)) {
    if (!picked.updated || (picked.updated || 0) <= (remoteRow.updated || 0)) {
      picked = Object.assign({}, picked, { updated: Date.now() });
    }
    await savePrefsNow(picked);
  } else {
    memory = picked;
    await writeLocal(KEY, [toDb(picked)]);
  }
  return applyPrefs(memory || picked);
}
