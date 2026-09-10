import * as financeStore from "./financeStore";
import * as incomeStore from "./incomeStore";
import * as tasksStore from "./tasksStore";
import * as wishlistStore from "./wishlistStore";
import { emitSync } from "./syncEvents";
import { pauseCloudPull } from "./cloudSyncGuard";
import { sequenceId, sequenceLabel } from "./financeSequences";

var recent = {};

export var QUICK_KINDS = [
  { id: "expense", label: "Gasto", dest: "/finance", sync: "expenses", hint: "ex. 4,50 café" },
  { id: "income", label: "Recurso", dest: "/finance", sync: "incomes", hint: "ex. 20 vinted" },
  { id: "task", label: "Tarefa", dest: "/tasks", sync: "tasks", hint: "ex. comprar leite" },
  { id: "wish", label: "Wishlist", dest: "/wishlist", sync: "wishlist_items", hint: "ex. airpods" },
];

export function quickBaseUrl() {
  var origin = window.location.origin;
  var path = window.location.pathname || "/";
  path = path.replace(/index\.html$/i, "");
  if (path.indexOf("/") !== 0) path = "/" + path;
  if (!path.endsWith("/")) path += "/";
  return origin + path + "#/quick";
}

export function kindMeta(id) {
  var i;
  for (i = 0; i < QUICK_KINDS.length; i++) {
    if (QUICK_KINDS[i].id === id) return QUICK_KINDS[i];
  }
  return QUICK_KINDS[0];
}

function normKind(raw) {
  var k = String(raw || "").trim().toLowerCase();
  if (/^(expense|gasto|gastos|despesa|financeiro|finance)$/.test(k)) return "expense";
  if (/^(income|recurso|recursos|entrada|receita)$/.test(k)) return "income";
  if (/^(task|tarefa|tarefas|todo)$/.test(k)) return "task";
  if (/^(wish|wishlist|desejo|desejos)$/.test(k)) return "wish";
  return "";
}

export function parseAmount(raw) {
  if (raw == null || String(raw).trim() === "") return NaN;
  var s = String(raw).trim().replace(/[€eE]/g, "").replace(/\s/g, "").replace(",", ".");
  var n = parseFloat(s);
  return isFinite(n) ? n : NaN;
}

export function parseShorthand(raw) {
  var s = String(raw || "").trim();
  if (!s) return { title: "", amount: NaN };
  var lead = s.match(/^(\d+(?:[.,]\d+)?)\s*[€e]?\s+(.+)$/);
  if (lead) return { amount: parseAmount(lead[1]), title: lead[2].trim() };
  var trail = s.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*[€e]?$/);
  if (trail) return { amount: parseAmount(trail[2]), title: trail[1].trim() };
  var only = s.match(/^(\d+(?:[.,]\d+)?)\s*[€e]?$/);
  if (only) return { amount: parseAmount(only[1]), title: "" };
  return { title: s, amount: NaN };
}

function firstParam(search, names) {
  var i, v;
  for (i = 0; i < names.length; i++) {
    v = search.get(names[i]);
    if (v != null && String(v).trim() !== "") return String(v);
  }
  return "";
}

export function parseQuickSearch(search) {
  var params = search instanceof URLSearchParams ? search : new URLSearchParams(search || "");
  var kind = normKind(firstParam(params, ["kind", "type", "menu", "modulo"]));
  var blob = firstParam(params, ["q", "text", "siri", "input", "frase"]);
  var parsed = blob ? parseShorthand(blob) : { title: "", amount: NaN };
  var title = firstParam(params, ["title", "titulo", "t", "nome"]) || parsed.title;
  var amountRaw = firstParam(params, ["amount", "valor", "v", "a"]);
  var amount = amountRaw ? parseAmount(amountRaw) : parsed.amount;
  var category = firstParam(params, ["category", "categoria", "cat"]);
  var day = firstParam(params, ["day", "data", "date"]) || financeStore.todayKey();
  var sequence = sequenceId(firstParam(params, ["seq", "sequence", "livro", "conta"]));
  var notes = firstParam(params, ["notes", "nota"]);
  if (!kind && (title || isFinite(amount))) kind = "expense";
  return {
    kind: kind,
    sequence: sequence,
    title: title.trim(),
    amount: amount,
    category: category.trim(),
    day: day,
    notes: notes.trim(),
    hasQuery: !!(kind || title || blob || amountRaw),
  };
}

