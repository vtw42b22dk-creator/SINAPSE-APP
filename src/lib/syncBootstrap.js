import {
  flushPendingDeletes,
  migrateLegacyScopes,
  replayEmergencyDrafts,
} from "./cloudStore";
import * as calendarStore from "./calendarStore";
import * as tasksStore from "./tasksStore";
import * as synapseStore from "./synapseStore";
import * as projectModuleStore from "./projectModuleStore";
import * as journalStore from "./journalStore";
import * as wishlistStore from "./wishlistStore";
import * as financeStore from "./financeStore";
import * as incomeStore from "./incomeStore";

var CORE_KEYS = [
  "sinapse-calendar-v3",
  "sinapse-calendar-v2",
  "sinapse-tasks-v2",
  "sinapse-tasks-v1",
  "sinapse-projects-v1",
  "journal-spaces-v1",
  "journal-blocks-v1",
  "journal-note-layout-v1",
  "wishlist-items-v1",
  "wishlist-groups-v1",
  "finance-categories-v1",
  "expenses-v1",
  "income-categories-v1",
  "incomes-v1",
];

function extraLocalKeys() {
  var extra = [];
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k) continue;
      if (k.indexOf("project-module-v1:") === 0) {
        var parts = k.split(":");
        if (parts.length >= 3) extra.push(parts.slice(0, 3).join(":"));
      }
    }
  } catch (e) {}
  return extra;
}

export async function bootstrapSync() {
  await migrateLegacyScopes(CORE_KEYS.concat(extraLocalKeys()));
  await flushPendingDeletes();
  await replayEmergencyDrafts();
  return pullAllCore();
}

export async function pullAllCore() {
  var projects = [];
  try { await calendarStore.loadEvents(); } catch (e) {}
  try { await tasksStore.loadTasks(); } catch (e) {}
  try { await journalStore.pullSpaces(); } catch (e) {}
  try { await journalStore.pullBlocks(); } catch (e) {}
  try { await journalStore.pullNoteLayout(); } catch (e) {}
  try { await wishlistStore.loadGroups(); } catch (e) {}
  try { await wishlistStore.loadItems(); } catch (e) {}
  try { await financeStore.loadCategories(); } catch (e) {}
  try { await financeStore.loadExpenses(); } catch (e) {}
  try { await incomeStore.loadCategories(); } catch (e) {}
  try { await incomeStore.loadIncomes(); } catch (e) {}
  try { projects = await synapseStore.loadProjects(); } catch (e) { projects = []; }
  await Promise.all((projects || []).map(function(p) {
    if (!p || !p.id) return Promise.resolve();
    return projectModuleStore.pullProjectModules(p.id).catch(function() {});
  }));
}

export async function pushPendingSync() {
  await flushPendingDeletes();
  await replayEmergencyDrafts();
}
