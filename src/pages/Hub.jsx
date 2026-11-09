/* eslint-disable no-unused-vars, no-empty */
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { COLORS, MODULE_COLORS, moduleGlow } from "../lib/theme";
import { MICRO_CSS, trackSpotlight } from "../lib/microUi";
import { readLocal } from "../lib/cloudStore";
import * as tasksStore from "../lib/tasksStore";
import * as journalStore from "../lib/journalStore";
import * as wishlistStore from "../lib/wishlistStore";
import * as financeStore from "../lib/financeStore";
import * as incomeStore from "../lib/incomeStore";
import * as projectModuleStore from "../lib/projectModuleStore";
import { financeStats } from "../lib/financeSequences";
import {
  loadHubOrder,
  saveHubOrder,
  loadHidden,
  saveHidden,
} from "../lib/navModules.jsx";

var HUB_CSS = [
  MICRO_CSS,
  "@keyframes hubIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}",
  "@keyframes hubTick{0%,48%{opacity:1}50%,98%{opacity:.18}}",
  "@keyframes hubDrift{0%,100%{transform:translate(0,0)}50%{transform:translate(3%,-4%)}}",
  "@keyframes hubPulse{0%,100%{opacity:1}50%{opacity:.35}}",
  ".hub-scroll{height:100%;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;position:relative;background:transparent;color:" + COLORS.text + ";font-family:'Manrope',sans-serif}",
  ".hub-scroll::-webkit-scrollbar{width:5px}",
  ".hub-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1)}",
  ".hub-inner{max-width:1080px;margin:0 auto;padding:48px 32px 96px;position:relative;overflow:visible}",
  ".hub-glow{position:absolute;border-radius:50%;pointer-events:none;filter:blur(70px);animation:hubDrift 22s ease-in-out infinite;z-index:0}",
  ".hub-glow--a{width:min(520px,70vw);height:min(520px,70vw);top:-10%;right:-12%;opacity:.95}",
  ".hub-glow--b{width:min(420px,56vw);height:min(420px,56vw);top:4%;left:-18%;opacity:.8;animation-delay:-8s}",
  ".hub-glow--c{width:min(720px,92%);height:min(280px,36vw);top:18%;left:2%;opacity:.7;animation-delay:-14s}",
  ".hub-top,.hub-grid,.hub-foot,.hub-set{position:relative;z-index:1}",
  ".hub-top{display:flex;align-items:flex-start;justify-content:space-between;gap:28px;margin-bottom:48px}",
  ".hub-kicker{font-size:10px;letter-spacing:2.4px;text-transform:uppercase;color:" + COLORS.faint + ";font-family:'JetBrains Mono',monospace;margin:0 0 14px;display:flex;align-items:center;gap:8px}",
  ".hub-live{width:6px;height:6px;border-radius:50%;background:var(--mc,#EDE8DF);flex-shrink:0;animation:hubPulse 2.2s ease-in-out infinite}",
  ".hub-hello{font-family:'Syne',sans-serif;font-weight:700;font-size:clamp(40px,6.4vw,72px);letter-spacing:-.055em;line-height:.92;margin:0;color:" + COLORS.text + "}",
  ".hub-hello span{display:block;color:" + COLORS.muted + ";font-weight:500;font-size:.52em;letter-spacing:-.03em;margin-top:10px}",
  ".hub-clock-wrap{text-align:right;animation:hubIn var(--dur-slow) var(--ease) both}",
  ".hub-time{display:flex;align-items:baseline;justify-content:flex-end;font-family:'JetBrains Mono',monospace;font-weight:300;letter-spacing:-.08em;line-height:.85;font-size:clamp(40px,5vw,64px);color:" + COLORS.text + "}",
  ".hub-colon{display:inline-block;animation:hubTick 2s steps(1) infinite;margin:0 2px;color:" + COLORS.text + "}",
  ".hub-date{margin:12px 0 0;font-size:13px;color:" + COLORS.muted + ";letter-spacing:.15px;text-transform:capitalize}",
  ".hub-ring{margin-top:16px;display:flex;align-items:center;justify-content:flex-end;gap:10px;color:" + COLORS.faint + ";font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.8px}",
  ".hub-ring svg{display:block}",
  ".hub-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 36px;animation:hubIn var(--dur-slow) var(--ease) both;animation-delay:80ms}",
  ".hub-stats.has-resale{grid-template-columns:repeat(5,minmax(0,1fr))}",
  ".hub-stat{position:relative;padding:16px 16px 14px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.045);text-align:left;cursor:pointer;color:inherit;font-family:inherit;min-width:0;backdrop-filter:blur(22px) saturate(2.1);-webkit-backdrop-filter:blur(22px) saturate(2.1);overflow:hidden}",
  ".hub-stat::before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.16),transparent 48%)}",
  ".hub-stat:hover{border-color:rgba(255,255,255,.32);background:rgba(255,255,255,.07)}",
  ".hub-stat b{display:block;font-family:'JetBrains Mono',monospace;font-size:clamp(22px,3vw,28px);font-weight:400;letter-spacing:-.04em;color:" + COLORS.text + ";line-height:1}",
  ".hub-stat i{display:block;margin-top:8px;font-style:normal;font-size:11px;letter-spacing:.4px;color:" + COLORS.faint + ";font-family:'JetBrains Mono',monospace;text-transform:uppercase}",
  ".hub-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:28px;animation:hubIn var(--dur-slow) var(--ease) both;animation-delay:180ms}",
  ".hub-panel h2{margin:0 0 14px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:" + COLORS.faint + ";font-weight:400}",
  ".hub-row{display:flex;align-items:baseline;justify-content:space-between;gap:12px;width:100%;padding:12px 0;border:none;border-bottom:1px solid rgba(255,255,255,.06);background:none;color:inherit;text-align:left;cursor:pointer;font-family:inherit}",
  ".hub-row:hover .hub-row-t{color:var(--mc,#EDE8DF)}",
  ".hub-row-t{margin:0;font-size:15px;color:" + COLORS.text + ";line-height:1.35}",
  ".hub-row-m{font-family:'JetBrains Mono',monospace;font-size:11px;color:" + COLORS.faint + ";flex-shrink:0}",
  ".hub-empty{margin:0;font-size:13px;color:" + COLORS.faint + ";line-height:1.55}",
  ".hub-set{animation:hubIn var(--dur-slow) var(--ease) both}",
  ".hub-set-lead{margin:0 0 28px;max-width:48ch;font-size:14px;line-height:1.55;color:" + COLORS.muted + "}",
  ".hub-set-block{margin-top:36px}",
  ".hub-index-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;padding-top:4px}",
  ".hub-tog{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:14px;padding:16px 4px;border-bottom:1px solid rgba(255,255,255,.06)}",
  ".hub-tog h3{margin:0;font-family:'Syne',sans-serif;font-size:16px;font-weight:600;letter-spacing:-.02em;color:" + COLORS.text + "}",
  ".hub-tog p{margin:4px 0 0;font-size:12.5px;line-height:1.45;color:" + COLORS.faint + "}",
  ".hub-switch{min-height:44px;padding:8px 2px;border:none;border-bottom:1px solid rgba(255,255,255,.16);background:transparent;color:#6E6E76;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.4px;cursor:pointer;white-space:nowrap}",
  ".hub-switch.is-on{color:var(--mc);border-bottom-color:var(--mc)}",
  ".hub-set-link{display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%;padding:18px 2px;border:none;border-bottom:1px solid rgba(255,255,255,.06);background:transparent;color:inherit;text-align:left;cursor:pointer;font-family:inherit}",
  ".hub-set-link h3{margin:0;font-family:'Syne',sans-serif;font-size:16px;font-weight:600;color:" + COLORS.text + "}",
  ".hub-set-link p{margin:4px 0 0;font-size:12.5px;color:" + COLORS.faint + "}",
  ".hub-set-link:hover h3{color:var(--mc)}",
  ".hub-foot{margin-top:48px;padding-top:20px;border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}",
  ".hub-foot p{margin:0;font-size:12px;color:" + COLORS.faint + ";font-family:'JetBrains Mono',monospace;letter-spacing:.4px}",
  "@media(hover:hover) and (pointer:fine){.hub-tog{cursor:grab}.hub-tog.is-dragging{opacity:.42}.hub-tog.is-over{background:rgba(255,255,255,.04)}}",
  "@media(max-width:1100px){.hub-stats,.hub-stats.has-resale{grid-template-columns:repeat(2,minmax(0,1fr))}.hub-grid{grid-template-columns:1fr}.hub-top{flex-direction:column}.hub-clock-wrap{text-align:left}.hub-time,.hub-ring{justify-content:flex-start}}",
  "@media(max-width:719px){",
  ".hub-inner{padding:28px 16px max(88px,env(safe-area-inset-bottom))}",
  ".hub-hello{font-size:36px}",
  ".hub-stats,.hub-stats.has-resale{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}",
  ".hub-tog{grid-template-columns:24px minmax(0,1fr);gap:12px}",
  ".hub-switch{grid-column:1 / -1;justify-self:start}",
  "}",
].join("");

