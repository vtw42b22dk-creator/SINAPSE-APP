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
import { financeStats } from "../lib/financeSequences";
import {
  loadHubOrder,
  saveHubOrder,
  loadHidden,
  saveHidden,
} from "../lib/navModules.jsx";

var NOTES = [
  "O que não está escrito ainda não existe.",
  "Uma coisa de cada vez. O resto espera.",
  "O foco não é força — é recusa.",
  "Guarda o dia antes de o dia te guardar a ti.",
  "Pequenos movimentos, todos os dias.",
  "Se está na cabeça, põe-no nalgum sítio.",
  "O silêncio também é trabalho.",
  "Não precisas de mais horas. Precisas de menos ruído.",
  "Começa pelo que pesa mais.",
  "O amanhã trata-se melhor se o hoje ficar fechado.",
];

var HUB_CSS = [
  MICRO_CSS,
  "@keyframes hubIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}",
  "@keyframes hubTick{0%,48%{opacity:1}50%,98%{opacity:.18}}",
  "@keyframes hubDrift{0%,100%{transform:translate(0,0)}50%{transform:translate(3%,-4%)}}",
  "@keyframes hubPulse{0%,100%{opacity:1}50%{opacity:.35}}",
  ".hub-scroll{height:100%;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;position:relative;background:transparent;color:" + COLORS.text + ";font-family:'Manrope',sans-serif}",
  ".hub-scroll::-webkit-scrollbar{width:5px}",
  ".hub-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1)}",
  ".hub-inner{max-width:1080px;margin:0 auto;padding:48px 32px 96px;position:relative;z-index:1}",
  ".hub-glow{position:fixed;border-radius:50%;pointer-events:none;filter:blur(100px);animation:hubDrift 22s ease-in-out infinite}",
  ".hub-glow--a{width:min(480px,60vw);height:min(480px,60vw);top:-16%;right:-8%;opacity:.55}",
  ".hub-glow--b{width:min(340px,46vw);height:min(340px,46vw);bottom:4%;left:-10%;opacity:.35;animation-delay:-8s}",
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
  ".hub-note{max-width:42ch;margin:0 0 40px;font-size:18px;line-height:1.55;color:" + COLORS.muted + ";font-family:'Syne',sans-serif;font-weight:500;letter-spacing:-.02em;animation:hubIn var(--dur-slow) var(--ease) both;animation-delay:80ms}",
  ".hub-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:36px;animation:hubIn var(--dur-slow) var(--ease) both;animation-delay:120ms}",
  ".hub-stat{padding:16px 16px 14px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);text-align:left;cursor:pointer;color:inherit;font-family:inherit;min-width:0}",
  ".hub-stat:hover{border-color:color-mix(in srgb,var(--sc,#EDE8DF) 45%,transparent);background:rgba(255,255,255,.04)}",
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
  "@media(max-width:900px){.hub-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.hub-grid{grid-template-columns:1fr}.hub-top{flex-direction:column}.hub-clock-wrap{text-align:left}.hub-time,.hub-ring{justify-content:flex-start}}",
  "@media(max-width:719px){",
  ".hub-inner{padding:28px 16px max(88px,env(safe-area-inset-bottom))}",
  ".hub-hello{font-size:36px}",
  ".hub-note{font-size:16px;margin-bottom:28px}",
  ".hub-stats{gap:8px}",
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
function dayNote() {
  var i = Math.floor(Date.now() / 86400000) % NOTES.length;
  return NOTES[i];
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

  var openTasks = (tasks || []).filter(function(t) {
    return t.column !== "done" && t.column !== "longdone";
  });
  var dueToday = openTasks.filter(function(t) { return t.due === today; });
  var wishOpen = (items || []).filter(function(i) { return !i.purchased; });
  var stats = financeStats(expenses, incomes);
  events.sort(function(a, b) {
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    return String(a.time || "").localeCompare(String(b.time || ""));
  });
  return {
    openTasks: openTasks.length,
    dueToday: dueToday.slice(0, 6),
    events: events.slice(0, 6),
    notes: (spaces || []).length,
    wishes: wishOpen.length,
    projects: (projects || []).length,
    saldo: stats.saldo,
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
      <div className="hub-glow hub-glow--a" style={{ background: moduleGlow(MODULE_COLORS.focus, "22") }} aria-hidden="true" />
      <div className="hub-glow hub-glow--b" style={{ background: moduleGlow(MODULE_COLORS.calendar, "18") }} aria-hidden="true" />
      <div className="hub-inner">
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
            <p className="hub-note">{dayNote()}</p>

            {snap ? (
              <div className="hub-stats">
                <button type="button" className="hub-stat" style={{ "--sc": MODULE_COLORS.tasks }} onClick={function() { navigate("/tasks"); }} onMouseMove={trackSpotlight}>
                  <b>{snap.openTasks}</b>
                  <i>tarefas abertas</i>
                </button>
                <button type="button" className="hub-stat" style={{ "--sc": MODULE_COLORS.calendar }} onClick={function() { navigate("/calendar"); }}>
                  <b>{snap.events.length}</b>
                  <i>eventos hoje</i>
                </button>
                <button type="button" className="hub-stat" style={{ "--sc": MODULE_COLORS.finance }} onClick={function() { navigate("/finance"); }}>
                  <b>{eur(snap.saldo)}</b>
                  <i>saldo vivo</i>
                </button>
                <button type="button" className="hub-stat" style={{ "--sc": MODULE_COLORS.journal }} onClick={function() { navigate("/journal"); }}>
                  <b>{snap.notes}</b>
                  <i>espaços no diário</i>
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
