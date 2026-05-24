/* eslint-disable no-unused-vars, no-empty */
import { supabase } from "./supabase";
import {
  backupBeforeWrite,
  readWithRecovery,
  recoverFromRing,
  scanAllStorageForBaseKey,
  collectAllRingSnapshots,
  collectAllStorageArraysForBaseKey,
  mergeRowArrays,
  isValidRowArray,
} from "./dataGuard";
import { ensureWriteSession, saveEmergencyDraft, clearEmergencyDraft } from "./safeCloudWrite";

var LAST_USER_KEY = "sinapse-last-user-id-v1";

export function uid(prefix) {
  return (prefix || "id") + Date.now() + Math.random().toString(36).slice(2, 8);
}

export function cloudErrorMessage(err) {
  if (!err) return "erro desconhecido";
  if (typeof err === "string") return err;
  return err.message || err.details || err.hint || String(err);
}

export async function getUser() {
  if (!supabase) return null;
  try {
    var ses = await supabase.auth.getSession();
    if (ses.data && ses.data.session && ses.data.session.user) return ses.data.session.user;
    var res = await supabase.auth.getUser();
    return res && res.data ? res.data.user : null;
  } catch (e) {
    return null;
  }
}

export async function refreshSession() {
  if (!supabase) return null;
  try {
    var res = await supabase.auth.refreshSession();
    return res.data && res.data.session ? res.data.session : null;
  } catch (e) {
    return null;
  }
}

export async function currentUserId() {
  var u = await getUser();
  if (u && u.id) {
    try { localStorage.setItem(LAST_USER_KEY, u.id); } catch (e) {}
    return u.id;
  }
  try {
    var last = localStorage.getItem(LAST_USER_KEY);
    if (last) return last;
  } catch (e) {}
  return "local";
}

export async function scopedKey(key) {
  var id = await currentUserId();
  return key + ":" + id;
}

export async function readLocal(key, fallback) {
  try {
    var sk = await scopedKey(key);
    return await readWithRecovery(key, sk, async function() {
      var raw = localStorage.getItem(sk);
      if (!raw) raw = localStorage.getItem(key);
      if (!raw) return Array.isArray(fallback) ? fallback.slice() : fallback;
      return JSON.parse(raw);
    });
  } catch (e) {
    return Array.isArray(fallback) ? fallback.slice() : fallback;
  }
}

export async function writeLocal(key, value) {
  try {
    var sk = await scopedKey(key);
    var prev = [];
    try {
      var raw = localStorage.getItem(sk);
      if (raw) prev = JSON.parse(raw);
    } catch (e) {}
    if (Array.isArray(prev) && prev.length) {
      await backupBeforeWrite(sk, prev);
    }
    if ((!value || !value.length) && Array.isArray(prev) && prev.length) {
      return;
    }
    localStorage.setItem(sk, JSON.stringify(value || []));
  } catch (e) {}
}

function pickNewerRow(a, b) {
  var ta = a.updated || a.updated_at || 0;
  var tb = b.updated || b.updated_at || 0;
  if (typeof ta === "string") ta = new Date(ta).getTime();
  if (typeof tb === "string") tb = new Date(tb).getTime();
  return Number(ta) >= Number(tb) ? a : b;
}

