import {
  deleteRemoteIds,
  getUser,
  readLocal,
  replaceRows,
  uid,
  writeLocal,
  scopedKey,
} from "./cloudStore";
import { safePullMerge } from "./syncEngine";
import { hydrateJournalBlocks, stripAttachmentRef } from "./attachmentsStore";
import { supabase } from "./supabase";

var SPACES = "journal-spaces-v1";
var BLOCKS = "journal-blocks-v1";
var NOTE_LAYOUT_KEY = "journal-note-layout-v1";
var NOTE_LAYOUT_TABLE = "journal_note_layout";
var LAYOUT_ROW_ID = "layout";
var LEGACY_NOTE_BLOCKS_KEY = "sinapse-journal-note-blocks-v1";

function emptyNoteLayout() {
  return { blocks: [], assign: {}, collapsed: {}, updated: 0 };
}

function normalizeNoteLayoutRow(row) {
  if (!row) return Object.assign({ id: LAYOUT_ROW_ID, updated: 0 }, emptyNoteLayout());
  var p = row.payload || row.data || {};
  if (typeof p === "string") {
    try { p = JSON.parse(p); } catch (e) { p = {}; }
  }
  return {
    id: row.id || LAYOUT_ROW_ID,
    blocks: Array.isArray(p.blocks) ? p.blocks : [],
    assign: p.assign && typeof p.assign === "object" ? p.assign : {},
    collapsed: p.collapsed && typeof p.collapsed === "object" ? p.collapsed : {},
    updated: row.updated || (row.updated_at ? new Date(row.updated_at).getTime() : 0),
  };
}

function noteLayoutToDb(layout) {
  var l = layout || emptyNoteLayout();
  return {
    id: LAYOUT_ROW_ID,
    payload: {
      blocks: l.blocks || [],
      assign: l.assign || {},
      collapsed: l.collapsed || {},
    },
    updated: l.updated || Date.now(),
  };
}

function layoutScore(layout) {
  if (!layout) return 0;
  var n = (layout.blocks || []).length;
  var assign = layout.assign || {};
  n += Object.keys(assign).length;
  return n;
}

function pickNewerLayout(a, b) {
  var sa = layoutScore(a);
  var sb = layoutScore(b);
  if (sa === 0 && sb > 0) return b;
  if (sb === 0 && sa > 0) return a;
  var ta = (a && a.updated) || 0;
  var tb = (b && b.updated) || 0;
  return ta >= tb ? a : b;
}

async function migrateLegacyNoteLayout() {
  try {
    var sk = await scopedKey(NOTE_LAYOUT_KEY);
    if (localStorage.getItem(sk)) return;
    var raw = localStorage.getItem(LEGACY_NOTE_BLOCKS_KEY);
    if (!raw) return;
    var v = JSON.parse(raw);
    var row = noteLayoutToDb(Object.assign(emptyNoteLayout(), v || {}, { updated: Date.now() }));
    await writeLocal(NOTE_LAYOUT_KEY, [row]);
  } catch (e) {}
}

var LAYOUT_BLOCK_ID = "journal-layout-block";
var LAYOUT_BLOCK_TYPE = "__layout__";

function isLayoutBlock(b) {
  return !!(b && (b.id === LAYOUT_BLOCK_ID || b.type === LAYOUT_BLOCK_TYPE));
}

function layoutFromBlock(b) {
  if (!b) return null;
  try {
    var p = b.content;
    if (typeof p === "string") p = JSON.parse(p);
    if (!p || typeof p !== "object") return null;
    return normalizeNoteLayoutRow({
      id: LAYOUT_ROW_ID,
      payload: p,
      updated: b.updated || (b.updated_at ? new Date(b.updated_at).getTime() : 0),
    });
  } catch (e) {
    return null;
  }
}

function layoutToBlock(layout) {
  var l = layout || emptyNoteLayout();
  return {
    id: LAYOUT_BLOCK_ID,
    space_id: LAYOUT_BLOCK_ID,
    type: LAYOUT_BLOCK_TYPE,
    content: JSON.stringify({
      blocks: l.blocks || [],
      assign: l.assign || {},
      collapsed: l.collapsed || {},
    }),
    meta: {},
    order_index: 0,
    updated: l.updated || Date.now(),
  };
}

