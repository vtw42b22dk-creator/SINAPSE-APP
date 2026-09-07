import {
  deleteRemoteIds,
  getUser,
  readLocal,
  fetchRemoteRows,
  replaceRows,
  selectRowsMerged,
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

function mergeLayouts(a, b) {
  var left = a || emptyNoteLayout();
  var right = b || emptyNoteLayout();
  var sa = layoutScore(left);
  var sb = layoutScore(right);
  if (sa === 0 && sb === 0) {
    return ((left.updated || 0) >= (right.updated || 0)) ? left : right;
  }
  if (sa === 0) return right;
  if (sb === 0) return left;
  var aFirst = (left.updated || 0) <= (right.updated || 0);
  var first = aFirst ? left : right;
  var second = aFirst ? right : left;
  var blocksById = {};
  var order = [];
  function addBlocks(list) {
    (list || []).forEach(function(blk) {
      if (!blk || !blk.id) return;
      if (!blocksById[blk.id]) {
        order.push(blk.id);
        blocksById[blk.id] = blk;
      } else {
        blocksById[blk.id] = Object.assign({}, blocksById[blk.id], blk);
      }
    });
  }
  addBlocks(first.blocks);
  addBlocks(second.blocks);
  return {
    id: LAYOUT_ROW_ID,
    blocks: order.map(function(id) { return blocksById[id]; }),
    assign: Object.assign({}, first.assign || {}, second.assign || {}),
    collapsed: Object.assign({}, first.collapsed || {}, second.collapsed || {}),
    updated: Math.max(left.updated || 0, right.updated || 0),
  };
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
var CATS_SPACE_ID = "__journal_cats__";

function isCatsSpace(s) {
  return !!(s && s.id === CATS_SPACE_ID);
}

function stripCatsSpaces(list) {
  return (list || []).filter(function(s) { return !isCatsSpace(s); });
}

function layoutFromSpace(s) {
  if (!s) return null;
  try {
    var p = typeof s.title === "string" ? JSON.parse(s.title) : s.title;
    if (!p || typeof p !== "object") return null;
    return normalizeNoteLayoutRow({
      id: LAYOUT_ROW_ID,
      payload: p,
      updated: s.updated || (s.updated_at ? new Date(s.updated_at).getTime() : 0),
    });
  } catch (e) {
    return null;
  }
}

function spaceFromLayout(layout) {
  var l = layout || emptyNoteLayout();
  return {
    id: CATS_SPACE_ID,
    title: JSON.stringify({
      blocks: l.blocks || [],
      assign: l.assign || {},
      collapsed: l.collapsed || {},
    }),
    color: "#000000",
    updated: l.updated || Date.now(),
  };
}

function extractLayoutFromSpaces(list) {
  var found = (list || []).find(isCatsSpace);
  return found ? layoutFromSpace(found) : null;
}

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
  if (!stripCatsSpaces(local).length) {
    var blocks = await readLocal(BLOCKS, []);
    var seen = {};
    (blocks || []).forEach(function(b) {
      if (b && b.space_id && !isLayoutBlock(b) && b.space_id !== CATS_SPACE_ID) seen[b.space_id] = true;
    });
    var recovered = Object.keys(seen).map(function(id) {
      return { id: id, title: "Recuperado", color: "#E6E6E9", updated: Date.now() };
    });
    if (recovered.length) {
      local = local.concat(recovered);
      await writeLocal(SPACES, local);
    }
  }
  return stripCatsSpaces(local);
}

export async function loadBlocksLocal() {
  var local = await readLocal(BLOCKS, []);
  return blocksToUi(stripLayoutBlocks(local));
}

export async function pullSpaces() {
  try {
    var merged = await safePullMerge(SPACES, "journal_spaces", normalizeSpace);
    var layout = extractLayoutFromSpaces(merged);
    if (layout && layoutScore(layout) > 0) {
      var localLayout = await loadNoteLayoutLocal();
      var picked = mergeLayouts(localLayout, layout);
      await writeLocal(NOTE_LAYOUT_KEY, [noteLayoutToDb(picked)]);
    }
    return stripCatsSpaces(merged || []);
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
  rows = stripCatsSpaces(rows);
  if (!rows.length) return [{ id: uid("js"), title: "Livre", color: "#E6E6E9" }];
  return rows;
}

export async function saveSpaces(spaces, layout) {
  var rows = stripCatsSpaces(spaces || []).map(function(s) {
    return { id: s.id, title: s.title, color: s.color || "#E6E6E9", updated: s.updated || Date.now() };
  });
  if (layout && layoutScore(layout) > 0) {
    rows.push(spaceFromLayout(layout));
  } else {
    var existing = extractLayoutFromSpaces(await readLocal(SPACES, []));
    if (existing && layoutScore(existing) > 0) rows.push(spaceFromLayout(existing));
  }
  return replaceRows("journal_spaces", SPACES, rows, { pruneOrphans: false });
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
  var s = await saveSpaces(spaces || [], layout);
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
    var fromSpaces = extractLayoutFromSpaces(await readLocal(SPACES, []));
    var tableRow = null;
    try {
      var merged = await safePullMerge(NOTE_LAYOUT_KEY, NOTE_LAYOUT_TABLE, normalizeNoteLayoutRow);
      tableRow = merged.find(function(r) { return r && r.id === LAYOUT_ROW_ID; });
    } catch (e) {}
    var remote = tableRow ? normalizeNoteLayoutRow(tableRow) : emptyNoteLayout();
    var remoteSpacesLayout = null;
    try {
      remoteSpacesLayout = extractLayoutFromSpaces(await fetchRemoteRows("journal_spaces", normalizeSpace));
    } catch (e) {}
    var picked = mergeLayouts(
      mergeLayouts(mergeLayouts(mergeLayouts(local, remote), fromBlocks || emptyNoteLayout()), fromSpaces || emptyNoteLayout()),
      remoteSpacesLayout || emptyNoteLayout()
    );
    await writeLocal(NOTE_LAYOUT_KEY, [noteLayoutToDb(picked)]);
    return picked;
  } catch (e) {
    return loadNoteLayoutLocal();
  }
}

export async function saveNoteLayout(layout) {
  var row = noteLayoutToDb(Object.assign({}, layout || emptyNoteLayout(), { updated: Date.now() }));
  await writeLocal(NOTE_LAYOUT_KEY, [row]);
  var spaceRes = { ok: true };
  try {
    var spaces = stripCatsSpaces(await readLocal(SPACES, []));
    spaces.push(spaceFromLayout(row));
    await writeLocal(SPACES, spaces);
    var user = await getUser();
    if (supabase && user) {
      var spacePayload = Object.assign({}, spaceFromLayout(row), {
        user_id: user.id,
        updated_at: new Date(row.updated || Date.now()).toISOString(),
      });
      delete spacePayload.updated;
      var spaceUp = await supabase.from("journal_spaces").upsert(spacePayload, { onConflict: "id" });
      if (spaceUp.error) throw spaceUp.error;
    } else {
      spaceRes = await replaceRows("journal_spaces", SPACES, spaces, { pruneOrphans: false });
    }
  } catch (e) {
    spaceRes = { ok: false, error: e && e.message ? e.message : String(e) };
  }
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
      await supabase.from("journal_blocks").upsert(payload, { onConflict: "id" });
    }
  } catch (e) {}
  var tableRes = await replaceRows(NOTE_LAYOUT_TABLE, NOTE_LAYOUT_KEY, [row], { pruneOrphans: false });
  return {
    ok: !!(spaceRes && spaceRes.ok) || !!(tableRes && tableRes.ok),
    error: (spaceRes && spaceRes.error) || (tableRes && tableRes.error),
    cloud: (spaceRes && spaceRes.cloud) || (tableRes && tableRes.cloud),
    emergency: (spaceRes && spaceRes.emergency) || (tableRes && tableRes.emergency),
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
  await saveSpaces(spaces, layout);
  await saveBlocks(blocks, layout);
  if (layoutScore(layout) > 0) await saveNoteLayout(layout);
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
