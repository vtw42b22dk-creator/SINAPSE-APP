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

export function saveEmergencyDraft(localKey, rows) {
  if (!localKey || !rows || !rows.length) return;
  try {
    localStorage.setItem(
      EMERGENCY_PREFIX + localKey,
      JSON.stringify({ at: Date.now(), rows: rows })
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
