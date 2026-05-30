import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import * as focusStore from "../lib/focusStore";
import { MODULE_ENTRY_CSS } from "../lib/pageMotion";

var CYAN = "#00FFC8";
var PINK = "#FF3D8A";
var AMBER = "#FFB800";
var REVIEW_DRAFT_KEY = "study-review-draft-v1";

var MODES = [
  { id: "pomodoro", label: "Pomodoro", focus: 25, brk: 5 },
  { id: "exame", label: "Modo Exame", focus: 45, brk: 15 },
  { id: "custom", label: "Custom", focus: 30, brk: 10 },
];

var FOCUS_CSS = [
  "@keyframes fxFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}",
  "@keyframes fxGlow{0%,100%{opacity:.85}50%{opacity:1}}",
  ".fx-page{min-height:100vh;display:flex;flex-direction:column;background:radial-gradient(120% 80% at 50% -10%,#0e1018 0%,#08080f 55%,#06060b 100%);color:#fff;font-family:'IBM Plex Sans',sans-serif}",
  ".fx-head{position:sticky;top:0;z-index:20;flex-shrink:0;display:flex;align-items:center;gap:12px;padding:13px 18px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(7,7,13,0.8);backdrop-filter:blur(16px)}",
  ".fx-hbtn{display:inline-flex;align-items:center;justify-content:center;height:34px;padding:0 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.6);cursor:pointer;font-size:12px;font-family:inherit}",
  ".fx-hbtn:hover{color:#fff;border-color:rgba(255,255,255,0.2)}",
  ".fx-grid{flex:1;display:grid;grid-template-columns:340px minmax(0,1fr) 320px;gap:16px;padding:18px;max-width:1340px;width:100%;margin:0 auto;box-sizing:border-box;align-items:start}",
  ".fx-panel{border-radius:18px;border:1px solid rgba(255,255,255,0.07);background:linear-gradient(155deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012));padding:18px;animation:fxFade .35s ease;box-sizing:border-box}",
  ".fx-title{margin:0 0 14px;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;letter-spacing:.6px;display:flex;align-items:center;gap:9px}",
  ".fx-modes{display:flex;gap:6px;margin-bottom:16px}",
  ".fx-mode{flex:1;padding:9px 6px;border-radius:11px;border:1px solid rgba(255,255,255,0.09);background:rgba(255,255,255,0.025);color:rgba(255,255,255,0.5);font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;cursor:pointer;transition:all .15s}",
  ".fx-mode.on{color:#0b0b12}",
  ".fx-custom{display:flex;gap:10px;margin-bottom:16px}",
  ".fx-clock{text-align:center;font-family:'JetBrains Mono',monospace;font-weight:600;font-size:clamp(56px,11vw,82px);line-height:1;letter-spacing:2px;transition:color .4s,text-shadow .4s}",
  ".fx-phase{text-align:center;margin:4px 0 14px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;transition:color .4s}",
  ".fx-prog{height:6px;border-radius:999px;background:rgba(255,255,255,0.07);overflow:hidden;margin-bottom:18px}",
  ".fx-prog i{display:block;height:100%;border-radius:999px;transition:width 1s linear,background .4s}",
  ".fx-tcontrols{display:flex;gap:10px}",
  ".fx-tbtn{flex:1;padding:13px;border-radius:13px;border:1px solid;background:transparent;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}",
  ".fx-tbtn:disabled{opacity:.4;cursor:default}",
  ".fx-input{width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:11px;color:#fff;padding:10px 12px;font-size:14px;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color .15s}",
  ".fx-input:focus{border-color:rgba(0,255,200,0.45)}",
  ".fx-input:disabled{opacity:.45;cursor:not-allowed}",
  ".fx-label{display:block;font-size:9px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.4);margin-bottom:5px;letter-spacing:.5px;text-transform:uppercase}",
  ".fx-tabs{display:flex;gap:6px;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.07)}",
  ".fx-tab{padding:9px 14px;border:none;background:none;color:rgba(255,255,255,0.45);font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .15s}",
  ".fx-tab.on{color:#fff}",
  ".fx-area{width:100%;min-height:240px;background:rgba(0,0,0,0.28);border:1px solid rgba(255,255,255,0.09);border-radius:13px;color:#fff;padding:14px 15px;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.7;outline:none;resize:vertical;box-sizing:border-box;transition:border-color .15s}",
  ".fx-area:focus{border-color:rgba(0,255,200,0.4)}",
  ".fx-area:disabled{opacity:.45;cursor:not-allowed}",
  ".fx-btn{display:inline-flex;align-items:center;gap:7px;padding:10px 16px;border-radius:11px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;border:1px solid;transition:transform .15s}",
  ".fx-btn:hover:not(:disabled){transform:translateY(-1px)}",
  ".fx-btn:disabled{opacity:.4;cursor:not-allowed}",
  ".fx-idea{position:relative;padding:10px 34px 10px 12px;border-radius:11px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.022);font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-word}",
  ".fx-idea time{display:block;margin-top:5px;font-size:8px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.3);letter-spacing:.4px}",
  ".fx-idea button{position:absolute;top:7px;right:7px;width:22px;height:22px;border-radius:7px;border:none;background:transparent;color:rgba(255,255,255,0.3);cursor:pointer;font-size:13px}",
  ".fx-idea button:hover{background:rgba(255,61,90,0.16);color:#FF3D5A}",
  ".fx-chart{display:flex;gap:7px;align-items:flex-end;height:140px;margin:6px 0 4px}",
  ".fx-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end;border-radius:10px;padding:5px 2px;transition:box-shadow .2s,background .2s}",
  ".fx-col.best{background:rgba(0,255,200,0.06);box-shadow:0 0 0 1px rgba(0,255,200,0.4),0 0 16px rgba(0,255,200,0.18)}",
  ".fx-bars{flex:1;display:flex;align-items:flex-end;gap:3px;width:100%;justify-content:center}",
  ".fx-bar{width:9px;border-radius:4px 4px 0 0;min-height:2px;transition:height .4s ease}",
  ".fx-daylbl{font-size:8px;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.4)}",
  ".fx-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;font-size:10px;font-family:'JetBrains Mono',monospace;font-weight:600}",
  ".fx-note{font-size:10px;color:rgba(255,255,255,0.32);font-family:'JetBrains Mono',monospace;text-align:center;padding:20px}",
  "@media(max-width:980px){.fx-grid{grid-template-columns:1fr;max-width:560px}}",
].join("");

