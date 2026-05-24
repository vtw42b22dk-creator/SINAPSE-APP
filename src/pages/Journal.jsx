import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as journalStore from "../lib/journalStore";
import * as attachmentsStore from "../lib/attachmentsStore";
import { PageLoader } from "../components/PageLoader";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";
import { pageBg, pageText } from "../lib/ThemeContext";
import { useCloudSync } from "../lib/useCloudSync";

var ACCENT = "#FFB800";
var COLORS = ["#FFB800", "#00FFC8", "#7B61FF", "#FF3D8A", "#38BDF8", "#34D399"];

export default function Journal() {
  var navigate = useNavigate();
  var vwS = useState(window.innerWidth);
  var viewportW = vwS[0], setViewportW = vwS[1];
  var isMobile = viewportW < 720;
  var spS = useState([]);
  var spaces = spS[0], setSpaces = spS[1];
  var blS = useState([]);
  var blocks = blS[0], setBlocks = blS[1];
  var activeS = useState(null);
  var active = activeS[0], setActive = activeS[1];
  var titleS = useState("");
  var newTitle = titleS[0], setNewTitle = titleS[1];
  var loadedS = useState(false);
  var loaded = loadedS[0], setLoaded = loadedS[1];
  var saveTimer = useRef(null);
  var hydratingRef = useRef(false);
  var blocksRef = useRef([]);
  var spacesRef = useRef([]);
  var editingBlockRef = useRef(null);
  var flushBlocksRef = useRef(null);
  var flushHandlersRef = useRef({});

  var loadFromCloud = useCallback(function() {
    if (flushBlocksRef.current) flushBlocksRef.current();
    hydratingRef.current = true;
    return Promise.all([
      journalStore.pullSpaces(spacesRef.current),
      journalStore.pullBlocks(blocksRef.current, editingBlockRef.current),
    ]).then(function(res) {
      setSpaces(res[0]);
      setBlocks(res[1]);
      setActive(function(prev) {
        if (prev && res[0].some(function(s) { return s.id === prev; })) return prev;
        return res[0][0] ? res[0][0].id : null;
      });
      setLoaded(true);
      setTimeout(function() { hydratingRef.current = false; }, 0);
    });
  }, []);

  useCloudSync(loadFromCloud, ["journal_spaces", "journal_blocks"]);

  useEffect(function() {
    function onResize() { setViewportW(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  useEffect(function() {
    if (!loaded || hydratingRef.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(function() { journalStore.saveSpaces(spaces); }, 500);
  }, [spaces, loaded]);
  useEffect(function() {
    if (!loaded || hydratingRef.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(function() { journalStore.saveBlocks(blocks); }, 700);
  }, [blocks, loaded]);

  useEffect(function() { blocksRef.current = blocks; }, [blocks]);
  useEffect(function() { spacesRef.current = spaces; }, [spaces]);
  useEffect(function() {
    if (!loaded) return;
    function flush() {
      if (flushBlocksRef.current) flushBlocksRef.current();
      journalStore.saveBlocks(blocksRef.current);
      journalStore.saveSpaces(spacesRef.current);
    }
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", function() {
      if (document.visibilityState === "hidden") flush();
    });
    return function() { window.removeEventListener("beforeunload", flush); };
  }, [loaded]);

  useEffect(function() {
    flushBlocksRef.current = function() {
      Object.keys(flushHandlersRef.current).forEach(function(id) {
        var fn = flushHandlersRef.current[id];
        if (fn) fn();
      });
    };
  }, []);
  function registerFlush(id, fn) {
    flushHandlersRef.current[id] = fn;
  }
  function unregisterFlush(id) {
    delete flushHandlersRef.current[id];
  }

  var activeSpace = spaces.find(function(s) { return s.id === active; }) || spaces[0];
  var color = activeSpace ? activeSpace.color : ACCENT;
  var activeBlocks = useMemo(function() {
    return blocks.filter(function(b) { return b.space_id === active; }).sort(function(a, b) { return a.order_index - b.order_index; });
  }, [blocks, active]);

  function createSpace() {
    if (!newTitle.trim()) return;
    var s = { id: journalStore.newBlock("x").id.replace("jb", "js"), title: newTitle.trim(), color: COLORS[spaces.length % COLORS.length] };
    setSpaces(spaces.concat([s]));
    setActive(s.id);
    setNewTitle("");
  }

  function removeSpace(space) {
    if (!space) return;
    if (!window.confirm("Eliminar o tema \"" + space.title + "\" e todos os blocos dentro dele?")) return;
    var nextSpaces = spaces.filter(function(s) { return s.id !== space.id; });
    if (!nextSpaces.length) nextSpaces = [{ id: journalStore.newBlock("x").id.replace("jb", "js"), title: "Livre", color: ACCENT }];
    blocks.filter(function(b) { return b.space_id === space.id && b.meta && b.meta.attachment; }).forEach(function(b) {
      attachmentsStore.deleteAttachment(b.meta.attachment);
    });
    setSpaces(nextSpaces);
    setBlocks(blocks.filter(function(b) { return b.space_id !== space.id; }));
    if (active === space.id) setActive(nextSpaces[0] ? nextSpaces[0].id : null);
  }

  function addBlock(type) {
    if (!active) return;
    setBlocks(blocks.concat([journalStore.newBlock(active, type)]));
  }

  function updateBlock(id, patch) {
    setBlocks(blocks.map(function(b) {
      return b.id === id ? Object.assign({}, b, patch, { updated: Date.now() }) : b;
    }));
  }

  function removeBlock(id) {
    var block = blocks.find(function(b) { return b.id === id; });
    if (block && block.meta && block.meta.attachment) attachmentsStore.deleteAttachment(block.meta.attachment);
    setBlocks(blocks.filter(function(b) { return b.id !== id; }));
  }

  function format(cmd, value) {
    document.execCommand(cmd, false, value || null);
  }

  return (
    <div style={{minHeight:"100vh",background:loaded ? "radial-gradient(circle at 20% 0,"+color+"0D,transparent 35%),"+pageBg() : pageBg(),color:pageText(),fontFamily:"'IBM Plex Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
      <style>{MODULE_ENTRY_CSS}</style>
      <header style={{position:"sticky",top:0,zIndex:20,background:"rgba(10,10,16,0.92)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:isMobile?"12px":"14px 20px"}}>
        <div style={{maxWidth:1180,margin:"0 auto",display:"flex",alignItems:isMobile?"stretch":"center",justifyContent:"space-between",gap:12,flexDirection:isMobile?"column":"row",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <button onClick={function(){navigate("/");}} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"rgba(255,255,255,0.45)",padding:"7px 12px",cursor:"pointer"}}>← Hub</button>
            <h1 style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,color:color,margin:0}}>Diário</h1>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",overflowX:isMobile?"auto":"visible",paddingBottom:isMobile?2:0}}>
            <button onClick={function(){addBlock("title");}} style={topBtn(color)}>+ Título</button>
            <button onClick={function(){addBlock("text");}} style={topBtn(color)}>+ Texto</button>
            <button onClick={function(){addBlock("image");}} style={topBtn(color)}>+ Imagem</button>
            <button onClick={function(){addBlock("document");}} style={topBtn(color)}>+ Documento</button>
          </div>
        </div>
      </header>

      <main className="mod-main" data-scrollable style={{maxWidth:1180,margin:"0 auto",padding:isMobile?"14px 12px 80px":"22px 20px"}}>
        {!loaded ? <PageLoader accent={ACCENT} lines={7} /> : (
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"260px minmax(0,1fr)",gap:isMobile?14:22}}>
        <aside style={{border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.025)",borderRadius:isMobile?18:22,padding:isMobile?12:16,height:"fit-content",position:isMobile?"sticky":"static",top:isMobile?78:"auto",zIndex:isMobile?10:1,backdropFilter:"blur(14px)"}}>
          <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.28)",letterSpacing:1,margin:"0 0 12px"}}>TEMAS</p>
          <div data-scrollable style={{display:"flex",flexDirection:isMobile?"row":"column",gap:8,overflowX:isMobile?"auto":"visible",paddingBottom:isMobile?4:0}}>
            {spaces.map(function(s) {
              var on = active === s.id;
              return <div key={s.id} style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                <button onClick={function(){setActive(s.id);}} style={{flex:1,textAlign:"left",padding:"12px 14px",borderRadius:14,border:"1px solid "+(on?s.color+"45":"rgba(255,255,255,0.06)"),background:on?s.color+"12":"transparent",color:on?s.color:"rgba(255,255,255,0.62)",cursor:"pointer",fontFamily:"'IBM Plex Sans',sans-serif",whiteSpace:isMobile?"nowrap":"normal",minWidth:isMobile?120:0}}>{s.title}</button>
                <button onClick={function(){removeSpace(s);}} title="Eliminar tema" style={{width:30,height:30,borderRadius:10,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.025)",color:"rgba(255,255,255,0.22)",cursor:"pointer",flexShrink:0}}>×</button>
              </div>;
            })}
          </div>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <input value={newTitle} onChange={function(e){setNewTitle(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")createSpace();}} placeholder="Novo tema..." style={{flex:1,minWidth:0,background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"#fff",padding:"9px 10px",outline:"none",fontSize:isMobile?16:13}}/>
            <button onClick={createSpace} style={{background:color+"14",border:"1px solid "+color+"35",borderRadius:12,color:color,padding:"0 12px",cursor:"pointer"}}>+</button>
          </div>
        </aside>

        <section style={{minWidth:0}}>
          <div style={{marginBottom:16}}>
            <p style={{margin:0,fontSize:10,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,color:color}}>ESPAÇO</p>
            <h2 style={{margin:"6px 0 0",fontSize:"clamp(28px,5vw,48px)",fontFamily:"'JetBrains Mono',monospace"}}>{activeSpace ? activeSpace.title : "Diário"}</h2>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            <button onClick={function(){format("bold");}} style={toolBtn()}>Negrito</button>
            <button onClick={function(){format("italic");}} style={toolBtn()}>Itálico</button>
            <button onClick={function(){var url=prompt("Link"); if(url) format("createLink",url);}} style={toolBtn()}>Hiperligação</button>
          </div>
          {activeBlocks.length === 0 ? (
            <div style={{border:"1px dashed "+color+"22",borderRadius:24,minHeight:280,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",color:"rgba(255,255,255,0.3)",lineHeight:1.7}}>
              Adiciona blocos para começar a escrever.
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {activeBlocks.map(function(b) {
                return (
                  <JournalBlock
                    key={b.id}
                    block={b}
                    color={color}
                    onChange={updateBlock}
                    onDelete={removeBlock}
                    onEditStart={function(id) { editingBlockRef.current = id; }}
                    onEditEnd={function() { editingBlockRef.current = null; }}
                    registerFlush={registerFlush}
                    unregisterFlush={unregisterFlush}
                  />
                );
              })}
            </div>
          )}
        </section>
        </div>
        )}
      </main>
    </div>
  );
}

function JournalBlock(props) {
  var b = props.block;
  var fileRef = useRef(null);
  var editorRef = useRef(null);
  var latestHtml = useRef(b.content || "");
  var saveTimer = useRef(null);
  var uploadS = useState("");
  var uploadMsg = uploadS[0], setUploadMsg = uploadS[1];
  useEffect(function() {
    if (!editorRef.current || b.type === "image" || b.type === "document") return;
    var html = b.content || "";
    if (html !== latestHtml.current) {
      latestHtml.current = html;
      editorRef.current.innerHTML = html;
    }
  }, [b.id, b.content, b.type]);
  useEffect(function() {
    return function() { clearTimeout(saveTimer.current); };
  }, [b.id]);
  function pushContent() {
    props.onChange(b.id, { content: latestHtml.current });
  }
  function onInput(e) {
    latestHtml.current = e.currentTarget.innerHTML;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(pushContent, 400);
  }
  function syncText() {
    clearTimeout(saveTimer.current);
    pushContent();
  }
  useEffect(function() {
    if (props.registerFlush) props.registerFlush(b.id, syncText);
    return function() {
      if (props.unregisterFlush) props.unregisterFlush(b.id);
    };
  }, [b.id]);
  async function onFile(e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    e.target.value = "";
    setUploadMsg("A enviar...");
    var uploaded = await attachmentsStore.uploadAttachment(f, "journal_block", b.id, { block_id: b.id, space_id: b.space_id });
    if (uploaded.uploadError && uploaded.localOnly) {
      setUploadMsg("Guardado só neste dispositivo: " + uploaded.uploadError);
    } else if (uploaded.uploadError) {
      setUploadMsg("Erro: " + uploaded.uploadError);
      return;
    } else {
      setUploadMsg(uploaded.localOnly ? "Guardado localmente (sem nuvem)" : "Guardado");
    }
    var url = uploaded.url || uploaded.data || "";
    props.onChange(b.id, {
      content: url,
      meta: { name: f.name, attachment: attachmentsStore.stripAttachmentRef(uploaded) },
    });
    setTimeout(function() { setUploadMsg(""); }, 2800);
  }
  return (
    <div style={{border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.025)",borderRadius:18,padding:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:props.color}}>{b.type.toUpperCase()}</span>
        <button onClick={function(){props.onDelete(b.id);}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.2)",cursor:"pointer"}}>×</button>
      </div>
      {uploadMsg ? <p style={{margin:"0 0 8px",fontSize:11,color:props.color,opacity:0.85}}>{uploadMsg}</p> : null}
      {b.type === "image" ? (
        <div>
          {b.content ? <img src={b.content} alt={b.meta && b.meta.name || "Imagem"} style={{maxWidth:"100%",borderRadius:14,display:"block"}}/> : <button onClick={function(){fileRef.current.click();}} style={{width:"100%",minHeight:160,border:"1px dashed "+props.color+"30",borderRadius:14,background:props.color+"08",color:props.color,cursor:"pointer"}}>Escolher imagem</button>}
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={onFile}/>
        </div>
      ) : b.type === "document" ? (
        <div>
          {b.content ? <a href={b.content} download={b.meta && b.meta.name} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:14,border:"1px solid "+props.color+"24",background:props.color+"08",color:props.color,textDecoration:"none"}}><span style={{fontSize:24}}>📄</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.meta && b.meta.name || "Documento"}</span></a> : <button onClick={function(){fileRef.current.click();}} style={{width:"100%",minHeight:120,border:"1px dashed "+props.color+"30",borderRadius:14,background:props.color+"08",color:props.color,cursor:"pointer"}}>Escolher documento</button>}
          <input ref={fileRef} type="file" style={{display:"none"}} onChange={onFile}/>
        </div>
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={onInput}
          onFocus={function() { if (props.onEditStart) props.onEditStart(b.id); }}
          onBlur={function() { syncText(); if (props.onEditEnd) props.onEditEnd(); }}
          data-placeholder={b.type === "title" ? "Título" : "Escreve aqui..."}
          style={{outline:"none",fontSize:b.type==="title"?26:15,lineHeight:1.85,color:"rgba(255,255,255,0.86)",fontFamily:b.type==="title"?"'JetBrains Mono',monospace":"'IBM Plex Sans',sans-serif",fontWeight:b.type==="title"?600:400,minHeight:b.type==="title"?38:90}}
        />
      )}
    </div>
  );
}

function topBtn(color) {
  return {background:color+"12",border:"1px solid "+color+"35",borderRadius:10,color:color,padding:"8px 12px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:11};
}
function toolBtn() {
  return {background:"rgba(255,255,255,0.035)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"rgba(255,255,255,0.58)",padding:"8px 12px",cursor:"pointer",fontSize:12};
}
