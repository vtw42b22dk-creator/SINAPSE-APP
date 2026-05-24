export var CHANGELOG_VERSION = "2026-05-19-v2";
var SEEN_KEY = "sinapse-changelog-seen";

export function hasUnreadChangelog() {
  try {
    return localStorage.getItem(SEEN_KEY) !== CHANGELOG_VERSION;
  } catch (e) {
    return true;
  }
}

export function markChangelogSeen() {
  try {
    localStorage.setItem(SEEN_KEY, CHANGELOG_VERSION);
  } catch (e) {}
}

export var CHANGELOG = {
  version: CHANGELOG_VERSION,
  title: "Novidades do ecossistema",
  subtitle: "Tudo o que entrou hoje — num só sítio",
  dateLabel: "19 maio 2026",
  highlights: [
    { label: "2 módulos novos", color: "#34D399" },
    { label: "Memória corrigida", color: "#FFB800" },
    { label: "iPad + telemóvel", color: "#FF3D8A" },
  ],
  sections: [
    {
      id: "new",
      title: "Novos módulos",
      icon: "✦",
      accent: "#00FFC8",
      items: [
        { tag: "Novo", tagColor: "#34D399", title: "Wishlist", desc: "Lista desejos com grupos personalizados (Investimentos, Aquário, Projetos…). Cria pastas no painel lateral e associa cada item ao grupo certo.", module: "wishlist" },
        { tag: "Novo", tagColor: "#38BDF8", title: "Gastos", desc: "Controlo mensal de despesas, totais por categoria e gestão dinâmica de categorias (criar, renomear, apagar).", module: "finance" },
      ],
    },
    {
      id: "synapse",
      title: "Sinapses",
      icon: "◎",
      accent: "#FF3D8A",
      items: [
        { tag: "Corrigido", tagColor: "#00FFC8", title: "Upload de documentos", desc: "PDF, JPG e PNG validados e guardados na nuvem (Supabase). Lista com os mais recentes no topo e etiqueta «Recente».", module: "synapse" },
        { tag: "Melhorado", tagColor: "#FFB800", title: "Menu de ficheiros", desc: "Tabela clara com tipo, data e destaque visual. Um único botão de upload fiável em todo o painel.", module: "synapse" },
        { tag: "iPad", tagColor: "#7B61FF", title: "Experiência tablet", desc: "No iPad funciona como no telemóvel: barra em baixo (Filho, Nova, Nome, Docs), botão + para criar sinapses e toque no canvas.", module: "synapse" },
      ],
    },
    {
      id: "journal",
      title: "Diário",
      icon: "▤",
      accent: "#FFB800",
      items: [
        { tag: "Corrigido", tagColor: "#00FFC8", title: "Memória de texto e imagens", desc: "O que escreves já não desaparece. Autoguardado a cada poucos segundos e ao sair do separador.", module: "journal" },
        { tag: "Melhorado", tagColor: "#38BDF8", title: "Fotos na nuvem", desc: "Imagens ligadas ao Supabase Storage com URLs estáveis — deixam de sumir ao reabrir a app.", module: "journal" },
        { tag: "Animação", tagColor: "#7B61FF", title: "Entrada suave", desc: "Mesma transição do Calendário e Tarefas ao abrir o módulo.", module: "journal" },
      ],
    },
    {
      id: "calendar",
      title: "Calendário",
      icon: "◷",
      accent: "#00FFC8",
      items: [
        { tag: "Novo", tagColor: "#00FFC8", title: "Tempo até ao evento", desc: "Ao clicar num evento vês quanto falta («Faltam 2h 15min», «A decorrer agora», «Já passou»).", module: "calendar" },
      ],
    },
    {
      id: "hub",
      title: "Hub e sistema",
      icon: "◇",
      accent: "#7B61FF",
      items: [
        { tag: "Hub", tagColor: "#00FFC8", title: "Barra de espaço local", desc: "Indica uso no dispositivo e explica quando as fotos estão na nuvem em vez de ocupar os 5 MB locais.", module: null },
        { tag: "Sync", tagColor: "#34D399", title: "Sincronização mais fiável", desc: "Tarefas e temas do diário que apagas deixam de voltar sozinhos. Dados fundidos entre local e Supabase.", module: null },
        { tag: "Animação", tagColor: "#FFB800", title: "Wishlist e Gastos", desc: "Entrada com fade e slide, igual aos módulos que já tinhas.", module: null },
      ],
    },
  ],
};
