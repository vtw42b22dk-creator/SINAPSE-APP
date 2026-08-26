/**
 * Tema único: dark minimalista, sem neons.
 * Base neutra em cinzentos; cor apenas onde tem significado (positivo/negativo/aviso).
 */

export var COLORS = {
  bg: "#070708",
  bgSoft: "#070708",
  surface: "transparent",
  surfaceHi: "#1C1C20",
  border: "#26262A",
  borderSoft: "rgba(255,255,255,0.07)",
  borderHi: "rgba(255,255,255,0.14)",
  text: "#EDEDEF",
  muted: "#A0A0A8",
  faint: "#6E6E76",
  accent: "#E6E6E9",
  positive: "#8FB39B",
  negative: "#C08C8C",
  warning: "#C4A57C",
};

/** Paleta neutra para o utilizador escolher (projetos, notas, eventos). */
export var PALETTE = ["#E6E6E9", "#A0A0A8", "#8FB39B", "#C4A57C", "#C08C8C", "#8FA8C4", "#6E6E76"];

/** Cor decorativa por módulo — estilo wishlist (ponto + glow subtil). */
export var MODULE_COLORS = {
  calendar: "#8FA8C4",
  focus: "#C4A57C",
  tasks: "#8FB39B",
  journal: "#C08C8C",
  projects: "#A0A0A8",
  wishlist: "#C4A57C",
  finance: "#A0A0A8",
  hub: "#E6E6E9",
  auth: "#8FA8C4",
};

export function moduleFromPath(path) {
  if (!path || path === "/") return "hub";
  if (path.indexOf("/calendar") === 0) return "calendar";
  if (path.indexOf("/focus") === 0) return "focus";
  if (path.indexOf("/tasks") === 0) return "tasks";
  if (path.indexOf("/journal") === 0) return "journal";
  if (path.indexOf("/projects") === 0) return "projects";
  if (path.indexOf("/wishlist") === 0) return "wishlist";
  if (path.indexOf("/finance") === 0) return "finance";
  return "hub";
}

export function moduleColor(id) {
  return MODULE_COLORS[id] || COLORS.accent;
}

/** Fundo de glow: hex + alpha em 8 dígitos (#RRGGBBAA). */
export function moduleGlow(hex, alphaHex) {
  var c = hex || COLORS.accent;
  if (c.charAt(0) !== "#") return "rgba(255,255,255,0.06)";
  return c.length === 7 ? c + (alphaHex || "18") : c;
}

export var MODULE_GLOW_CSS = ".mod-glow{position:fixed;width:min(520px,70vw);height:min(520px,70vw);border-radius:50%;pointer-events:none;filter:blur(80px);opacity:.52;z-index:0;transition:background 1s var(--ease)}";

/** Regras partilhadas — acentos com var(--mc) em toda a app (base B&W). */
export var MODULE_ACCENT_CSS = [
  ":root{--mc:var(--accent,#E6E6E9)}",
  ".ui-line-btn:hover{color:var(--mc);border-bottom-color:var(--mc)}",
  ".ui-in:focus{border-bottom-color:color-mix(in srgb,var(--mc) 70%,#fff 30%);padding-left:4px}",
  ".mod-accent{color:var(--mc)!important}",
  ".mod-accent-bd{border-bottom-color:var(--mc)!important;color:var(--mc)!important}",
  ".ch-mode.is-on{color:var(--mc)!important;border-bottom-color:var(--mc)!important}",
  ".ch-btn--accent{color:var(--mc)!important;border-color:color-mix(in srgb,var(--mc) 40%,transparent)!important;background:color-mix(in srgb,var(--mc) 10%,transparent)!important}",
  ".ch-now,.ch-wk-now{background:var(--mc)!important;box-shadow:0 0 12px color-mix(in srgb,var(--mc) 50%,transparent)!important}",
  ".ch-now-dot,.ch-wk-now-dot{background:var(--mc)!important}",
  ".ch-day-num{color:color-mix(in srgb,var(--mc) 88%,#fff 12%)!important}",
  ".ch-rail-day.is-on,.ch-rail-day.is-today .ch-rail-n{color:var(--mc)!important}",
  ".ch-rail-day.is-on::after,.ch-rail-day.is-on .ch-rail-dot{background:var(--mc)!important}",
  ".ch-wk-strip-cell.is-on::after{background:var(--mc)!important}",
  ".ch-wk-strip-cell.is-on .ch-wk-strip-num,.ch-wk-strip-cell.is-today .ch-wk-strip-num{color:var(--mc)!important}",
  ".ch-month-cell.is-on::after,.ch-month-cell.is-today{color:var(--mc)!important}",
  ".ch-fab{color:var(--mc)!important;border-bottom-color:var(--mc)!important}",
  ".ch-save{border-bottom-color:var(--mc)!important;color:var(--mc)!important}",
  ".tk-check.on{background:var(--mc)!important;border-color:var(--mc)!important}",
  ".tk-new-btn,.tk-save{border-bottom-color:var(--mc)!important;color:var(--mc)!important}",
  ".fx-nav.on{color:var(--mc)!important}",
  ".fx-nav.on::before{background:var(--mc)!important}",
  ".fx-mode.on,.fx-stybtn.on,.fx-tab.on{color:var(--mc)!important;border-bottom-color:var(--mc)!important}",
  ".ag-kicker{color:var(--mc)!important}",
  ".ag-field input:focus{border-bottom-color:var(--mc)!important}",
  ".ag-go{border-bottom-color:var(--mc)!important;color:var(--mc)!important}",
  ".fin-btn[style*='--fin-fg']{transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".pj-new{border-bottom-color:var(--mc)!important;color:var(--mc)!important}",
  ".skel-accent{background:color-mix(in srgb,var(--mc) 38%,transparent)!important}",
  ".skel-label{color:color-mix(in srgb,var(--mc) 55%,#6E6E76 45%)!important}",
  ".skel-rule{background:color-mix(in srgb,var(--mc) 22%,transparent)!important}",
  ".pw-link.on::before{background:var(--lc,var(--mc))!important;opacity:1!important}",
  ".pw-link.on .pw-lic{background:color-mix(in srgb,var(--lc,var(--mc)) 18%,transparent)!important;color:var(--lc,var(--mc))!important}",
].join("");

/** Sombras discretas — nunca coloridas. */
export var SHADOW = {
  sm: "0 1px 2px rgba(0,0,0,0.4)",
  md: "0 4px 16px rgba(0,0,0,0.45)",
  lg: "0 12px 32px rgba(0,0,0,0.5)",
};

export var RADIUS = { sm: 0, md: 0, lg: 0, xl: 0 };

/** Hex + alpha (0-1) em rgba, para sobreposições subtis. */
export function alpha(hex, a) {
  var h = String(hex).replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  var n = parseInt(h, 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}

/** Curvas e durações partilhadas — motion coerente em toda a app. */
export var MOTION = {
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
  fast: "140ms",
  base: "220ms",
  slow: "380ms",
};
