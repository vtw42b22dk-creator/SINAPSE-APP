/* eslint-disable no-unused-vars, no-empty, react-hooks/refs */
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as synapseStore from "../lib/synapseStore";
import * as taskStore from "../lib/tasksStore";
import * as journalStore from "../lib/journalStore";
import * as attachmentsStore from "../lib/attachmentsStore";
import * as wishlistStore from "../lib/wishlistStore";
import * as financeStore from "../lib/financeStore";
import { DOC_RECENT_CSS } from "../lib/pageMotion";

var DOC_ACCEPT = "image/jpeg,image/png,image/jpg,.jpg,.jpeg,.png,.pdf,application/pdf";
var DOC_RECENT_MS = 15 * 60 * 1000;

function isAllowedDocFile(f) {
  if (!f) return false;
  var name = (f.name || "").toLowerCase();
  if (/\.(pdf|jpe?g|png)$/i.test(name)) return true;
  var mime = (f.type || "").toLowerCase();
  return mime === "application/pdf" || /^image\/(jpeg|png|jpg)$/.test(mime);
}

function inferDocFileType(file, uploaded) {
  var name = ((uploaded && uploaded.name) || file.name || "").toLowerCase();
  if (/\.(jpe?g|png)$/i.test(name) || uploaded.type === "image") return "image";
  if (/\.pdf$/i.test(name) || file.type === "application/pdf") return "pdf";
  return "file";
}

function sortDocsRecent(list) {
  return (list || []).slice().sort(function(a, b) { return (b.ts || 0) - (a.ts || 0); });
}

function isDocRecent(f) {
  return !!(f && f.recentUntil && f.recentUntil > Date.now());
}

// ═══════════════════════════════════════════
// SINAPSE'S v2.1 — The Neural Workspace
// ═══════════════════════════════════════════

var ALL_COLORS = ["#FFB800","#00FFC8","#7B61FF","#FF3D8A","#00AAFF","#FF6B35","#00FF94","#D946EF","#38BDF8","#FB923C","#818CF8","#F472B6","#34D399","#A78BFA","#22D3EE","#FBBF24","#E879F9","#60A5FA","#A3E635","#6EE7B7"];

function pickDifferentColor(parentColor) {
  var filtered = ALL_COLORS.filter(function(c) { return c !== parentColor; });
  return filtered[Math.floor(Math.random() * filtered.length)];
}

var _uid = Date.now();
function uid() { return "n" + (_uid++); }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

var SK = "synapse-v6";
async function doSave(d) {
  var payload = JSON.stringify(d);
  try {
    if (window.storage && window.storage.set) {
      await window.storage.set(SK, payload);
      return;
    }
  } catch (e) {}
  try { localStorage.setItem(SK, payload); } catch (e) {}
}
async function doLoad() {
  try {
    if (window.storage && window.storage.get) {
      var r = await window.storage.get(SK);
      if (r && r.value) return JSON.parse(r.value);
    }
  } catch (e) {}
  try {
    var raw = localStorage.getItem(SK);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function bez(x1, y1, x2, y2) {
  var dx = x2 - x1, dy = y2 - y1;
  return "M"+x1+","+y1+" C"+(x1+dx*0.4)+","+(y1+dy*0.12)+" "+(x2-dx*0.4)+","+(y2-dy*0.12)+" "+x2+","+y2;
}

function useDevice() {
  var st = useState(window.innerWidth);
  var w = st[0], setW = st[1];
  useEffect(function() {
    function h() { setW(window.innerWidth); }
    window.addEventListener("resize", h);
    return function() { window.removeEventListener("resize", h); };
  }, []);
  if (w < 600) return "mobile";
  if (w < 1100) return "tablet";
  return "desktop";
}

// Word-wrap helper: splits label into lines, never breaking words
function wrapLabel(label, maxCharsPerLine) {
  if (!label) return ["\u2026"];
  var words = label.split(" ");
  var lines = [];
  var current = "";
  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= maxCharsPerLine) {
      current = current + " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current.length > 0) lines.push(current);
  // Max 3 lines
  if (lines.length > 3) {
    lines = lines.slice(0, 3);
    lines[2] = lines[2].slice(0, maxCharsPerLine - 1) + "\u2026";
  }
  return lines;
}

// ═══ Connection Line ═══
function ConnLine(props) {
  var path = bez(props.x1, props.y1, props.x2, props.y2);
  var gid = "cg_" + props.ck;
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={props.c1} stopOpacity="0.5"/>
          <stop offset="100%" stopColor={props.c2} stopOpacity="0.5"/>
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke={props.c1} strokeWidth="7" opacity="0.03"/>
      <path d={path} fill="none" stroke={"url(#"+gid+")"} strokeWidth="2" strokeDasharray="8 5">
        <animate attributeName="stroke-dashoffset" from="0" to="-26" dur="2.5s" repeatCount="indefinite"/>
      </path>
      <path d={path} fill="none" stroke="transparent" strokeWidth="22" style={{cursor:"pointer"}} onContextMenu={props.onCtx}/>
      <circle r="2.5" fill={props.c1} opacity="0.45">
        <animateMotion path={path} dur="3.5s" repeatCount="indefinite"/>
        <animate attributeName="r" values="2;3.5;2" dur="3.5s" repeatCount="indefinite"/>
      </circle>
    </g>
  );
}

// ═══ Node Circle ═══
function NodeCircle(props) {
  var node = props.node, isSel = props.isSel, isConn = props.isConn;
  var hasHid = props.hasHid, editId = props.editId;
  var mobile = !!props.mobile;

  var r = node.isChild ? 28 : 40;
  var c = node.color;
  var editing = editId === node.id;
  var iref = useRef(null);
  var labS = useState(node.label); var lab = labS[0], setLab = labS[1];
  var lpRef = useRef(null);
  var movedRef = useRef(false);
  var fc = (node.files ? node.files.length : 0) + (node.links ? node.links.length : 0);

  // Multi-line label
  var maxChars = node.isChild ? 8 : 12;
  var lines = wrapLabel(node.label, maxChars);

  useEffect(function() { setLab(node.label); }, [node.label]);
  useEffect(function() { if (editing && iref.current) { iref.current.focus(); iref.current.select(); } }, [editing]);

  return (
    <g style={{cursor: editing ? "text" : "grab"}}
      onPointerDown={function(e) {
        if (editing) return;
        movedRef.current = false;
        if (e.pointerType === "touch" && !mobile) {
          lpRef.current = setTimeout(function() {
            if (!movedRef.current) props.onCtx({preventDefault:function(){},stopPropagation:function(){},clientX:e.clientX,clientY:e.clientY}, node.id);
          }, 550);
        }
        props.onPD(e, node.id);
      }}
      onPointerMove={function() { movedRef.current = true; if (lpRef.current) clearTimeout(lpRef.current); }}
      onPointerUp={function(e) { if (lpRef.current) clearTimeout(lpRef.current); if (!movedRef.current && !editing) props.onTap(e, node.id); }}
      onContextMenu={function(e) { props.onCtx(e, node.id); }}
    >
      <circle cx={node.x} cy={node.y} r={r+18} fill={c} opacity={isSel?0.1:0.02} filter="url(#nodeGlow)">
        {isSel && <animate attributeName="opacity" values="0.1;0.05;0.1" dur="3s" repeatCount="indefinite"/>}
      </circle>
      <circle cx={node.x} cy={node.y} r={r+3} fill="none" stroke={c} strokeWidth={isSel?1.6:0.5} opacity={isSel?0.35:0.06}
        strokeDasharray={isConn?"5 3":"none"}>
        {isConn && <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="1s" repeatCount="indefinite"/>}
      </circle>
      <circle cx={node.x} cy={node.y} r={r} fill={c+"08"} stroke={c} strokeWidth={isSel?2:1.1}
        style={{filter:isSel?"drop-shadow(0 0 14px "+c+"25)":"none",transition:"all 0.3s ease"}}/>
      <circle cx={node.x-r*0.15} cy={node.y-r*0.2} r={r*0.4} fill={c} opacity="0.035"/>
      {editing ? (
        <foreignObject x={node.x-(mobile?85:65)} y={node.y-(mobile?20:14)} width={mobile?170:130} height={mobile?42:28}>
          <input ref={iref} value={lab} onChange={function(e){setLab(e.target.value);}}
            onBlur={function(){props.onCommit(node.id,lab);}}
            onKeyDown={function(e){if(e.key==="Enter")props.onCommit(node.id,lab);if(e.key==="Escape")props.onCommit(node.id,node.label);}}
            style={{width:"100%",height:"100%",background:"rgba(0,0,0,0.93)",border:"1px solid "+c+"50",borderRadius:mobile?12:8,color:"#fff",fontSize:mobile?16:11,textAlign:"center",padding:mobile?"7px 10px":"5px 8px",fontFamily:"'JetBrains Mono',monospace",outline:"none",boxShadow:"0 0 20px "+c+"15"}}/>
        </foreignObject>
      ) : (
        <text x={node.x} textAnchor="middle" fill={c} fontSize={node.isChild?9:11}
          fontFamily="'JetBrains Mono',monospace" fontWeight="500" style={{pointerEvents:"none",userSelect:"none",textShadow:"0 0 12px "+c+"20"}}>
          {lines.map(function(line, i) {
            var totalH = lines.length * (node.isChild ? 11 : 13);
            var startY = node.y - totalH / 2 + (node.isChild ? 7 : 8);
            return <tspan key={i} x={node.x} y={startY + i * (node.isChild ? 11 : 13)}>{line}</tspan>;
          })}
        </text>
      )}
      {fc > 0 && (
        <g>
          <circle cx={node.x+r*0.62} cy={node.y-r*0.62} r={8} fill="#0A0A12" stroke={c} strokeWidth="0.8"/>
          <text x={node.x+r*0.62} y={node.y-r*0.62+0.5} textAnchor="middle" dominantBaseline="central" fill={c} fontSize="7" fontFamily="'JetBrains Mono',monospace" fontWeight="600">{fc}</text>
        </g>
      )}
      {node.notes && node.notes.length > 0 && <circle cx={node.x-r*0.62} cy={node.y-r*0.62} r={4} fill={c} opacity="0.35"/>}
      {hasHid && (
        <g>
          <circle cx={node.x} cy={node.y+r+14} r={10} fill="#0A0A12" stroke={c} strokeWidth="1.2" strokeDasharray="4 2.5">
            <animate attributeName="stroke-dashoffset" from="0" to="-13" dur="4s" repeatCount="indefinite"/>
          </circle>
          <text x={node.x} y={node.y+r+15} textAnchor="middle" dominantBaseline="central" fill={c} fontSize="10" fontFamily="'JetBrains Mono',monospace">{"\u2026"}</text>
        </g>
      )}
    </g>
  );
}

// ═══ Toolbar Button ═══
function TBtn(props) {
  var hS = useState(false); var hov = hS[0], setHov = hS[1];
  var c = props.accent || "#00FFC8";
  var sz = props.small ? 34 : 40;
  return (
    <button onClick={props.onClick} title={props.title}
      onMouseEnter={function(){setHov(true);}} onMouseLeave={function(){setHov(false);}}
      style={{width:sz,height:sz,borderRadius:props.small?10:12,border:"1px solid "+(props.active||hov?c+"35":"rgba(255,255,255,0.06)"),background:props.active?c+"12":hov?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.01)",color:props.active||hov?c:"rgba(255,255,255,0.4)",fontSize:props.small?13:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",flexShrink:0,fontFamily:"'IBM Plex Sans',sans-serif",boxShadow:props.active?"0 0 20px "+c+"10":"none"}}>
      {props.children}
    </button>
  );
}