function stripLayoutBlocks(list) {
  return (list || []).filter(function(b) { return !isLayoutBlock(b); });
}

function extractLayoutFromBlocks(list) {
  var found = (list || []).find(isLayoutBlock);
  return found ? layoutFromBlock(found) : null;
}

function normalizeSpace(s) {
  return {
    id: s.id,
    title: s.title || "Tema",
    color: s.color || "#E6E6E9",
    updated: s.updated || (s.updated_at ? new Date(s.updated_at).getTime() : 0),
  };
}

function normalizeBlock(b) {
  return {
    id: b.id,
    space_id: b.space_id,
    type: b.type || "text",
    content: b.content || "",
    meta: b.meta && typeof b.meta === "object" ? b.meta : {},
    order_index: b.order_index || 0,
    updated: b.updated_at ? new Date(b.updated_at).getTime() : (b.updated || 0),
  };
}

function textLen(html) {
  if (!html) return 0;
  return String(html).replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length;
}

function pickRicherBlock(a, b) {
  var la = textLen(a.content);
  var lb = textLen(b.content);
  var ta = a.updated || 0;
  var tb = b.updated || 0;
  if (la === 0 && lb > 0) return b;
  if (lb === 0 && la > 0) return a;
  if (ta > tb) return a;
  if (tb > ta) return b;
  return la >= lb ? a : b;
}

/** Junta blocos preferindo texto mais completo (evita apagar conteúdo). */
export function mergeBlocksByContent(local, remote) {
  var map = {};
  (remote || []).forEach(function(r) {
    var n = normalizeBlock(r);
    if (n.id) map[n.id] = n;
  });
  (local || []).forEach(function(l) {
    var nl = normalizeBlock(l);
    if (!nl.id) return;
    var r = map[nl.id];
    map[nl.id] = r ? pickRicherBlock(nl, r) : nl;
  });
  return Object.values(map);
}

/** Pull: junta com remoto; se remoto vazio, mantém local (nunca wipe). */
export function mergeBlocksForPull(local, remote, editingBlock, deletedIds) {
  var loc = local || [];
  var rem = remote || [];
  var deleted = {};
  (deletedIds || []).forEach(function(id) { if (id) deleted[id] = true; });
  rem = rem.filter(function(r) {
    var n = normalizeBlock(r);
    return n.id && !deleted[n.id];
  });
  if (!rem.length) {
    if (!loc.length) return [];
    return loc.map(function(l) { return normalizeBlock(l); });
  }
  var editingId = editingBlock && editingBlock.id;
  var map = {};
  rem.forEach(function(r) {
    var n = normalizeBlock(r);
    if (n.id) map[n.id] = n;
  });
  loc.forEach(function(l) {
    var nl = normalizeBlock(l);
    if (!nl.id) return;
    var r = map[nl.id];
    if (r) map[nl.id] = pickRicherBlock(nl, r);
    else if (!deleted[nl.id]) map[nl.id] = nl;
  });
  return Object.values(map);
}

function blocksToUi(merged) {
  return hydrateJournalBlocks(
    merged.map(function(b) {
      return {
        id: b.id,
        space_id: b.space_id,
        type: b.type,
        content: b.content,
        meta: b.meta,
        order_index: b.order_index,
        updated: b.updated || 0,
      };
    })
  );
}

function overlayEditingBlock(merged, editingBlock) {
  if (!editingBlock || !editingBlock.id) return merged;
  var map = {};
  merged.forEach(function(b) {
    map[b.id] = b;
  });
  var nc = normalizeBlock(editingBlock);
  var prev = map[editingBlock.id];
  map[editingBlock.id] = prev ? pickRicherBlock(nc, prev) : nc;
  return Object.values(map);
}

