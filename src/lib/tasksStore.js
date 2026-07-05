/* eslint-disable no-unused-vars, no-empty */
import {
  deleteRemoteIds,
  fetchRemoteRows,
  readLocal,
  replaceRows,
  uid,
  writeLocal,
} from "./cloudStore";
import { safePullMerge } from "./syncEngine";

var TABLE = "tasks";
var KEY = "sinapse-tasks-v2";
var OLD_KEY = "sinapse-tasks-v1";

function rowUpdated(row) {
  if (!row) return 0;
  if (row.updated) return Number(row.updated) || 0;
  if (row.updated_at) return new Date(row.updated_at).getTime();
  if (row.created_at) return new Date(row.created_at).getTime();
  if (row.created) return Number(row.created) || 0;
  return 0;
}

function parseSubtasks(row) {
  if (Array.isArray(row.subtasks)) return row.subtasks;
  if (row.subtasks && typeof row.subtasks === "string") {
    try { return JSON.parse(row.subtasks); } catch (e) { return []; }
  }
  return [];
}

function normalize(row) {
  var updated = rowUpdated(row);
  if (!updated) updated = Date.now();
  return {
    id: row.id || uid("t"),
    title: row.title || "",
    notes: row.notes || "",
    priority: row.priority || "med",
    due: row.due || row.due_date || null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    subtasks: parseSubtasks(row).map(function(s) {
      return { id: s.id || uid("st"), title: s.title || "", done: !!s.done };
    }),
    column: row.column || row.status || "inbox",
    source_type: row.source_type || "manual",
    source_id: row.source_id || null,
    synapse_project_id: row.synapse_project_id || null,
    synapse_node_id: row.synapse_node_id || null,
    created: row.created || row.created_at || updated,
    updated: updated,
  };
}

function toDb(t) {
  var n = normalize(t);
  return {
    id: n.id,
    title: n.title,
    notes: n.notes || "",
    priority: n.priority || "med",
    due_date: n.due || null,
    tags: n.tags || [],
    subtasks: (n.subtasks || []).map(function(s) {
      return { id: s.id, title: s.title, done: !!s.done };
    }),
    status: n.column || "inbox",
    source_type: n.source_type || "manual",
    source_id: n.source_id || null,
    synapse_project_id: n.synapse_project_id || null,
    synapse_node_id: n.synapse_node_id || null,
    updated: n.updated || Date.now(),
  };
}

async function migrateOldKey() {
  var rows = await readLocal(KEY, null);
  if (rows && rows.length) return;
  try {
    var old = JSON.parse(localStorage.getItem(OLD_KEY) || "[]");
    if (old && old.length) {
      var mapped = old.map(normalize);
      await writeLocal(KEY, mapped.map(toDb));
    }
  } catch (e) {}
}

export async function loadTasksLocal() {
  await migrateOldKey();
  var rows = await readLocal(KEY, []);
  return (rows || []).map(normalize);
}

/** Traz alterações da nuvem e faz merge seguro com o dispositivo. */
export async function pullTasks() {
  await migrateOldKey();
  try {
    var merged = await safePullMerge(KEY, TABLE, normalize);
    return (merged || []).map(normalize);
  } catch (e) {
    return loadTasksLocal();
  }
}

/** Envia tarefas locais para a nuvem (ex.: backlog offline). */
export async function pushTasks(tasks) {
  var list = (tasks || []).map(normalize);
  if (!list.length) return { ok: true, cloud: true, rows: [], skippedEmpty: true };
  await writeLocal(KEY, list.map(toDb));
  return replaceRows(TABLE, KEY, list.map(toDb), { pruneOrphans: false });
}

/**
 * Pull + push: garante que tarefas só locais chegam à nuvem
 * e que o dispositivo fica alinhado com outros ecrãs.
 */
export async function syncTasks() {
  var merged = await pullTasks();
  if (!merged.length) return { ok: true, cloud: true, tasks: merged };
  var res = await pushTasks(merged);
  return Object.assign({}, res, { tasks: merged });
}

export async function loadTasks() {
  var merged = await pullTasks();
  try {
    var remote = await fetchRemoteRows(TABLE, normalize);
    var remoteIds = {};
    (remote || []).forEach(function(r) { if (r && r.id) remoteIds[r.id] = true; });
    var hasLocalOnly = merged.some(function(t) { return t.id && !remoteIds[t.id]; });
    if (hasLocalOnly) await pushTasks(merged);
  } catch (e) {}
  return merged;
}

export async function saveTasks(tasks) {
  return pushTasks(tasks);
}

/** Gravação imediata (criar/editar/mover) — não depende de debounce na UI. */
export async function saveTasksNow(tasks) {
  return pushTasks(tasks);
}

/** Remove tarefa localmente e na nuvem (evita reaparecer ao sincronizar). */
export async function deleteTaskById(tasks, taskId) {
  if (!taskId) return (tasks || []).slice();
  var next = (tasks || []).filter(function(t) { return t.id !== taskId; });
  await deleteRemoteIds(TABLE, [taskId], KEY);
  var dbRows = next.map(toDb);
  await writeLocal(KEY, dbRows);
  if (dbRows.length) {
    await replaceRows(TABLE, KEY, dbRows, { pruneOrphans: false });
  }
  return next;
}

export async function createLinkedTask(tasks, source) {
  var existing = tasks.find(function(t) { return t.source_type === source.source_type && t.source_id === source.source_id; });
  var now = Date.now();
  var nextTask = Object.assign({}, existing || {}, {
    id: existing ? existing.id : uid("t"),
    title: source.title || (existing && existing.title) || "Nova tarefa",
    notes: source.notes || (existing && existing.notes) || "",
    priority: source.priority || (existing && existing.priority) || "med",
    due: source.due || (existing && existing.due) || null,
    tags: source.tags || (existing && existing.tags) || [],
    subtasks: source.subtasks || (existing && existing.subtasks) || [],
    column: source.column || (existing && existing.column) || "inbox",
    source_type: source.source_type,
    source_id: source.source_id,
    synapse_project_id: source.synapse_project_id || null,
    synapse_node_id: source.synapse_node_id || null,
    created: existing ? existing.created : now,
    updated: now,
  });
  var next = existing ? tasks.map(function(t) { return t.id === existing.id ? nextTask : t; }) : tasks.concat([nextTask]);
  await saveTasksNow(next);
  return next;
}

export function touchTask(task, patch) {
  return Object.assign({}, task, patch || {}, { updated: Date.now() });
}
