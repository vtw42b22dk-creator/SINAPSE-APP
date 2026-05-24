/* eslint-disable no-unused-vars, no-empty */
import { supabase } from "./supabase";

export function uid(prefix) {
  return (prefix || "id") + Date.now() + Math.random().toString(36).slice(2, 8);
}

export async function getUser() {
  if (!supabase) return null;
  try {
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
    var map = {};
    remote.forEach(function(r) {
      if (r && r.id) map[r.id] = r;
    });
    local.forEach(function(l) {
      if (!l || !l.id) return;
      var r = map[l.id];
      if (!r || ts(l) > ts(r)) map[l.id] = l;
    });
    return Object.values(map);
  } catch (e) {
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
  await writeLocal(localKey, rows);
  var user = await getUser();
  if (!supabase || !user) return { ok: true, rows: rows };
  try {
    var del = await supabase.from(table).delete().eq("user_id", user.id);
    if (del.error) throw del.error;
    if (rows.length) {
      var payload = rows.map(function(row) {
        return Object.assign({}, row, { user_id: user.id, updated_at: new Date().toISOString() });
      });
      var res = await supabase.from(table).upsert(payload);
      if (res.error) throw res.error;
    }
    return { ok: true, rows: rows };
  } catch (e) {
    return { ok: false, error: e, rows: rows };
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