function pad2(n) { return n < 10 ? "0" + n : "" + n; }
function dayKey(d) {
  d = d || new Date();
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}
function eur(v) {
  return (Number(v) || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
function canDesktopReorder() {
  try { return window.matchMedia("(hover: hover) and (pointer: fine)").matches; } catch (e) { return true; }
}
function getGreeting() {
  var h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 20) return "Boa tarde";
  return "Boa noite";
}
function resaleScore(p) {
  var t = ((p && p.name) || "") + " " + ((p && p.description) || "");
  t = t.toLowerCase();
  if (/ressel|resell|ressell|resale|sapatilh|sneaker|t[eé]nis|flip|streetwear/.test(t)) return 2;
  if (p && p.modules && p.modules.stock) return 1;
  return 0;
}
function sneakerItems(data) {
  var names = ((data && data.items) || []).map(function(i) { return i.nome || i.name || ""; }).join(" ").toLowerCase();
  return /samba|jordan|nike|adidas|dunk|yeezy|sapatilh|air max|force|nb |new balance/.test(names);
}
function localStockBlobs() {
  var out = [];
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf("project-module-v1:stock:") !== 0) continue;
      try {
        var data = JSON.parse(localStorage.getItem(k) || "{}");
        var parts = k.split(":");
        out.push({ id: parts[2], data: data });
      } catch (e) {}
    }
  } catch (e) {}
  return out;
}

