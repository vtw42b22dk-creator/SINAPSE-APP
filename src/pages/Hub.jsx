import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useTheme } from "../lib/ThemeContext";
import * as changelog from "../lib/changelog";
import { probeCloudTables, SYNC_REV } from "../lib/cloudStatus";
import UpdatesChangelog, { UpdatesFloatingButton } from "../components/UpdatesChangelog";

function ParticleField() {
  const ref = useRef(null);
  useEffect(function() {
    var canvas = ref.current;
    var ctx = canvas.getContext("2d");
    var animId;
    var particles = [];
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener("resize", resize);
    function Particle() { this.reset(); }
    Particle.prototype.reset = function() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5 + 0.5;
      this.sx = (Math.random() - 0.5) * 0.3;
      this.sy = (Math.random() - 0.5) * 0.3;
      this.op = Math.random() * 0.5 + 0.1;
    };
    Particle.prototype.update = function() {
      this.x += this.sx; this.y += this.sy;
      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    };
    Particle.prototype.draw = function() {
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,255,200," + this.op + ")"; ctx.fill();
    };
    for (var i = 0; i < 50; i++) particles.push(new Particle());
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; i++) { particles[i].update(); particles[i].draw(); }
      for (var k = 0; k < particles.length; k++) {
        for (var j = k + 1; j < particles.length; j++) {
          var dx = particles[k].x - particles[j].x, dy = particles[k].y - particles[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(particles[k].x, particles[k].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = "rgba(0,255,200," + (0.06 * (1 - dist / 120)) + ")";
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(animate);
    }
    animate();
    return function() { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",zIndex:0,pointerEvents:"none"}} />;
}

function SynapseIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="5" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="38" cy="14" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="10" cy="36" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="38" cy="34" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="20" y1="20" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="28" y1="21" x2="36" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="28" x2="12" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="28" y1="27" x2="36" y2="33" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="10" width="36" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
      <line x1="6" y1="20" x2="42" y2="20" stroke="currentColor" strokeWidth="2"/>
      <line x1="16" y1="6" x2="16" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="32" y1="6" x2="32" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="16" cy="28" r="2" fill="currentColor"/>
      <circle cx="24" cy="28" r="2" fill="currentColor"/>
      <circle cx="32" cy="28" r="2" fill="currentColor"/>
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 24 L21 29 L32 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function WishlistIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M14 10H34L32 28H16L14 10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="18" cy="36" r="2" fill="currentColor"/>
      <circle cx="30" cy="36" r="2" fill="currentColor"/>
      <path d="M20 14L24 22L28 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function FinanceIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2"/>
      <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 18H36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M13 8H33C36.3137 8 39 10.6863 39 14V40H15C11.6863 40 9 37.3137 9 34V12C9 9.79086 10.7909 8 13 8Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M15 14H33" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M15 21H31" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M15 28H27" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M33 8V40" stroke="currentColor" strokeWidth="1.3" opacity="0.35"/>
    </svg>
  );
}

var MODULES = [
  {id:"calendar", name:"Calendário", desc:"Visualiza e organiza o teu tempo", Icon:CalendarIcon, accent:"#00FFC8", glow:"rgba(0,255,200,0.3)", path:"/calendar"},
  {id:"tasks", name:"Tarefas", desc:"Captura, prioriza, conquista", Icon:TasksIcon, accent:"#7B61FF", glow:"rgba(123,97,255,0.3)", path:"/tasks"},
  {id:"journal", name:"Diário", desc:"Blocos de escrita para tudo o que vem à cabeça", Icon:JournalIcon, accent:"#FFB800", glow:"rgba(255,184,0,0.25)", path:"/journal"},
  {id:"synapse", name:"Sinapse", desc:"Mapeia o teu universo criativo", Icon:SynapseIcon, accent:"#FF3D8A", glow:"rgba(255,61,138,0.3)", path:"/synapse"},
  {id:"wishlist", name:"Wishlist", desc:"Lista o que queres comprar ou fazer", Icon:WishlistIcon, accent:"#34D399", glow:"rgba(52,211,153,0.28)", path:"/wishlist"},
  {id:"finance", name:"Financeiro", desc:"Gastos, recursos e orçamento mensal", Icon:FinanceIcon, accent:"#38BDF8", glow:"rgba(56,189,248,0.28)", path:"/finance"},
];

function ModuleCard(props) {
  var mod = props.module, index = props.index, onClick = props.onClick;
  var hS = useState(false); var hov = hS[0], setHov = hS[1];
  var ok = !!mod.path;
  var compact = props.compact;
  return (
    <button onClick={function() { if (ok) onClick(mod); }}
      onMouseEnter={function() { setHov(true); }} onMouseLeave={function() { setHov(false); }}
      style={{
        position:"relative",
        background: hov ? "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))" : "linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
        border: "1px solid " + (hov ? mod.accent + "60" : "rgba(255,255,255,0.06)"),
        borderRadius: 20, padding: compact ? "24px 20px" : "40px 32px", cursor: ok ? "pointer" : "default",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
        transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
        transform: hov && ok && !compact ? "translateY(-6px) scale(1.02)" : "none",
        boxShadow: hov && ok ? "0 20px 60px " + mod.glow : "0 4px 20px rgba(0,0,0,0.3)",
        backdropFilter: "blur(20px)", color: hov ? mod.accent : "rgba(255,255,255,0.7)",
        width: "100%", maxWidth: compact ? 420 : 280,
        animation: "fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) " + (index * 0.12) + "s both",
        outline: "none", fontFamily: "inherit", opacity: ok ? 1 : 0.5,
      }}>
      <div style={{position:"relative", zIndex:1}}><mod.Icon /></div>
      <div style={{textAlign:"center", position:"relative", zIndex:1}}>
        <h2 style={{margin:"0 0 8px", fontSize:18, fontWeight:600, letterSpacing:0.5,
          fontFamily:"'JetBrains Mono', monospace", color: hov ? mod.accent : "rgba(255,255,255,0.9)",
          transition:"color 0.3s"}}>{mod.name}</h2>
        <p style={{margin:0, fontSize:13, fontWeight:400, lineHeight:1.5, color:"rgba(255,255,255,0.4)",
          fontFamily:"'IBM Plex Sans', sans-serif"}}>{ok ? mod.desc : "Em breve"}</p>
      </div>
      <div style={{position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)",
        width: hov && ok ? "60%" : "0%", height:2,
        background:"linear-gradient(90deg, transparent, " + mod.accent + ", transparent)",
        transition:"width 0.4s cubic-bezier(0.16,1,0.3,1)"}} />
    </button>
  );
}