function fmtClock(total) {
  var m = Math.floor(total / 60);
  var s = total % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function weekdayShort(dayKey) {
  var p = dayKey.split("-");
  var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return d.toLocaleDateString("pt-PT", { weekday: "short" }).replace(".", "");
}

function playBeep(freq) {
  try {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    var ctx = new Ctx();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq || 760;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
    osc.onended = function() { try { ctx.close(); } catch (e) {} };
  } catch (e) {}
}

export default function Focus() {
  var navigate = useNavigate();
  var auth = useAuth();

  var hydratedS = useState(false);
  var isHydrated = hydratedS[0], setIsHydrated = hydratedS[1];

  var ideasS = useState([]);
  var ideas = ideasS[0], setIdeas = ideasS[1];
  var ideaInputS = useState("");
  var ideaInput = ideaInputS[0], setIdeaInput = ideaInputS[1];

  var metricsS = useState([]);
  var metrics = metricsS[0], setMetrics = metricsS[1];

  var tabS = useState("ideas");
  var tab = tabS[0], setTab = tabS[1];
  var reviewS = useState("");
  var reviewText = reviewS[0], setReviewText = reviewS[1];
  var syncS = useState("idle");
  var syncStatus = syncS[0], setSyncStatus = syncS[1];
  var syncMsgS = useState("");
  var syncMsg = syncMsgS[0], setSyncMsg = syncMsgS[1];

  // Timer
  var modeS = useState("pomodoro");
  var modeId = modeS[0], setModeId = modeS[1];
  var cFocusS = useState(30);
  var customFocus = cFocusS[0], setCustomFocus = cFocusS[1];
  var cBreakS = useState(10);
  var customBreak = cBreakS[0], setCustomBreak = cBreakS[1];
  var phaseS = useState("focus");
  var phase = phaseS[0], setPhase = phaseS[1];
  var runningS = useState(false);
  var running = runningS[0], setRunning = runningS[1];

  var mode = MODES.find(function(m) { return m.id === modeId; }) || MODES[0];
  var focusMin = modeId === "custom" ? Math.max(1, customFocus || 1) : mode.focus;
  var breakMin = modeId === "custom" ? Math.max(1, customBreak || 1) : mode.brk;

  var secsS = useState(MODES[0].focus * 60);
  var secsLeft = secsS[0], setSecsLeft = secsS[1];

  var today = focusStore.dayKey();

  // Hidratação: carrega local + nuvem antes de permitir escrita
  useEffect(function() {
    var alive = true;
    try {
      var draft = localStorage.getItem(REVIEW_DRAFT_KEY);
      if (draft) setReviewText(draft);
    } catch (e) {}
    Promise.all([focusStore.loadIdeas(), focusStore.loadMetrics()]).then(function(res) {
      if (!alive) return;
      setIdeas(res[0]);
      setMetrics(res[1]);
    }).finally(function() {
      if (!alive) return;
      setIsHydrated(true);
    });
    return function() { alive = false; };
  }, []);

  var addStudiedMinutes = useCallback(function(min) {
    setMetrics(function(prev) {
      var cur = prev.find(function(m) { return m.day_key === today; });
      var base = cur ? cur.minutes : 0;
      var patch = { minutes: base + min };
      var next = cur
        ? prev.map(function(m) { return m.day_key === today ? Object.assign({}, m, patch, { updated: Date.now() }) : m; })
        : prev.concat([Object.assign(focusStore.newMetric(today), patch)]);
      focusStore.saveMetrics(next);
      return next;
    });
  }, [today]);

  // Ciclo do cronómetro
  useEffect(function() {
    if (!running) return;
    if (secsLeft <= 0) {
      playBeep(phase === "focus" ? 880 : 520);
      if (phase === "focus") {
        addStudiedMinutes(focusMin);
        setPhase("break");
        setSecsLeft(breakMin * 60);
      } else {
        setPhase("focus");
        setSecsLeft(focusMin * 60);
      }
      return;
    }
    var t = setTimeout(function() { setSecsLeft(function(s) { return s - 1; }); }, 1000);
    return function() { clearTimeout(t); };
  }, [running, secsLeft, phase, focusMin, breakMin, addStudiedMinutes]);

  function selectMode(id) {
    setModeId(id);
    setRunning(false);
    setPhase("focus");
    var m = MODES.find(function(x) { return x.id === id; }) || MODES[0];
    var f = id === "custom" ? Math.max(1, customFocus || 1) : m.focus;
    setSecsLeft(f * 60);
  }

  function changeCustom(which, val) {
    var n = Math.max(1, Math.min(180, parseInt(val, 10) || 0));
    if (which === "focus") {
      setCustomFocus(n);
      if (!running && phase === "focus" && modeId === "custom") setSecsLeft(n * 60);
    } else {
      setCustomBreak(n);
    }
  }

  function resetTimer() {
    setRunning(false);
    setPhase("focus");
    setSecsLeft(focusMin * 60);
  }

  var ideaColor = phase === "focus" ? CYAN : PINK;
  var phaseTotal = (phase === "focus" ? focusMin : breakMin) * 60;
  var progress = phaseTotal > 0 ? Math.max(0, Math.min(100, (1 - secsLeft / phaseTotal) * 100)) : 0;

  function addIdea() {
    if (!isHydrated || !ideaInput.trim()) return;
    var n = focusStore.newIdea(ideaInput.trim());
    var next = [n].concat(ideas);
    setIdeas(next);
    setIdeaInput("");
    focusStore.saveIdeas(next);
  }

  function removeIdea(id) {
    if (!isHydrated) return;
    focusStore.deleteIdea(ideas, id).then(setIdeas);
  }

  function onReviewChange(val) {
    setReviewText(val);
    if (syncStatus !== "idle") setSyncStatus("idle");
    try { localStorage.setItem(REVIEW_DRAFT_KEY, val); } catch (e) {}
  }

  function syncToDiary() {
    if (!isHydrated || !reviewText.trim()) return;
    setSyncStatus("sending");
    setSyncMsg("");
    focusStore.syncNoteToDiary(reviewText).then(function(res) {
      if (res.ok) {
        setSyncStatus("sent");
        setTimeout(function() { setSyncStatus(function(s) { return s === "sent" ? "idle" : s; }); }, 4500);
      } else {
        setSyncStatus("error");
        setSyncMsg(res.error || "Falhou");
      }
    });
  }

  function updateToday(patch) {
    if (!isHydrated) return;
    setMetrics(function(prev) {
      var cur = prev.find(function(m) { return m.day_key === today; });
      var next = cur
        ? prev.map(function(m) { return m.day_key === today ? Object.assign({}, m, patch, { updated: Date.now() }) : m; })
        : prev.concat([Object.assign(focusStore.newMetric(today), patch)]);
      focusStore.saveMetrics(next);
      return next;
    });
  }

  var todayMetric = useMemo(function() {
    return metrics.find(function(m) { return m.day_key === today; }) || focusStore.newMetric(today);
  }, [metrics, today]);

  var week = useMemo(function() { return focusStore.lastDays(metrics, 7); }, [metrics]);
  var maxMin = Math.max(1, Math.max.apply(null, week.map(function(d) { return d.minutes; })));
  var maxPages = Math.max(1, Math.max.apply(null, week.map(function(d) { return d.pages; })));
  var bestKey = useMemo(function() {
    var best = null, bv = 0;
    week.forEach(function(d) { if (d.minutes > bv) { bv = d.minutes; best = d.day_key; } });
    return best;
  }, [week]);

  var canSync = isHydrated && !!auth.user && reviewText.trim().length > 0;
  var dis = !isHydrated;

  return (
    <div className="fx-page" data-scrollable>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{MODULE_ENTRY_CSS + FOCUS_CSS}</style>

      <header className="fx-head">
        <button type="button" className="fx-hbtn" onClick={function() { navigate("/"); }}>← Hub</button>
        <div style={{ display: "flex", alignItems: "baseline", gap: 9, flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: CYAN, letterSpacing: 1.2 }}>ESTÚDIO DE FOCO</h1>
          <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.3)" }}>sessões · ideias · métricas</span>
        </div>
        <span className="fx-badge" style={{ color: isHydrated ? "#34D399" : AMBER, background: (isHydrated ? "#34D399" : AMBER) + "18" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: isHydrated ? "#34D399" : AMBER }} />
          {isHydrated ? (auth.user ? "Sincronizado" : "Local") : "A carregar…"}
        </span>
      </header>

      <main className="fx-grid">
        {/* PAINEL ESQUERDO — TIMER */}
        <section className="fx-panel" style={{ borderColor: ideaColor + "2e" }}>
          <h3 className="fx-title" style={{ color: ideaColor }}><span>◷</span> Sessão</h3>
          <div className="fx-modes">
            {MODES.map(function(m) {
              var on = modeId === m.id;
              return (
                <button type="button" key={m.id} className={"fx-mode" + (on ? " on" : "")} onClick={function() { selectMode(m.id); }}
                  style={on ? { background: ideaColor, boxShadow: "0 0 14px " + ideaColor + "55" } : null}>
                  {m.label}
                </button>
              );
            })}
          </div>

          {modeId === "custom" && (
            <div className="fx-custom">
              <div style={{ flex: 1 }}>
                <label className="fx-label">Foco (min)</label>
                <input type="number" min={1} max={180} className="fx-input" value={customFocus} disabled={running}
                  onChange={function(e) { changeCustom("focus", e.target.value); }} style={{ fontFamily: "'JetBrains Mono',monospace" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="fx-label">Pausa (min)</label>
                <input type="number" min={1} max={180} className="fx-input" value={customBreak} disabled={running}
                  onChange={function(e) { changeCustom("break", e.target.value); }} style={{ fontFamily: "'JetBrains Mono',monospace" }} />
              </div>
            </div>
          )}

          <div className="fx-clock" style={{ color: ideaColor, textShadow: "0 0 22px " + ideaColor + "88, 0 0 6px " + ideaColor + "66" }}>
            {fmtClock(secsLeft)}
          </div>
          <p className="fx-phase" style={{ color: ideaColor }}>{phase === "focus" ? "● Foco" : "❚❚ Pausa"} · {phase === "focus" ? focusMin : breakMin} min</p>
          <div className="fx-prog"><i style={{ width: progress + "%", background: ideaColor, boxShadow: "0 0 10px " + ideaColor }} /></div>

          <div className="fx-tcontrols">
            <button type="button" className="fx-tbtn" disabled={dis} onClick={function() { setRunning(!running); }}
              style={{ borderColor: ideaColor + "66", color: ideaColor, background: ideaColor + "12" }}>
              {running ? "❚❚ Pausa" : "▶ Play"}
            </button>
            <button type="button" className="fx-tbtn" disabled={dis} onClick={resetTimer}
              style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>
              ↺ Reset
            </button>
          </div>
          <p style={{ margin: "14px 0 0", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
            Estudo hoje: <span style={{ color: CYAN }}>{todayMetric.minutes} min</span>
          </p>
        </section>

        {/* PAINEL CENTRAL — IDEIAS / NOTAS */}
        <section className="fx-panel">
          <div className="fx-tabs">
            <button type="button" className={"fx-tab" + (tab === "ideas" ? " on" : "")} onClick={function() { setTab("ideas"); }}
              style={tab === "ideas" ? { borderBottomColor: CYAN, color: CYAN } : null}>Ideias Espontâneas</button>
            <button type="button" className={"fx-tab" + (tab === "notes" ? " on" : "")} onClick={function() { setTab("notes"); }}
              style={tab === "notes" ? { borderBottomColor: PINK, color: PINK } : null}>Notas de Revisão</button>
          </div>

          {tab === "ideas" ? (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input className="fx-input" value={ideaInput} disabled={dis} placeholder="Pensamento rápido para não perder o foco…"
                  onChange={function(e) { setIdeaInput(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === "Enter") addIdea(); }} />
                <button type="button" className="fx-btn" disabled={dis || !ideaInput.trim()} onClick={addIdea}
                  style={{ borderColor: CYAN + "55", color: CYAN, background: CYAN + "14" }}>+ Anotar</button>
              </div>
              {ideas.length === 0 ? (
                <p className="fx-note">Sem ideias registadas. Escreve algo e prime Enter.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "52vh", overflowY: "auto" }}>
                  {ideas.map(function(it) {
                    return (
                      <div key={it.id} className="fx-idea">
                        <button type="button" onClick={function() { removeIdea(it.id); }} title="Apagar">×</button>
                        {it.content}
                        <time>{it.day_key}</time>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="fx-label">Resumo / lembrete da matéria</label>
              <textarea className="fx-area" value={reviewText} disabled={dis}
                placeholder={"Aponta o resumo importante…\n\nDepois envia diretamente para o teu Diário."}
                onChange={function(e) { onReviewChange(e.target.value); }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button type="button" className="fx-btn" disabled={!canSync || syncStatus === "sending"} onClick={syncToDiary}
                  style={{ borderColor: PINK + "55", color: PINK, background: PINK + "14" }}>
                  {syncStatus === "sending" ? "A enviar…" : "↗ Sincronizar com o Diário"}
                </button>
                {syncStatus === "sent" && (
                  <span className="fx-badge" style={{ color: "#34D399", background: "rgba(52,211,153,0.14)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399" }} />Enviado ✓
                  </span>
                )}
                {syncStatus === "error" && (
                  <span className="fx-badge" style={{ color: "#FF3D5A", background: "rgba(255,61,90,0.14)" }}>Erro: {syncMsg}</span>
                )}
                {!auth.user && isHydrated && (
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'JetBrains Mono',monospace" }}>Inicia sessão para sincronizar</span>
                )}
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                Guardado no Diário com a data de hoje e o prefixo <span style={{ color: PINK }}>// NOTA DE ESTUDO:</span>
              </p>
            </div>
          )}
        </section>

        {/* PAINEL DIREITO — MÉTRICAS */}
        <section className="fx-panel">
          <h3 className="fx-title" style={{ color: AMBER }}><span>◈</span> Desempenho</h3>

          <label className="fx-label">Minutos estudados (auto)</label>
          <input type="number" min={0} className="fx-input" value={todayMetric.minutes} disabled={dis}
            onChange={function(e) { updateToday({ minutes: Math.max(0, parseInt(e.target.value, 10) || 0) }); }}
            style={{ fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }} />

          <label className="fx-label">Páginas lidas</label>
          <input type="number" min={0} className="fx-input" value={todayMetric.pages} disabled={dis}
            onChange={function(e) { updateToday({ pages: Math.max(0, parseInt(e.target.value, 10) || 0) }); }}
            style={{ fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }} />

          <label className="fx-label">Matéria estudada</label>
          <input className="fx-input" value={todayMetric.subject} disabled={dis} placeholder="Ex: Cálculo, Física…"
            onChange={function(e) { updateToday({ subject: e.target.value }); }} style={{ marginBottom: 18 }} />

          <p style={{ margin: "0 0 4px", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.4)", letterSpacing: 0.6 }}>ÚLTIMOS 7 DIAS</p>
          <div className="fx-chart">
            {week.map(function(d) {
              var minH = Math.round((d.minutes / maxMin) * 100);
              var pgH = Math.round((d.pages / maxPages) * 100);
              return (
                <div key={d.day_key} className={"fx-col" + (d.day_key === bestKey && d.minutes > 0 ? " best" : "")} title={d.minutes + " min · " + d.pages + " pág"}>
                  <div className="fx-bars">
                    <div className="fx-bar" style={{ height: (d.minutes > 0 ? Math.max(4, minH) : 0) + "%", background: CYAN, boxShadow: "0 0 8px " + CYAN + "55" }} />
                    <div className="fx-bar" style={{ height: (d.pages > 0 ? Math.max(4, pgH) : 0) + "%", background: AMBER, boxShadow: "0 0 8px " + AMBER + "55" }} />
                  </div>
                  <span className="fx-daylbl" style={d.day_key === today ? { color: CYAN } : null}>{weekdayShort(d.day_key)}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 8 }}>
            <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: CYAN }} /> Minutos
            </span>
            <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: AMBER }} /> Páginas
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