export function canAutoSave(parsed) {
  if (!parsed || !parsed.kind) return false;
  if (parsed.kind === "expense" || parsed.kind === "income") {
    return isFinite(parsed.amount) && parsed.amount >= 0;
  }
  return !!(parsed.title && parsed.title.trim());
}

function catsFor(category, fallback) {
  if (category) return [category];
  return fallback ? [fallback] : ["Outro"];
}

function sigOf(input) {
  return [input.kind, input.sequence, input.title, input.amount, input.day, input.category].join("|");
}

export async function applyQuickCapture(input) {
  var kind = input && input.kind;
  var title = ((input && input.title) || "").trim();
  var amount = input && input.amount;
  var day = (input && input.day) || financeStore.todayKey();
  var notes = (input && input.notes) || "";
  var category = (input && input.category) || "";
  var sequence = sequenceId(input && input.sequence);
  var meta = kindMeta(kind);
  var sig = sigOf(Object.assign({}, input || {}, { sequence: sequence }));
  var row;
  var seqName = sequenceLabel(sequence);

  if (!kind) return { ok: false, error: "Escolhe: recurso ou gastos." };
  if (kind === "expense" || kind === "income") {
    if (!isFinite(amount) || amount < 0) return { ok: false, error: "Indica o valor." };
    if (!title) title = kind === "income" ? "Recurso" : "Gasto";
  } else if (!title) {
    return { ok: false, error: "Escreve o que queres adicionar." };
  }

  if (recent[sig] && Date.now() - recent[sig] < 12000) {
    return { ok: true, duplicate: true, kind: kind, title: title, amount: amount, sequence: sequence, dest: meta.dest, label: meta.label, sequenceLabel: seqName };
  }

  if (kind === "expense") {
    pauseCloudPull(8000, "expenses");
    var expenses = await financeStore.pullExpenses();
    row = financeStore.newExpense(title, amount, catsFor(category, "Outro"), day, sequence);
    if (notes) row.notes = notes;
    await financeStore.saveExpenses([row].concat(expenses || []));
  } else if (kind === "income") {
    pauseCloudPull(8000, "incomes");
    var incomes = await incomeStore.pullIncomes();
    row = incomeStore.newIncome(title, amount, catsFor(category, "Outro"), day, sequence);
    if (notes) row.notes = notes;
    await incomeStore.saveIncomes([row].concat(incomes || []));
  } else if (kind === "task") {
    pauseCloudPull(8000, "tasks");
    var tasks = await tasksStore.loadTasks();
    row = tasksStore.newInboxTask(title, notes);
    await tasksStore.saveTasksNow((tasks || []).concat([row]));
  } else if (kind === "wish") {
    pauseCloudPull(8000, "wishlist_items");
    var groups = await wishlistStore.loadGroups();
    var items = await wishlistStore.loadItems();
    var gid = groups && groups[0] ? groups[0].id : null;
    row = wishlistStore.newItem(title, gid);
    if (isFinite(amount) && amount > 0) row.price = amount;
    if (notes) row.notes = notes;
    await wishlistStore.saveItems((items || []).concat([row]));
  } else {
    return { ok: false, error: "Menu desconhecido." };
  }

  recent[sig] = Date.now();
  emitSync(meta.sync);
  return { ok: true, kind: kind, title: title, amount: amount, sequence: sequence, dest: meta.dest, label: meta.label, sequenceLabel: seqName };
}

export function shortcutUrl(kind, withQueryPlaceholder) {
  var base = quickBaseUrl() + "?kind=" + encodeURIComponent(kind || "expense");
  if (withQueryPlaceholder) return base + "&q=";
  return base;
}

export function financeCaptureUrl(kind, seq, title, amount) {
  var u = quickBaseUrl()
    + "?kind=" + encodeURIComponent(kind || "expense")
    + "&seq=" + encodeURIComponent(seq || "geral");
  if (title) u += "&title=" + encodeURIComponent(title);
  if (amount != null && String(amount) !== "" && isFinite(Number(amount))) {
    u += "&amount=" + encodeURIComponent(amount);
  }
  return u;
}
