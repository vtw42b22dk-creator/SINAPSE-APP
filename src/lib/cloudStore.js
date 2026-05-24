/* eslint-disable no-unused-vars, no-empty */
import { supabase } from "./supabase";

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
  return u ? u.id : "local";
}

export async function scopedKey(key) {
  var id = await currentUserId();
  return key + ":" + id;
}

export async function readLocal(key, fallback) {
  try {
    var raw = localStorage.getItem(await scopedKey(key));
    if (!raw) raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

export async function writeLocal(key, value) {
  try {
    localStorage.setItem(await scopedKey(key), JSON.stringify(value));
  } catch (e) {}
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

function stampRow(row) {
  var ms = row.updated ? Number(row.updated) : 0;
  if (!ms && row.updated_at) ms = new Date(row.updated_at).getTime();
  if (!ms || ms < 1) ms = Date.now();
  return Object.assign({}, row, { updated: ms, updated_at: new Date(ms).toISOString() });
}

function cleanPayload(row, userId) {
  var out = Object.assign({}, row, { user_id: userId });
  delete out.updated;
  delete out.created;
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
  await writeLocal(localKey, stamped);

  var user = await getUser();
  if (!supabase || !user) {
    return { ok: false, cloud: false, error: "Supabase não configurado.", rows: stamped };
  }
  if (!stamped.length) {
    return { ok: true, cloud: true, rows: [], skippedEmpty: true };
  }

  try {
    var payload = stamped.map(function(row) {
      return cleanPayload(row, user.id);
    });
    var res = await supabase.from(table).upsert(payload, { onConflict: "id" });
    if (res.error) throw res.error;

    if (options.pruneOrphans) {
      var ids = stamped.map(function(r) { return r.id; });
      var existing = await supabase.from(table).select("id").eq("user_id", user.id);
      if (existing.error) throw existing.error;
      var orphanIds = (existing.data || [])
        .map(function(r) { return r.id; })
        .filter(function(id) { return ids.indexOf(id) < 0; });
      if (orphanIds.length) {
        var del = await supabase.from(table).delete().eq("user_id", user.id).in("id", orphanIds);
        if (del.error) throw del.error;
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
  var user = await getUser();
  if (supabase && user) {
    try {
      await supabase.from(table).delete().eq("user_id", user.id).eq("id", id);
    } catch (e) {}
  }
  return next;
}
