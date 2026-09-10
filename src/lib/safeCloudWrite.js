/* eslint-disable no-empty */
import { supabase } from "./supabase";

async function refreshSessionForWrite() {
  if (!supabase) return null;
  try {
    var res = await supabase.auth.refreshSession();
    return res.data && res.data.session ? res.data.session : null;
  } catch (e) {
    return null;
  }
}

var EMERGENCY_PREFIX = "sinapse-emergency-v1:";

/** Verifica sessão ativa; tenta refresh antes de escrever na nuvem. */
export async function ensureWriteSession() {
  if (!supabase) {
    return { canWriteCloud: false, user: null, reason: "Supabase não configurado" };
  }
  try {
    var ses = await supabase.auth.getSession();
    if (ses.data && ses.data.session && ses.data.session.user) {
      return { canWriteCloud: true, user: ses.data.session.user, reason: null };
    }
    var refreshed = await refreshSessionForWrite();
    if (refreshed && refreshed.user) {
      return { canWriteCloud: true, user: refreshed.user, reason: null };
    }
  } catch (e) {}
  return { canWriteCloud: false, user: null, reason: "Sessão expirada — inicia sessão no Hub" };
}

export function saveEmergencyDraft(localKey, rows, table) {
  if (!localKey || !rows || !rows.length) return;
  try {
    localStorage.setItem(
      EMERGENCY_PREFIX + localKey,
      JSON.stringify({ at: Date.now(), rows: rows, table: table || null })
    );
  } catch (e) {}
}

export function clearEmergencyDraft(localKey) {
  try {
    localStorage.removeItem(EMERGENCY_PREFIX + localKey);
  } catch (e) {}
}

export function hasEmergencyDraft(localKey) {
  try {
    return !!localStorage.getItem(EMERGENCY_PREFIX + localKey);
  } catch (e) {
    return false;
  }
}

/** Rascunhos que ficaram em espera por falta de sessão ou de rede. */
export function listEmergencyDrafts() {
  var out = [];
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf(EMERGENCY_PREFIX) !== 0) continue;
      var localKey = k.slice(EMERGENCY_PREFIX.length);
      var parsed = null;
      try { parsed = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { parsed = null; }
      if (!parsed || !parsed.table || !Array.isArray(parsed.rows) || !parsed.rows.length) continue;
      out.push({ localKey: localKey, table: parsed.table, rows: parsed.rows, at: parsed.at || 0 });
    }
  } catch (e) {}
  return out;
}