function Clock(props) {
  var tS = useState(new Date()); var time = tS[0], setTime = tS[1];
  useEffect(function() {
    var i = setInterval(function() { setTime(new Date()); }, 1000);
    return function() { clearInterval(i); };
  }, []);
  var h = time.getHours().toString().padStart(2, "0");
  var m = time.getMinutes().toString().padStart(2, "0");
  var s = time.getSeconds().toString().padStart(2, "0");
  var passed = (time.getHours() * 60 + time.getMinutes()) / (24 * 60);
  var C = 2 * Math.PI * 14;
  var dash = (passed * C).toFixed(2);
  return (
    <div className="hub-clock-wrap">
      <div className="hub-time" style={{ fontSize: props.isMobile ? 48 : 64 }}>
        <span>{h}</span>
        <span className="hub-colon">:</span>
        <span>{m}</span>
        <span style={{ fontSize: 13, fontWeight: 400, color: COLORS.faint, letterSpacing: "0.18em", marginLeft: 10, alignSelf: "flex-end", marginBottom: 6 }}>{s}</span>
      </div>
      <p className="hub-date">
        {time.toLocaleDateString("pt-PT", { weekday: "long" })} · {time.toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}
      </p>
      <div className="hub-ring">
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="2.4" />
          <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray={dash + " " + C} strokeLinecap="butt" transform="rotate(-90 18 18)" />
        </svg>
        {Math.round(passed * 100)}% do dia
      </div>
    </div>
  );
}

