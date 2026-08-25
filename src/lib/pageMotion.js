/** Animação de entrada alinhada em todos os módulos. */
export var MODULE_ENTRY_CSS =
  "@keyframes modIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}" +
  ".mod-main{animation:modIn var(--dur-slow,480ms) var(--ease,cubic-bezier(0.22,1,0.36,1)) both}";

export var DOC_RECENT_CSS =
  "@keyframes docRecentPulse{0%{background:rgba(196,165,124,0.14)}100%{background:transparent}}" +
  ".doc-recent-row{animation:docRecentPulse 1.2s ease}";
