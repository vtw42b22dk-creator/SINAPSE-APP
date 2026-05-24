/* eslint-disable no-unused-vars, no-empty */
import { supabase } from "./supabase";

export function uid(prefix) {
  return (prefix || "id") + Date.now() + Math.random().toString(36).slice(2, 8);
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

function mergeByTimestamp(local, remote) {
  var map = {};
  (remote || []).forEach(function(r) {
    if (r && r.id) map[r.id] = r;
  });
  (local || []).forEach(function(l) {
    if (!l || !l.id) return;
    var r = map[l.id];
    if (!r || ts(l) >= ts(r)) map[l.id] = l;
  });
  return Object.values(map);
}

export async function selectRowsMerged(table, localKey, fallback, normalizeFn) {
  var local = await readLocal(localKey, fallback);
  if (!Array.isArray(local)) local = fallback ? fallback.slice() : [];
  var user = await getUser();
  if (!supabase || !user) return local;
  try {
    var res = await supabase.from(table).select("*").eq("user_id", user.id);
    if (res.error) throw res.error;
    var remote = (res.data || []).map(function(r) {
      return normalizeFn ? normalizeFn(r) : r;
    });
    if (!remote.length) return local.length ? local : (fallback ? fallback.slice() : []);
    var merged = mergeByTimestamp(local, remote);
    await writeLocal(localKey, merged);
    return merged;
  } catch (e) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[Sinapse] leitura nuvem falhou:", table, e.message || e);
    }
    return local;
  }
}

export async function selectRows(table, localKey, fallback) {
  return selectRowsMerged(table, localKey, fallback, null);
}

export async function upsertRows(table, localKey, rows) {
  await writeLocal(localKey, rows);
  var user = await getUser();
  if (!supabase || !user) return { ok: true, rows: rows };
  try {
    var payload = rows.map(function(row) {
      return Object.assign({}, row, { user_id: user.id, updated_at: new Date().toISOString() });
    });
    var res = await supabase.from(table).upsert(payload);
    if (res.error) throw res.error;
    return { ok: true, rows: rows };
  } catch (e) {
    return { ok: false, error: e, rows: rows };
  }
}

export async function replaceRows(table, localKey, rows) {
  var now = new Date().toISOString();
  var stamped = (rows || []).map(function(row) {
    return Object.assign({}, row, { updated: Date.now(), updated_at: now });
  });
  await writeLocal(localKey, stamped);
  var user = await getUser();
  if (!supabase || !user) return { ok: true, rows: stamped };
  try {
    var ids = stamped.map(function(r) { return r.id; });
    if (stamped.length) {
      var payload = stamped.map(function(row) {
        return Object.assign({}, row, { user_id: user.id, updated_at: now });
      });
      var res = await supabase.from(table).upsert(payload, { onConflict: "id" });
      if (res.error) throw res.error;
    }
    var existing = await supabase.from(table).select("id").eq("user_id", user.id);
    if (existing.error) throw existing.error;
    var orphanIds = (existing.data || [])
      .map(function(r) { return r.id; })
      .filter(function(id) { return ids.indexOf(id) < 0; });
    if (orphanIds.length) {
      var del = await supabase.from(table).delete().eq("user_id", user.id).in("id", orphanIds);
      if (del.error) throw del.error;
    }
    return { ok: true, rows: stamped };
  } catch (e) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[Sinapse] gravação nuvem falhou:", table, e.message || e);
    }
    return { ok: false, error: e, rows: stamped };
  }
}

export async function deleteRow(table, localKey, rows, id) {
  var next = rows.filter(function(row) { return row.id !== id; });
  await writeLocal(localKey, next);
  var user = await getUser();
  if (supabase && user) {
    try { await supabase.from(table).delete().eq("user_id", user.id).eq("id", id); } catch (e) {}
  }
  return next;
}
