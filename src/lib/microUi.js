/** Micro-interações partilhadas — feedback táctil, inputs, botões de linha. */
export var MICRO_CSS = [
  "@keyframes uiPop{0%{transform:scale(.88);opacity:.6}55%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}",
  "@keyframes uiSlideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}",
  "@keyframes uiPulse{0%,100%{opacity:1}50%{opacity:.45}}",
  "@keyframes uiGlow{0%,100%{opacity:.35}50%{opacity:.7}}",
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
].join("");