function sanitizeBlockForSave(b) {
  var meta = Object.assign({}, b.meta || {});
  if (meta.attachment) meta.attachment = stripAttachmentRef(meta.attachment);
  var content = b.content || "";
  if (content.length > 200000 && meta.attachment && meta.attachment.url) content = meta.attachment.url;
  try {
    JSON.stringify(meta);
  } catch (e) {
    meta = {};
  }
  return {
    id: b.id,
    space_id: b.space_id,
    type: b.type || "text",
    content: content,
    meta: meta,
    order_index: b.order_index || 0,
    updated: b.updated || Date.now(),
  };
}

export async function loadSpacesLocal() {
  var local = await readLocal(SPACES, []);
  if (!local.length) {
    var blocks = await readLocal(BLOCKS, []);
    var seen = {};
    (blocks || []).forEach(function(b) {
      if (b && b.space_id && !isLayoutBlock(b)) seen[b.space_id] = true;
    });
    local = Object.keys(seen).map(function(id) {
      return { id: id, title: "Recuperado", color: "#E6E6E9", updated: Date.now() };
    });
    if (local.length) await writeLocal(SPACES, local);
  }
  return local;
}

export async function loadBlocksLocal() {
  var local = await readLocal(BLOCKS, []);
  return blocksToUi(stripLayoutBlocks(local));
}

export async function pullSpaces() {
  try {
    var merged = await safePullMerge(SPACES, "journal_spaces", normalizeSpace);
    return merged || [];
  } catch (e) {
    return loadSpacesLocal();
  }
}

export async function pullBlocks(editingBlock) {
  try {
    var merged = await safePullMerge(BLOCKS, "journal_blocks", normalizeBlock, function(local, remote, deletedIds) {
      return overlayEditingBlock(mergeBlocksForPull(local, remote, editingBlock, deletedIds), editingBlock);
    });
    return blocksToUi(stripLayoutBlocks(merged));
  } catch (e) {
    return loadBlocksLocal();
  }
}

export async function loadSpaces() {
  var rows = await selectRowsMerged("journal_spaces", SPACES, [], normalizeSpace);
  if (!rows.length) return [{ id: uid("js"), title: "Livre", color: "#E6E6E9" }];
  return rows;
}

export async function saveSpaces(spaces) {
  return replaceRows(
    "journal_spaces",
    SPACES,
    (spaces || []).map(function(s) {
      return { id: s.id, title: s.title, color: s.color || "#E6E6E9", updated: Date.now() };
    }),
    { pruneOrphans: false }
  );
}

export async function loadBlocks() {
  return loadBlocksLocal();
}

export async function saveBlocks(blocks, layout) {
  var rows = stripLayoutBlocks(blocks || []).map(sanitizeBlockForSave);
  if (layout) rows.push(sanitizeBlockForSave(layoutToBlock(layout)));
  else {
    var existing = extractLayoutFromBlocks(await readLocal(BLOCKS, []));
    if (existing) rows.push(sanitizeBlockForSave(layoutToBlock(existing)));
  }
  if (!rows.length) {
    return { ok: true, cloud: true, rows: [], skippedEmpty: true };
  }
  return replaceRows("journal_blocks", BLOCKS, rows, { pruneOrphans: false });
}

export async function saveAll(spaces, blocks, layout) {
  var s = await saveSpaces(spaces || []);
  var b = await saveBlocks(blocks || [], layout);
  var l = layout ? await saveNoteLayout(layout) : { ok: true };
  return { ok: s.ok && b.ok && l.ok, error: s.error || b.error || l.error, spaces: s, blocks: b, layout: l };
}

export async function loadNoteLayoutLocal() {
  await migrateLegacyNoteLayout();
  var rows = await readLocal(NOTE_LAYOUT_KEY, []);
  var row = rows.find(function(r) { return r && r.id === LAYOUT_ROW_ID; });
  if (!row) return Object.assign({ id: LAYOUT_ROW_ID, updated: 0 }, emptyNoteLayout());
  return normalizeNoteLayoutRow(row);
}