function Clock() {
  var tS = useState(new Date()); var time = tS[0], setTime = tS[1];
  useEffect(function() { var i = setInterval(function() { setTime(new Date()); }, 1000); return function() { clearInterval(i); }; }, []);
  var h = time.getHours().toString().padStart(2, "0");
  var m = time.getMinutes().toString().padStart(2, "0");
  var s = time.getSeconds().toString().padStart(2, "0");
  var weekday = time.toLocaleDateString("pt-PT", {weekday:"long"});
  var date = time.toLocaleDateString("pt-PT", {day:"numeric", month:"long", year:"numeric"});
  return (
    <div style={{textAlign:"center", animation:"fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.05s both"}}>
      <div style={{fontFamily:"'JetBrains Mono', monospace", fontSize:"clamp(48px, 10vw, 80px)",
        fontWeight:200, letterSpacing:6, color:"rgba(255,255,255,0.9)", lineHeight:1}}>
        {h}<span style={{color:"#00FFC8", opacity:0.7, animation:"pulse 2s ease-in-out infinite"}}>:</span>{m}
        <span style={{fontSize:"0.5em", color:"rgba(255,255,255,0.25)", marginLeft:4}}>{s}</span>
      </div>
      <div style={{fontFamily:"'IBM Plex Sans', sans-serif", fontSize:14, color:"rgba(255,255,255,0.3)",
        marginTop:8, letterSpacing:2, textTransform:"capitalize"}}>{weekday} · {date}</div>
    </div>
  );
}

