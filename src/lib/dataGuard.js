/**
 * Proteção de dados local — backups automáticos e recuperação.
 * Tudo o que passa por readLocal/writeLocal do cloudStore fica protegido.
 */

var MAX_RING = 10;

function backupRingStorageKey(scopedDataKey) {
  return scopedDataKey + "::backup-ring";
}

function hasUsefulRows(arr) {
  return Array.isArray(arr) && arr.length > 0;
}

/** Guarda snapshot antes de alterações (só se tiver dados). */
export async function backupBeforeWrite(scopedDataKey, data, writeFn) {
  if (!hasUsefulRows(data)) return;
  try {
    var ringRaw = localStorage.getItem(backupRingStorageKey(scopedDataKey));
    var ring = ringRaw ? JSON.parse(ringRaw) : [];
    if (!Array.isArray(ring)) ring = [];
    ring.push({ at: Date.now(), n: data.length, data: data });
    if (ring.length > MAX_RING) ring = ring.slice(-MAX_RING);
    localStorage.setItem(backupRingStorageKey(scopedDataKey), JSON.stringify(ring));
  } catch (e) {}
}

export function scanAllStorageForBaseKey(baseKey) {
  var best = null;
  var bestN = 0;
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf(baseKey) < 0) continue;
      if (k.indexOf("backup-ring") >= 0 || k.indexOf("deleted-v1") >= 0) continue;
      try {
        var data = JSON.parse(localStorage.getItem(k) || "null");
        if (hasUsefulRows(data) && data.length > bestN) {
          bestN = data.length;
          best = { key: k, data: data };
        }
      } catch (e) {}
    }
  } catch (e) {}
  return best;
}

export function recoverFromRing(scopedDataKey) {
  try {
    var ringRaw = localStorage.getItem(backupRingStorageKey(scopedDataKey));
    if (!ringRaw) return null;
    var ring = JSON.parse(ringRaw);
    if (!Array.isArray(ring) || !ring.length) return null;
    var best = ring[0];
    for (var j = 0; j < ring.length; j++) {
      if (ring[j].data && ring[j].data.length > (best.data || []).length) best = ring[j];
    }
    return best && best.data ? best.data : null;
  } catch (e) {
    return null;
  }
}

/**
 * Se o pull reduzir dados sem motivo, repõe união com o estado anterior + backup.
 */
export function guardMergeResult(localBefore, merged, deletedIds) {
  var before = localBefore || [];
  var after = merged || [];
  if (!before.length) return after;
  if (!after.length) return before.slice();

  var deleted = {};
  (deletedIds || []).forEach(function(id) { if (id) deleted[id] = true; });
  var allowedDrop = 0;
  before.forEach(function(row) {
    if (row && row.id && deleted[row.id]) allowedDrop++;
  });

  var minExpected = before.length - allowedDrop;
  if (after.length >= minExpected) return after;

  var map = {};
  after.forEach(function(r) {
    if (r && r.id) map[r.id] = r;
  });
  before.forEach(function(l) {
    if (!l || !l.id || deleted[l.id]) return;
    if (!map[l.id]) map[l.id] = l;
  });
  return Object.values(map);
}

export async function readWithRecovery(baseKey, scopedDataKey, readScopedFn) {
  var cur = await readScopedFn();
  if (hasUsefulRows(cur)) return cur;

  var fromRing = recoverFromRing(scopedDataKey);
  if (hasUsefulRows(fromRing)) {
    return fromRing;
  }

  var scanned = scanAllStorageForBaseKey(baseKey);
  if (scanned && hasUsefulRows(scanned.data)) {
    return scanned.data;
  }

  return Array.isArray(cur) ? cur : [];
}

export async function writeSafe(scopedDataKey, next, readScopedFn, writeScopedFn) {
  var prev = await readScopedFn();
  if (hasUsefulRows(prev)) {
    await backupBeforeWrite(scopedDataKey, prev, writeScopedFn);
  }
  if (!hasUsefulRows(next) && hasUsefulRows(prev)) {
    return prev;
  }
  await writeScopedFn(next || []);
  return next || [];
}
