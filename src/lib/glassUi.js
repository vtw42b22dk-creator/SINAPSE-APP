/**
 * Apple Liquid Glass + Spatial UI (visionOS)
 * — backdrop-blur para desfocar o fundo
 * — inner shadows (claro no topo / escuro em baixo) para vidro espesso
 * — borda com gradiente subtil para reflexo nas arestas
 *
 * Classes: .glass | .glass-flat | .glass-capsule | .glass-soft | .liquid-glass
 */
import { alpha } from "./theme";

/** Receita partilhada: inset claro + escuro + halo interior. */
export var GLASS_INSET =
  "inset 0 1px 0 rgba(255,255,255,.55)," +
  "inset 0 -1px 1px rgba(0,0,0,.32)," +
  "inset 0 0 28px rgba(255,255,255,.045)";

export var GLASS_INSET_SOFT =
  "inset 0 1px 0 rgba(255,255,255,.38)," +
  "inset 0 -1px 1px rgba(0,0,0,.22)," +
  "inset 0 0 18px rgba(255,255,255,.03)";

export var GLASS_CSS = [
  "@keyframes glassIn{from{opacity:0;transform:translateY(16px) scale(.985)}to{opacity:1;transform:none}}",
  "@keyframes haloBreathe{0%,100%{transform:scale(1);opacity:.55}50%{transform:scale(1.08);opacity:.95}}",
  "@keyframes haloBreatheSlow{0%,100%{transform:scale(1);opacity:.38}50%{transform:scale(1.045);opacity:.6}}",
  "@keyframes glowPulse{0%,100%{filter:drop-shadow(0 0 14px var(--glow,rgba(237,237,239,.35)))}50%{filter:drop-shadow(0 0 28px var(--glow,rgba(237,237,239,.6)))}}",
  "@keyframes chipPop{0%{transform:scale(.86);opacity:.4}60%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}",
  "@keyframes driftA{0%,100%{transform:translate(0,0)}50%{transform:translate(2%,-3%)}}",
  "@keyframes driftB{0%,100%{transform:translate(0,0)}50%{transform:translate(-3%,2%)}}",

  /* ── Liquid Glass core ── */
  ".glass,.glass-flat,.glass-capsule,.glass-soft,.liquid-glass{" +
    "position:relative;" +
    "isolation:isolate;" +
    "background:var(--glass-fill,rgba(255,255,255,.1));" +
    "backdrop-filter:blur(var(--glass-blur,48px)) saturate(var(--glass-sat,1.9));" +
    "-webkit-backdrop-filter:blur(var(--glass-blur,48px)) saturate(var(--glass-sat,1.9));" +
    "border:1px solid transparent;" +
    "background-clip:padding-box;" +
    "box-shadow:var(--glass-inset," + GLASS_INSET + "),var(--glass-float,0 18px 48px rgba(0,0,0,.4));" +
    "overflow:hidden;" +
  "}",

  /* Reflexo nas arestas (borda com gradiente) */
  ".glass::before,.glass-flat::before,.glass-capsule::before,.glass-soft::before,.liquid-glass::before{" +
    "content:'';" +
    "position:absolute;" +
    "inset:0;" +
    "border-radius:inherit;" +
    "padding:1px;" +
    "background:var(--glass-rim," +
      "linear-gradient(145deg," +
        "rgba(255,255,255,.62) 0%," +
        "rgba(255,255,255,.14) 28%," +
        "rgba(255,255,255,.04) 48%," +
        "rgba(255,255,255,.22) 72%," +
        "rgba(255,255,255,.08) 100%)" +
    ");" +
    "-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);" +
    "-webkit-mask-composite:xor;" +
    "mask-composite:exclude;" +
    "pointer-events:none;" +
    "z-index:2;" +
  "}",

  /* Sheen superior (vidro espesso) */
  ".glass::after,.glass-capsule::after,.liquid-glass::after{" +
    "content:'';" +
    "position:absolute;" +
    "inset:1px 1px auto 1px;" +
    "height:42%;" +
    "border-radius:inherit;" +
    "background:linear-gradient(180deg,rgba(255,255,255,.14),transparent 70%);" +
    "pointer-events:none;" +
    "z-index:1;" +
    "opacity:.85;" +
  "}",

  ".glass{border-radius:var(--radius-xl);--glass-blur:42px;--glass-sat:1.9}",
  ".glass-flat{" +
    "border-radius:var(--radius-lg);" +
    "--glass-blur:28px;" +
    "--glass-sat:1.6;" +
    "--glass-fill:linear-gradient(165deg,rgba(255,255,255,.06),rgba(255,255,255,.018));" +
    "background:linear-gradient(165deg,rgba(255,255,255,.06),rgba(255,255,255,.018));" +
    "--glass-inset:" + GLASS_INSET_SOFT + ";" +
  "}",
  ".glass-flat::after{display:none}",
  ".glass-capsule{" +
    "border-radius:26px;" +
    "--glass-blur:36px;" +
    "--glass-sat:1.85;" +
    "--glass-fill:rgba(255,255,255,.05);" +
  "}",
  ".glass-soft{" +
    "border-radius:var(--radius-md);" +
    "--glass-blur:24px;" +
    "--glass-sat:1.5;" +
    "--glass-fill:rgba(255,255,255,.04);" +
    "--glass-inset:" + GLASS_INSET_SOFT + ";" +
  "}",
  ".glass-soft::after{display:none}",
  ".liquid-glass{border-radius:var(--radius-xl)}",

  ".glow-orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(64px)}",

  ".seg{position:relative;display:inline-flex;gap:2px;padding:4px;border-radius:999px;background:rgba(255,255,255,.032);border:1px solid transparent;backdrop-filter:blur(20px) saturate(1.5);-webkit-backdrop-filter:blur(20px) saturate(1.5);box-shadow:" + GLASS_INSET_SOFT + "}",
  ".seg::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(145deg,rgba(255,255,255,.4),rgba(255,255,255,.06) 45%,rgba(255,255,255,.16));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}",
  ".seg-thumb{position:absolute;top:4px;bottom:4px;left:4px;border-radius:999px;transition:transform var(--dur-slow) var(--ease),background 1s var(--ease);z-index:0;pointer-events:none}",
  ".seg button{position:relative;z-index:1;border:none;background:transparent;cursor:pointer;font-family:'Manrope',sans-serif;white-space:nowrap;transition:color var(--dur) var(--ease)}",

  ".glow-btn{position:relative;cursor:pointer;font-family:'Manrope',sans-serif;transition:transform var(--dur-fast) var(--ease),filter var(--dur) var(--ease),opacity var(--dur) var(--ease),background var(--dur) var(--ease),border-color var(--dur) var(--ease)}",
  ".glow-btn:hover:not(:disabled){transform:translateY(-1px)}",
  ".glow-btn:active:not(:disabled){transform:translateY(0) scale(.96)}",
  ".glow-btn:disabled{opacity:.4;cursor:not-allowed}",

  ".glass-in{animation:glassIn var(--dur-slow) var(--ease) both}",
  "@media(prefers-reduced-motion:reduce){.glow-orb{animation:none!important}.glass-in{animation:none!important}}",
].join("");

/** drop-shadow tonalizado por hex+alpha (para orbs / glow externo). */
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