export async function pullNoteLayout() {
  try {
    var localRows = await readLocal(NOTE_LAYOUT_KEY, []);
    var localRow = localRows.find(function(r) { return r && r.id === LAYOUT_ROW_ID; });
    var local = normalizeNoteLayoutRow(localRow);
    var fromBlocks = extractLayoutFromBlocks(await readLocal(BLOCKS, []));
    var tableRow = null;
    try {
      var merged = await safePullMerge(NOTE_LAYOUT_KEY, NOTE_LAYOUT_TABLE, normalizeNoteLayoutRow);
      tableRow = merged.find(function(r) { return r && r.id === LAYOUT_ROW_ID; });
    } catch (e) {}
    var remote = tableRow ? normalizeNoteLayoutRow(tableRow) : emptyNoteLayout();
    var picked = pickNewerLayout(pickNewerLayout(local, remote), fromBlocks || emptyNoteLayout());
    await writeLocal(NOTE_LAYOUT_KEY, [noteLayoutToDb(picked)]);
    return picked;
  } catch (e) {
    return loadNoteLayoutLocal();
  }
}

export async function saveNoteLayout(layout) {
  var row = noteLayoutToDb(Object.assign({}, layout || emptyNoteLayout(), { updated: Date.now() }));
  await writeLocal(NOTE_LAYOUT_KEY, [row]);
  var blockRes = { ok: true };
  try {
    var all = await readLocal(BLOCKS, []);
    var content = stripLayoutBlocks(all);
    var layoutBlock = sanitizeBlockForSave(layoutToBlock(row));
    if (content.length || all.length) {
      await writeLocal(BLOCKS, content.concat([layoutBlock]));
    }
    var user = await getUser();
    if (supabase && user) {
      var payload = Object.assign({}, layoutBlock, {
        user_id: user.id,
        updated_at: new Date(layoutBlock.updated || Date.now()).toISOString(),
      });
      delete payload.updated;
      delete payload.created;
      var res = await supabase.from("journal_blocks").upsert(payload, { onConflict: "id" });
      if (res.error) throw res.error;
      blockRes = { ok: true, cloud: true };
    }
  } catch (e) {
    blockRes = { ok: false, error: e && e.message ? e.message : String(e) };
  }
  var tableRes = await replaceRows(NOTE_LAYOUT_TABLE, NOTE_LAYOUT_KEY, [row], { pruneOrphans: false });
  return {
    ok: !!(tableRes && tableRes.ok) || !!(blockRes && blockRes.ok),
    error: (tableRes && tableRes.error) || (blockRes && blockRes.error),
    cloud: (tableRes && tableRes.cloud) || (blockRes && blockRes.cloud),
    emergency: tableRes && tableRes.emergency,
  };
}

/**
 * Pull da nuvem + push do que só existe neste dispositivo.
 * Garante telemóvel ↔ computador alinhados.
 */
export async function syncJournal(editingBlock) {
  var spaces = await pullSpaces();
  var blocks = await pullBlocks(editingBlock);
  var layout = await pullNoteLayout();
  if (spaces.length) await saveSpaces(spaces);
  await saveBlocks(blocks, layout);
  await saveNoteLayout(layout);
  return { spaces: spaces, blocks: blocks, layout: layout };
}

/** Apaga tema e blocos na nuvem (para sincronizar eliminações). */
export async function deleteSpaceAndBlocks(spaceId, blockIds) {
  if (blockIds && blockIds.length) await deleteRemoteIds("journal_blocks", blockIds, BLOCKS);
  if (spaceId) await deleteRemoteIds("journal_spaces", [spaceId], SPACES);
}

export async function deleteRemoteBlock(blockId) {
  if (blockId) await deleteRemoteIds("journal_blocks", [blockId], BLOCKS);
}

export function newBlock(spaceId, type) {
  return {
    id: uid("jb"),
    space_id: spaceId,
    type: type || "text",
    content: "",
    meta: {},
    order_index: Math.floor(Date.now() / 1000),
    updated: Date.now(),
  };
}

export async function appendBlock(spaceId, type, content, meta) {
  var blocks = await loadBlocks();
  var block = Object.assign(newBlock(spaceId, type), {
    content: content || "",
    meta: meta || {},
  });
  await saveBlocks(blocks.concat([block]));
  return block;
}
