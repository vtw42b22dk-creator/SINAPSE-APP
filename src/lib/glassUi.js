/**
 * Sistema visual "vidro + halo" — fundação partilhada pelo redesign do
 * Estúdio de Foco e do Diário. Nomes de classe novos (não usados em
 * global.css) para não colidir com os resets !important já existentes
 * para as classes fx- e jr- — e nenhum box-shadow (global.css desliga-o
 * em todo o lado), por isso todo o glow usa filter:blur()/drop-shadow().
 */
import { alpha } from "./theme";

export var GLASS_CSS = [
  "@keyframes glassIn{from{opacity:0;transform:translateY(16px) scale(.985)}to{opacity:1;transform:none}}",
  "@keyframes haloBreathe{0%,100%{transform:scale(1);opacity:.55}50%{transform:scale(1.08);opacity:.95}}",
  "@keyframes haloBreatheSlow{0%,100%{transform:scale(1);opacity:.38}50%{transform:scale(1.045);opacity:.6}}",
  "@keyframes glowPulse{0%,100%{filter:drop-shadow(0 0 14px var(--glow,rgba(237,237,239,.35)))}50%{filter:drop-shadow(0 0 28px var(--glow,rgba(237,237,239,.6)))}}",
  "@keyframes chipPop{0%{transform:scale(.86);opacity:.4}60%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}",
  "@keyframes driftA{0%,100%{transform:translate(0,0)}50%{transform:translate(2%,-3%)}}",
  "@keyframes driftB{0%,100%{transform:translate(0,0)}50%{transform:translate(-3%,2%)}}",

  ".glass{position:relative;background:linear-gradient(165deg,rgba(255,255,255,.06),rgba(255,255,255,.014) 65%);border:1px solid rgba(255,255,255,.09);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-radius:var(--radius-xl)}",
  ".glass-flat{background:linear-gradient(165deg,rgba(255,255,255,.045),rgba(255,255,255,.01));border:1px solid rgba(255,255,255,.07);border-radius:var(--radius-lg)}",
  ".glass-capsule{background:rgba(12,12,15,.6);border:1px solid rgba(255,255,255,.09);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:26px}",

  ".glow-orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(64px)}",

  ".seg{position:relative;display:inline-flex;gap:2px;padding:4px;border-radius:999px;background:rgba(255,255,255,.032);border:1px solid rgba(255,255,255,.08)}",
  ".seg-thumb{position:absolute;top:4px;bottom:4px;left:4px;border-radius:999px;transition:transform var(--dur-slow) var(--ease),background 1s var(--ease);z-index:0;pointer-events:none}",
  ".seg button{position:relative;z-index:1;border:none;background:transparent;cursor:pointer;font-family:'JetBrains Mono',monospace;white-space:nowrap;transition:color var(--dur) var(--ease)}",

  ".glow-btn{position:relative;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:transform var(--dur-fast) var(--ease),filter var(--dur) var(--ease),opacity var(--dur) var(--ease),background var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".glow-btn:hover:not(:disabled){transform:translateY(-1px)}",
  ".glow-btn:active:not(:disabled){transform:translateY(0) scale(.96)}",
  ".glow-btn:disabled{opacity:.4;cursor:not-allowed}",

  ".glass-in{animation:glassIn var(--dur-slow) var(--ease) both}",
  "@media(prefers-reduced-motion:reduce){.glow-orb{animation:none!important}.glass-in{animation:none!important}}",
].join("");

/** drop-shadow (nunca box-shadow — global.css desliga-o) tonalizado por hex+alpha. */
export function glowFilter(hex, blur, a) {
  return "drop-shadow(0 0 " + (blur == null ? 22 : blur) + "px " + alpha(hex, a == null ? 0.45 : a) + ")";
}

/** Estilo do "thumb" deslizante de um controlo segmentado com N itens de largura igual. */
export function segThumbStyle(index, count, color) {
  return {
    width: "calc((100% - 8px)/" + count + ")",
    transform: "translateX(calc(" + index + " * 100%))",
    background: "color-mix(in srgb, " + (color || "var(--mc)") + " 22%, transparent)",
    border: "1px solid color-mix(in srgb, " + (color || "var(--mc)") + " 45%, transparent)",
  };
}
