import { MODULE_COLORS } from "./theme";

export var VINTED_ACCENT = MODULE_COLORS.vinted;

export var VINTED_SECTIONS = [
  { id: "overview", path: "/vinted", label: "Visão geral", desc: "Semana, o que mudou e o estado do bot", icon: "◈" },
  { id: "mensagens", path: "/vinted/mensagens", label: "Mensagens", desc: "Vendedor, fixar e respostas rápidas", icon: "◎" },
  { id: "venda", path: "/vinted/venda", label: "Modo venda", desc: "Publicar e acabar rascunhos", icon: "◇" },
  { id: "analise", path: "/vinted/analise", label: "Análise", desc: "Idade dos anúncios e envios", icon: "▦" },
  { id: "compra", path: "/vinted/compra", label: "Modo compra", desc: "Caça e alertas no Telegram", icon: "✦" },
];

export function vintedSectionFromPath(pathname) {
  var p = String(pathname || "");
  if (p === "/vinted" || p === "/vinted/") return "overview";
  for (var i = 1; i < VINTED_SECTIONS.length; i++) {
    if (p.indexOf(VINTED_SECTIONS[i].path) === 0) return VINTED_SECTIONS[i].id;
  }
  return "overview";
}

export function eur(v) {
  return (Number(v) || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

export function haQuanto(ts, agora) {
  var n = Number(ts);
  if (!n || !agora) return "";
  var d = agora - n;
  if (d < 60000) return "agora";
  if (d < 3600000) return Math.floor(d / 60000) + " min";
  if (d < 86400000) return Math.floor(d / 3600000) + " h";
  return new Date(n).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

export function corIdade(cor) {
  if (cor === "vermelho") return "#C08C8C";
  if (cor === "amarelo") return "#C4A57C";
  if (cor === "verde") return "#8FB39B";
  return "#6E6A64";
}
