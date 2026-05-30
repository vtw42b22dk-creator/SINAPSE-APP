/* eslint-disable no-empty */
import {
  readLocal,
  selectRowsMerged,
  replaceRows,
  deleteRemoteIds,
  getUser,
  uid,
  cloudErrorMessage,
} from "./cloudStore";
import { supabase } from "./supabase";
import * as journalStore from "./journalStore";

var IDEAS_TABLE = "study_ideas";
var IDEAS_KEY = "study-ideas-v1";
var METRICS_TABLE = "study_metrics";
var METRICS_KEY = "study-metrics-v1";
var DIARY_SPACE_TITLE = "Estudo";

export function dayKey(d) {
  d = d || new Date();
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var da = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + da;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tsFromRow(row) {
  if (row.updated) return Number(row.updated);
  if (row.updated_at) return new Date(row.updated_at).getTime();
  if (row.created_at) return new Date(row.created_at).getTime();
  return Date.now();
}

/* ------------------------------- IDEIAS ------------------------------- */

function normalizeIdea(row) {
  return {
    id: row.id || uid("si"),
    content: row.content || "",
    day_key: row.day_key || dayKey(),
    created: row.created || (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
    updated: tsFromRow(row),
  };
}

function ideaToDb(r) {
  return { id: r.id, content: r.content || "", day_key: r.day_key || dayKey() };
}

export function newIdea(content) {
  return normalizeIdea({ id: uid("si"), content: content || "", day_key: dayKey() });
}

export async function loadIdeas() {
  var rows = await selectRowsMerged(IDEAS_TABLE, IDEAS_KEY, [], normalizeIdea);
  return (rows || []).map(normalizeIdea).sort(function(a, b) { return b.created - a.created; });
}

export async function saveIdeas(rows) {
  return replaceRows(IDEAS_TABLE, IDEAS_KEY, (rows || []).map(ideaToDb), { pruneOrphans: false });
}

export async function deleteIdea(rows, id) {
  var next = (rows || []).filter(function(r) { return r.id !== id; });
  await deleteRemoteIds(IDEAS_TABLE, [id], IDEAS_KEY);
  await replaceRows(IDEAS_TABLE, IDEAS_KEY, next.map(ideaToDb), { pruneOrphans: false });
  return next;
}

/* ------------------------------ MÉTRICAS ------------------------------ */

function metricId(day) {
  return "sm_" + day;
}

function normalizeMetric(row) {
  var day = row.day_key || dayKey();
  return {
    id: row.id || metricId(day),
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
    id: r.id || metricId(r.day_key),
    day_key: r.day_key,
    minutes: Number(r.minutes) || 0,
    pages: Number(r.pages) || 0,
    subject: r.subject || "",
  };
}

export function newMetric(day) {
  var d = day || dayKey();
  return normalizeMetric({ id: metricId(d), day_key: d, minutes: 0, pages: 0, subject: "" });
}

export async function loadMetrics() {
  var rows = await selectRowsMerged(METRICS_TABLE, METRICS_KEY, [], normalizeMetric);
  return (rows || []).map(normalizeMetric);
}

export async function saveMetrics(rows) {
  return replaceRows(METRICS_TABLE, METRICS_KEY, (rows || []).map(metricToDb), { pruneOrphans: false });
}

/** Últimos N dias (mais antigo → mais recente) com a métrica respetiva. */
export function lastDays(metrics, n) {
  var byDay = {};
  (metrics || []).forEach(function(m) { byDay[m.day_key] = m; });
  var out = [];
  for (var i = n - 1; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var k = dayKey(d);
    out.push(byDay[k] || { id: metricId(k), day_key: k, minutes: 0, pages: 0, subject: "" });
  }
  return out;
}

/* ---------------------- SINCRONIZAÇÃO COM O DIÁRIO -------------------- */

/**
 * Insere o texto diretamente na tabela do Diário (journal_blocks), num tema
 * "Estudo", com a data atual e o prefixo "// NOTA DE ESTUDO:".
 */
export async function syncNoteToDiary(text) {
  if (!text || !text.trim()) return { ok: false, error: "Texto vazio." };
  var user = await getUser();
  if (!supabase || !user) return { ok: false, error: "Sem sessão Supabase — inicia sessão para sincronizar." };
  try {
    var spaces = await journalStore.loadSpaces();
    var space = (spaces || []).find(function(s) {
      return (s.title || "").toLowerCase() === DIARY_SPACE_TITLE.toLowerCase();
    });
    if (!space) {
      space = { id: uid("js"), title: DIARY_SPACE_TITLE, color: "#00FFC8" };
      await journalStore.saveSpaces((spaces || []).concat([space]));
    }
    var dateStr = new Date().toLocaleDateString("pt-PT");
    var safe = escapeHtml(text.trim()).replace(/\n/g, "<br/>");
    var content = '<b style="color:#00FFC8">// NOTA DE ESTUDO: ' + dateStr + "</b><br/>" + safe;
    var block = await journalStore.appendBlock(space.id, "text", content, { source: "focus_studio" });
    return { ok: true, blockId: block.id, space: space.title };
  } catch (e) {
    return { ok: false, error: cloudErrorMessage(e) };
  }
}
