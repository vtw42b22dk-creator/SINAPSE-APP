import {
  deleteRemoteIds,
  readLocal,
  replaceRows,
  uid,
  writeLocal,
} from "./cloudStore";
import { safePullMerge } from "./syncEngine";
import { hydrateJournalBlocks, stripAttachmentRef } from "./attachmentsStore";

var SPACES = "journal-spaces-v1";
var BLOCKS = "journal-blocks-v1";

function normalizeSpace(s) {
  return { id: s.id, title: s.title || "Tema", color: s.color || "#FFB800" };
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
    if (blocks.length) {
      var seen = {};
      blocks.forEach(function(b) {
        if (b && b.space_id) seen[b.space_id] = true;
      });
      local = Object.keys(seen).map(function(id) {
        return { id: id, title: "Recuperado", color: "#FFB800", updated: Date.now() };
      });
      if (local.length) await writeLocal(SPACES, local);
    }
  }
  if (!local.length) return [{ id: uid("js"), title: "Livre", color: "#FFB800" }];
  return local;
}

export async function loadBlocksLocal() {
  var local = await readLocal(BLOCKS, []);
  return blocksToUi(local);
}

export async function pullSpaces() {
  try {
    var merged = await safePullMerge(SPACES, "journal_spaces", normalizeSpace);
    if (!merged.length) {
      var local = await readLocal(SPACES, []);
      merged = local.length ? local : [{ id: uid("js"), title: "Livre", color: "#FFB800" }];
      await writeLocal(SPACES, merged);
    }
    return merged;
  } catch (e) {
    return loadSpacesLocal();
  }
}

export async function pullBlocks(editingBlock) {
  try {
    var merged = await safePullMerge(BLOCKS, "journal_blocks", normalizeBlock, function(local, remote, deletedIds) {
      return overlayEditingBlock(mergeBlocksForPull(local, remote, editingBlock, deletedIds), editingBlock);
    });
    return blocksToUi(merged);
  } catch (e) {
    return loadBlocksLocal();
  }
}

export async function loadSpaces() {
  var rows = await selectRowsMerged("journal_spaces", SPACES, [], normalizeSpace);
  if (!rows.length) return [{ id: uid("js"), title: "Livre", color: "#FFB800" }];
  return rows;
}

export async function saveSpaces(spaces) {
  return replaceRows(
    "journal_spaces",
    SPACES,
    (spaces || []).map(function(s) {
      return { id: s.id, title: s.title, color: s.color || "#FFB800", updated: Date.now() };
    }),
    { pruneOrphans: false }
  );
}

export async function loadBlocks() {
  return loadBlocksLocal();
}

export async function saveBlocks(blocks) {
  if (!blocks || !blocks.length) {
    return { ok: true, cloud: true, rows: [], skippedEmpty: true };
  }
  var rows = blocks.map(sanitizeBlockForSave);
  return replaceRows("journal_blocks", BLOCKS, rows, { pruneOrphans: false });
}

export async function saveAll(spaces, blocks) {
  var s = await saveSpaces(spaces || []);
  var b = await saveBlocks(blocks || []);
  return { ok: s.ok && b.ok, error: s.error || b.error, spaces: s, blocks: b };
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
