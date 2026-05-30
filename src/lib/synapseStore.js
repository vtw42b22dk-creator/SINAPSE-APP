/* eslint-disable no-unused-vars, no-empty */
import { readLocal, selectRows, upsertRows, uid, getUser } from "./cloudStore";
import { hydrateSynapseNodes, stripFileForSave } from "./attachmentsStore";
import { deleteProjectModules } from "./projectModuleStore";
import { supabase } from "./supabase";

var PROJECTS = "sinapse-projects-v1";
var DATA = "sinapse-project-data-v1";

export var DEFAULT_MODULES = {
  investments: true,
  notes: true,
  analytics: true,
  inventory: true,
  documents: true,
};

export var MODULE_META = [
  { id: "documents", label: "Documentos", desc: "Mapa mental e ficheiros" },
  { id: "investments", label: "Investimentos", desc: "Ledger financeiro do projeto" },
  { id: "notes", label: "Notas", desc: "Wiki técnica e documentação" },
  { id: "analytics", label: "Analytics", desc: "KPIs e metas" },
  { id: "inventory", label: "Inventário", desc: "Stock e componentes" },
];

function normalizeProject(p) {
  return {
    id: p.id || uid("sp"),
    name: p.name || "Projeto",
    description: p.description || "",
    color: p.color || "#FF3D8A",
    collapsed: p.collapsed || [],
    modules: Object.assign({}, DEFAULT_MODULES, p.modules || {}),
  };
}

function mergeNodes(localNodes, remoteNodes) {
  var map = {};
  (remoteNodes || []).forEach(function(n) { map[n.id] = n; });
  (localNodes || []).forEach(function(local) {
    var remote = map[local.id];
    if (!remote) { map[local.id] = local; return; }
    var lf = (local.files || []).length;
    var rf = (remote.files || []).length;
    var ld = (local.description || "").length;
    var rd = (remote.description || "").length;
    if (lf > rf || ld > rd) map[local.id] = Object.assign({}, remote, { files: local.files, description: local.description || remote.description });
  });
  return Object.values(map);
}

function stripNodesForCloud(nodes) {
  return (nodes || []).map(function(n) {
    var next = Object.assign({}, n);
    if (next.files && next.files.length) next.files = next.files.map(stripFileForSave);
    return next;
  });
}

export async function loadProjects() {
  var rows = await selectRows("synapse_projects", PROJECTS, []);
  return (rows || []).map(normalizeProject);
}

export async function saveProjects(projects) {
  return upsertRows("synapse_projects", PROJECTS, projects.map(function(p) {
    var n = normalizeProject(p);
    return {
      id: n.id,
      name: n.name,
      description: n.description,
      color: n.color,
      collapsed: n.collapsed,
      modules: n.modules,
    };
  }));
}

export async function loadProjectData(projectId) {
  var local = null;
  try {
    var raw = localStorage.getItem(DATA + ":" + projectId);
    if (raw) local = JSON.parse(raw);
  } catch (e) {}
  var user = await getUser();
  var nodes = null;
  var conns = null;
  if (supabase && user) {
    try {
      var nr = await supabase.from("synapse_nodes").select("*").eq("user_id", user.id).eq("project_id", projectId);
      if (!nr.error) nodes = nr.data || [];
    } catch (e) {}
    try {
      var cr = await supabase.from("synapse_connections").select("*").eq("user_id", user.id).eq("project_id", projectId);
      if (!cr.error) conns = cr.data || [];
    } catch (e) {}
  }
  if (!nodes) nodes = await readLocal(DATA + ":nodes:" + projectId, []);
  if (!conns) conns = await readLocal(DATA + ":conns:" + projectId, []);
  var remoteNodes = (nodes || []).filter(function(r){return !r.project_id || r.project_id === projectId;}).map(function(r){return r.data || r;});
  var remoteConns = (conns || []).filter(function(r){return !r.project_id || r.project_id === projectId;}).map(function(r){return r.data || r;});
  var localNodes = local && local.nodes ? local.nodes : [];
  var localConns = local && local.conns ? local.conns : [];
  if (!remoteNodes.length && localNodes.length) remoteNodes = localNodes;
  if (!remoteConns.length && localConns.length) remoteConns = localConns;
  var mergedNodes = mergeNodes(localNodes, remoteNodes);
  mergedNodes = await hydrateSynapseNodes(mergedNodes, projectId);
  return {
    nodes: mergedNodes,
    conns: remoteConns.length ? remoteConns : localConns,
    collapsed: local && local.collapsed ? local.collapsed : [],
  };
}