/** Grava à força e confirma que ficou guardado (recuperação). */
export async function forceWriteLocal(key, value) {
  if (!isValidRowArray(value)) {
    return { ok: false, error: "Dados inválidos" };
  }
  try {
    var sk = await scopedKey(key);
    var payload = JSON.stringify(value);
    localStorage.setItem(sk, payload);
    try { localStorage.setItem(key, payload); } catch (e) {}
    var verify = JSON.parse(localStorage.getItem(sk) || "[]");
    if (!isValidRowArray(verify) || verify.length < value.length) {
      return { ok: false, error: "Gravação não confirmada (armazenamento cheio?)" };
    }
    return { ok: true, count: verify.length };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

/** Junta TODAS as cópias do anel + outras chaves e grava. */
export async function restoreFromBackups(key) {
  var sk = await scopedKey(key);
  var arrays = collectAllRingSnapshots(sk);
  arrays = arrays.concat(collectAllStorageArraysForBaseKey(key));
  var fromRing = recoverFromRing(sk);
  if (fromRing && fromRing.length) arrays.push(fromRing);
  var merged = mergeRowArrays(arrays, pickNewerRow);
  if (!merged.length) {
    var scanned = scanAllStorageForBaseKey(key);
    if (scanned && isValidRowArray(scanned.data)) merged = scanned.data;
  }
  if (!merged.length) return { ok: false, reason: "Sem cópias válidas" };
  var wrote = await forceWriteLocal(key, merged);
  if (!wrote.ok) return { ok: false, reason: wrote.error || "Falha ao gravar" };
  return { ok: true, count: wrote.count, source: "backup" };
}

function ts(row) {
  if (!row) return 0;
  if (row.updated_at) return new Date(row.updated_at).getTime();
  if (row.updated) return Number(row.updated);
  if (row.created_at) return new Date(row.created_at).getTime();
  if (row.created) return Number(row.created);
  return 0;
}

export function mergeRowsByTimestamp(local, remote) {
  var map = {};
  (remote || []).forEach(function(r) {
    if (r && r.id) map[r.id] = r;
  });
  (local || []).forEach(function(l) {
    if (!l || !l.id) return;
    var r = map[l.id];
    if (!r || ts(l) > ts(r)) map[l.id] = l;
  });
  return Object.values(map);
}

function tombstoneKey(localKey) {
  return localKey + "-deleted-v1";
}

function deletedSet(deletedIds) {
  var d = {};
  (deletedIds || []).forEach(function(id) {
    if (id) d[id] = true;
  });
  return d;
}

/** Regista ids apagados neste dispositivo (a sync não os repõe). */
export async function markLocalDeleted(localKey, ids) {
  if (!ids || !ids.length) return;
  var cur = await readLocal(tombstoneKey(localKey), []);
  var map = deletedSet(cur);
  ids.forEach(function(id) {
    if (id) map[id] = true;
  });
  var list = Object.keys(map);
  if (list.length > 1000) list = list.slice(-1000);
  await writeLocal(tombstoneKey(localKey), list);
}

export async function getLocalDeletedIds(localKey) {
  return await readLocal(tombstoneKey(localKey), []);
}

export async function clearLocalDeleted(localKey) {
  await writeLocal(tombstoneKey(localKey), []);
}

/**
 * Ao trazer da nuvem: remoto define existência, mas NUNCA apaga tudo local
 * se a nuvem vier vazia; ids em tombstones não voltam.
 */
export function mergePullFromRemote(local, remote, deletedIds) {
  var loc = local || [];
  var rem = remote || [];
  var deleted = deletedSet(deletedIds);
  if (!rem.length) {
    return loc.length ? loc.slice() : [];
  }
  var map = {};
  rem.forEach(function(r) {
    if (r && r.id && !deleted[r.id]) map[r.id] = r;
  });
  loc.forEach(function(l) {
    if (!l || !l.id || deleted[l.id]) return;
    var r = map[l.id];
    if (r) {
      if (ts(l) > ts(r)) map[l.id] = l;
    } else {
      map[l.id] = l;
    }
  });
  return Object.values(map);
}

export async function mergePullFromRemoteAsync(local, remote, localKey) {
  var deletedIds = await getLocalDeletedIds(localKey);
  return mergePullFromRemote(local, remote, deletedIds);
}

/** Não sobrescrever localStorage com [] se já havia dados. */
export async function safeWriteLocal(key, next, prev) {
  var previous = prev;
  if (previous === undefined) {
    try { previous = await readLocal(key, []); } catch (e) { previous = []; }
  }
  if (!next || !next.length) {
    if (previous && previous.length) return;
  }
  await writeLocal(key, next || []);
}

function stampRow(row) {
  var ms = row.updated ? Number(row.updated) : 0;
  if (!ms && row.updated_at) ms = new Date(row.updated_at).getTime();
  if (!ms || ms < 1) ms = Date.now();
  return Object.assign({}, row, { updated: ms, updated_at: new Date(ms).toISOString() });
}

function safeOrderIndex(value) {
  var n = value != null ? Number(value) : Math.floor(Date.now() / 1000);
  if (!isFinite(n)) n = 0;
  if (n > 2147483647) n = Math.floor(n / 1000);
  if (n > 2147483647) n = 2147483647;
  if (n < 0) n = 0;
  return Math.floor(n);
}

function cleanPayload(row, userId) {
  var out = Object.assign({}, row, { user_id: userId });
  delete out.updated;
  delete out.created;
  if (out.order_index != null) out.order_index = safeOrderIndex(out.order_index);
  return out;
}

export async function fetchRemoteRows(table, normalizeFn) {
  var user = await getUser();
  if (!supabase || !user) return [];
  var res = await supabase.from(table).select("*").eq("user_id", user.id);
  if (res.error) throw res.error;
  return (res.data || []).map(function(r) {
    return normalizeFn ? normalizeFn(r) : r;
  });
}

export async function selectRowsMerged(table, localKey, fallback, normalizeFn) {
  var local = await readLocal(localKey, fallback);
  if (!Array.isArray(local)) local = fallback ? fallback.slice() : [];
  var user = await getUser();
  if (!supabase || !user) return local;
  try {
    var remote = await fetchRemoteRows(table, normalizeFn);
    if (!remote.length) return local.length ? local : (fallback ? fallback.slice() : []);
    var merged = mergeRowsByTimestamp(local, remote);
    await writeLocal(localKey, merged);
    return merged;
  } catch (e) {
    console.warn("[Sinapse] leitura:", table, cloudErrorMessage(e));
    return local;
  }
}

export async function selectRows(table, localKey, fallback) {
  return selectRowsMerged(table, localKey, fallback, null);
}

export async function upsertRows(table, localKey, rows) {
  return replaceRows(table, localKey, rows, { pruneOrphans: false });
}

/**
 * Grava na nuvem. Nunca apaga tudo na nuvem com lista vazia (evita wipe acidental).
 * pruneOrphans: remove linhas na nuvem que já não estão na lista (após upsert OK).
 */
export async function replaceRows(table, localKey, rows, options) {
  options = options || {};
  var stamped = (rows || []).map(stampRow);
  var previous = await readLocal(localKey, []);
  if (!stamped.length && previous && previous.length) {
    return { ok: true, cloud: true, rows: previous, skippedEmpty: true, keptLocal: true };
  }
  await writeLocal(localKey, stamped);

  if (!stamped.length) {
    return { ok: true, cloud: true, rows: [], skippedEmpty: true };
  }

  if (!supabase) {
    saveEmergencyDraft(localKey, stamped);
    return { ok: true, cloud: false, emergency: true, error: "Supabase não configurado.", rows: stamped };
  }

  var session = await ensureWriteSession();
  if (!session.canWriteCloud || !session.user) {
    saveEmergencyDraft(localKey, stamped);
    return {
      ok: true,
      cloud: false,
      emergency: true,
      error: session.reason || "Sem sessão",
      rows: stamped,
    };
  }

  try {
    var payload = stamped.map(function(row) {
      return cleanPayload(row, session.user.id);
    });
    var res = await supabase.from(table).upsert(payload, { onConflict: "id" });
    if (res.error) throw res.error;
    clearEmergencyDraft(localKey);

    if (options.pruneOrphans === true) {
      var ids = stamped.map(function(r) { return r.id; });
      var existing = await supabase.from(table).select("id").eq("user_id", user.id);
      if (existing.error) throw existing.error;
      var orphanIds = (existing.data || [])
        .map(function(r) { return r.id; })
        .filter(function(id) { return ids.indexOf(id) < 0; });
      if (orphanIds.length) {
        var del = await supabase.from(table).delete().eq("user_id", user.id).in("id", orphanIds);
        if (del.error) throw del.error;
        await markLocalDeleted(localKey, orphanIds);
      }
    }

    return { ok: true, cloud: true, rows: stamped };
  } catch (e) {
    var msg = cloudErrorMessage(e);
    console.warn("[Sinapse] gravação falhou:", table, msg);
    try {
      sessionStorage.setItem("sinapse-last-cloud-error", table + ": " + msg);
    } catch (ex) {}
    return { ok: false, cloud: false, error: msg, rows: stamped };
  }
}

export async function deleteRow(table, localKey, rows, id) {
  var next = rows.filter(function(row) { return row.id !== id; });
  await writeLocal(localKey, next);
  await deleteRemoteIds(table, [id]);
  return next;
}

/** Apaga linhas na nuvem por id (eliminar tema, grupo, etc.). */
export async function deleteRemoteIds(table, ids, localKey) {
  if (!ids || !ids.length) return { ok: true };
  var user = await getUser();
  if (!supabase || !user) return { ok: false, error: "Sem ligação" };
  try {
    var res = await supabase.from(table).delete().eq("user_id", user.id).in("id", ids);
    if (res.error) throw res.error;
    if (localKey) await markLocalDeleted(localKey, ids);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: cloudErrorMessage(e) };
  }
}