function getGreeting() {
  var h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 20) return "Boa tarde";
  return "Boa noite";
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function getAppStorageUsage() {
  try {
    var total = 0;
    var keys = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i) || "";
      var lk = key.toLowerCase();
      if (lk.indexOf("sinapse") < 0 && lk.indexOf("journal") < 0 && lk.indexOf("wishlist") < 0 && lk.indexOf("expense") < 0) continue;
      var value = localStorage.getItem(key) || "";
      total += (key.length + value.length) * 2;
      keys++;
    }
    return { bytes: total, keys: keys };
  } catch (e) {
    return { bytes: 0, keys: 0 };
  }
}

function estimateLocalPhotos(bytes) {
  var avg = 450 * 1024;
  return Math.max(0, Math.floor(bytes / avg));
}

function StorageBar(props) {
  var usage = props.usage;
  var limit = 5 * 1024 * 1024;
  var pct = Math.min(100, Math.round((usage.bytes / limit) * 100));
  var color = pct >= 90 ? "#FF3D5A" : pct >= 70 ? "#FFB800" : "#00FFC8";
  var estPhotos = estimateLocalPhotos(usage.bytes);
  var cloudHint = props.loggedIn
    ? "Com login Supabase, as fotos vão para a nuvem (centenas+, conforme o teu plano)."
    : "Sem login, as fotos ficam só neste dispositivo (limite ~5 MB).";
  return (
    <div style={{width:"min(420px,100%)",padding:"14px 16px",borderRadius:16,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.03)",animation:"fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s both",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:8}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.35)",letterSpacing:1,textTransform:"uppercase"}}>Espaço neste dispositivo</span>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:color}}>{formatBytes(usage.bytes)} / 5 MB</span>
      </div>
      <div style={{height:7,borderRadius:999,background:"rgba(255,255,255,0.06)",overflow:"hidden",border:"1px solid rgba(255,255,255,0.04)"}}>
        <div style={{height:"100%",width:Math.max(pct, usage.bytes > 0 ? 4 : 0)+"%",background:"linear-gradient(90deg,"+color+","+color+"88)",borderRadius:999,transition:"width .35s ease"}} />
      </div>
      <p style={{margin:"8px 0 0",fontSize:10,color:"rgba(255,255,255,0.28)",textAlign:"center",lineHeight:1.5}}>
        {usage.bytes < 50000
          ? "Quase vazio aqui — normal se as fotos estão na nuvem."
          : estPhotos > 0
            ? "Cópias locais ~" + estPhotos + " foto(s) de tamanho médio (se guardadas sem nuvem)."
            : "Texto e dados da app neste browser."}
      </p>
      <p style={{margin:"4px 0 0",fontSize:9,color:"rgba(255,255,255,0.2)",textAlign:"center",lineHeight:1.45}}>{cloudHint}</p>
    </div>
  );
}

