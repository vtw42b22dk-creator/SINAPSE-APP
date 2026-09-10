/* eslint-disable no-unused-vars */
import {
  deleteRemoteIds,
  fetchRemoteRows,
  mergePullFromRemote,
  getLocalDeletedIds,
  readLocal,
  replaceRows,
  uid,
  writeLocal,
} from "./cloudStore";
import { pauseCloudPull } from "./cloudSyncGuard";

var TABLE = "calendar_events";
var KEY = "sinapse-calendar-v3";
var OLD_KEY = "sinapse-calendar-v2";
var OPEN_BASE = 100000;

function rowTs(row) {
  if (!row) return 0;
  if (row.updated) return Number(row.updated) || 0;
  if (row.updated_at) return new Date(row.updated_at).getTime() || 0;
  return 0;
}

function unpackDuration(row) {
  var dur = row.duration == null ? 60 : Number(row.duration);
  var openEnd = !!(row.openEnd || row.open_end);
  if (!isFinite(dur)) dur = 60;
  if (dur === 0) {
    openEnd = true;
    dur = 30;
  }
  if (dur >= OPEN_BASE) {
    openEnd = true;
    dur = dur - OPEN_BASE;
  }
  if (dur < 15) dur = 15;
  return { duration: dur, openEnd: openEnd };
}

function packDuration(ev) {
  if (ev.allDay) return null;
  var d = Math.max(15, Number(ev.duration) || 60);
  if (ev.openEnd) return OPEN_BASE + d;
  return d;
}

function normalize(row) {
  var packed = unpackDuration(row);
  return {
    id: row.id || uid("e"),
    title: row.title || "",
    notes: row.notes || "",
    color: row.color || "#E6E6E9",
    allDay: !!(row.allDay || row.all_day),
    time: row.time || null,
    duration: packed.duration,
    openEnd: packed.openEnd,
    task_id: row.task_id || null,
    day_key: row.day_key || row.dayKey || null,
    updated: rowTs(row) || Date.now(),
  };
}

function toDb(dayKey, ev) {
  return {
    id: ev.id,
    day_key: dayKey,
    title: ev.title,
    notes: ev.notes || "",
    color: ev.color || "#E6E6E9",
    all_day: !!ev.allDay,
    time: ev.allDay ? null : ev.time,
    duration: packDuration(ev),
    task_id: ev.task_id || null,
    updated: ev.updated || Date.now(),
  };
}

function rowsToDays(rows) {
  var out = {};
  (rows || []).forEach(function(row) {
    var n = normalize(row);
    var key = n.day_key || row.day_key || row.dayKey;
    if (!key) return;
    delete n.day_key;
    if (!out[key]) out[key] = [];
    out[key].push(n);
  });
  return out;
}

function daysToRows(events) {
  var rows = [];
  Object.keys(events || {}).forEach(function(k) {
    (events[k] || []).forEach(function(ev) { rows.push(toDb(k, ev)); });
  });
  return rows;
}

export async function loadEvents() {
  var local = await readLocal(KEY, null);
  if (!local) {
    try { local = JSON.parse(localStorage.getItem(OLD_KEY) || "[]"); } catch (e) { local = []; }
  }
  if (local && !Array.isArray(local) && typeof local === "object") {
    local = daysToRows(local);
  }
  local = (local || []).map(normalize);

  var remote = [];
  try {
    remote = await fetchRemoteRows(TABLE, normalize);
  } catch (e) {
    return rowsToDays(local);
  }

  var deletedIds = await getLocalDeletedIds(KEY);
  var merged = mergePullFromRemote(local, remote, deletedIds, TABLE);
  await writeLocal(KEY, merged.map(function(ev) { return toDb(ev.day_key, ev); }));

  var remoteIds = {};
  remote.forEach(function(r) { if (r && r.id) remoteIds[r.id] = true; });
  var localOnly = merged.filter(function(r) { return r.id && !remoteIds[r.id]; });
  if (localOnly.length) {
    replaceRows(TABLE, KEY, merged.map(function(ev) { return toDb(ev.day_key, ev); }), { pruneOrphans: false }).catch(function() {});
  }

  return rowsToDays(merged);
}

export async function saveEvents(events) {
  var rows = daysToRows(events);
  pauseCloudPull(6000, TABLE);
  await replaceRows(TABLE, KEY, rows, { pruneOrphans: false });
  return events;
}

/** Remove evento localmente e na nuvem (evita reaparecer ao sincronizar). */
export async function deleteEventById(events, eventId) {
  if (!eventId) return events || {};
  var next = {};
  Object.keys(events || {}).forEach(function(k) {
    var list = (events[k] || []).filter(function(ev) { return ev.id !== eventId; });
    if (list.length) next[k] = list;
  });
  await deleteRemoteIds(TABLE, [eventId], KEY);
  await saveEvents(next);
  return next;
}
