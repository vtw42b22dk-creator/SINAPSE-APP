/**
 * Tema único: dark minimalista, sem neons.
 * Base neutra em cinzentos; cor apenas onde tem significado (positivo/negativo/aviso).
 */

export var COLORS = {
  bg: "#09090B",
  bgSoft: "#0E0E10",
  surface: "#141416",
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

/** Sombras discretas — nunca coloridas. */
export var SHADOW = {
  sm: "0 1px 2px rgba(0,0,0,0.4)",
  md: "0 4px 16px rgba(0,0,0,0.45)",
  lg: "0 12px 32px rgba(0,0,0,0.5)",
};

export var RADIUS = { sm: 8, md: 12, lg: 16, xl: 20 };

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
