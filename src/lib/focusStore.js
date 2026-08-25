/* eslint-disable no-empty */
import {
  selectRowsMerged,
  replaceRows,
  deleteRemoteIds,
  getUser,
  uid,
  cloudErrorMessage,
} from "./cloudStore";
import { supabase } from "./supabase";
import * as journalStore from "./journalStore";

var PROJECTS_TABLE = "focus_projects";
var PROJECTS_KEY = "focus-projects-v1";
var IDEAS_TABLE = "study_ideas";
var IDEAS_KEY = "study-ideas-v1";
var METRICS_TABLE = "study_metrics";
var METRICS_KEY = "study-metrics-v1";
var TASKS_TABLE = "focus_tasks";
var TASKS_KEY = "focus-tasks-v1";
var ACTIVE_PROJECT_KEY = "focus-active-project-v1";
var DIARY_SPACE_TITLE = "Estudo";

export var PROJECT_COLORS = ["#E6E6E9", "#A0A0A8", "#8FB39B", "#C4A57C", "#C08C8C", "#8FA8C4", "#6E6E76"];

export function dayKey(d) {
  d = d || new Date();
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var da = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + da;
}

function tsFromRow(row) {
  if (row.updated) return Number(row.updated);
  if (row.updated_at) return new Date(row.updated_at).getTime();
  if (row.created_at) return new Date(row.created_at).getTime();
  return Date.now();
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ----------------------------- PROJETOS ----------------------------- */

function normalizeProject(row) {
  return {
    id: row.id || uid("fp"),
    name: row.name || "Projeto",
    color: row.color || PROJECT_COLORS[0],
    icon: row.icon || "◈",
    goal_hours: row.goal_hours != null ? Number(row.goal_hours) : 0,
    deadline: row.deadline || "",
    presets: Array.isArray(row.presets) ? row.presets : [],
    created: row.created || (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
    updated: tsFromRow(row),
  };
}

function projectToDb(r) {
  return {
    id: r.id,
    name: r.name || "",
    color: r.color || PROJECT_COLORS[0],
    icon: r.icon || "◈",
    goal_hours: Number(r.goal_hours) || 0,
    deadline: r.deadline || "",
    presets: r.presets || [],
  };
}

export function newProject(name, opts) {
  opts = opts || {};
  return normalizeProject({
    id: uid("fp"),
    name: name || "Novo projeto",
    color: opts.color || PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
    icon: opts.icon || "◈",
    goal_hours: opts.goal_hours || 0,
    deadline: opts.deadline || "",
    presets: opts.presets || [],
  });
}

export async function loadProjects() {
  var rows = await selectRowsMerged(PROJECTS_TABLE, PROJECTS_KEY, [], normalizeProject);
  return (rows || []).map(normalizeProject).sort(function(a, b) { return b.created - a.created; });
}

export async function saveProjects(rows) {
  return replaceRows(PROJECTS_TABLE, PROJECTS_KEY, (rows || []).map(projectToDb), { pruneOrphans: false });
}

export async function deleteProject(rows, id) {
  var next = (rows || []).filter(function(r) { return r.id !== id; });
  await deleteRemoteIds(PROJECTS_TABLE, [id], PROJECTS_KEY);
  await replaceRows(PROJECTS_TABLE, PROJECTS_KEY, next.map(projectToDb), { pruneOrphans: false });
  return next;
}

export function clearProjectLocalData(projectId) {
  if (!projectId) return;
  try { localStorage.removeItem("focus-review-draft:" + projectId); } catch (e) {}
  if (loadActiveProjectId() === projectId) saveActiveProjectId("");
}

/** Elimina projeto e todos os dados associados (ideias, métricas, tarefas) com persistência local + nuvem. */
export async function deleteProjectFull(projectId, projects, ideas, metrics, tasks) {
  if (!projectId) return { projects: projects || [], ideas: ideas || [], metrics: metrics || [], tasks: tasks || [] };
  var nextProjects = (projects || []).filter(function(p) { return p.id !== projectId; });
  var removedIdeas = (ideas || []).filter(function(r) { return r.project_id === projectId; });
  var removedMetrics = (metrics || []).filter(function(r) { return r.project_id === projectId; });
  var removedTasks = (tasks || []).filter(function(r) { return r.project_id === projectId; });
  var nextIdeas = (ideas || []).filter(function(r) { return r.project_id !== projectId; });
  var nextMetrics = (metrics || []).filter(function(r) { return r.project_id !== projectId; });
  var nextTasks = (tasks || []).filter(function(r) { return r.project_id !== projectId; });

  await deleteRemoteIds(PROJECTS_TABLE, [projectId], PROJECTS_KEY);
  if (removedIdeas.length) await deleteRemoteIds(IDEAS_TABLE, removedIdeas.map(function(r) { return r.id; }), IDEAS_KEY);
  if (removedMetrics.length) await deleteRemoteIds(METRICS_TABLE, removedMetrics.map(function(r) { return r.id; }), METRICS_KEY);
  if (removedTasks.length) await deleteRemoteIds(TASKS_TABLE, removedTasks.map(function(r) { return r.id; }), TASKS_KEY);

  await replaceRows(PROJECTS_TABLE, PROJECTS_KEY, nextProjects.map(projectToDb), { pruneOrphans: false });
  await replaceRows(IDEAS_TABLE, IDEAS_KEY, nextIdeas.map(ideaToDb), { pruneOrphans: false });
  await replaceRows(METRICS_TABLE, METRICS_KEY, nextMetrics.map(metricToDb), { pruneOrphans: false });
  await replaceRows(TASKS_TABLE, TASKS_KEY, nextTasks.map(taskToDb), { pruneOrphans: false });

  clearProjectLocalData(projectId);
  return { projects: nextProjects, ideas: nextIdeas, metrics: nextMetrics, tasks: nextTasks };
}

export function loadActiveProjectId() {
  try { return localStorage.getItem(ACTIVE_PROJECT_KEY) || ""; } catch (e) { return ""; }
}

export function saveActiveProjectId(id) {
  try {
    if (id) localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    else localStorage.removeItem(ACTIVE_PROJECT_KEY);
  } catch (e) {}
}

/* ------------------------------- IDEIAS ------------------------------- */

function normalizeIdea(row) {
  return {
    id: row.id || uid("si"),
    project_id: row.project_id || "",
    content: row.content || "",
    day_key: row.day_key || dayKey(),
    kind: row.kind || "idea",
    created: row.created || (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
    updated: tsFromRow(row),
  };
}

function ideaToDb(r) {
  return {
    id: r.id,
    project_id: r.project_id || "",
    content: r.content || "",
    day_key: r.day_key || dayKey(),
    kind: r.kind || "idea",
  };
}

export function newIdea(content, projectId, kind) {
  return normalizeIdea({
    id: uid("si"),
    project_id: projectId || "",
    content: content || "",
    day_key: dayKey(),
    kind: kind || "idea",
  });
}

export async function loadIdeas(projectId) {
  var rows = await selectRowsMerged(IDEAS_TABLE, IDEAS_KEY, [], normalizeIdea);
  var list = (rows || []).map(normalizeIdea);
  if (projectId) list = list.filter(function(r) { return r.project_id === projectId; });
  return list.sort(function(a, b) { return b.created - a.created; });
}

export async function saveIdeas(rows) {
  return replaceRows(IDEAS_TABLE, IDEAS_KEY, (rows || []).map(ideaToDb), { pruneOrphans: false });
}

export async function deleteIdea(allRows, id) {
  var next = (allRows || []).filter(function(r) { return r.id !== id; });
  await deleteRemoteIds(IDEAS_TABLE, [id], IDEAS_KEY);
  await replaceRows(IDEAS_TABLE, IDEAS_KEY, next.map(ideaToDb), { pruneOrphans: false });
  return next;
}

/* ------------------------------ MÉTRICAS ------------------------------ */

function metricId(day, projectId) {
  return "sm_" + (projectId || "default") + "_" + day;
}

function normalizeMetric(row) {
  var day = row.day_key || dayKey();
  var pid = row.project_id || "";
  return {
    id: row.id || metricId(day, pid),
    project_id: pid,
    day_key: day,
    minutes: Number(row.minutes) || 0,
    pages: Number(row.pages) || 0,
    subject: row.subject || "",
    created: row.created || (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
    updated: tsFromRow(row),
  };
}

function metricToDb(r) {
  return {
    id: r.id || metricId(r.day_key, r.project_id),
    project_id: r.project_id || "",
    day_key: r.day_key,
    minutes: Number(r.minutes) || 0,
    pages: Number(r.pages) || 0,
    subject: r.subject || "",
  };
}

export function newMetric(day, projectId) {
  var d = day || dayKey();
  return normalizeMetric({ id: metricId(d, projectId), project_id: projectId || "", day_key: d, minutes: 0, pages: 0, subject: "" });
}

export async function loadMetrics(projectId) {
  var rows = await selectRowsMerged(METRICS_TABLE, METRICS_KEY, [], normalizeMetric);
  var list = (rows || []).map(normalizeMetric);
  if (projectId) list = list.filter(function(r) { return r.project_id === projectId; });
  return list;
}

export async function saveMetrics(rows) {
  return replaceRows(METRICS_TABLE, METRICS_KEY, (rows || []).map(metricToDb), { pruneOrphans: false });
}

export function addMinutesToDay(allMetrics, projectId, day, min) {
  var prev = allMetrics || [];
  var cur = prev.find(function(m) { return m.project_id === projectId && m.day_key === day; });
  var base = cur ? cur.minutes : 0;
  var patch = { minutes: base + Math.max(0, min) };
  if (cur) {
    return prev.map(function(m) {
      return m.project_id === projectId && m.day_key === day
        ? Object.assign({}, m, patch, { updated: Date.now() })
        : m;
    });
  }
  return prev.concat([Object.assign(newMetric(day, projectId), patch)]);
}

export function lastDays(metrics, n) {
  var byDay = {};
  (metrics || []).forEach(function(m) { byDay[m.day_key] = m; });
  var out = [];
  for (var i = n - 1; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var k = dayKey(d);
    out.push(byDay[k] || { day_key: k, minutes: 0, pages: 0, subject: "" });
  }
  return out;
}

export function totalMinutes(metrics) {
  return (metrics || []).reduce(function(s, m) { return s + (Number(m.minutes) || 0); }, 0);
}

export function goalProgress(project, metrics) {
  var studied = totalMinutes(metrics);
  var goalMin = (Number(project.goal_hours) || 0) * 60;
  if (!goalMin) return { studied: studied, goalMin: 0, pct: 0, remaining: 0, daysLeft: null };
  var remaining = Math.max(0, goalMin - studied);
  var pct = Math.min(100, Math.round((studied / goalMin) * 100));
  var daysLeft = null;
  if (project.deadline) {
    var end = new Date(project.deadline + "T23:59:59");
    daysLeft = Math.max(0, Math.ceil((end - Date.now()) / 86400000));
  }
  return { studied: studied, goalMin: goalMin, pct: pct, remaining: remaining, daysLeft: daysLeft };
}

/* ------------------------------- TAREFAS ------------------------------ */

function normalizeTask(row) {
  return {
    id: row.id || uid("ft"),
    project_id: row.project_id || "",
    text: row.text || "",
    done: !!row.done,
    priority: row.priority || "normal",
    created: row.created || (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
    updated: tsFromRow(row),
  };
}

function taskToDb(r) {
  return {
    id: r.id,
    project_id: r.project_id || "",
    text: r.text || "",
    done: !!r.done,
    priority: r.priority || "normal",
  };
}

export function newTask(text, projectId) {
  return normalizeTask({ id: uid("ft"), project_id: projectId || "", text: text || "", done: false });
}

export async function loadTasks(projectId) {
  var rows = await selectRowsMerged(TASKS_TABLE, TASKS_KEY, [], normalizeTask);
  var list = (rows || []).map(normalizeTask);
  if (projectId) list = list.filter(function(r) { return r.project_id === projectId; });
  return list.sort(function(a, b) {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return b.created - a.created;
  });
}

export async function saveTasks(rows) {
  return replaceRows(TASKS_TABLE, TASKS_KEY, (rows || []).map(taskToDb), { pruneOrphans: false });
}

export async function deleteTask(allRows, id) {
  var next = (allRows || []).filter(function(r) { return r.id !== id; });
  await deleteRemoteIds(TASKS_TABLE, [id], TASKS_KEY);
  await replaceRows(TASKS_TABLE, TASKS_KEY, next.map(taskToDb), { pruneOrphans: false });
  return next;
}

/* ---------------------- SINCRONIZAÇÃO COM O DIÁRIO -------------------- */

export async function syncNoteToDiary(text, projectName) {
  if (!text || !text.trim()) return { ok: false, error: "Texto vazio." };
  var user = await getUser();
  if (!supabase || !user) return { ok: false, error: "Sem sessão Supabase — inicia sessão para sincronizar." };
  try {
    var spaces = await journalStore.loadSpaces();
    var space = (spaces || []).find(function(s) {
      return (s.title || "").toLowerCase() === DIARY_SPACE_TITLE.toLowerCase();
    });
    if (!space) {
      space = { id: uid("js"), title: DIARY_SPACE_TITLE, color: "#E6E6E9" };
      await journalStore.saveSpaces((spaces || []).concat([space]));
    }
    var dateStr = new Date().toLocaleDateString("pt-PT");
    var prefix = projectName ? "// " + projectName.toUpperCase() + " · " + dateStr : "// NOTA DE ESTUDO: " + dateStr;
    var safe = escapeHtml(text.trim()).replace(/\n/g, "<br/>");
    var content = '<b style="color:#E6E6E9">' + prefix + "</b><br/>" + safe;
    var block = await journalStore.appendBlock(space.id, "text", content, { source: "focus_studio" });
    return { ok: true, blockId: block.id, space: space.title };
  } catch (e) {
    return { ok: false, error: cloudErrorMessage(e) };
  }
}

/** Carrega todos os dados de um projeto de uma vez. */
export async function loadProjectBundle(projectId) {
  var allIdeas = await selectRowsMerged(IDEAS_TABLE, IDEAS_KEY, [], normalizeIdea);
  var allMetrics = await selectRowsMerged(METRICS_TABLE, METRICS_KEY, [], normalizeMetric);
  var allTasks = await selectRowsMerged(TASKS_TABLE, TASKS_KEY, [], normalizeTask);
  return {
    ideas: (allIdeas || []).map(normalizeIdea).filter(function(r) { return r.project_id === projectId; }).sort(function(a, b) { return b.created - a.created; }),
    metrics: (allMetrics || []).map(normalizeMetric).filter(function(r) { return r.project_id === projectId; }),
    tasks: (allTasks || []).map(normalizeTask).filter(function(r) { return r.project_id === projectId; }).sort(function(a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return b.created - a.created;
    }),
    allIdeas: (allIdeas || []).map(normalizeIdea),
    allMetrics: (allMetrics || []).map(normalizeMetric),
    allTasks: (allTasks || []).map(normalizeTask),
  };
}

export async function ensureDefaultProject(projects) {
  if (projects && projects.length) return projects;
  var p = newProject("Estudo Geral", { icon: "◈", color: PROJECT_COLORS[0] });
  await saveProjects([p]);
  return [p];
}