export default function Hub() {
  var navigate = useNavigate();
  var auth = useAuth();
  var theme = useTheme();
  var vwS = useState(window.innerWidth);
  var viewportW = vwS[0], setViewportW = vwS[1];
  var isMobile = viewportW < 720;
  var stS = useState(getAppStorageUsage);
  var storageUsage = stS[0], setStorageUsage = stS[1];
  var chS = useState(changelog.hasUnreadChangelog);
  var changelogUnread = chS[0], setChangelogUnread = chS[1];
  var openChS = useState(false);
  var changelogOpen = openChS[0], setChangelogOpen = openChS[1];
  var cloudS = useState(null);
  var cloudStatus = cloudS[0], setCloudStatus = cloudS[1];
  useEffect(function() {
    if (!auth.user) {
      setCloudStatus(null);
      return;
    }
    probeCloudTables().then(setCloudStatus);
  }, [auth.user]);
  useEffect(function() {
    function onResize() { setViewportW(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);
  useEffect(function() {
    function refreshStorage() { setStorageUsage(getAppStorageUsage()); }
    refreshStorage();
    window.addEventListener("focus", refreshStorage);
    document.addEventListener("visibilitychange", refreshStorage);
    return function() {
      window.removeEventListener("focus", refreshStorage);
      document.removeEventListener("visibilitychange", refreshStorage);
    };
  }, []);
  return (
    <div>
      <style>{"@keyframes fadeSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:0.7}50%{opacity:0.2}}@keyframes floatBubble{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes pulseDot{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}"}</style>
      <UpdatesFloatingButton isMobile={isMobile} unread={changelogUnread} onOpen={function() { setChangelogOpen(true); }} />
      <UpdatesChangelog open={changelogOpen} onClose={function() { setChangelogOpen(false); }} onSeen={function() { setChangelogUnread(false); }} isMobile={isMobile} />
      <div data-scrollable style={{minHeight:"100vh", background:"linear-gradient(160deg, #0A0A0F 0%, #0D0E18 40%, #0A0A0F 100%)",
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start",
        padding:isMobile?"72px 14px 100px":"48px 24px 56px", position:"relative", overflow:"auto", WebkitOverflowScrolling:"touch"}}>
        <ParticleField />
        <div style={{position:"fixed",top:isMobile?12:18,right:isMobile?12:18,zIndex:4,display:"flex",gap:8}}>
          {theme && <button onClick={theme.toggle} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"rgba(255,255,255,0.45)",fontSize:12,padding:"8px 12px",cursor:"pointer",fontFamily:"'IBM Plex Sans',sans-serif"}}>{theme.isMinimal ? "Neon" : "Claro"}</button>}
          <button onClick={function(){auth.signOut();}} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:"rgba(255,255,255,0.45)",fontSize:12,padding:"8px 12px",cursor:"pointer",fontFamily:"'IBM Plex Sans',sans-serif"}}>Sair</button>
        </div>
        <div style={{position:"fixed",top:"-20%",right:"-10%",width:500,height:500,background:"radial-gradient(circle, rgba(0,255,200,0.03), transparent 60%)",pointerEvents:"none"}} />
        <div style={{position:"fixed",bottom:"-10%",left:"-10%",width:400,height:400,background:"radial-gradient(circle, rgba(123,97,255,0.03), transparent 60%)",pointerEvents:"none"}} />
        <div style={{position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:isMobile?28:48, maxWidth:960, width:"100%", paddingTop:isMobile?8:32, paddingBottom:24}}>
          <div style={{textAlign:"center"}}>
            <p style={{fontFamily:"'IBM Plex Sans', sans-serif", fontSize:14, fontWeight:300, color:"#00FFC8",
              letterSpacing:4, textTransform:"uppercase", marginBottom:24,
              animation:"fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0s both", opacity:0.7}}>
              {getGreeting()}{auth.user && auth.user.email ? ", " + auth.user.email.split("@")[0] : ", Martim"}
            </p>
            <Clock />
          </div>
          <div style={{width:40, height:1, background:"linear-gradient(90deg, transparent, rgba(0,255,200,0.3), transparent)",
            animation:"fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both"}} />
          <div style={{display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(220px,1fr))", gap:isMobile?14:24, justifyItems:"center", width:"100%", maxWidth:isMobile?430:960}}>
            {MODULES.map(function(mod, i) {
              return <ModuleCard key={mod.id} module={mod} compact={isMobile} index={i} onClick={function() { if (mod.path) navigate(mod.path); }} />;
            })}
          </div>
          <div style={{position:"sticky",bottom:isMobile?72:24,zIndex:2,width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:8,paddingTop:8}}>
            <StorageBar usage={storageUsage} loggedIn={!!auth.user} />
            {auth.user ? (
              <p style={{margin:0,fontSize:10,fontFamily:"'JetBrains Mono',monospace",textAlign:"center",lineHeight:1.5,maxWidth:420,color:cloudStatus && cloudStatus.ok ? "#34D399" : cloudStatus ? "#FF3D8A" : "rgba(255,255,255,0.3)"}}>
                {cloudStatus ? cloudStatus.detail : "A verificar sincronização…"}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={function() { setChangelogOpen(true); }}
            style={{
              marginTop: 8,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "10px 18px",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              color: changelogUnread ? "#00FFC8" : "rgba(255,255,255,0.22)",
              letterSpacing: 2,
              textTransform: "uppercase",
              animation: "fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.55s both",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {changelogUnread ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF3D8A", animation: "pulseDot 1.8s ease-in-out infinite" }} /> : null}
            Ver atualizações · {SYNC_REV}
          </button>
        </div>
      </div>
    </div>
  );
}