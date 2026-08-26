/** Micro-interações partilhadas — feedback táctil, inputs, botões de linha, gestos. */
export var MICRO_CSS = [
  "@keyframes uiPop{0%{transform:scale(.88);opacity:.6}55%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}",
  "@keyframes uiSlideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}",
  "@keyframes uiSlideLeft{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}",
  "@keyframes uiSlideRight{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}",
  "@keyframes uiPulse{0%,100%{opacity:1}50%{opacity:.45}}",
  "@keyframes uiGlow{0%,100%{opacity:.35}50%{opacity:.7}}",
  "@keyframes uiFlash{0%{opacity:0}15%{opacity:1}100%{opacity:0}}",
  ".ui-tap{transition:transform var(--dur-fast) var(--ease),opacity var(--dur-fast) var(--ease),color var(--dur) var(--ease),border-color var(--dur) var(--ease),background var(--dur) var(--ease)}",
  ".ui-tap:active:not(:disabled){transform:scale(.96)}",
  ".ui-line-btn{background:none;border:none;border-bottom:1px solid rgba(255,255,255,.16);color:#A0A0A8;padding:8px 2px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.35px;transition:color var(--dur) var(--ease),border-color var(--dur) var(--ease),transform var(--dur-fast) var(--ease),opacity var(--dur-fast) var(--ease)}",
  ".ui-line-btn:hover{color:#EDEDEF;border-bottom-color:#EDEDEF}",
  ".ui-line-btn:active{transform:translateY(1px);opacity:.7}",
  ".ui-in{width:100%;box-sizing:border-box;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.12);color:#EDEDEF;outline:none;transition:border-color var(--dur) var(--ease),padding-left var(--dur) var(--ease)}",
  ".ui-in:focus{border-bottom-color:rgba(255,255,255,.45);padding-left:4px}",
  ".ui-in::placeholder{color:#6E6E76}",
  ".ui-pop.is-on{animation:uiPop .38s var(--ease)}",
  ".ui-fade-in{animation:uiSlideUp var(--dur-slow) var(--ease) both}",
  ".ui-slide-left{animation:uiSlideLeft var(--dur-slow) var(--ease) both}",
  ".ui-slide-right{animation:uiSlideRight var(--dur-slow) var(--ease) both}",
].join("");

/** Gesto horizontal — onSwipeLeft (dedo ←), onSwipeRight (dedo →). */
export function attachSwipe(el, handlers, opts) {
  if (!el || !handlers) return function() {};
  opts = opts || {};
  var threshold = opts.threshold || 52;
  var maxVertical = opts.maxVertical || 72;
  var startX = 0;
  var startY = 0;
  var tracking = false;

  function onDown(e) {
    if (opts.filter && !opts.filter(e)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    tracking = true;
  }

  function onUp(e) {
    if (!tracking) return;
    tracking = false;
    var dx = e.clientX - startX;
    var dy = e.clientY - startY;
    if (Math.abs(dx) < threshold) return;
    if (Math.abs(dy) > maxVertical && Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0 && handlers.onSwipeLeft) handlers.onSwipeLeft();
    else if (dx > 0 && handlers.onSwipeRight) handlers.onSwipeRight();
  }

  function onCancel() { tracking = false; }

  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onCancel);
  return function() {
    el.removeEventListener("pointerdown", onDown);
    el.removeEventListener("pointerup", onUp);
    el.removeEventListener("pointercancel", onCancel);
  };
}
