/** Animação de entrada alinhada com Calendário (calIn) e Tarefas (taskIn). */
export var MODULE_ENTRY_CSS =
  "@keyframes modIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}" +
  ".mod-main{animation:modIn .4s cubic-bezier(0.16,1,0.3,1) both}";

export var DOC_RECENT_CSS =
  "@keyframes docRecentPulse{0%{background:rgba(255,184,0,0.14)}100%{background:transparent}}" +
  ".doc-recent-row{animation:docRecentPulse 1.2s ease}";
