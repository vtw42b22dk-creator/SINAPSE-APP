import {
  fetchRemoteRows,
  mergeRowsByTimestamp,
  readLocal,
  replaceRows,
  selectRowsMerged,
  uid,
  writeLocal,
} from "./cloudStore";
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
    meta: b.meta || {},
    order_index: b.order_index || 0,
    updated: b.updated_at ? new Date(b.updated_at).getTime() : (b.updated || 0),
  };
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
  if (!prev) {
    map[editingBlock.id] = nc;
  } else {
    var lc = (editingBlock.content || "").length;
    var pc = (prev.content || "").length;
    if (lc >= pc) map[editingBlock.id] = nc;
  }
  return Object.values(map);
}

function sanitizeBlockForSave(b) {
  var meta = Object.assign({}, b.meta || {});
  if (meta.attachment) meta.attachment = stripAttachmentRef(meta.attachment);
  var content = b.content || "";
  if (content.length > 200000 && meta.attachment && meta.attachment.url) content = meta.attachment.url;
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

export async function pullSpaces() {
  var remote = [];
  try {
    remote = await fetchRemoteRows("journal_spaces", normalizeSpace);
  } catch (e) {
    return loadSpaces();
  }
  var local = await readLocal(SPACES, []);
  var merged = mergeRowsByTimestamp(local, remote);
  if (!merged.length) merged = [{ id: uid("js"), title: "Livre", color: "#FFB800" }];
  await writeLocal(SPACES, merged);
  return merged;
}

export async function pullBlocks(editingBlock) {
  var remote = [];
  try {
    remote = await fetchRemoteRows("journal_blocks", normalizeBlock);
  } catch (e) {
    return loadBlocks();
  }
  var local = await readLocal(BLOCKS, []);
  var merged = mergeRowsByTimestamp(local, remote);
  merged = overlayEditingBlock(merged, editingBlock);
  await writeLocal(BLOCKS, merged);
  return blocksToUi(merged);
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
    })
  );
}

export async function loadBlocks() {
  var merged = await selectRowsMerged("journal_blocks", BLOCKS, [], normalizeBlock);
  return blocksToUi(merged);
}

export async function saveBlocks(blocks) {
  var rows = (blocks || []).map(sanitizeBlockForSave);
  return replaceRows("journal_blocks", BLOCKS, rows);
}

export async function saveAll(spaces, blocks) {
  var s = await saveSpaces(spaces);
  var b = await saveBlocks(blocks);
  return { spaces: s, blocks: b };
}

export function newBlock(spaceId, type) {
  return {
    id: uid("jb"),
    space_id: spaceId,
    type: type || "text",
    content: "",
    meta: {},
    order_index: Date.now(),
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