export async function saveProjectData(projectId, data) {
  var safeData = {
    nodes: stripNodesForCloud(data.nodes || []),
    conns: data.conns || [],
    collapsed: data.collapsed || [],
  };
  try { localStorage.setItem(DATA + ":" + projectId, JSON.stringify(Object.assign({}, data, { nodes: data.nodes }))); } catch (e) {}
  var nodeRows = (safeData.nodes || []).map(function(n) {
    return { id: n.id, project_id: projectId, data: n };
  });
  var connRows = (safeData.conns || []).map(function(c, i) {
    return { id: projectId + "-" + c.from + "-" + c.to + "-" + i, project_id: projectId, data: c };
  });
  try { localStorage.setItem(DATA + ":nodes:" + projectId, JSON.stringify(nodeRows)); } catch (e) {}
  try { localStorage.setItem(DATA + ":conns:" + projectId, JSON.stringify(connRows)); } catch (e) {}
  var user = await getUser();
  if (supabase && user) {
    try {
      var existingNodes = await supabase.from("synapse_nodes").select("id").eq("user_id", user.id).eq("project_id", projectId);
      var nodeIds = new Set(nodeRows.map(function(r) { return r.id; }));
      var staleNodeIds = ((existingNodes && existingNodes.data) || []).map(function(r) { return r.id; }).filter(function(id) { return !nodeIds.has(id); });
      if (staleNodeIds.length) await supabase.from("synapse_nodes").delete().eq("user_id", user.id).eq("project_id", projectId).in("id", staleNodeIds);
      if (nodeRows.length) await supabase.from("synapse_nodes").upsert(nodeRows.map(function(r) { return Object.assign({}, r, { user_id: user.id, updated_at: new Date().toISOString() }); }));
    } catch (e) {}
    try {
      var existingConns = await supabase.from("synapse_connections").select("id").eq("user_id", user.id).eq("project_id", projectId);
      var connIds = new Set(connRows.map(function(r) { return r.id; }));
      var staleConnIds = ((existingConns && existingConns.data) || []).map(function(r) { return r.id; }).filter(function(id) { return !connIds.has(id); });
      if (staleConnIds.length) await supabase.from("synapse_connections").delete().eq("user_id", user.id).eq("project_id", projectId).in("id", staleConnIds);
      if (connRows.length) await supabase.from("synapse_connections").upsert(connRows.map(function(r) { return Object.assign({}, r, { user_id: user.id, updated_at: new Date().toISOString() }); }));
    } catch (e) {}
    return;
  }
}

export async function deleteProject(projectId, projects) {
  try { localStorage.removeItem(DATA + ":" + projectId); } catch (e) {}
  await deleteProjectModules(projectId);
  var next = (projects || []).filter(function(p) { return p.id !== projectId; });
  await saveProjects(next);
  var user = await getUser();
  if (supabase && user) {
    try { await supabase.from("synapse_nodes").delete().eq("user_id", user.id).eq("project_id", projectId); } catch (e) {}
    try { await supabase.from("synapse_connections").delete().eq("user_id", user.id).eq("project_id", projectId); } catch (e) {}
    try { await supabase.from("synapse_projects").delete().eq("user_id", user.id).eq("id", projectId); } catch (e) {}
  }
  return next;
}

export function newProject(name, opts) {
  var o = opts || {};
  return normalizeProject({
    id: uid("sp"),
    name: name || "Novo projeto",
    description: o.description || "",
    color: o.color || "#FF3D8A",
    collapsed: [],
    modules: Object.assign({}, DEFAULT_MODULES, o.modules || {}),
  });
}
