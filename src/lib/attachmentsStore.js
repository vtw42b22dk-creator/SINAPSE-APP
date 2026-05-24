/* eslint-disable no-empty */
import { getUser, uid } from "./cloudStore";
import { supabase } from "./supabase";

var TABLE = "attachments";
var BUCKET = "attachments";

function safeName(name) {
  return (name || "file").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120);
}

function readAsDataUrl(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function(ev) { resolve(ev.target.result); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function stripAttachmentRef(att) {
  if (!att) return null;
  return {
    id: att.id || att.attachmentId,
    attachmentId: att.attachmentId || att.id,
    name: att.name,
    type: att.type,
    mime_type: att.mime_type,
    storagePath: att.storagePath,
    url: att.url && !String(att.url).startsWith("data:") ? att.url : (att.public_url || ""),
    public_url: att.public_url || "",
    localOnly: !!att.localOnly,
  };
}

export function stripFileForSave(file) {
  if (!file) return file;
  var next = {
    id: file.id,
    name: file.name,
    type: file.type,
    folderId: file.folderId || null,
    attachmentId: file.attachmentId || file.id,
    storagePath: file.storagePath,
    url: file.url && !String(file.url).startsWith("data:") ? file.url : "",
    localOnly: !!file.localOnly,
  };
  if (file.localOnly && file.data) next.data = file.data;
  return next;
}

export async function resolveAttachmentUrl(att) {
  if (!att) return "";
  if (att.url && !String(att.url).startsWith("data:")) return att.url;
  if (att.public_url) return att.public_url;
  var user = await getUser();
  if (supabase && user && att.storagePath) {
    try {
      var signed = await supabase.storage.from(BUCKET).createSignedUrl(att.storagePath, 60 * 60 * 24);
      if (signed && signed.data && signed.data.signedUrl) return signed.data.signedUrl;
    } catch (e) {}
    try {
      var pub = supabase.storage.from(BUCKET).getPublicUrl(att.storagePath);
      if (pub && pub.data && pub.data.publicUrl) return pub.data.publicUrl;
    } catch (e) {}
  }
  return att.data || "";
}

async function listAttachments(ownerType, ownerIds) {
  var user = await getUser();
  if (!supabase || !user || !ownerIds || !ownerIds.length) return [];
  try {
    var res = await supabase.from(TABLE).select("*").eq("user_id", user.id).eq("owner_type", ownerType).in("owner_id", ownerIds);
    if (res.error) throw res.error;
    return res.data || [];
  } catch (e) {
    return [];
  }
}

export async function uploadAttachment(file, ownerType, ownerId, meta) {
  var id = uid("att");
  var kind = file.type && file.type.startsWith("image/") ? "image" : "file";
  var base = {
    id: id,
    name: file.name,
    type: kind,
    mime_type: file.type || "application/octet-stream",
    size: file.size || 0,
    owner_type: ownerType,
    owner_id: ownerId,
    meta: meta || {},
    ts: Date.now(),
    attachmentId: id,
  };
  var user = await getUser();
  if (supabase && user) {
    try {
      var path = user.id + "/" + ownerType + "/" + ownerId + "/" + id + "-" + safeName(file.name);
      var uploaded = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });
      if (uploaded.error) throw uploaded.error;
      var pub = supabase.storage.from(BUCKET).getPublicUrl(path);
      var url = pub && pub.data ? pub.data.publicUrl : "";
      var row = {
        id: base.id,
        owner_type: base.owner_type,
        owner_id: base.owner_id,
        name: base.name,
        type: base.type,
        mime_type: base.mime_type,
        size: base.size,
        meta: base.meta,
        user_id: user.id,
        storage_bucket: BUCKET,
        storage_path: path,
        public_url: url,
        updated_at: new Date().toISOString(),
      };
      var saved = await supabase.from(TABLE).upsert(row);
      if (saved.error) throw saved.error;
      return Object.assign({}, base, { url: url, storagePath: path, public_url: url, localOnly: false });
    } catch (e) {
      var msg = e && e.message ? e.message : "Falha no upload";
      try {
        var data = await readAsDataUrl(file);
        return Object.assign({}, base, { data: data, url: data, localOnly: true, uploadError: msg });
      } catch (e2) {
        return Object.assign({}, base, { uploadError: msg });
      }
    }
  }
  var data = await readAsDataUrl(file);
  return Object.assign({}, base, { data: data, url: data, localOnly: true });
}

export async function hydrateJournalBlocks(blocks) {
  if (!blocks || !blocks.length) return blocks;
  var ids = blocks.map(function(b) { return b.id; });
  var rows = await listAttachments("journal_block", ids);
  var byOwner = {};
  rows.forEach(function(r) {
    if (!byOwner[r.owner_id]) byOwner[r.owner_id] = [];
    byOwner[r.owner_id].push(r);
  });
  return Promise.all(blocks.map(async function(b) {
    if (b.type !== "image" && b.type !== "document") return b;
    var att = b.meta && b.meta.attachment ? b.meta.attachment : null;
    var row = (byOwner[b.id] || [])[0];
    if (row) {
      att = {
        attachmentId: row.id,
        id: row.id,
        name: row.name,
        type: row.type,
        storagePath: row.storage_path,
        public_url: row.public_url,
        url: row.public_url,
      };
    }
    var url = await resolveAttachmentUrl(att || { url: b.content, storagePath: att && att.storagePath });
    if (!url && b.content && !String(b.content).startsWith("data:")) url = b.content;
    if (!url && b.content) url = b.content;
    return Object.assign({}, b, {
      content: url || b.content || "",
      meta: Object.assign({}, b.meta || {}, { attachment: stripAttachmentRef(att) }),
    });
  }));
}

export async function hydrateSynapseNodes(nodes, projectId) {
  if (!nodes || !nodes.length || !projectId) return nodes;
  var ownerIds = nodes.map(function(n) { return projectId + ":" + n.id; });
  var rows = await listAttachments("synapse_node", ownerIds);
  var byOwner = {};
  rows.forEach(function(r) {
    if (!byOwner[r.owner_id]) byOwner[r.owner_id] = [];
    byOwner[r.owner_id].push(r);
  });
  return Promise.all(nodes.map(async function(n) {
    var key = projectId + ":" + n.id;
    var remote = byOwner[key] || [];
    var files = n.files || [];
    if (!files.length && remote.length) {
      files = remote.map(function(r) {
        return {
          id: r.id,
          attachmentId: r.id,
          name: r.name,
          type: r.type,
          storagePath: r.storage_path,
          url: r.public_url,
          folderId: r.meta && r.meta.folder_id ? r.meta.folder_id : null,
        };
      });
    }
    var nextFiles = await Promise.all(files.map(async function(f) {
      var url = await resolveAttachmentUrl(f);
      return Object.assign({}, f, { url: url || f.url || "", data: f.localOnly ? f.data : undefined });
    }));
    return Object.assign({}, n, { files: nextFiles });
  }));
}

export async function deleteAttachment(file) {
  if (!file) return;
  var user = await getUser();
  if (!supabase || !user) return;
  try {
    if (file.storagePath) await supabase.storage.from(BUCKET).remove([file.storagePath]);
  } catch (e) {}
  try {
    var id = file.attachmentId || file.id;
    if (id) await supabase.from(TABLE).delete().eq("user_id", user.id).eq("id", id);
  } catch (e) {}
}
