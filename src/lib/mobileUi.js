/** Breakpoint partilhado — telemóvel vs desktop. */
export var MOBILE_BP = 720;

/** Tipografia e inputs maiores em ecrãs estreitos (todos os módulos). */
export var MOBILE_GLOBAL_CSS = [
  "@media(max-width:719px){",
  "html{-webkit-text-size-adjust:100%}",
  "body{padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}",
  ".mod-main header h1,.mod-h1{font-size:1.2rem!important;letter-spacing:.6px!important}",
  ".mod-main input,.mod-main select,.mod-main textarea{font-size:1rem!important;min-height:44px}",
  ".mod-main button:not(.mod-icon-btn){font-size:0.92rem!important;min-height:42px}",
  ".mod-lbl{font-size:0.78rem!important;letter-spacing:.5px!important}",
  ".mod-stat{font-size:0.88rem!important}",
  "[data-scrollable]{-webkit-overflow-scrolling:touch}",
  "}",
  "@media(pointer:coarse){",
  "button,a,[role='button']{touch-action:manipulation}",
  "}",
].join("");

/** Devolve tamanho desktop ou mobile consoante o viewport. */
export function fs(isMobile, desktop, mobile) {
  return isMobile ? mobile : desktop;
}
