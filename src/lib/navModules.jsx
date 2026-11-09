/* eslint-disable no-unused-vars, no-empty */
import { MODULE_COLORS } from "./theme";

export var ORDER_KEY = "sinapse-hub-order-v1";
export var HIDDEN_KEY = "sinapse-hub-hidden-v1";
export var NAV_EVENT = "sinapse-nav-change";

export function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="8" y="12" width="32" height="28" stroke="currentColor" strokeWidth="2.2" />
      <path d="M8 20h32M16 8v8M32 8v8" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}
export function TasksIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M14 24 L21 31 L36 14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
    </svg>
  );
}
export function WishlistIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M14 12H34L32 30H16L14 12Z" stroke="currentColor" strokeWidth="2.2" />
      <path d="M18 36h12" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}
export function FinanceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M10 34 L20 22 L28 28 L38 14" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}
export function VintedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M14 10 H30 L38 18 V38 H14 Z" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="22" cy="20" r="2.2" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}
export function JournalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M12 8H36V40H12Z" stroke="currentColor" strokeWidth="2.2" />
      <path d="M18 16H30M18 24H30M18 32H26" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
export function FocusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="26" r="13" stroke="currentColor" strokeWidth="2.2" />
      <path d="M24 26 L24 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
    </svg>
  );
}
export function ProjectsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="8" y="10" width="14" height="12" stroke="currentColor" strokeWidth="2.2" />
      <rect x="26" y="10" width="14" height="12" stroke="currentColor" strokeWidth="2.2" />
      <rect x="8" y="26" width="14" height="12" stroke="currentColor" strokeWidth="2.2" />
      <rect x="26" y="26" width="14" height="12" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}
export function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M8 22 L24 10 L40 22 V40 H30 V28 H18 V40 H8Z" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

export var MODULES = [
  { id: "calendar", name: "Calendário", desc: "Visualiza e organiza o teu tempo", Icon: CalendarIcon, path: "/calendar", color: MODULE_COLORS.calendar },
  { id: "focus", name: "Estúdio de Foco", desc: "Sessões de estudo, ideias e métricas diárias", Icon: FocusIcon, path: "/focus", color: MODULE_COLORS.focus },
  { id: "tasks", name: "Tarefas", desc: "Captura, prioriza, conquista", Icon: TasksIcon, path: "/tasks", color: MODULE_COLORS.tasks },
  { id: "journal", name: "Notas", desc: "Escreve, organiza e volta a encontrar", Icon: JournalIcon, path: "/journal", color: MODULE_COLORS.journal },
  { id: "projects", name: "Projetos", desc: "Workspaces modulares com finanças, notas e sinapses", Icon: ProjectsIcon, path: "/projects", color: MODULE_COLORS.projects },
  { id: "wishlist", name: "Wishlist", desc: "Lista o que queres comprar ou fazer", Icon: WishlistIcon, path: "/wishlist", color: MODULE_COLORS.wishlist },
  { id: "finance", name: "Financeiro", desc: "Saldo vivo, sequências e relatório do mês", Icon: FinanceIcon, path: "/finance", color: MODULE_COLORS.finance },
  { id: "vinted", name: "Vinted", desc: "A Central, no mesmo sítio: semana, anúncios, vendas e mensagens", Icon: VintedIcon, path: "/vinted", color: MODULE_COLORS.vinted },
];

function emitNav() {
  try { window.dispatchEvent(new Event(NAV_EVENT)); } catch (e) {}
}

export function loadHubOrder() {
  try {
    var raw = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
    if (!Array.isArray(raw) || !raw.length) return MODULES.slice();
    var map = {};
    MODULES.forEach(function(m) { map[m.id] = m; });
    var out = [];
    raw.forEach(function(id) {
      if (map[id]) { out.push(map[id]); delete map[id]; }
    });
    MODULES.forEach(function(m) { if (map[m.id]) out.push(m); });
    return out;
  } catch (e) {
    return MODULES.slice();
  }
}

export function saveHubOrder(list) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(list.map(function(m) { return m.id; })));
  } catch (e) {}
  emitNav();
}

export function loadHidden() {
  try {
    var raw = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    var known = {};
    MODULES.forEach(function(m) { known[m.id] = true; });
    return raw.filter(function(id) { return known[id]; });
  } catch (e) {
    return [];
  }
}

export function saveHidden(ids) {
  try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids)); } catch (e) {}
  emitNav();
}

export function visibleModules() {
  var hidden = loadHidden();
  var set = {};
  hidden.forEach(function(id) { set[id] = true; });
  return loadHubOrder().filter(function(m) { return !set[m.id]; });
}

export function navActive(path, pathname) {
  if (path === "/") return pathname === "/";
  if (path === "/projects") {
    return pathname.indexOf("/projects") === 0 || pathname.indexOf("/synapse") === 0;
  }
  if (path === "/vinted") return pathname.indexOf("/vinted") === 0;
  return pathname === path || pathname.indexOf(path + "/") === 0;
}