function mobileActionStyle(color) {
  return {
    minHeight: 42,
    borderRadius: 12,
    border: "1px solid " + color + "35",
    background: color + "12",
    color: color === "#ffffff" ? "rgba(255,255,255,0.55)" : color,
    fontSize: 11,
    fontFamily: "'JetBrains Mono',monospace",
    cursor: "pointer",
  };
}

// ═══ Context Menu ═══
function CtxMenu(props) {
  var ref = useRef(null);
  var pS = useState({x:props.x,y:props.y}); var pos = pS[0], setPos = pS[1];
  useEffect(function() {
    if (!ref.current) return;
    var r = ref.current.getBoundingClientRect();
    setPos({x:clamp(props.x,8,window.innerWidth-r.width-8),y:clamp(props.y,8,window.innerHeight-r.height-8)});
  }, [props.x, props.y]);

  return (
    <div ref={ref} data-no-canvas-zoom style={props.mobile ? {position:"fixed",left:12,right:12,bottom:12,zIndex:96,background:"rgba(12,12,22,0.96)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:22,padding:10,backdropFilter:"blur(32px)",boxShadow:"0 16px 64px rgba(0,0,0,0.65),inset 0 1px 0 rgba(255,255,255,0.04)",animation:"slideUp 0.18s cubic-bezier(0.2,0,0,1)"} : {position:"fixed",left:pos.x,top:pos.y,zIndex:60,background:"rgba(12,12,22,0.92)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:8,backdropFilter:"blur(32px)",boxShadow:"0 16px 64px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.04)",minWidth:190,animation:"ctxIn 0.15s cubic-bezier(0.2,0,0,1)"}}
      onClick={function(e){e.stopPropagation();}} onContextMenu={function(e){e.preventDefault();}}>
      {props.items.map(function(it,i) {
        if (it.sep) return <div key={i} style={{height:1,background:"rgba(255,255,255,0.04)",margin:"5px 12px"}}/>;
        return (
          <button key={i} onClick={function(){it.action();props.onClose();}}
            style={{display:"flex",alignItems:"center",gap:11,width:"100%",padding:props.mobile?"14px 15px":"11px 14px",
              background:it.hl?"rgba(0,255,200,0.06)":"transparent",
              border:it.hl?"1px solid rgba(0,255,200,0.1)":"1px solid transparent",
              borderRadius:12,color:it.danger?"#FF3D5A":it.hl?"#00FFC8":"rgba(255,255,255,0.65)",
              fontSize:props.mobile?15:13,fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:it.hl?500:400,textAlign:"left",cursor:"pointer",transition:"all 0.15s"}}
            onMouseEnter={function(e){if(!it.hl)e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
            onMouseLeave={function(e){e.currentTarget.style.background=it.hl?"rgba(0,255,200,0.06)":"transparent";}}>
            <span style={{fontSize:15,width:22,textAlign:"center"}}>{it.icon}</span>
            <span>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ═══ Search Bar ═══
function SearchBar(props) {
  var qS = useState(""); var q = qS[0], setQ = qS[1];
  var ref = useRef(null);
  useEffect(function() { if (ref.current) ref.current.focus(); }, []);

  var results = useMemo(function() {
    if (!q.trim()) return [];
    var lq = q.toLowerCase();
    return props.nodes.filter(function(n) {
      return (n.label && n.label.toLowerCase().indexOf(lq) >= 0) || (n.notes && n.notes.toLowerCase().indexOf(lq) >= 0);
    }).slice(0, 8);
  }, [q, props.nodes]);

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:70,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:"15vh"}} onClick={props.onClose} data-no-canvas-zoom>
      <div style={{width:"min(500px,90vw)",background:"rgba(12,12,22,0.96)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,backdropFilter:"blur(32px)",overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.04)",animation:"searchIn 0.2s cubic-bezier(0.2,0,0,1)"}} onClick={function(e){e.stopPropagation();}}>
        <div style={{display:"flex",alignItems:"center",padding:"16px 20px",gap:12,borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
          <span style={{fontSize:16,color:"rgba(255,255,255,0.25)"}}>&#128269;</span>
          <input ref={ref} value={q} onChange={function(e){setQ(e.target.value);}} placeholder="Procurar sinapses..."
            style={{flex:1,background:"none",border:"none",color:"#fff",fontSize:15,fontFamily:"'IBM Plex Sans',sans-serif",outline:"none"}}/>
          <button onClick={props.onClose} style={{background:"rgba(255,255,255,0.05)",border:"none",borderRadius:8,color:"rgba(255,255,255,0.3)",fontSize:10,padding:"4px 8px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>ESC</button>
        </div>
        {results.length > 0 && (
          <div data-scrollable style={{maxHeight:320,overflow:"auto",padding:8}}>
            {results.map(function(n) {
              return (
                <button key={n.id} onClick={function(){props.onSelect(n.id);props.onClose();}}
                  style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 14px",background:"transparent",border:"none",borderRadius:12,cursor:"pointer",transition:"background 0.15s",textAlign:"left"}}
                  onMouseEnter={function(e){e.currentTarget.style.background="rgba(255,255,255,0.04)";}}
                  onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:n.color,boxShadow:"0 0 8px "+n.color+"40",flexShrink:0}}/>
                  <div style={{minWidth:0,flex:1}}>
                    <p style={{fontSize:13,color:n.color,fontFamily:"'JetBrains Mono',monospace",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",margin:0}}>{n.label||"Sem nome"}</p>
                    {n.notes && n.notes.length > 0 && <p style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:2,fontFamily:"'IBM Plex Sans',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",margin:0}}>{n.notes.slice(0,60)}</p>}
                  </div>
                  <span style={{marginLeft:"auto",fontSize:10,color:"rgba(255,255,255,0.12)",fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>{n.isChild?"filho":"raiz"}</span>
                </button>
              );
            })}
          </div>
        )}
        {q.length > 0 && results.length === 0 && (
          <div style={{padding:"24px 20px",textAlign:"center"}}>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.2)",fontFamily:"'IBM Plex Sans',sans-serif",margin:0}}>Nenhuma sinapse encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ Knowledge Pop-up ═══
function DocPanel(props) {
  var node = props.node, c = node.color, device = props.device;
  var tS = useState("home"); var tab = tS[0], setTab = tS[1];
  var fileRef = useRef(null);
  var uploadFolderRef = useRef(null);
  var nlS = useState(""); var newLink = nlS[0], setNewLink = nlS[1];
  var nltS = useState(""); var nlt = nltS[0], setNlt = nltS[1];
  var alS = useState(false); var addingLink = alS[0], setAddingLink = alS[1];
  var nfS = useState(""); var newFolder = nfS[0], setNewFolder = nfS[1];
  var afS = useState(false); var addingFolder = afS[0], setAddingFolder = afS[1];
  var qS = useState(""); var q = qS[0], setQ = qS[1];
  var taskS = useState([]); var tasks = taskS[0], setTasks = taskS[1];
  var ntS = useState(""); var newTask = ntS[0], setNewTask = ntS[1];
  var jsS = useState([]); var journalSpaces = jsS[0], setJournalSpaces = jsS[1];
  var jselS = useState(""); var journalSpaceId = jselS[0], setJournalSpaceId = jselS[1];
  var jstS = useState(""); var journalStatus = jstS[0], setJournalStatus = jstS[1];
  var upS = useState(""); var uploadStatus = upS[0], setUploadStatus = upS[1];
  var dragS = useState(false); var dragOver = dragS[0], setDragOver = dragS[1];
  var wlS = useState([]); var wishlistItems = wlS[0], setWishlistItems = wlS[1];
  var exS = useState([]); var expenseItems = exS[0], setExpenseItems = exS[1];

  var files = node.files || [], links = node.links || [], folders = node.folders || [], pinned = node.pinned || [], notes = node.notes || "";
  var linkedWishlist = node.linkedWishlist || [];
  var linkedExpenses = node.linkedExpenses || [];
  var isMobile = device === "mobile";
  var isTablet = device === "tablet";
  function sync(patch) { props.onUpdate(Object.assign({}, node, patch)); }

  useEffect(function() {
    taskStore.loadTasks().then(setTasks);
    journalStore.loadSpaces().then(function(list) {
      setJournalSpaces(list);
      if (list[0]) setJournalSpaceId(list[0].id);
    });
    wishlistStore.loadItems().then(setWishlistItems);
    financeStore.loadExpenses().then(setExpenseItems);
  }, [node.id]);

  function linkWishlist(item) {
    if (linkedWishlist.find(function(x) { return x.id === item.id; })) return;
    sync({ linkedWishlist: linkedWishlist.concat([{ id: item.id, title: item.title }]) });
  }
  function linkExpense(item) {
    if (linkedExpenses.find(function(x) { return x.id === item.id; })) return;
    sync({ linkedExpenses: linkedExpenses.concat([{ id: item.id, title: item.title, amount: item.amount }]) });
  }
  function unlinkWishlist(id) { sync({ linkedWishlist: linkedWishlist.filter(function(x) { return x.id !== id; }) }); }
  function unlinkExpense(id) { sync({ linkedExpenses: linkedExpenses.filter(function(x) { return x.id !== id; }) }); }

  function onDragOverZone(e) { e.preventDefault(); setDragOver(true); }
  function onDragLeaveZone() { setDragOver(false); }
  function onDropZone(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) addFile({ target: { files: e.dataTransfer.files, value: "" } });
  }

  function pickFiles(folderId) {
    uploadFolderRef.current = folderId || null;
    if (fileRef.current) fileRef.current.click();
  }

  async function addFile(e) {
    var fl = e.target.files;
    if (!fl || !fl.length) return;
    e.target.value = "";
    var folderId = uploadFolderRef.current;
    var valid = [];
    var invalid = [];
    Array.from(fl).forEach(function(f) {
      if (isAllowedDocFile(f)) valid.push(f);
      else invalid.push(f);
    });
    if (invalid.length) {
      setUploadStatus("Formato inválido (usa PDF, JPG ou PNG): " + invalid.map(function(f) { return f.name; }).join(", "));
      setTimeout(function() { setUploadStatus(""); }, 4000);
    }
    if (!valid.length) return;
    setUploadStatus("A enviar " + valid.length + " ficheiro(s)...");
    var ownerId = (props.projectId || "local") + ":" + node.id;
    var now = Date.now();
    var uploaded = await Promise.all(valid.map(function(f) {
      return attachmentsStore.uploadAttachment(f, "synapse_node", ownerId, { project_id: props.projectId, node_id: node.id, folder_id: folderId || null });
    }));
    var failed = uploaded.filter(function(f) { return f.uploadError && !f.url && !f.data; });
    if (failed.length) {
      setUploadStatus("Erro: " + (failed[0].uploadError || "upload falhou"));
      return;
    }
    var localOnly = uploaded.some(function(f) { return f.localOnly; });
    setUploadStatus(localOnly ? "Guardado localmente (verifica login Supabase)" : "Ficheiros guardados");
    setTimeout(function() { setUploadStatus(""); }, 2800);
    var added = uploaded.map(function(f, i) {
      return Object.assign({}, attachmentsStore.stripFileForSave(f), {
        folderId: folderId || null,
        data: f.localOnly ? (f.data || f.url) : undefined,
        ts: now + i,
        recentUntil: now + DOC_RECENT_MS,
        type: inferDocFileType(valid[i], f),
        mime_type: valid[i].type || "",
      });
    });
    sync({ files: sortDocsRecent(added.concat(files)) });
  }
  function rmFile(fid) {
    var file = files.find(function(f){return f.id===fid;});
    attachmentsStore.deleteAttachment(file);
    sync({files:files.filter(function(f){return f.id!==fid;}),pinned:pinned.filter(function(p){return p.id!==fid;})});
  }
  function togglePin(item) {
    var ex = pinned.find(function(p){return p.id===item.id;});
    sync({pinned: ex ? pinned.filter(function(p){return p.id!==item.id;}) : pinned.concat([{id:item.id,type:item.type||"file",name:item.name||item.title}])});
  }
  function addLinkFn() {
    if (!newLink.trim()) return;
    sync({links:links.concat([{id:uid(),url:newLink.trim(),title:nlt.trim()||newLink.trim(),ts:Date.now()}])});
    setNewLink("");setNlt("");setAddingLink(false);
  }
  function rmLink(lid) { sync({links:links.filter(function(l){return l.id!==lid;}),pinned:pinned.filter(function(p){return p.id!==lid;})}); }
  function addFolderFn() {
    if (!newFolder.trim()) return;
    sync({folders:folders.concat([{id:uid(),name:newFolder.trim()}])});
    setNewFolder("");setAddingFolder(false);
  }
  function rmFolder(fid) {
    files.filter(function(f){return f.folderId===fid;}).forEach(function(f){attachmentsStore.deleteAttachment(f);});
    sync({folders:folders.filter(function(f){return f.id!==fid;}),files:files.filter(function(f){return f.folderId!==fid;})});
  }
  async function addNodeTask() {
    if (!newTask.trim()) return;
    var next = await taskStore.createLinkedTask(tasks, {
      title: newTask.trim(),
      notes: "Criada na sinapse: " + (node.label || "Sem nome"),
      column: "inbox",
      source_type: "synapse",
      source_id: node.id + "-" + Date.now(),
      synapse_project_id: props.projectId,
      synapse_node_id: node.id,
    });
    setTasks(next);
    setNewTask("");
  }
  async function toggleNodeTask(tid) {
    var next = tasks.map(function(t){return t.id===tid?Object.assign({},t,{column:t.column==="done"?"inbox":"done"}):t;});
    setTasks(next);
    await taskStore.saveTasks(next);
  }
  async function sendNoteToJournal() {
    if (!notes.trim()) return;
    var target = journalSpaceId || (journalSpaces[0] && journalSpaces[0].id);
    if (!target) return;
    setJournalStatus("A enviar...");
    await journalStore.appendBlock(target, "text", notes.trim().replace(/\n/g, "<br>"), {
      source_type: "synapse",
      source_id: node.id,
      synapse_project_id: props.projectId,
      synapse_node_id: node.id,
      synapse_label: node.label || "Sem nome",
      created_from: "quick_note",
    });
    setJournalStatus("Enviado para o Diário");
    setTimeout(function(){ setJournalStatus(""); }, 2200);
  }

  var lq = q.trim().toLowerCase();
  var visibleFiles = files.filter(function(f){ return !lq || f.name.toLowerCase().indexOf(lq)>=0; });
  var visibleLinks = links.filter(function(l){ return !lq || (l.title||"").toLowerCase().indexOf(lq)>=0 || (l.url||"").toLowerCase().indexOf(lq)>=0; });
  var unfiledFiles = sortDocsRecent(visibleFiles.filter(function(f){return !f.folderId;}));
  var allFilesSorted = sortDocsRecent(visibleFiles);
  var quick = pinned.map(function(p) {
    return files.find(function(f){return f.id===p.id;}) || links.find(function(l){return l.id===p.id;}) || null;
  }).filter(Boolean);
  var nodeTasks = tasks.filter(function(t){return t.synapse_node_id===node.id;});

  function actionButton(label, icon, onClick, strong) {
    return <button onClick={onClick} style={{border:"1px solid "+(strong?c+"40":"rgba(255,255,255,0.08)"),background:strong?c+"14":"rgba(255,255,255,0.03)",color:strong?c:"rgba(255,255,255,0.62)",borderRadius:12,padding:"10px 12px",fontSize:12,fontFamily:"'IBM Plex Sans',sans-serif",cursor:"pointer",display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}><span>{icon}</span>{label}</button>;
  }
  function tabBtn(key, icon, label, count) {
    var active = tab === key;
    return <button onClick={function(){setTab(key);}} style={{border:"1px solid "+(active?c+"40":"rgba(255,255,255,0.06)"),background:active?c+"12":"rgba(255,255,255,0.02)",color:active?c:"rgba(255,255,255,0.42)",borderRadius:14,padding:isMobile?"9px 10px":"10px 14px",fontSize:11,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",display:"flex",alignItems:"center",gap:8,whiteSpace:"nowrap"}}><span style={{fontSize:14}}>{icon}</span>{label}<span style={{opacity:0.45}}>{count}</span></button>;
  }
  function emptyState(icon, text) {
    return <div style={{minHeight:170,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,textAlign:"center",border:"1px dashed "+c+"18",borderRadius:18,background:c+"04"}}><div style={{width:58,height:58,borderRadius:20,background:c+"10",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{icon}</div><p style={{fontSize:13,color:"rgba(255,255,255,0.28)",lineHeight:1.6,margin:0}}>{text}</p></div>;
  }
  function fileCard(f, compact) {
    var isPinned = pinned.find(function(p){return p.id===f.id;});
    return (
      <div key={f.id} style={{borderRadius:16,overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)",background:"linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.01))",boxShadow:"0 10px 30px rgba(0,0,0,0.16)"}}>
        {f.type==="image" ? <img src={f.url||f.data} alt={f.name} style={{width:"100%",height:compact?70:118,objectFit:"cover",display:"block"}}/> : <div style={{height:compact?70:118,display:"flex",alignItems:"center",justifyContent:"center",background:"radial-gradient(circle at 50% 30%,"+c+"18,transparent 60%)",fontSize:32}}>{f.type==="pdf"?"PDF":"📄"}</div>}
        <div style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
          <a href={f.url||f.data} target="_blank" rel="noopener noreferrer" download={f.name} style={{flex:1,minWidth:0,color:"rgba(255,255,255,0.7)",fontSize:11.5,textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</a>
          <button onClick={function(){togglePin(f);}} title="Favorito" style={{background:"none",border:"none",fontSize:13,cursor:"pointer",color:isPinned?"#FFB800":"rgba(255,255,255,0.18)"}}>&#9733;</button>
          <button onClick={function(){rmFile(f.id);}} title="Apagar" style={{background:"none",border:"none",fontSize:12,cursor:"pointer",color:"rgba(255,255,255,0.18)"}}>&#10005;</button>
        </div>
      </div>
    );
  }
  function fileTableRow(f) {
    var isPinned = pinned.find(function(p){return p.id===f.id;});
    var recent = isDocRecent(f);
    var kind = f.type === "image" ? "Imagem" : f.type === "pdf" ? "PDF" : "Doc";
    var when = f.ts ? new Date(f.ts).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
    return (
      <div key={f.id} className={recent ? "doc-recent-row" : ""} style={{display:"grid",gridTemplateColumns:isMobile?"1fr auto":"minmax(0,1fr) 90px 110px auto",gap:10,alignItems:"center",padding:"12px 14px",borderRadius:14,border:"1px solid "+(recent?"rgba(255,184,0,0.35)":"rgba(255,255,255,0.06)"),background:recent?"rgba(255,184,0,0.06)":"rgba(255,255,255,0.02)",transition:"border-color .35s ease, background .35s ease"}}>
        <div style={{minWidth:0,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:c,flexShrink:0}}>{kind}</span>
          <a href={f.url||f.data} target="_blank" rel="noopener noreferrer" download={f.name} style={{color:"rgba(255,255,255,0.82)",fontSize:13,textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</a>
          {recent ? <span style={{fontSize:9,padding:"2px 7px",borderRadius:999,background:"rgba(255,184,0,0.18)",color:"#FFB800",fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>Recente</span> : null}
        </div>
        {!isMobile && <span style={{fontSize:10,color:"rgba(255,255,255,0.28)",fontFamily:"'JetBrains Mono',monospace"}}>{when}</span>}
        {!isMobile && <span style={{fontSize:10,color:"rgba(255,255,255,0.22)"}}>{f.folderId ? "Pasta" : "Geral"}</span>}
        <div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
          <button onClick={function(){togglePin(f);}} style={{background:"none",border:"none",fontSize:13,cursor:"pointer",color:isPinned?"#FFB800":"rgba(255,255,255,0.18)"}}>&#9733;</button>
          <button onClick={function(){rmFile(f.id);}} style={{background:"none",border:"none",fontSize:12,cursor:"pointer",color:"rgba(255,255,255,0.18)"}}>&#10005;</button>
        </div>
      </div>
    );
  }
  function filesTable(list, emptyText) {
    if (!list.length) return emptyState("📄", emptyText);
    return <div style={{display:"flex",flexDirection:"column",gap:8}}>{list.map(fileTableRow)}</div>;
  }
  function linkCard(l) {
    var isPinned = pinned.find(function(p){return p.id===l.id;});
    return (
      <div key={l.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:14,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.025)"}}>
        <div style={{width:34,height:34,borderRadius:12,background:c+"12",display:"flex",alignItems:"center",justifyContent:"center",color:c}}>&#128279;</div>
        <a href={l.url} target="_blank" rel="noopener noreferrer" style={{flex:1,minWidth:0,textDecoration:"none"}}><p style={{margin:0,color:c,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.title}</p><p style={{margin:"2px 0 0",color:"rgba(255,255,255,0.22)",fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.url}</p></a>
        <button onClick={function(){togglePin({id:l.id,type:"link",name:l.title});}} style={{background:"none",border:"none",fontSize:13,cursor:"pointer",color:isPinned?"#FFB800":"rgba(255,255,255,0.18)"}}>&#9733;</button>
        <button onClick={function(){rmLink(l.id);}} style={{background:"none",border:"none",fontSize:12,cursor:"pointer",color:"rgba(255,255,255,0.18)"}}>&#10005;</button>
      </div>
    );
  }

  return (
    <div data-no-canvas-zoom onClick={props.onClose} style={{position:"fixed",inset:0,zIndex:70,background:"radial-gradient(circle at 50% 15%,"+c+"10,rgba(0,0,0,0.72) 42%,rgba(0,0,0,0.82))",backdropFilter:"blur(18px)",display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?8:(isTablet?14:22)}}>
      <div onClick={function(e){e.stopPropagation();}} style={{width:isMobile?"97vw":(isTablet?"95vw":"min(1060px,92vw)"),height:isMobile?"94vh":(isTablet?"90vh":"min(760px,86vh)"),borderRadius:isMobile?20:28,overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)",background:"linear-gradient(145deg,rgba(13,14,26,0.98),rgba(6,7,14,0.98))",boxShadow:"0 32px 120px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",animation:"searchIn 0.22s cubic-bezier(0.2,0,0,1)"}}>
        <div style={{padding:isMobile?"18px 16px":"24px 26px 20px",background:"radial-gradient(circle at 20% 0,"+c+"1A,transparent 42%)",borderBottom:"1px solid rgba(255,255,255,0.055)"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
            <div style={{width:54,height:54,borderRadius:20,background:c+"12",border:"1px solid "+c+"35",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 40px "+c+"22",color:c,fontSize:23,flexShrink:0}}>&#10022;</div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{margin:"0 0 4px",fontSize:10,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,color:c}}>SINAPSE HUB</p>
              <h2 style={{margin:0,fontSize:isMobile?20:26,color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{node.label||"Sem nome"}</h2>
              <p style={{margin:"8px 0 0",fontSize:12,color:"rgba(255,255,255,0.36)"}}>{files.length} ficheiro{files.length!==1?"s":""} · {links.length} link{links.length!==1?"s":""} · {notes.length} caracteres em notas</p>
              {uploadStatus ? <p style={{margin:"6px 0 0",fontSize:11,color:c}}>{uploadStatus}</p> : null}
            </div>
            <button onClick={props.onClose} style={{width:38,height:38,borderRadius:13,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.035)",color:"rgba(255,255,255,0.45)",fontSize:16,cursor:"pointer",flexShrink:0}}>&#10005;</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.2fr repeat(3,0.45fr)",gap:10,marginTop:18}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:14,background:"rgba(0,0,0,0.22)",border:"1px solid rgba(255,255,255,0.06)"}}><span style={{color:c}}>&#128269;</span><input value={q} onChange={function(e){setQ(e.target.value);}} placeholder="Filtrar ficheiros e links..." style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:isMobile?16:13,fontFamily:"'IBM Plex Sans',sans-serif"}}/></div>
            <div style={{borderRadius:14,background:c+"08",border:"1px solid "+c+"18",padding:"10px 12px"}}><p style={{margin:0,fontSize:9,color:c,fontFamily:"'JetBrains Mono',monospace"}}>FICHEIROS</p><strong style={{fontSize:18,color:"#fff"}}>{files.length}</strong></div>
            <div style={{borderRadius:14,background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",padding:"10px 12px"}}><p style={{margin:0,fontSize:9,color:"rgba(255,255,255,0.28)",fontFamily:"'JetBrains Mono',monospace"}}>LINKS</p><strong style={{fontSize:18,color:"#fff"}}>{links.length}</strong></div>
            <div style={{borderRadius:14,background:"rgba(255,184,0,0.06)",border:"1px solid rgba(255,184,0,0.16)",padding:"10px 12px"}}><p style={{margin:0,fontSize:9,color:"#FFB800",fontFamily:"'JetBrains Mono',monospace"}}>FAVORITOS</p><strong style={{fontSize:18,color:"#fff"}}>{pinned.length}</strong></div>
          </div>
        </div>

        <div style={{display:"flex",gap:8,overflowX:"auto",padding:isMobile?"12px 12px":"14px 22px",borderBottom:"1px solid rgba(255,255,255,0.045)"}}>
          {tabBtn("home","\u2726","VISÃO",quick.length)}
          {tabBtn("files","\uD83D\uDCC1","FICHEIROS",visibleFiles.length)}
          {tabBtn("links","\uD83D\uDD17","LINKS",visibleLinks.length)}
          {tabBtn("tasks","\u2713","TAREFAS",nodeTasks.length)}
          {tabBtn("notes","\u270F\uFE0F","NOTAS",notes.length)}
        </div>

        <div data-scrollable style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch",padding:isMobile?"14px":(isTablet?"18px":"20px 22px 24px")}}>
          {tab==="home" && (
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
              <div style={{borderRadius:20,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.025)",padding:16}}>
                <p style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:c,letterSpacing:1.2,margin:"0 0 12px"}}>AÇÕES RÁPIDAS</p>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
                  {actionButton("Adicionar ficheiros","\uD83D\uDCC4",function(){pickFiles(null);},true)}
                  {actionButton("Novo link","\uD83D\uDD17",function(){setTab("links");setAddingLink(true);},false)}
                  {actionButton("Escrever nota","\u270F\uFE0F",function(){setTab("notes");},false)}
                  {actionButton("Nova pasta","\uD83D\uDCC1",function(){setTab("files");setAddingFolder(true);},false)}
                </div>
              </div>
              <div style={{borderRadius:20,border:"1px solid "+c+"18",background:"linear-gradient(145deg,"+c+"08,rgba(255,255,255,0.015))",padding:16}}>
                <p style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:c,letterSpacing:1.2,margin:"0 0 10px"}}>NOTA RÁPIDA</p>
                <textarea value={notes} onChange={function(e){sync({notes:e.target.value});}} placeholder="Ideias, contexto, próximos passos..." style={{width:"100%",minHeight:isMobile?280:(isTablet?300:230),background:"rgba(0,0,0,0.18)",border:"1px solid "+c+"18",borderRadius:14,color:"rgba(255,255,255,0.82)",fontSize:isMobile?16:14.5,lineHeight:1.85,padding:14,resize:"vertical",outline:"none",fontFamily:"'IBM Plex Sans',sans-serif",boxSizing:"border-box"}}/>
              </div>
              <div style={{gridColumn:isMobile?"auto":"1 / -1",borderRadius:20,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.02)",padding:16}}>
                <p style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:"#FFB800",letterSpacing:1.2,margin:"0 0 12px"}}>FAVORITOS</p>
                {quick.length===0 ? emptyState("\u2B50","Marca ficheiros ou links com estrela para aparecerem aqui.") : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax("+ (isMobile ? "120px" : "150px") +",1fr))",gap:10}}>{quick.map(function(it){return it.url?linkCard(it):fileCard(it,true);})}</div>}
              </div>
              <div style={{gridColumn:isMobile?"auto":"1 / -1",borderRadius:20,border:"1px solid rgba(52,211,153,0.2)",background:"rgba(52,211,153,0.04)",padding:16}}>
                <p style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:"#34D399",letterSpacing:1.2,margin:"0 0 10px"}}>LIGAÇÕES</p>
                {linkedWishlist.length ? linkedWishlist.map(function(l) {
                  return <div key={"wl-"+l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,fontSize:12}}><span style={{color:"#34D399"}}>Wishlist · {l.title}</span><button onClick={function(){unlinkWishlist(l.id);}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.25)",cursor:"pointer"}}>×</button></div>;
                }) : null}
                {linkedExpenses.length ? linkedExpenses.map(function(l) {
                  return <div key={"ex-"+l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,fontSize:12}}><span style={{color:"#38BDF8"}}>Gasto · {l.title}{l.amount!=null?" · "+Number(l.amount).toFixed(2)+"€":""}</span><button onClick={function(){unlinkExpense(l.id);}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.25)",cursor:"pointer"}}>×</button></div>;
                }) : null}
                {!linkedWishlist.length && !linkedExpenses.length ? <p style={{margin:0,fontSize:11,color:"rgba(255,255,255,0.25)"}}>Associa itens da wishlist ou gastos abaixo.</p> : null}
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10,marginTop:12}}>
                  <select onChange={function(e){var it=wishlistItems.find(function(x){return x.id===e.target.value;}); if(it) linkWishlist(it); e.target.value="";}} style={{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#fff",padding:"8px",fontSize:11}}>
                    <option value="">+ Wishlist…</option>
                    {wishlistItems.filter(function(i){return !i.purchased;}).map(function(i){return <option key={i.id} value={i.id}>{i.title}</option>;})}
                  </select>
                  <select onChange={function(e){var it=expenseItems.find(function(x){return x.id===e.target.value;}); if(it) linkExpense(it); e.target.value="";}} style={{background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#fff",padding:"8px",fontSize:11}}>
                    <option value="">+ Gasto…</option>
                    {expenseItems.slice(0,40).map(function(i){return <option key={i.id} value={i.id}>{i.title}</option>;})}
                  </select>
                </div>
              </div>
            </div>
          )}
          {tab==="files" && (
            <div>
              <div
                onDragOver={onDragOverZone}
                onDragLeave={onDragLeaveZone}
                onDrop={onDropZone}
                onClick={function(){pickFiles(null);}}
                style={{marginBottom:16,padding:"28px 16px",borderRadius:20,border:"2px dashed "+(dragOver?c+"70":c+"28"),background:dragOver?c+"12":c+"06",textAlign:"center",cursor:"pointer",transition:"border-color .2s, background .2s"}}
              >
                <p style={{margin:0,fontSize:14,color:dragOver?c:"rgba(255,255,255,0.55)"}}>Arrasta PDF ou imagens (JPG, PNG) para aqui</p>
                <p style={{margin:"8px 0 0",fontSize:11,color:"rgba(255,255,255,0.28)"}}>ou clica para escolher ficheiros</p>
              </div>
              <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
                {actionButton("Adicionar ficheiro","\uD83D\uDCC4",function(){pickFiles(null);},true)}
                {actionButton("Criar pasta","\uD83D\uDCC1",function(){setAddingFolder(true);},false)}
              </div>
              <p style={{margin:"0 0 10px",fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:"rgba(255,255,255,0.28)",letterSpacing:1}}>DOCUMENTOS · MAIS RECENTES NO TOPO</p>
              {addingFolder && <div style={{display:"flex",gap:8,marginBottom:14}}><input value={newFolder} onChange={function(e){setNewFolder(e.target.value);}} placeholder="Nome da pasta..." autoFocus onKeyDown={function(e){if(e.key==="Enter")addFolderFn();}} style={{flex:1,background:"rgba(255,255,255,0.035)",border:"1px solid "+c+"22",borderRadius:12,color:"#fff",fontSize:13,padding:"10px 12px",outline:"none"}}/><button onClick={addFolderFn} style={{background:c+"14",border:"1px solid "+c+"35",borderRadius:12,color:c,padding:"0 16px",cursor:"pointer"}}>Criar</button></div>}
              {allFilesSorted.length ? filesTable(allFilesSorted, "") : emptyState("\uD83D\uDCC4","Adiciona PDF ou imagens (JPG, PNG).")}
              {folders.map(function(folder){
                var ff = sortDocsRecent(visibleFiles.filter(function(f){return f.folderId===folder.id;}));
                return <div key={folder.id} style={{marginTop:18}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <p style={{margin:0,fontSize:12,color:"rgba(255,255,255,0.58)",fontFamily:"'JetBrains Mono',monospace"}}>&#128194; {folder.name} <span style={{opacity:0.3}}>{ff.length}</span></p>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={function(){pickFiles(folder.id);}} style={{background:c+"10",border:"1px solid "+c+"28",borderRadius:10,color:c,padding:"6px 10px",fontSize:10,cursor:"pointer"}}>+ Ficheiro</button>
                      <button onClick={function(){rmFolder(folder.id);}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.18)",cursor:"pointer"}}>&#10005;</button>
                    </div>
                  </div>
                  {filesTable(ff, "Pasta vazia.")}
                </div>;
              })}
            </div>
          )}
          {tab==="links" && (
            <div>
              <button onClick={function(){setAddingLink(true);}} style={{width:"100%",padding:"12px",background:c+"10",border:"1px solid "+c+"28",borderRadius:14,color:c,fontSize:13,marginBottom:14,cursor:"pointer"}}>+ Novo link</button>
              {addingLink && <div style={{background:c+"05",border:"1px solid "+c+"18",borderRadius:16,padding:14,marginBottom:14}}><input value={nlt} onChange={function(e){setNlt(e.target.value);}} placeholder="Título" autoFocus style={{width:"100%",boxSizing:"border-box",background:"rgba(0,0,0,0.18)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"#fff",fontSize:13,padding:"10px 12px",outline:"none",marginBottom:8}}/><input value={newLink} onChange={function(e){setNewLink(e.target.value);}} placeholder="https://..." onKeyDown={function(e){if(e.key==="Enter")addLinkFn();}} style={{width:"100%",boxSizing:"border-box",background:"rgba(0,0,0,0.18)",border:"1px solid "+c+"20",borderRadius:12,color:c,fontSize:12,padding:"10px 12px",outline:"none",marginBottom:10}}/><div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={function(){setAddingLink(false);setNewLink("");setNlt("");}} style={{background:"rgba(255,255,255,0.035)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"rgba(255,255,255,0.42)",padding:"8px 12px",cursor:"pointer"}}>Cancelar</button><button onClick={addLinkFn} style={{background:c+"14",border:"1px solid "+c+"35",borderRadius:10,color:c,padding:"8px 12px",cursor:"pointer"}}>Guardar</button></div></div>}
              {visibleLinks.length ? <div style={{display:"flex",flexDirection:"column",gap:10}}>{visibleLinks.map(linkCard)}</div> : emptyState("\uD83D\uDD17","Guarda links úteis, pesquisas e referências externas.")}
            </div>
          )}
          {tab==="tasks" && (
            <div>
              <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:isMobile?"wrap":"nowrap"}}>
                <input value={newTask} onChange={function(e){setNewTask(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")addNodeTask();}} placeholder="Nova tarefa ligada a este nó..." style={{flex:1,minWidth:isMobile?"100%":180,background:"rgba(0,0,0,0.18)",border:"1px solid "+c+"22",borderRadius:12,color:"#fff",fontSize:isMobile?16:13,padding:"11px 12px",outline:"none"}}/>
                <button onClick={addNodeTask} style={{background:c+"14",border:"1px solid "+c+"35",borderRadius:12,color:c,padding:isMobile?"11px 16px":"0 16px",cursor:"pointer"}}>Adicionar</button>
              </div>
              {nodeTasks.length ? <div style={{display:"flex",flexDirection:"column",gap:10}}>{nodeTasks.map(function(t){return <div key={t.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",borderRadius:14,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.025)"}}><button onClick={function(){toggleNodeTask(t.id);}} style={{width:22,height:22,borderRadius:6,border:"2px solid "+(t.column==="done"?c:"rgba(255,255,255,0.2)"),background:t.column==="done"?c+"25":"transparent",color:t.column==="done"?c:"transparent",cursor:"pointer"}}>✓</button><div style={{flex:1}}><p style={{margin:0,color:t.column==="done"?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.82)",textDecoration:t.column==="done"?"line-through":"none",fontSize:13}}>{t.title}</p>{t.notes&&<p style={{margin:"5px 0 0",color:"rgba(255,255,255,0.3)",fontSize:11}}>{t.notes}</p>}</div></div>;})}</div> : emptyState("\u2713","Cria tarefas neste nó. Elas aparecem também no menu global de Tarefas.")}
            </div>
          )}
          {tab==="notes" && (
            <div>
              <textarea value={notes} onChange={function(e){sync({notes:e.target.value});}} placeholder="Escreve livremente..." style={{width:"100%",minHeight:isMobile?520:(isTablet?560:440),background:"linear-gradient(145deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))",border:"1px solid "+c+"18",borderRadius:20,color:"rgba(255,255,255,0.82)",fontSize:isMobile?16:15,fontFamily:"'IBM Plex Sans',sans-serif",lineHeight:1.9,padding:isMobile?16:20,resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
              <div style={{display:"flex",gap:8,alignItems:"center",marginTop:10,flexWrap:isMobile?"wrap":"nowrap"}}>
                <p style={{fontSize:10,color:"rgba(255,255,255,0.14)",margin:0,fontFamily:"'JetBrains Mono',monospace",flex:1}}>{notes.length} caracteres · auto-guardado</p>
                <select value={journalSpaceId} onChange={function(e){setJournalSpaceId(e.target.value);}} style={{minWidth:isMobile?"100%":170,background:"rgba(0,0,0,0.22)",border:"1px solid "+c+"22",borderRadius:12,color:"#fff",fontSize:12,padding:"9px 10px",outline:"none"}}>
                  {journalSpaces.map(function(s){return <option key={s.id} value={s.id}>{s.title}</option>;})}
                </select>
                <button onClick={sendNoteToJournal} disabled={!notes.trim() || !journalSpaceId} style={{background:c+"14",border:"1px solid "+c+"35",borderRadius:12,color:c,padding:"10px 12px",cursor:(!notes.trim()||!journalSpaceId)?"default":"pointer",opacity:(!notes.trim()||!journalSpaceId)?0.45:1,fontSize:12}}>Enviar para Diário</button>
              </div>
              {journalStatus && <p style={{fontSize:10,color:c,margin:"8px 0 0",fontFamily:"'JetBrains Mono',monospace"}}>{journalStatus}</p>}
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" multiple accept={DOC_ACCEPT} style={{display:"none"}} onChange={addFile}/>
      </div>
      <style>{DOC_RECENT_CSS}</style>
    </div>
  );
}

// ══════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════
export default function Synapse(props) {
  var embedded = !!(props && props.embedded);
  var routeProjectId = props && props.projectId;
  var navigate = useNavigate();
  var device = useDevice();
  var isMob = device==="mobile", isTab = device==="tablet";
  var touchUI = isMob || isTab;
  var svgRef = useRef(null);
  var workspaceRef = useRef(null);
  var nS = useState([]); var nodes = nS[0], setNodes = nS[1];
  var cS = useState([]); var conns = cS[0], setConns = cS[1];
  var selS = useState(null); var sel = selS[0], setSel = selS[1];
  var cfS = useState(null); var connFrom = cfS[0], setConnFrom = cfS[1];
  var panS = useState({x:0,y:0}); var pan = panS[0], setPan = panS[1];
  var zS = useState(1); var zoom = zS[0], setZoom = zS[1];
  var dS = useState(null); var drag = dS[0], setDrag = dS[1];
  var ipS = useState(false); var isPanning = ipS[0], setIsPanning = ipS[1];
  var eS = useState(null); var editId = eS[0], setEditId = eS[1];
  var dnS = useState(null); var docNode = dnS[0], setDocNode = dnS[1];
  var colS = useState(new Set()); var collapsed = colS[0], setCollapsed = colS[1];
  var ctxS = useState(null); var ctx = ctxS[0], setCtx = ctxS[1];
  var tlS = useState("select"); var tool = tlS[0], setTool = tlS[1];
  var hlS = useState(true); var help = hlS[0], setHelp = hlS[1];
  var ldS = useState(false); var loaded = ldS[0], setLoaded = ldS[1];
  var srS = useState(false); var search = srS[0], setSearch = srS[1];
  var mpS = useState({x:0,y:0}); var mousePos = mpS[0], setMousePos = mpS[1];
  var plS = useState(false); var placing = plS[0], setPlacing = plS[1];
  var prS = useState([]); var projects = prS[0], setProjects = prS[1];
  var apS = useState(null); var activeProject = apS[0], setActiveProject = apS[1];
  var npS = useState(""); var newProjectName = npS[0], setNewProjectName = npS[1];

  var dragOff = useRef({x:0,y:0});
  var panStart = useRef({x:0,y:0});
  var didDrag = useRef(false);
  var lastTap = useRef({});
  var tapTimers = useRef({});
  var saveTimer = useRef(null);
  var touchRef = useRef({fingers:0});
  var hydratingRef = useRef(false);
  var lastSavedKey = useRef("");
  var lastLocalEdit = useRef(0);

  useEffect(function() {
    function h(e) { if (svgRef.current && svgRef.current.contains(e.target)) e.preventDefault(); }
    document.addEventListener("contextmenu", h);
    return function() { document.removeEventListener("contextmenu", h); };
  }, []);

  useEffect(function() {
    synapseStore.loadProjects().then(function(list) {
      if (list.length) { setProjects(list); setLoaded(true); return; }
      doLoad().then(function(old) {
        var p = synapseStore.newProject("Principal");
        setProjects([p]);
        synapseStore.saveProjects([p]);
        if (old && old.nodes && old.nodes.length) synapseStore.saveProjectData(p.id, old);
        setLoaded(true);
      });
    });
  }, []);

  useEffect(function() {
    if (!routeProjectId || !projects.length) return;
    var match = projects.find(function(p) { return p.id === routeProjectId; });
    if (match) setActiveProject(match);
  }, [routeProjectId, projects]);

  var refreshProjectData = useCallback(function(silent) {
    if (!activeProject) return Promise.resolve();
    if (!silent) setLoaded(false);
    hydratingRef.current = true;
    return synapseStore.loadProjectData(activeProject.id).then(function(d) {
      var nextNodes = d.nodes || [];
      var nextConns = d.conns || [];
      var nextCollapsed = d.collapsed || activeProject.collapsed || [];
      lastSavedKey.current = JSON.stringify({nodes:nextNodes,conns:nextConns,collapsed:nextCollapsed});
      setNodes(nextNodes);
      setConns(nextConns);
      setCollapsed(new Set(nextCollapsed));
      if (d.nodes && d.nodes.length) setHelp(false);
      setLoaded(true);
      setTimeout(function(){ hydratingRef.current = false; }, 0);
    }).catch(function() {
      hydratingRef.current = false;
      if (!silent) setLoaded(true);
    });
  }, [activeProject]);

  useEffect(function() {
    refreshProjectData();
  }, [activeProject && activeProject.id]);

  useEffect(function() {
    if (!activeProject || !loaded) return;
    function canRefresh() {
      return !editId && !docNode && !ctx && !drag && !placing && !connFrom;
    }
    function doRefresh() {
      if (Date.now() - lastLocalEdit.current < 8000) return;
      if (document.visibilityState === "visible" && canRefresh()) refreshProjectData(true);
    }
    function onVisible() {
      if (Date.now() - lastLocalEdit.current < 8000) return;
      if (document.visibilityState === "visible" && canRefresh()) refreshProjectData(true);
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", doRefresh);
    return function() {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", doRefresh);
    };
  }, [activeProject, loaded, editId, docNode, ctx, drag, placing, connFrom, refreshProjectData]);

  useEffect(function() {
    if (!loaded || !activeProject) return;
    if (hydratingRef.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(function() {
      var data = {nodes:nodes,conns:conns,collapsed:Array.from(collapsed)};
      var key = JSON.stringify(data);
      if (key === lastSavedKey.current) return;
      lastSavedKey.current = key;
      synapseStore.saveProjectData(activeProject.id, data);
      var nextProjects = projects.map(function(p){return p.id===activeProject.id?Object.assign({},p,{collapsed:data.collapsed}):p;});
      setProjects(nextProjects);
      synapseStore.saveProjects(nextProjects);
    }, 500);
  }, [nodes, conns, collapsed, loaded, activeProject]);

  function createProject() {
    var p = synapseStore.newProject(newProjectName.trim() || "Novo projeto");
    var next = projects.concat([p]);
    setProjects(next);
    setNewProjectName("");
    synapseStore.saveProjects(next);
  }
  async function removeProject(project) {
    if (!window.confirm("Apagar a sinapse \"" + project.name + "\"? Isto remove este projeto e os seus nós.")) return;
    var next = await synapseStore.deleteProject(project.id, projects);
    setProjects(next);
    if (activeProject && activeProject.id === project.id) setActiveProject(null);
  }
  function renameProject(project) {
    var name = window.prompt("Novo nome do workspace", project.name || "");
    if (name === null) return;
    name = name.trim();
    if (!name) return;
    var next = projects.map(function(p) {
      return p.id === project.id ? Object.assign({}, p, { name: name }) : p;
    });
    setProjects(next);
    synapseStore.saveProjects(next);
    if (activeProject && activeProject.id === project.id) setActiveProject(Object.assign({}, activeProject, { name: name }));
  }

  var s2c = useCallback(function(sx, sy) {
    var r = svgRef.current ? svgRef.current.getBoundingClientRect() : null;
    if (!r) return {x:sx,y:sy};
    return {x:(sx-r.left-pan.x)/zoom, y:(sy-r.top-pan.y)/zoom};
  }, [pan, zoom]);

  var hidden = useMemo(function() {
    var h = new Set();
    function hideKids(pid) { nodes.forEach(function(n) { if(n.parentId===pid){h.add(n.id);hideKids(n.id);} }); }
    collapsed.forEach(function(id){hideKids(id);});
    return h;
  }, [nodes, collapsed]);

  // CHANGED: color system — first children get different colors, grandchildren inherit parent color
  var createNode = useCallback(function(x, y, parentId) {
    var parent = parentId ? nodes.find(function(n){return n.id===parentId;}) : null;
    var nc;
    if (parent) {
      // Check if parent is a root node (no parentId) = first-level children get different colors
      if (!parent.parentId) {
        nc = pickDifferentColor(parent.color);
      } else {
        // Grandchildren and deeper: inherit parent's color
        nc = parent.color;
      }
    } else {
      var rc = nodes.filter(function(n){return !n.isChild;}).length;
      nc = ALL_COLORS[rc % ALL_COLORS.length];
    }
    var id = uid();
    var nn = {id:id,label:"",x:x,y:y,color:nc,isChild:!!parentId,parentId:parentId||null,notes:"",files:[],links:[],folders:[],pinned:[]};
    lastLocalEdit.current = Date.now();
    setNodes(function(p){return p.concat([nn]);});
    if (parentId) {
      setConns(function(p){return p.concat([{from:parentId,to:id}]);});
      setCollapsed(function(p){var s=new Set(p);s.delete(parentId);return s;});
    }
    setEditId(id);
    setHelp(false); setPlacing(false);
    return id;
  }, [nodes]);

  var commitLabel = useCallback(function(nid, lab) {
    setNodes(function(p){return p.map(function(n){return n.id===nid?Object.assign({},n,{label:lab.trim()||"Sem nome"}):n;});});
    setEditId(null);
  }, []);

  function renameNode(nid) {
    setEditId(nid);
  }

  var deleteNode = useCallback(function(nid) {
    function desc(id) { var a=[id]; nodes.filter(function(n){return n.parentId===id;}).forEach(function(ch){a=a.concat(desc(ch.id));}); return a; }
    var all = desc(nid);
    setNodes(function(p){return p.filter(function(n){return all.indexOf(n.id)<0;});});
    setConns(function(p){return p.filter(function(c){return all.indexOf(c.from)<0&&all.indexOf(c.to)<0;});});
    if(sel===nid)setSel(null);
    if(docNode&&docNode.id===nid)setDocNode(null);
    setCollapsed(function(p){var s=new Set(p);all.forEach(function(i){s.delete(i);});return s;});
  }, [nodes, sel, docNode]);

  var updateNode = useCallback(function(u) {
    lastLocalEdit.current = Date.now();
    setNodes(function(p){return p.map(function(n){return n.id===u.id?u:n;});});
    if(docNode&&docNode.id===u.id)setDocNode(u);
  }, [docNode]);

  // CHANGED: recolor node + all descendants (children, grandchildren, etc.)
  var recolorNode = useCallback(function(nid) {
    var node = nodes.find(function(n){return n.id===nid;});
    if (!node) return;
    var newColor = pickDifferentColor(node.color);
    // Collect all descendants
    function getDesc(id) {
      var a = [];
      nodes.filter(function(n){return n.parentId===id;}).forEach(function(ch){
        a.push(ch.id);
        a = a.concat(getDesc(ch.id));
      });
      return a;
    }
    var descIds = getDesc(nid);
    setNodes(function(p){
      return p.map(function(n){
        if (n.id === nid) return Object.assign({}, n, {color: newColor});
        if (descIds.indexOf(n.id) >= 0) return Object.assign({}, n, {color: newColor});
        return n;
      });
    });
  }, [nodes]);

  var addChild = useCallback(function(pid) {
    var p = nodes.find(function(n){return n.id===pid;});
    if(!p)return;
    var ch = nodes.filter(function(n){return n.parentId===pid;});
    var ang = ch.length*(Math.PI*2/Math.max(ch.length+1,3))+Math.PI/6;
    var d = 110+Math.random()*25;
    createNode(p.x+Math.cos(ang)*d, p.y+Math.sin(ang)*d, pid);
  }, [nodes, createNode]);

  var navigateTo = useCallback(function(nid) {
    var n = nodes.find(function(nd){return nd.id===nid;});
    if(!n)return;
    var current = n, toExp = [];
    while(current&&current.parentId){toExp.push(current.parentId);current=nodes.find(function(nd){return nd.id===current.parentId;});}
    if(toExp.length)setCollapsed(function(p){var s=new Set(p);toExp.forEach(function(i){s.delete(i);});return s;});
    var rect = svgRef.current?svgRef.current.getBoundingClientRect():null;
    if(rect)setPan({x:rect.width/2-n.x*zoom, y:rect.height/2-n.y*zoom});
    setSel(nid);
  }, [nodes, zoom]);

  // CHANGED: double-click only collapses, never opens doc panel
  var onNodePD = useCallback(function(e, nid) {
    if(e.button&&e.button!==0)return;
    if(e.stopPropagation)e.stopPropagation();
    didDrag.current = false;
    var now = Date.now(), last = lastTap.current[nid]||0;
    lastTap.current[nid] = now;
    // Double click/tap = collapse only
    if(now-last<350){
      clearTimeout(tapTimers.current[nid]);
      setCollapsed(function(p){var s=new Set(p);if(s.has(nid))s.delete(nid);else s.add(nid);return s;});
      return;
    }
    if(tool==="connect"){setConnFrom(nid);return;}
    var n=nodes.find(function(nd){return nd.id===nid;});if(!n)return;
    var pos=s2c(e.clientX,e.clientY);
    dragOff.current={x:pos.x-n.x,y:pos.y-n.y};
    setDrag(nid);
  }, [nodes, s2c, tool]);

  // CHANGED: single tap opens doc panel, but not if we just double-tapped
  var onNodeTap = useCallback(function(e, nid) {
    if(e.button&&e.button!==0)return;
    if(connFrom&&connFrom!==nid){
      var ex=conns.some(function(c){return(c.from===connFrom&&c.to===nid)||(c.from===nid&&c.to===connFrom);});
      if(!ex)setConns(function(p){return p.concat([{from:connFrom,to:nid}]);});
      setConnFrom(null);setTool("select");return;
    }
    setSel(nid);setCtx(null);
    if (touchUI) {
      setDocNode(null);
      setPlacing(false);
      return;
    }
    if(!didDrag.current&&editId!==nid){
      clearTimeout(tapTimers.current[nid]);
      tapTimers.current[nid]=setTimeout(function(){
        // Only open doc if no double-click happened
        var now2 = Date.now();
        var last2 = lastTap.current[nid] || 0;
        // If the last tap was recent (double-click window), skip
        if (now2 - last2 < 100) return;
        var n=nodes.find(function(nd){return nd.id===nid;});
        if(n)setDocNode(n);
      },450);
    }
  }, [connFrom, conns, nodes, editId, touchUI]);

  var onNodeCtx = useCallback(function(e, nid) {
    e.preventDefault();if(e.stopPropagation)e.stopPropagation();
    setCtx({type:"node",x:e.clientX,y:e.clientY,nodeId:nid});setSel(nid);
  }, []);

  var onConnCtx = useCallback(function(e, ci) {
    e.preventDefault();if(e.stopPropagation)e.stopPropagation();
    setCtx({type:"conn",x:e.clientX,y:e.clientY,connIdx:ci});
  }, []);

  // CHANGED: right-click on canvas cancels connect mode / placing mode
  var onCanvasCtx = useCallback(function(e) {
    e.preventDefault();
    // If in connect mode or placing mode, cancel instead of showing menu
    if (connFrom || placing) {
      setConnFrom(null);
      setPlacing(false);
      setTool("select");
      return;
    }
    var pos=s2c(e.clientX,e.clientY);
    setCtx({type:"canvas",x:e.clientX,y:e.clientY,cx:pos.x,cy:pos.y});
  }, [s2c, connFrom, placing]);

  var onCanvasClick = useCallback(function(e) {
    if(e.target!==svgRef.current&&e.target.tagName!=="rect")return;
    if(placing){var pos=s2c(e.clientX,e.clientY);createNode(pos.x,pos.y);return;}
    if(connFrom){setConnFrom(null);return;}
    setSel(null);setCtx(null);setDocNode(null);
  }, [connFrom, placing, s2c, createNode]);

  var onCanvasMD = useCallback(function(e) {
    if(e.button===1||(e.button===0&&e.altKey)||(e.button===0&&(e.target===svgRef.current||e.target.tagName==="rect"))){
      e.preventDefault();setIsPanning(true);
      panStart.current={x:e.clientX-pan.x,y:e.clientY-pan.y};
    }
  }, [pan]);

  var onMM = useCallback(function(e) {
    var pos=s2c(e.clientX,e.clientY);
    setMousePos(pos);
    if(drag){
      didDrag.current=true;
      setNodes(function(p){return p.map(function(n){return n.id===drag?Object.assign({},n,{x:pos.x-dragOff.current.x,y:pos.y-dragOff.current.y}):n;});});
    }
    if(isPanning)setPan({x:e.clientX-panStart.current.x,y:e.clientY-panStart.current.y});
  }, [drag, isPanning, s2c]);

  var onMU = useCallback(function(){setDrag(null);setIsPanning(false);}, []);

  var onWheel = useCallback(function(e) {
    if (e.target && e.target.closest && e.target.closest("[data-no-canvas-zoom]")) return;
    e.preventDefault();
    e.stopPropagation();
    var dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16;
    else if (e.deltaMode === 2) dy *= window.innerHeight;
    var d = dy > 0 ? 0.92 : 1.08;
    if (e.ctrlKey) d = dy > 0 ? 0.94 : 1.06;
    var rect = svgRef.current ? svgRef.current.getBoundingClientRect() : null;
    if (!rect) return;
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    setZoom(function(z) {
      var nz = clamp(z * d, 0.12, 5);
      var sc = nz / z;
      setPan(function(p) { return { x: mx - sc * (mx - p.x), y: my - sc * (my - p.y) }; });
      return nz;
    });
  }, []);

  useEffect(function() {
    if (!loaded) return;
    var el = workspaceRef.current;
    if (!el) return;
    function handler(e) { onWheel(e); }
    el.addEventListener("wheel", handler, { passive: false });
    return function() { el.removeEventListener("wheel", handler); };
  }, [onWheel, loaded]);

  var onTouchStart = useCallback(function(e) {
    var ts=e.touches;
    touchRef.current.fingers=ts.length;
    if(ts.length===2){
      var dx=ts[0].clientX-ts[1].clientX,dy=ts[0].clientY-ts[1].clientY;
      touchRef.current={fingers:2,startDist:Math.hypot(dx,dy),startZoom:zoom,startPan:{x:pan.x,y:pan.y},startMid:{x:(ts[0].clientX+ts[1].clientX)/2,y:(ts[0].clientY+ts[1].clientY)/2}};
    } else if(ts.length===1&&!drag){
      var tgt=e.target;
      if(tgt===svgRef.current||tgt.tagName==="rect"){
        touchRef.current={fingers:1,startPan:{x:pan.x,y:pan.y},startX:ts[0].clientX,startY:ts[0].clientY,moved:false};
      }
    }
  }, [zoom, pan, drag]);

  var onTouchMove = useCallback(function(e) {
    var ts=e.touches, tr=touchRef.current;
    if(ts.length===2&&tr.fingers===2){
      e.preventDefault();
      if (isMob) return;
      var dx=ts[0].clientX-ts[1].clientX,dy=ts[0].clientY-ts[1].clientY;
      var dist=Math.hypot(dx,dy), scale=dist/tr.startDist;
      var nz=clamp(tr.startZoom*scale,0.12,5);
      var midX=(ts[0].clientX+ts[1].clientX)/2,midY=(ts[0].clientY+ts[1].clientY)/2;
      var rect=svgRef.current?svgRef.current.getBoundingClientRect():null;if(!rect)return;
      var mx=tr.startMid.x-rect.left,my=tr.startMid.y-rect.top;
      var s2=nz/tr.startZoom;
      setPan({x:mx-s2*(mx-tr.startPan.x)+(midX-tr.startMid.x),y:my-s2*(my-tr.startPan.y)+(midY-tr.startMid.y)});
      setZoom(nz);
    } else if(ts.length===1&&tr.fingers===1&&!drag){
      var ddx=ts[0].clientX-tr.startX,ddy=ts[0].clientY-tr.startY;
      if(Math.abs(ddx)+Math.abs(ddy)>5)tr.moved=true;
      if(tr.moved)setPan({x:tr.startPan.x+ddx,y:tr.startPan.y+ddy});
    }
    if(ts.length===1&&drag){
      var pos=s2c(ts[0].clientX,ts[0].clientY);
      didDrag.current=true;
      setNodes(function(p){return p.map(function(n){return n.id===drag?Object.assign({},n,{x:pos.x-dragOff.current.x,y:pos.y-dragOff.current.y}):n;});});
    }
  }, [drag, s2c, touchUI]);

  var onTouchEnd = useCallback(function(e) {
    var tr = touchRef.current;
    if (placing && tr && tr.fingers === 1 && !tr.moved && !drag) {
      var touch = e && e.changedTouches && e.changedTouches[0];
      if (touch) {
        var pos = s2c(touch.clientX, touch.clientY);
        createNode(pos.x, pos.y);
        setPlacing(false);
      }
    }
    touchRef.current.fingers = 0;
    setDrag(null);
  }, [placing, drag, s2c, createNode]);

  var vis = nodes.filter(function(n){return !hidden.has(n.id);});
  var visCon = conns.filter(function(c){return !hidden.has(c.from)&&!hidden.has(c.to);});
  var withHidden = useMemo(function(){
    var s=new Set();
    collapsed.forEach(function(id){if(nodes.some(function(n){return n.parentId===id;}))s.add(id);});
    return s;
  }, [nodes, collapsed]);

  // CHANGED: added "Mudar cor" option to context menu
  function ctxItems() {
    if(!ctx)return[];
    if(ctx.type==="canvas") return [{icon:"\u2728",label:"Nova Sinapse",hl:true,action:function(){createNode(ctx.cx,ctx.cy);}}];
    if(ctx.type==="node") return [
      {icon:"\u2728",label:"Nova Sinapse",hl:true,action:function(){var n=nodes.find(function(nd){return nd.id===ctx.nodeId;});if(!n)return;var a=Math.random()*Math.PI*2;createNode(n.x+Math.cos(a)*160,n.y+Math.sin(a)*160);}},
      {icon:"\uD83C\uDF31",label:"Novo Filho",hl:true,action:function(){addChild(ctx.nodeId);}},
      {sep:true},
      {icon:"\u270F\uFE0F",label:"Renomear",action:function(){renameNode(ctx.nodeId);}},
      {icon:"\uD83C\uDFA8",label:"Mudar cor",action:function(){recolorNode(ctx.nodeId);}},
      {icon:"\uD83D\uDD17",label:"Conectar",action:function(){setConnFrom(ctx.nodeId);setTool("connect");}},
      {icon:"\uD83D\uDCC2",label:"Ficheiros",action:function(){var n=nodes.find(function(nd){return nd.id===ctx.nodeId;});if(n)setDocNode(n);}},
      {sep:true},
      {icon:"\uD83D\uDDD1\uFE0F",label:"Eliminar",danger:true,action:function(){deleteNode(ctx.nodeId);}},
    ];
    if(ctx.type==="conn") return [{icon:"\uD83D\uDDD1\uFE0F",label:"Remover ligação",danger:true,action:function(){setConns(function(p){return p.filter(function(_,i){return i!==ctx.connIdx;});});}}];
    return[];
  }

  useEffect(function() {
    function h(e) {
      if(e.key==="/"&&!e.ctrlKey&&!e.metaKey&&!editId){e.preventDefault();setSearch(true);}
      if(e.key==="k"&&(e.ctrlKey||e.metaKey)){e.preventDefault();setSearch(true);}
      if(e.key==="Escape"){setSearch(false);setCtx(null);setDocNode(null);setConnFrom(null);setPlacing(false);setTool("select");}
    }
    window.addEventListener("keydown",h);
    return function(){window.removeEventListener("keydown",h);};
  }, [editId]);

  if(!loaded) return (
    <div style={{width:"100vw",height:"100vh",background:"#06060C",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      <p style={{fontFamily:"'JetBrains Mono',monospace",color:"#FF3D8A",fontSize:14,opacity:0.5}}>A carregar...</p>
    </div>
  );

  var selectedNode = sel ? nodes.find(function(n) { return n.id === sel; }) : null;

  if (!activeProject) {
    if (embedded && routeProjectId) {
      return (
        <div style={{ width: "100%", height: "100%", background: "#06060C", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontFamily: "'JetBrains Mono',monospace", color: "#FF3D8A", fontSize: 14, opacity: 0.5 }}>A carregar...</p>
        </div>
      );
    }
    if (embedded) return null;
    return (
    <div data-scrollable style={{minHeight:"100vh",background:"linear-gradient(160deg,#06060C,#12101B)",color:"#fff",fontFamily:"'IBM Plex Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",padding:isMob?16:24,overflow:"auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      <div style={{width:"min(920px,94vw)"}}>
        <button onClick={function(){window.history.back();}} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"rgba(255,255,255,0.45)",padding:"8px 12px",cursor:"pointer",marginBottom:22}}>← Hub</button>
        <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:2,color:"#FF3D8A",margin:0}}>PROJETOS DE SINAPSE</p>
        <h1 style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"clamp(30px,6vw,54px)",margin:"8px 0 18px"}}>Escolhe um projeto</h1>
        <div style={{display:"flex",gap:10,marginBottom:22,flexWrap:isMob?"wrap":"nowrap"}}>
          <input value={newProjectName} onChange={function(e){setNewProjectName(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")createProject();}} placeholder="Nome do novo projeto..." style={{flex:1,minWidth:isMob?"100%":220,background:"rgba(0,0,0,0.25)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,color:"#fff",padding:"12px 14px",outline:"none",fontSize:isMob?16:14}}/>
          <button onClick={createProject} style={{background:"rgba(255,61,138,0.14)",border:"1px solid rgba(255,61,138,0.35)",borderRadius:14,color:"#FF3D8A",padding:"0 18px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>Criar</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax("+ (isMob ? "180px" : "220px") +",1fr))",gap:16}}>
          {projects.map(function(p){return <div key={p.id} style={{position:"relative",minHeight:150,borderRadius:22,border:"1px solid "+(p.color||"#FF3D8A")+"35",background:"linear-gradient(145deg,"+(p.color||"#FF3D8A")+"12,rgba(255,255,255,0.02))",color:"#fff",padding:20,boxShadow:"0 16px 48px rgba(0,0,0,0.25)",overflow:"hidden"}}>
            <div style={{position:"absolute",top:12,right:12,display:"flex",gap:6,zIndex:2}}>
              <button onClick={function(){renameProject(p);}} title="Renomear workspace" style={{width:30,height:30,borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(0,0,0,0.18)",color:"rgba(255,255,255,0.38)",cursor:"pointer",fontSize:12}}>✎</button>
              <button onClick={function(){removeProject(p);}} title="Apagar projeto" style={{width:30,height:30,borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(0,0,0,0.18)",color:"rgba(255,255,255,0.32)",cursor:"pointer"}}>×</button>
            </div>
            <button onClick={function(){setActiveProject(p);}} style={{width:"100%",height:"100%",textAlign:"left",background:"transparent",border:"none",color:"inherit",padding:0,cursor:"pointer"}}>
              <div style={{width:38,height:38,borderRadius:14,background:(p.color||"#FF3D8A")+"18",display:"flex",alignItems:"center",justifyContent:"center",color:p.color||"#FF3D8A",marginBottom:22}}>✦</div>
              <h2 style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,margin:"0 0 8px",paddingRight:70}}>{p.name}</h2>
              <p style={{fontSize:12,color:"rgba(255,255,255,0.35)",margin:0}}>Entrar no workspace</p>
            </button>
          </div>;})}
        </div>
      </div>
    </div>
    );
  }

  var canvasW = embedded ? "100%" : "100vw";
  var canvasH = embedded ? "100%" : "100vh";

  return (
    <div ref={workspaceRef} style={{width:canvasW,height:canvasH,background:"#06060C",position:"relative",overflow:"hidden",fontFamily:"'IBM Plex Sans',sans-serif",touchAction:"none",userSelect:"none"}}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      <style>{"*{margin:0;padding:0;box-sizing:border-box}@keyframes ctxIn{from{opacity:0;transform:scale(0.96) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes searchIn{from{opacity:0;transform:translateY(-12px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes breathe{0%,100%{opacity:0.25}50%{opacity:0.7}}@keyframes gridDrift{0%{transform:translate(0,0)}100%{transform:translate(30px,30px)}}@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes panelSlide{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}body{overflow:hidden}"}</style>

      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(0,255,200,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,200,0.02) 1px,transparent 1px)",backgroundSize:"32px 32px",animation:"gridDrift 10s linear infinite",opacity:0.4,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"min(900px,150vw)",height:"min(900px,150vh)",background:"radial-gradient(circle,rgba(123,97,255,0.015) 0%,transparent 55%)",pointerEvents:"none"}}/>

      <div data-no-canvas-zoom style={{position:"absolute",top:0,left:0,right:0,height:isMob?58:52,background:embedded?"transparent":"linear-gradient(180deg,rgba(6,6,12,0.99) 70%,transparent 100%)",display:"flex",alignItems:"center",justifyContent:embedded?"flex-end":"space-between",padding:isMob?"0 10px":"0 16px",zIndex:isMob?85:20,pointerEvents:"auto"}}>
        {!embedded && (
        <div style={{display:"flex",alignItems:"center",gap:isMob?10:14}}>
          <button onClick={function(){setActiveProject(null);}} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"rgba(255,255,255,0.55)",padding:isMob?"8px 10px":"5px 10px",fontSize:11,fontFamily:"'IBM Plex Sans',sans-serif",cursor:"pointer"}}>{isMob ? "← Projetos" : "\u2190"}</button>
          {isMob && <button onClick={function(){navigate("/");}} style={{background:"rgba(255,61,138,0.10)",border:"1px solid rgba(255,61,138,0.22)",borderRadius:12,color:"#FF3D8A",padding:"8px 10px",fontSize:11,fontFamily:"'IBM Plex Sans',sans-serif",cursor:"pointer"}}>Hub</button>}
          <h1 style={{fontSize:isMob?12:15,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",color:"#FF3D8A",letterSpacing:1,maxWidth:isMob?110:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeProject.name}</h1>
        </div>
        )}
        <div style={{display:"flex",gap:isMob?3:5,alignItems:"center"}}>
          {!touchUI && (
            <>
              <TBtn title="Selecionar" active={tool==="select"} onClick={function(){setTool("select");setConnFrom(null);}} accent="#00FFC8" small={isTab}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 2L13 8L8 9L6 14L3 2Z" fill="currentColor"/></svg>
              </TBtn>
              <TBtn title="Conectar" active={tool==="connect"} onClick={function(){setTool(tool==="connect"?"select":"connect");setConnFrom(null);}} accent="#7B61FF" small={isTab}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/><line x1="6" y1="6" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5"/></svg>
              </TBtn>
              <div style={{width:1,height:16,background:"rgba(255,255,255,0.04)",margin:"0 2px"}}/>
            </>
          )}
          <TBtn title="Procurar" onClick={function(){setSearch(true);}} accent="#FFB800" small={device!=="desktop"}>&#128269;</TBtn>
          {touchUI && <TBtn title="Zoom -" onClick={function(){setZoom(function(z){return clamp(z/1.2,0.35,2.8);});}} accent="#00FFC8" small={true}>−</TBtn>}
          {touchUI && <TBtn title="Zoom +" onClick={function(){setZoom(function(z){return clamp(z*1.2,0.35,2.8);});}} accent="#00FFC8" small={true}>+</TBtn>}
          {!touchUI && <TBtn title="Zoom +" onClick={function(){setZoom(function(z){return clamp(z*1.25,0.12,5);});}} accent="#00FFC8" small={device!=="desktop"}>+</TBtn>}
          {!touchUI && <TBtn title="Zoom -" onClick={function(){setZoom(function(z){return clamp(z/1.25,0.12,5);});}} accent="#00FFC8" small={device!=="desktop"}>-</TBtn>}
          {!touchUI && <TBtn title="Reset" onClick={function(){setZoom(1);setPan({x:0,y:0});}} accent="#FFB800" small={isTab}>&#8962;</TBtn>}
          <TBtn title="Ajuda" active={help} onClick={function(){setHelp(!help);}} accent="#FF3D8A" small={device!=="desktop"}>?</TBtn>
        </div>
      </div>

      {touchUI && !selectedNode && (
        <button onClick={function(){setPlacing(!placing);}} style={{position:"absolute",bottom:24,right:24,zIndex:25,width:56,height:56,borderRadius:"50%",background:placing?"#00FFC820":"rgba(255,61,138,0.15)",border:"2px solid "+(placing?"#00FFC8":"#FF3D8A"),color:placing?"#00FFC8":"#FF3D8A",fontSize:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:placing?"0 0 30px rgba(0,255,200,0.2)":"0 0 30px rgba(255,61,138,0.15)",transition:"all 0.3s cubic-bezier(0.2,0,0,1)",backdropFilter:"blur(12px)",transform:placing?"rotate(45deg)":"none"}}>+</button>
      )}
      {placing && (
        <div style={{position:"absolute",bottom:88,right:16,zIndex:25,background:"rgba(12,12,22,0.9)",borderRadius:12,padding:"8px 14px",backdropFilter:"blur(16px)",border:"1px solid rgba(0,255,200,0.15)"}}>
          <p style={{fontSize:11,color:"#00FFC8",fontFamily:"'JetBrains Mono',monospace",margin:0}}>Toca no canvas para criar</p>
        </div>
      )}
      {touchUI && selectedNode && !docNode && !ctx && (
        <div data-no-canvas-zoom style={{position:"absolute",left:10,right:10,bottom:16,zIndex:82,display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,background:"rgba(8,8,16,0.90)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,padding:8,backdropFilter:"blur(18px)",boxShadow:"0 16px 60px rgba(0,0,0,0.45)"}}>
          <button onClick={function(){createNode(selectedNode.x+150, selectedNode.y+70, selectedNode.id);}} style={mobileActionStyle(selectedNode.color)}>Filho</button>
          <button onClick={function(){var a=Math.random()*Math.PI*2;createNode(selectedNode.x+Math.cos(a)*160,selectedNode.y+Math.sin(a)*160);}} style={mobileActionStyle(selectedNode.color)}>Nova</button>
          <button onClick={function(){renameNode(selectedNode.id);}} style={mobileActionStyle(selectedNode.color)}>Nome</button>
          <button onClick={function(){setDocNode(selectedNode);}} style={mobileActionStyle(selectedNode.color)}>Docs</button>
          <button onClick={function(){setSel(null);}} style={mobileActionStyle("#ffffff")}>Fechar</button>
        </div>
      )}

      {help && nodes.length===0 && (
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:15,textAlign:"center",animation:"slideUp 0.6s cubic-bezier(0.2,0,0,1)",pointerEvents:"none"}}>
          <div style={{width:72,height:72,borderRadius:"50%",border:"2px dashed rgba(255,61,138,0.2)",margin:"0 auto 24px",display:"flex",alignItems:"center",justifyContent:"center",animation:"breathe 3s ease-in-out infinite,floatY 4s ease-in-out infinite"}}>
            <span style={{fontSize:28,color:"#FF3D8A",opacity:0.5}}>{"\u2726"}</span>
          </div>
          <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:isMob?13:15,color:"rgba(255,255,255,0.35)",marginBottom:10}}>{touchUI?"Toca no + para começar":"Clica direito para começar"}</p>
          <p style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:11.5,color:"rgba(255,255,255,0.15)",lineHeight:2,whiteSpace:"pre-line"}}>{touchUI?"Toca num nó → menu em baixo\n+ no canto → nova sinapse":"Botão direito → criar · Clique → ficheiros\nDuplo clique → colapsar · Scroll → zoom · Cmd+K → procurar"}</p>
        </div>
      )}

      {help && nodes.length>0 && !touchUI && (
        <div style={{position:"absolute",bottom:16,left:16,zIndex:15,background:"rgba(10,10,18,0.9)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:14,padding:"14px 18px",backdropFilter:"blur(20px)",animation:"slideUp 0.3s ease",maxWidth:260}}>
          <p style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:"#FF3D8A",marginBottom:8,letterSpacing:1}}>CONTROLOS</p>
          {(isTab?[["Long press","Criar / Menu"],["Toque","Ficheiros"],["Duplo toque","Colapsar"],["Pinch","Zoom"],["Arrastar","Navegar"]]:[["Botão direito","Criar / Menu"],["Clique","Ficheiros"],["Duplo clique","Colapsar"],["Dir. na linha","Apagar"],["Scroll","Zoom"],["Arrastar","Navegar"],["Cmd+K ou /","Procurar"]]).map(function(pair,i){
            return (
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.02)"}}>
                <span style={{fontSize:10.5,color:"rgba(255,255,255,0.4)"}}>{pair[0]}</span>
                <span style={{fontSize:10.5,color:"rgba(255,255,255,0.18)",fontFamily:"'JetBrains Mono',monospace"}}>{pair[1]}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{position:"absolute",bottom:isMob?8:16,left:isMob?"50%":undefined,right:isMob?undefined:16,transform:isMob?"translateX(-50%)":"none",zIndex:15}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,color:"rgba(255,255,255,0.1)",letterSpacing:1}}>{nodes.length+" nós · "+conns.length+" ligações · "+Math.round(zoom*100)+"%"}</span>
      </div>

      <svg ref={svgRef} width="100%" height="100%" style={{position:"absolute",inset:0,cursor:connFrom||placing?"crosshair":isPanning?"grabbing":"default",touchAction:"none"}}
        onWheel={onWheel}
        onClick={onCanvasClick} onContextMenu={onCanvasCtx}
        onMouseMove={onMM} onMouseUp={onMU} onMouseDown={onCanvasMD} onMouseLeave={onMU}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <defs><filter id="nodeGlow"><feGaussianBlur stdDeviation="10"/></filter></defs>
        <rect width="100%" height="100%" fill="transparent"/>
        <g transform={"translate("+pan.x+","+pan.y+") scale("+zoom+")"}>
          {visCon.map(function(cn){
            var f=nodes.find(function(n){return n.id===cn.from;}),t=nodes.find(function(n){return n.id===cn.to;});
            if(!f||!t)return null;
            var ci=conns.findIndex(function(c){return c.from===cn.from&&c.to===cn.to;});
            return <ConnLine key={cn.from+"-"+cn.to} x1={f.x} y1={f.y} x2={t.x} y2={t.y} c1={f.color} c2={t.color} ck={cn.from+cn.to} onCtx={function(e){onConnCtx(e,ci);}}/>;
          })}
          {connFrom && (function(){
            var f=nodes.find(function(n){return n.id===connFrom;});
            if(!f)return null;
            return <line x1={f.x} y1={f.y} x2={mousePos.x} y2={mousePos.y} stroke="#7B61FF" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4"><animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite"/></line>;
          })()}
          {vis.map(function(n){
            return <NodeCircle key={n.id} node={n} mobile={touchUI} isSel={sel===n.id} isConn={connFrom===n.id} hasHid={withHidden.has(n.id)} editId={editId} onCommit={commitLabel} onPD={onNodePD} onCtx={onNodeCtx} onTap={onNodeTap}/>;
          })}
        </g>
      </svg>

      {ctx && (
        <>
          <CtxMenu x={ctx.x} y={ctx.y} mobile={touchUI} items={ctxItems()} onClose={function(){setCtx(null);}}/>
          <div style={{position:"fixed",inset:0,zIndex:touchUI?94:55}} onClick={function(){setCtx(null);}} onContextMenu={function(e){e.preventDefault();setCtx(null);}}/>
        </>
      )}
      {search && <SearchBar nodes={nodes} onSelect={navigateTo} onClose={function(){setSearch(false);}}/>}
      {docNode && <DocPanel node={docNode} projectId={activeProject && activeProject.id} onClose={function(){setDocNode(null);}} onUpdate={updateNode} device={device}/>}
    </div>
  );
}