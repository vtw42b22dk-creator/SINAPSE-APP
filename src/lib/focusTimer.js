/* eslint-disable no-empty */
/** Motor de cronómetro persistente — continua a contar ao mudar de aba/módulo. */

var TIMER_KEY = "focus-timer-engine-v2";
var listeners = [];
var tickTimer = null;

var DEFAULT_STATE = {
  projectId: null,
  modeId: "pomodoro",
  customFocus: 30,
  customBreak: 10,
  phase: "focus",
  running: false,
  endAt: null,
  secsLeft: 25 * 60,
  clockStyle: "digital",
  focusStartedAt: null,
};

function readRaw() {
  try {
    var raw = localStorage.getItem(TIMER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function writeRaw(state) {
  try {
    localStorage.setItem(TIMER_KEY, JSON.stringify(state));
  } catch (e) {}
}

function notify() {
  listeners.forEach(function(fn) {
    try { fn(getState()); } catch (e) {}
  });
}

function modeFocusMin(state) {
  if (state.modeId === "custom") return Math.max(1, state.customFocus || 1);
  var presets = {
    pomodoro: 25,
    exame: 45,
    deep: 90,
    sprint: 15,
  };
  return presets[state.modeId] || 25;
}

function modeBreakMin(state) {
  if (state.modeId === "custom") return Math.max(1, state.customBreak || 1);
  var presets = {
    pomodoro: 5,
    exame: 15,
    deep: 20,
    sprint: 3,
  };
  return presets[state.modeId] || 5;
}

function phaseTotalSecs(state) {
  return (state.phase === "focus" ? modeFocusMin(state) : modeBreakMin(state)) * 60;
}

function syncSecsLeft(state) {
  if (state.running && state.endAt) {
    state.secsLeft = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
    if (state.secsLeft <= 0) state.secsLeft = 0;
  }
  return state;
}

export function getState() {
  var s = readRaw() || Object.assign({}, DEFAULT_STATE);
  return syncSecsLeft(s);
}

export function subscribe(fn) {
  listeners.push(fn);
  return function() {
    listeners = listeners.filter(function(x) { return x !== fn; });
  };
}

export function setClockStyle(style) {
  var s = getState();
  s.clockStyle = style || "digital";
  writeRaw(s);
  notify();
}

export function configureTimer(patch) {
  var s = getState();
  Object.assign(s, patch || {});
  if (!s.running) {
    var total = phaseTotalSecs(s);
    s.secsLeft = total;
    s.endAt = null;
  }
  writeRaw(s);
  notify();
}

export function bindProject(projectId) {
  var s = getState();
  if (s.projectId === projectId) return s;
  s.projectId = projectId;
  if (!s.running) {
    s.secsLeft = phaseTotalSecs(s);
    s.endAt = null;
  }
  writeRaw(s);
  notify();
  return s;
}

/** Minutos de foco decorridos na fase actual (para creditar em pausa/reset). */
export function elapsedFocusMinutes(state) {
  state = state || getState();
  if (state.phase !== "focus") return 0;
  var total = phaseTotalSecs(state);
  var left = state.running && state.endAt
    ? Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000))
    : state.secsLeft;
  var elapsed = Math.max(0, total - left);
  return Math.floor(elapsed / 60);
}

export function startTimer() {
  var s = getState();
  s.running = true;
  s.endAt = Date.now() + s.secsLeft * 1000;
  if (s.phase === "focus" && !s.focusStartedAt) s.focusStartedAt = Date.now();
  writeRaw(s);
  notify();
  ensureTick();
}

export function pauseTimer() {
  var s = syncSecsLeft(getState());
  var credit = elapsedFocusMinutes(s);
  s.running = false;
  s.endAt = null;
  s.focusStartedAt = null;
  writeRaw(s);
  notify();
  return credit;
}

export function resetTimer() {
  var s = syncSecsLeft(getState());
  var credit = s.phase === "focus" ? elapsedFocusMinutes(s) : 0;
  s.running = false;
  s.phase = "focus";
  s.endAt = null;
  s.focusStartedAt = null;
  s.secsLeft = modeFocusMin(s) * 60;
  writeRaw(s);
  notify();
  return credit;
}

export function completePhase(onFocusComplete) {
  var s = syncSecsLeft(getState());
  if (s.phase === "focus") {
    if (onFocusComplete) onFocusComplete(modeFocusMin(s));
    s.phase = "break";
    s.secsLeft = modeBreakMin(s) * 60;
    s.focusStartedAt = null;
  } else {
    s.phase = "focus";
    s.secsLeft = modeFocusMin(s) * 60;
    s.focusStartedAt = Date.now();
  }
  s.running = true;
  s.endAt = Date.now() + s.secsLeft * 1000;
  if (s.phase === "focus") s.focusStartedAt = Date.now();
  writeRaw(s);
  notify();
  return s;
}

var onFocusCredit = null;
var onPhaseChange = null;

export function setTimerHandlers(handlers) {
  handlers = handlers || {};
  onFocusCredit = handlers.onFocusCredit || null;
  onPhaseChange = handlers.onPhaseChange || null;
}

function tickOnce() {
  var s = getState();
  if (!s.running) return;
  syncSecsLeft(s);
  if (s.secsLeft <= 0) {
    completePhase(onFocusCredit);
    if (onPhaseChange) onPhaseChange(getState());
    return "phase_done";
  }
  writeRaw(s);
  notify();
  return null;
}

function ensureTick() {
  if (tickTimer) return;
  tickTimer = setInterval(function() {
    var s = getState();
    if (!s.running) return;
    var result = tickOnce();
    if (result === "phase_done") {
      // handled by React listener via subscribe + phase_done event
    }
  }, 1000);
}

export function getModePresets() {
  return [
    { id: "pomodoro", label: "Pomodoro", focus: 25, break: 5 },
    { id: "exame", label: "Modo Exame", focus: 45, break: 15 },
    { id: "deep", label: "Deep Work", focus: 90, break: 20 },
    { id: "sprint", label: "Sprint", focus: 15, break: 3 },
    { id: "custom", label: "Custom", focus: 30, break: 10 },
  ];
}

export function fmtClock(total) {
  var m = Math.floor(total / 60);
  var s = total % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

if (typeof window !== "undefined") {
  ensureTick();
}
