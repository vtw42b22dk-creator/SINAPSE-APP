/* eslint-disable no-unused-vars */
import { replaceRows, selectRowsMerged, uid } from "./cloudStore";

var TABLE = "tasks";
var KEY = "sinapse-tasks-v2";
var OLD_KEY = "sinapse-tasks-v1";

function parseSubtasks(row) {
  if (Array.isArray(row.subtasks)) return row.subtasks;
  if (row.subtasks && typeof row.subtasks === "string") {
    try { return JSON.parse(row.subtasks); } catch (e) { return []; }
  }
  return [];
}

function normalize(row) {
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
    created: row.created || row.created_at || Date.now(),
  };
}

function toDb(t) {
  return {
    id: t.id,
    title: t.title,
    notes: t.notes || "",
    priority: t.priority || "med",
    due_date: t.due || null,
    tags: t.tags || [],
    subtasks: (t.subtasks || []).map(function(s) {
      return { id: s.id, title: s.title, done: !!s.done };
    }),
    status: t.column || "inbox",
    source_type: t.source_type || "manual",
    source_id: t.source_id || null,
    synapse_project_id: t.synapse_project_id || null,
    synapse_node_id: t.synapse_node_id || null,
  };
}

export async function loadTasks() {
  var rows = await selectRowsMerged(TABLE, KEY, null, normalize);
  if (!rows) {
    try {
      rows = JSON.parse(localStorage.getItem(OLD_KEY) || "[]");
    } catch (e) { rows = []; }
  }
  return (rows || []).map(normalize);
}

export async function saveTasks(tasks) {
  return replaceRows(TABLE, KEY, tasks.map(toDb));
}

export async function createLinkedTask(tasks, source) {
  var existing = tasks.find(function(t) { return t.source_type === source.source_type && t.source_id === source.source_id; });
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
    created: existing ? existing.created : Date.now(),
  });
  var next = existing ? tasks.map(function(t) { return t.id === existing.id ? nextTask : t; }) : tasks.concat([nextTask]);
  await saveTasks(next);
  return next;
}