async function loadSnapshot() {
  var today = dayKey();
  var tasks = [];
  var events = [];
  var spaces = [];
  var items = [];
  var projects = [];
  var expenses = [];
  var incomes = [];
  try { tasks = await tasksStore.loadTasksLocal(); } catch (e) {}
  try {
    var raw = await readLocal("sinapse-calendar-v3", []);
    if (raw && !Array.isArray(raw) && typeof raw === "object") {
      events = (raw[today] || []).map(function(r) {
        return { title: r.title, time: r.time, allDay: !!r.allDay };
      });
    } else {
      events = (raw || []).filter(function(r) {
        return (r.day_key || r.dayKey) === today;
      }).map(function(r) {
        return { title: r.title, time: r.time, allDay: !!(r.allDay || r.all_day) };
      });
    }
  } catch (e) {}
  try { spaces = await journalStore.loadSpacesLocal(); } catch (e) {}
  try { items = await wishlistStore.loadItemsLocal(); } catch (e) {}
  try { projects = await readLocal("sinapse-projects-v1", []); } catch (e) {}
  try { expenses = await financeStore.loadExpenses(); } catch (e) {}
  try { incomes = await incomeStore.loadIncomes(); } catch (e) {}

  var boardTasks = (tasks || []).filter(function(t) {
    return t.column === "inbox" || t.column === "today";
  });
  var dueToday = boardTasks.filter(function(t) { return t.due === today; });
  var wishOpen = (items || []).filter(function(i) { return !i.purchased; });
  var stats = financeStats(expenses, incomes);
  events.sort(function(a, b) {
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    return String(a.time || "").localeCompare(String(b.time || ""));
  });

  var resaleId = null;
  var resalePath = "/projects";
  var lucro = null;
  var ranked = (projects || []).map(function(p) {
    return { p: p, s: resaleScore(p) };
  }).filter(function(x) { return x.s > 0; }).sort(function(a, b) { return b.s - a.s; });
  var blobs = localStockBlobs();
  var stockData = null;
  blobs.forEach(function(b) {
    if (!stockData || sneakerItems(b.data)) stockData = b.data;
  });
  if (ranked.length) {
    resaleId = ranked[0].p.id;
    resalePath = "/projects/" + ranked[0].p.id + ((ranked[0].p.modules && ranked[0].p.modules.stock) ? "/stock" : "");
    try {
      var pulled = await projectModuleStore.loadStock(ranked[0].p.id);
      if (pulled && pulled.items && pulled.items.length) stockData = pulled;
    } catch (e) {}
  } else if (blobs.length === 1 && (projects || []).length === 1) {
    resaleId = projects[0].id;
    resalePath = "/projects/" + projects[0].id;
  }
  if (stockData) lucro = projectModuleStore.stockStats(stockData).lucroTotal;

  return {
    openTasks: boardTasks.length,
    dueToday: dueToday.slice(0, 6),
    events: events.slice(0, 6),
    notes: (spaces || []).length,
    wishes: wishOpen.length,
    projects: (projects || []).length,
    saldo: stats.saldo,
    lucro: lucro,
    resalePath: resalePath,
    resaleId: resaleId,
  };
}

