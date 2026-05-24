/* eslint-disable no-unused-vars */
import { replaceRows, selectRows, uid } from "./cloudStore";

var TABLE = "calendar_events";
var KEY = "sinapse-calendar-v3";
var OLD_KEY = "sinapse-calendar-v2";

function normalize(row) {
  return {
    id: row.id || uid("e"),
    title: row.title || "",
    notes: row.notes || "",
    color: row.color || "#00FFC8",
    allDay: !!(row.allDay || row.all_day),
    time: row.time || null,
    duration: row.duration || 60,
    task_id: row.task_id || null,
  };
}

function toDb(dayKey, ev) {
  return {
    id: ev.id,
    day_key: dayKey,
    title: ev.title,
    notes: ev.notes || "",
    color: ev.color || "#00FFC8",
    all_day: !!ev.allDay,
    time: ev.allDay ? null : ev.time,
    duration: ev.allDay ? null : ev.duration || 60,
    task_id: ev.task_id || null,
  };
}

export async function loadEvents() {
  var rows = await selectRows(TABLE, KEY, null);
  if (!rows) {
    try { rows = JSON.parse(localStorage.getItem(OLD_KEY) || "{}"); } catch (e) { rows = {}; }
    return normalizeObject(rows);
  }
  if (!Array.isArray(rows)) return normalizeObject(rows || {});
  var out = {};
  rows.forEach(function(row) {
    var key = row.day_key || row.dayKey;
    if (!key) return;
    if (!out[key]) out[key] = [];
    out[key].push(normalize(row));
  });
  return out;
}

export async function saveEvents(events) {
  var rows = [];
  Object.keys(events || {}).forEach(function(k) {
    (events[k] || []).forEach(function(ev) { rows.push(toDb(k, ev)); });
  });
  await replaceRows(TABLE, KEY, rows);
  return events;
}

function normalizeObject(obj) {
  var out = {};
  Object.keys(obj || {}).forEach(function(k) {
    out[k] = (obj[k] || []).map(normalize);
  });
  return out;
}
