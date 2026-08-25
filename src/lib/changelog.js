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
    { label: "2 módulos novos", color: "#8FB39B" },
    { label: "Memória corrigida", color: "#C4A57C" },
    { label: "iPad + telemóvel", color: "#E6E6E9" },
  ],
  sections: [
    {
      id: "new",
      title: "Novos módulos",
      icon: "✦",
      accent: "#E6E6E9",
      items: [
        { tag: "Novo", tagColor: "#8FB39B", title: "Wishlist", desc: "Lista desejos com grupos personalizados (Investimentos, Aquário, Projetos…). Cria pastas no painel lateral e associa cada item ao grupo certo.", module: "wishlist" },
        { tag: "Novo", tagColor: "#E6E6E9", title: "Gastos", desc: "Controlo mensal de despesas, totais por categoria e gestão dinâmica de categorias (criar, renomear, apagar).", module: "finance" },
      ],
    },
    {
      id: "synapse",
      title: "Sinapses",
      icon: "◎",
      accent: "#E6E6E9",
      items: [
        { tag: "Corrigido", tagColor: "#E6E6E9", title: "Upload de documentos", desc: "PDF, JPG e PNG validados e guardados na nuvem (Supabase). Lista com os mais recentes no topo e etiqueta «Recente».", module: "synapse" },
        { tag: "Melhorado", tagColor: "#C4A57C", title: "Menu de ficheiros", desc: "Tabela clara com tipo, data e destaque visual. Um único botão de upload fiável em todo o painel.", module: "synapse" },
        { tag: "iPad", tagColor: "#E6E6E9", title: "Experiência tablet", desc: "No iPad funciona como no telemóvel: barra em baixo (Filho, Nova, Nome, Docs), botão + para criar sinapses e toque no canvas.", module: "synapse" },
      ],
    },
    {
      id: "journal",
      title: "Diário",
      icon: "▤",
      accent: "#C4A57C",
      items: [
        { tag: "Corrigido", tagColor: "#E6E6E9", title: "Memória de texto e imagens", desc: "O que escreves já não desaparece. Autoguardado a cada poucos segundos e ao sair do separador.", module: "journal" },
        { tag: "Melhorado", tagColor: "#E6E6E9", title: "Fotos na nuvem", desc: "Imagens ligadas ao Supabase Storage com URLs estáveis — deixam de sumir ao reabrir a app.", module: "journal" },
        { tag: "Animação", tagColor: "#E6E6E9", title: "Entrada suave", desc: "Mesma transição do Calendário e Tarefas ao abrir o módulo.", module: "journal" },
      ],
    },
    {
      id: "calendar",
      title: "Calendário",
      icon: "◷",
      accent: "#E6E6E9",
      items: [
        { tag: "Novo", tagColor: "#E6E6E9", title: "Tempo até ao evento", desc: "Ao clicar num evento vês quanto falta («Faltam 2h 15min», «A decorrer agora», «Já passou»).", module: "calendar" },
      ],
    },
    {
      id: "hub",
      title: "Hub e sistema",
      icon: "◇",
      accent: "#E6E6E9",
      items: [
        { tag: "Hub", tagColor: "#E6E6E9", title: "Barra de espaço local", desc: "Indica uso no dispositivo e explica quando as fotos estão na nuvem em vez de ocupar os 5 MB locais.", module: null },
        { tag: "Sync", tagColor: "#8FB39B", title: "Sincronização mais fiável", desc: "Tarefas e temas do diário que apagas deixam de voltar sozinhos. Dados fundidos entre local e Supabase.", module: null },
        { tag: "Animação", tagColor: "#C4A57C", title: "Wishlist e Gastos", desc: "Entrada com fade e slide, igual aos módulos que já tinhas.", module: null },
      ],
    },
  ],
};