export default function Hub() {
  var navigate = useNavigate();
  var loc = useLocation();
  var auth = useAuth();
  var vwS = useState(window.innerWidth);
  var isMobile = vwS[0] < 720;
  var screen = /view=settings/.test(loc.search || "") ? "settings" : "hub";

  useEffect(function() {
    function onResize() { vwS[1](window.innerWidth); }
    window.addEventListener("resize", onResize);
    return function() { window.removeEventListener("resize", onResize); };
  }, []);

  var who = auth.user && auth.user.email ? auth.user.email.split("@")[0] : "Martim";
  var canReorder = !isMobile && canDesktopReorder();
  var modsS = useState(loadHubOrder);
  var mods = modsS[0], setMods = modsS[1];
  var hiddenS = useState(loadHidden);
  var hidden = hiddenS[0], setHidden = hiddenS[1];
  var hiddenSet = {};
  hidden.forEach(function(id) { hiddenSet[id] = true; });
  var snapS = useState(null);
  var snap = snapS[0], setSnap = snapS[1];
  var dragIdS = useState(null);
  var dragId = dragIdS[0], setDragId = dragIdS[1];
  var overIdS = useState(null);
  var overId = overIdS[0], setOverId = overIdS[1];
  var dragLockRef = useRef(false);
  var dragIdRef = useRef(null);

  useEffect(function() {
    var alive = true;
    loadSnapshot().then(function(s) { if (alive) setSnap(s); }).catch(function() {});
    return function() { alive = false; };
  }, []);

  function toggleModule(id) {
    setHidden(function(prev) {
      var next = prev.indexOf(id) >= 0
        ? prev.filter(function(x) { return x !== id; })
        : prev.concat([id]);
      saveHidden(next);
      return next;
    });
  }

  function moveModule(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return;
    setMods(function(prev) {
      var next = prev.slice();
      var from = -1, to = -1;
      next.forEach(function(m, i) {
        if (m.id === fromId) from = i;
        if (m.id === toId) to = i;
      });
      if (from < 0 || to < 0) return prev;
      var item = next.splice(from, 1)[0];
      next.splice(to, 0, item);
      saveHubOrder(next);
      return next;
    });
  }

  function setScreen(next) {
    navigate(next === "settings" ? { pathname: "/", search: "?view=settings" } : "/");
  }

  return (
    <div className="hub-root hub-scroll" data-scrollable>
      <style>{HUB_CSS}</style>
      <div className="hub-inner">
        <div className="hub-glow hub-glow--a" style={{ background: moduleGlow(MODULE_COLORS.focus, "55") }} aria-hidden="true" />
        <div className="hub-glow hub-glow--b" style={{ background: moduleGlow(MODULE_COLORS.calendar, "48") }} aria-hidden="true" />
        <div className="hub-glow hub-glow--c" style={{ background: moduleGlow(MODULE_COLORS.tasks, "40") }} aria-hidden="true" />
        <header className="hub-top">
          <div>
            <p className="hub-kicker"><span className="hub-live" aria-hidden="true" />{getGreeting()}</p>
            <h1 className="hub-hello">
              {who}
              <span>O teu sítio para pensar e avançar.</span>
            </h1>
          </div>
          <Clock isMobile={isMobile} />
        </header>

        {screen === "settings" ? (
          <section className="hub-set" aria-label="Definições">
            <div className="hub-index-head">
              <p className="hub-kicker" style={{ margin: 0 }}>Definições</p>
              <button type="button" className="ui-line-btn ui-tap" onClick={function() { setScreen("hub"); }}>Início</button>
            </div>
            <p className="hub-set-lead">A barra lateral só mostra os módulos ligados. Ocultar não apaga dados — podes voltar a ligar quando quiseres.</p>
            <p className="hub-kicker" style={{ marginBottom: 8 }}>Módulos</p>
            <div>
              {mods.map(function(mod) {
                var on = !hiddenSet[mod.id];
                return (
                  <div
                    key={mod.id}
                    className={"hub-tog" + (dragId === mod.id ? " is-dragging" : "") + (overId === mod.id && dragId && dragId !== mod.id ? " is-over" : "")}
                    style={{ "--mc": mod.color }}
                    draggable={canReorder}
                    onDragStart={function(e) {
                      if (!canReorder) { e.preventDefault(); return; }
                      dragLockRef.current = true;
                      dragIdRef.current = mod.id;
                      setDragId(mod.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", mod.id);
                    }}
                    onDragOver={function(e) {
                      if (!canReorder) return;
                      e.preventDefault();
                      setOverId(mod.id);
                    }}
                    onDrop={function(e) {
                      if (!canReorder) return;
                      e.preventDefault();
                      moveModule(dragIdRef.current, mod.id);
                      setDragId(null);
                      setOverId(null);
                    }}
                    onDragEnd={function() {
                      dragIdRef.current = null;
                      setDragId(null);
                      setOverId(null);
                      setTimeout(function() { dragLockRef.current = false; }, 150);
                    }}
                  >
                    <span aria-hidden="true" style={{ color: mod.color, display: "flex" }}><mod.Icon /></span>
                    <span style={{ minWidth: 0 }}>
                      <h3>{mod.name}</h3>
                      <p>{mod.desc}</p>
                    </span>
                    <button type="button" className={"hub-switch ui-tap" + (on ? " is-on" : "")} aria-pressed={on} onClick={function() { toggleModule(mod.id); }}>
                      {on ? "Na barra" : "Oculto"}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="hub-set-block">
              <p className="hub-kicker" style={{ marginBottom: 4 }}>Atalhos</p>
              <button type="button" className="hub-set-link ui-tap" style={{ "--mc": MODULE_COLORS.finance }} onClick={function() { navigate("/quick"); }}>
                <span>
                  <h3>Atalhos iPhone</h3>
                  <p>Captura rápida de recursos e gastos, e o modelo para a app Atalhos.</p>
                </span>
                <span aria-hidden="true" style={{ color: COLORS.faint }}>→</span>
              </button>
            </div>
          </section>
        ) : (
          <div>
            {snap ? (
              <div className={"hub-stats" + (snap.lucro != null ? " has-resale" : "")}>
                <button type="button" className="hub-stat" style={{ "--sc": MODULE_COLORS.tasks }} onClick={function() { navigate("/tasks"); }} onMouseMove={trackSpotlight}>
                  <b>{snap.openTasks}</b>
                  <i>inbox e hoje</i>
                </button>
                <button type="button" className="hub-stat" style={{ "--sc": MODULE_COLORS.calendar }} onClick={function() { navigate("/calendar"); }}>
                  <b>{snap.events.length}</b>
                  <i>eventos hoje</i>
                </button>
                <button type="button" className="hub-stat" style={{ "--sc": MODULE_COLORS.finance }} onClick={function() { navigate("/finance"); }}>
                  <b>{eur(snap.saldo)}</b>
                  <i>saldo vivo</i>
                </button>
                {snap.lucro != null ? (
                  <button type="button" className="hub-stat" style={{ "--sc": snap.lucro >= 0 ? COLORS.positive : COLORS.negative }} onClick={function() { navigate(snap.resalePath || "/projects"); }}>
                    <b>{eur(snap.lucro)}</b>
                    <i>lucro resell</i>
                  </button>
                ) : null}
                <button type="button" className="hub-stat" style={{ "--sc": MODULE_COLORS.journal }} onClick={function() { navigate("/journal"); }}>
                  <b>{snap.notes}</b>
                  <i>notas</i>
                </button>
              </div>
            ) : null}

            <div className="hub-grid">
              <section className="hub-panel">
                <h2>Hoje no calendário</h2>
                {snap && snap.events.length ? snap.events.map(function(ev, i) {
                  return (
                    <button key={i} type="button" className="hub-row" style={{ "--mc": MODULE_COLORS.calendar }} onClick={function() { navigate("/calendar"); }}>
                      <p className="hub-row-t">{ev.title || "Evento"}</p>
                      <span className="hub-row-m">{ev.allDay ? "todo o dia" : (ev.time || "")}</span>
                    </button>
                  );
                }) : <p className="hub-empty">Nada marcado para hoje. O dia ainda está aberto.</p>}
              </section>
              <section className="hub-panel">
                <h2>A vencer hoje</h2>
                {snap && snap.dueToday.length ? snap.dueToday.map(function(t) {
                  return (
                    <button key={t.id} type="button" className="hub-row" style={{ "--mc": MODULE_COLORS.tasks }} onClick={function() { navigate("/tasks"); }}>
                      <p className="hub-row-t">{t.title || "Tarefa"}</p>
                      <span className="hub-row-m">{t.priority || ""}</span>
                    </button>
                  );
                }) : <p className="hub-empty">Nenhuma tarefa com prazo para hoje.</p>}
              </section>
            </div>

            <footer className="hub-foot">
              <p>{snap ? (snap.projects + " projetos · " + snap.wishes + " na wishlist") : "Sinapse"}</p>
              <button type="button" className="ui-line-btn ui-tap" onClick={function() { setScreen("settings"); }}>Definições</button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
