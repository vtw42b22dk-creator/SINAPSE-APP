const NAV = [
  ["inicio", "Início"],
  ["aero", "Aerossol"],
  ["nasal", "Nariz"],
  ["meias", "Meias"],
  ["parasitas", "Parasitas"],
  ["oral", "Boca"],
  ["teste", "Teste"],
];

const HOME = [
  ["01", "aero", "Aerossol", "O pó inspira-se depressa. O resto, devagar."],
  ["02", "nasal", "Nariz", "Isotónico hidrata. Hipertónico descongestiona."],
  ["03", "meias", "Meias", "A pressão desce do tornozelo para cima."],
  ["04", "parasitas", "Parasitas", "Permetrina é fármaco. Dimeticone é físico."],
  ["05", "oral", "Boca", "Placa sai em casa. Tártaro sai no dentista."],
];

function item(id, label, title, body, extra) {
  return { id, label, title, body, extra: extra || null };
}

const PAGES = {
  aero: {
    eyebrow: "Aula 2 e artigo Aguiar, 2017",
    title: "Aerossolterapia",
    rule: "pMDI, câmara, SMI e nebulizador pedem inspiração lenta. O DPI pede inspiração rápida e funda, porque é o fluxo que desagrega o pó.",
    sections: [
      {
        id: "queda",
        label: "Onde cai",
        items: [
          item("util", "1 a 5 µm", "O intervalo que trata", [
            "Estas partículas chegam ao pulmão profundo e aos alvéolos. Depositam-se por sedimentação: quanto maiores e mais lentas, mais tempo têm para assentar.",
            "A inspiração é lenta, a volume corrente, com uma pausa de cerca de 10 segundos. Débitos altos atiram a partícula contra a orofaringe.",
            "Para aerossóis líquidos o débito ideal anda nos 30 L/min. O DPI precisa de mais, em geral acima de 30 e até 60 L/min, porque o pó só se desfaz com essa força.",
            "No artigo, 5 µm ou mais são inaláveis. Abaixo de 5 µm são respiráveis.",
          ]),
          item("grande", "Acima de 5 µm", "Impacto na boca e nos brônquios", [
            "Acima de 10 µm a partícula fica na boca e na orofaringe. É grande e vai depressa, não faz a curva e bate na parede: impacto por inércia.",
            "Entre 5 e 10 µm o impacto continua, agora na transição para as vias inferiores e nos brônquios principais.",
          ]),
          item("fina", "Abaixo de 1 µm", "Quase não trata", [
            "Move-se ao acaso, por difusão browniana, e a maior parte volta a sair na expiração.",
          ]),
          item("fatores", "Mais fatores", "Não é só o tamanho", [
            "A aula lista seis fatores: a posição das partículas umas em relação às outras, a posição delas no ciclo inspiratório, o tamanho, a dose, a uniformidade com que a dose se distribui, e a solubilidade.",
            "Respirar pelo nariz pode cortar cerca de metade da dose pulmonar. A via é bucal. Volume corrente baixo também diminui a deposição.",
            "Em lactentes, choro, frequência alta e inspiração nasal pioram o resultado. Os débitos deles variam entre 0 e 40 L/min e os volumes são pequenos.",
            "O dispositivo existe para otimizar a aerossolização, fazer a terapia resultar e o doente aderir.",
          ]),
        ],
      },
      {
        id: "aparelhos",
        label: "Aparelhos",
        items: [
          item("pmdi", "pMDI", "Pressurizado, dose calibrada", [
            "Canister com fármaco em solução ou suspensão, propelente HFA e válvula de dose fixa. É pequeno, barato, rápido e tem muitas apresentações. Com câmara, a aula usa-o em crianças com menos de 6 anos.",
            "O custo dessa rapidez é a coordenação mão–pulmão e o depósito na boca. A nuvem sai a cerca de 100 km/h, com partículas de 30–40 µm, e só fica respirável (3–4 µm) quando o propelente evapora. Há efeito cold freon.",
            "Com HFA o artigo estima 55–60% de deposição pulmonar. Nos antigos CFC ficava abaixo de 20%, e uma grande fração ia para a orofaringe.",
            "Técnica: aquecer e agitar, posição em L, expirar, começar a inspirar devagar e só então disparar. Continuar 3–5 segundos e suster cerca de 10 segundos. Entre puffs, 30 segundos a 1 minuto. Com corticoide, lavar a boca sem engolir.",
            "Ordem dos fármacos: broncodilatador de ação curta, outro broncodilatador se existir, anti-inflamatório só 5–10 minutos depois. Não se conta a dose a flutuar o canister. Um puff sem pressão é sinal de substituir. Na primeira vez desperdiçam-se 1 a 4 doses para o ar.",
            "Erros: tampa, não agitar, não expirar, posição em P, inspiração superficial, sem pausa, repetir cedo demais.",
          ]),
          item("camara", "Câmara", "Dá tempo à nuvem", [
            "Serve o pMDI. O propelente evapora, a nuvem abranda e as partículas grandes ficam na parede. Chegam abaixo as pequenas, com menos fármaco na boca e menos efeito sistémico.",
            "Há tubos abertos, que só afastam o spray da boca; câmaras com válvula, que seguram o aerossol até à inspiração; e fluxo inverso, em que o spray entra numa bolsa.",
            "O plástico tem carga estática e rouba dose. Lava-se cerca de uma vez por semana com detergente suave, sem esfregar, e seca ao ar. Com fissuras, deita-se fora.",
            "Abaixo dos 3 anos, máscara bem adaptada. Depois, peça bucal assim que a criança colabora. Um erro típico é disparar vários puffs para dentro da câmara de uma só vez.",
          ]),
          item("dpi", "DPI", "O fluxo é que liberta o pó", [
            "Pó micronizado, muitas vezes agarrado a lactose para não agregar. Não há propelente nem coordenação mão–pulmão, e cabe mais fármaco do que num pMDI. Alvo: 1–5 µm.",
            "Unidose: a cápsula perfura-se no aparelho (Aerolizer, Breezhaler, HandiHaler). Inspira-se rápido e confirma-se que ficou vazia. Multidose: roda-se a base e inspira-se na horizontal. Multi-unidade: doses seladas, muitas vezes em blister, libertadas por uma alavanca.",
            "Diskus: 60 doses, janela vermelha nas últimas 5, fluxo 20–30 L/min. Turbohaler carrega na vertical e inspira na horizontal, com fluxo mais alto. Ellipta: não tapar os furos de ar. Genuair e Novolizer passam de vermelho a verde se o fluxo chegou. No Twisthaler, abrir a tampa já desconta a dose.",
            "Muitas crianças só conseguem o fluxo a partir dos 5–6 anos. Não se lava com água. Com corticoide, gargarejar e deitar fora. Erros: não carregar a dose, perder pó, expirar para dentro, fluxo fraco, saltar a pausa.",
          ]),
          item("smi", "SMI", "Respimat, névoa de mola", [
            "No artigo é o único deste tipo em Portugal. Uma mola faz colidir dois jatos. A névoa é lenta e longa, coordena-se com mais facilidade, sem propelente, e há muitas partículas abaixo de 5,8 µm. São 60 doses.",
            "Na vertical, roda-se a base até ao clique, expira-se e prime-se o botão durante uma inspiração lenta. Pausa de 10 segundos. Não se agita.",
            "Mais de 7 dias parado: uma dose para o chão. Mais de 21 dias: repetir a preparação até se ver a nuvem.",
          ]),
        ],
      },
      {
        id: "nevo",
        label: "Nebulizar",
        items: [
          item("jato", "Pneumático", "Venturi, o mais comum", [
            "Um jato de ar parte o líquido. Aceita soluções e suspensões e é, em geral, o mais barato.",
            "É ruidoso, demora, deixa volume residual alto e perde fármaco por evaporação. Fluxo de 6–8 L/min, até 10, volume de 4–5 mL, partículas abaixo de 5 µm.",
            "A maior parte da dose sai nos primeiros 5 minutos. O tempo útil é 10–15 minutos. Respira-se pela boca.",
          ]),
          item("ultra", "Ultrassónico", "Rápido, mas aquece", [
            "Um cristal piezoelétrico fragmenta o líquido. É mais silencioso, mais rápido e faz partículas uniformes. Serve volumes grandes e fluidificação de secreções.",
            "Aquece. É má escolha para suspensões, líquidos viscosos e fármacos que o calor inativa, como a dornase alfa. Corticoide em suspensão não é para este aparelho.",
          ]),
          item("malha", "Malha", "Pequeno e eficiente", [
            "Uma placa com micro-orifícios empurra o líquido. É silenciosa, portátil e deixa pouco resíduo. Aceita soluções e suspensões.",
            "Os poros entopem com suspensões viscosas, a limpeza é exigente e o preço é mais alto.",
          ]),
          item("lavar", "Limpeza", "Depois de cada uso", [
            "Desmontar, lavar como manda o fabricante, tirar resíduos e secar ao ar. Desinfetar na periodicidade indicada.",
            "Filtros, máscaras e tubos têm prazo e não mudam de pessoa sem esterilização. A técnica de qualquer inalador ensina-se e revê-se em cada consulta.",
          ]),
        ],
      },
    ],
  },
  nasal: {
    eyebrow: "Segunda metade da aula de ORL",
    title: "Limpeza nasal",
    rule: "Isotónico, NaCl a 0,9%, hidrata e limpa. Hipertónico, acima de 0,9%, descongestiona. Acima de 3% irrita.",
    sections: [
      {
        id: "solucao",
        label: "A solução",
        items: [
          item("iso", "Isotónico", "Igual à mucosa", [
            "Soro a 0,9% de NaCl ou água do mar isotónica. Hidrata e limpa no dia a dia.",
            "A aula usa estes produtos na rinite alérgica, na sinusite crónica, nas viroses das vias superiores e no pós-operatório nasal. O alvo é a função mucociliar, menos inflamação e menos complicações.",
          ]),
          item("hiper", "Hipertónico", "Puxa a água para fora", [
            "Tem mais sal do que 0,9%. A água sai da mucosa e a congestão diminui.",
            "Acima de 3% aparecem irritação, edema, ardor ou comichão, e podem surgir desconforto e reações vasomotoras da mucosa brônquica.",
            "O slide não fecha um dispositivo, uma solução, uma dose ou uma frequência únicos.",
          ]),
        ],
      },
      {
        id: "como",
        label: "Como se faz",
        items: [
          item("meios", "Dispositivos", "Cinco peças diferentes", [
            "Unidose ou conta-gotas: bebés, instilação simples.",
            "Spray: higiene diária, com a pressão já controlada pelo frasco.",
            "Seringa: duche manual. A pressão é a da mão e, em geral, há um adaptador de silicone.",
            "Irrigador flexível: aperta-se o recipiente. As pontas mudam de tamanho e têm angulação própria.",
            "Aspirador: secreções do bebé que atrapalham a alimentação, o sono ou a respiração. Sempre depois do soro, sucção suave, parar se houver resistência.",
          ]),
          item("duche", "Duche", "Narina de cima, narina de baixo", [
            "No bebé, roda-se a cabeça e a solução entra na narina de cima. Tapar essa narina ajuda a secreção a sair pela de baixo, na expiração. Tapar a boca um instante, na inspiração, ajuda a nasofaringe.",
            "Na criança sentada, a cabeça vai para a frente e roda-se. A lógica das duas narinas mantém-se.",
            "A aula trata-o como seguro mesmo em crianças pequenas: melhora a clearance mucociliar e baixa congestão, inflamação e infeções de repetição.",
          ]),
          item("aspirar", "Aspirar", "Ganhos e riscos", [
            "Com soro, a aula descreve menos dificuldade respiratória, menos sinusite e otite média aguda, e melhor sono e alimentação.",
            "Riscos: contaminação cruzada, ferida da mucosa e pressão no ouvido médio. Não se insiste.",
          ]),
        ],
      },
    ],
  },
  meias: {
    eyebrow: "Aula 1 · doença venosa",
    title: "Meias",
    rule: "De C2 a C6 a primeira escolha é a meia elástica. A pressão é máxima no tornozelo. DEN não é mmHg.",
    sections: [
      {
        id: "doenca",
        label: "A doença",
        items: [
          item("mecanismo", "Mecanismo", "A válvula deixa de fechar", [
            "Doença venosa crónica: anomalias de forma e de função nas veias das pernas. Prevalência cerca de 50% nos países industrializados, maior nas mulheres. Diagnóstico clínico e com Doppler.",
            "A parede cede, a veia dilata, a válvula falha e o sangue acumula. A pressão venosa sobe.",
            "Insuficiência venosa crónica é esse retorno já permanentemente perturbado: edema, dor, inflamação, prurido, fadiga, dermatoesclerose e tensão.",
            "Riscos: família, idade, sexo feminino, hormonas, obesidade, trabalho sempre de pé ou sempre sentado.",
          ]),
          item("varizes", "Varizes", "Visíveis, muitas vezes mudas", [
            "Troços dilatados, nodulares e tortuosos. A cadeia é parede fraca, dilatação, válvula incompetente, sangue parado.",
            "Podem não doer. Quando dão sinal: dor, cãibras, prurido, questão estética. Complicações: edema, inflamação, pigmentação e úlcera.",
          ]),
          item("tratar", "Vias", "Do conservador à cirurgia", [
            "A escolha depende da idade, do estado, dos sintomas e do tipo de várice.",
            "Conservador: medidas físicas, compressão e venoativos. Superficial: laser, radiofrequência, escleroterapia ou cirurgia. Profundo: cirurgia. Úlcera: compressão mais penso. Origem pélvica: via endovascular ou cirúrgica.",
            "Venoativos naturais: cumarina, diosmina, fração flavonóica micronizada, escina, ruscus, castanheiro-da-índia, videira vermelha. Sintéticos: dobesilato de cálcio, naftazona, benzarona. Embalagens do slide: Daflon, Venosmil, Cyclo 3.",
          ]),
        ],
      },
      {
        id: "ceap",
        label: "CEAP",
        items: [
          item("C0", "C0", "Nada à vista", ["Nada se vê nem se palpa. C0s é só sintoma, C0a é assintomático. O sufixo pode juntar-se a qualquer classe. Ainda não é a meia terapêutica de primeira linha."]),
          item("C1", "C1", "Vasinhos", ["Telangiectasias ou veias reticulares. Meia de classe 1 ou 2."]),
          item("C2", "C2", "Varizes", ["C2r são varizes que voltaram. A partir daqui a meia elástica é a primeira escolha. Classe 1 ou 2."]),
          item("C3", "C3", "Edema", ["Edema venoso. Classe 2, 23–32 mmHg. Essa classe cobre de C1 a C4."]),
          item("C4", "C4", "A pele muda", ["C4a: pigmentação ou eczema. C4b: lipodermatoesclerose ou atrofia branca. C4c: coroa flebectásica. Continua na classe 2. Daqui até C6 é insuficiência venosa crónica."]),
          item("C5", "C5", "Úlcera fechada", ["Úlcera venosa já cicatrizada. Classe 3, 34–46 mmHg, ou classe 4, mais de 49 mmHg."]),
          item("C6", "C6", "Úlcera aberta", ["C6r é a úlcera que voltou. Também classe 3 ou 4, mais o tratamento da ferida."]),
        ],
      },
      {
        id: "meia",
        label: "A meia",
        items: [
          item("efeito", "Efeito", "Gradiente e bomba muscular", [
            "A pressão é maior no tornozelo e desce perna acima. Esse gradiente empurra o sangue para cima.",
            "Quatro efeitos: reabsorve edema e evita que se forme, reduz o calibre da veia, acelera o fluxo e melhora a bomba muscular.",
            "Em repouso a malha já comprime. Na contração, o músculo trabalha contra a malha. É a pressão de repouso e a de trabalho.",
          ]),
          item("classe", "Classes", "mmHg, não DEN", [
            "Classe 1, 15–21 mmHg: C1 e C2. Classe 2, 23–32: C1 a C4. Classe 3, 34–46: C5 e C6. Classe 4, mais de 49: C5 e C6. São os valores do draft europeu do slide.",
            "Subir de classe para fazer melhor é um erro. Compressão a mais, ou num membro com doença arterial, faz mal.",
            "Venoativo sozinho fica para doença arterial, infeção da pele, intolerância, má adesão ou calor insuportável.",
            "A aula pergunta a evidência em insuficiência, edema, úlcera, varizes, tromboembolismo após cirurgia, dor e hematoma no pós-operatório, e trombose. O slide não cola o resultado do ensaio: fixa a tabela de indicações.",
          ]),
          item("medir", "Medir", "AD, AG, AT", [
            "AD acaba abaixo do joelho: perímetros B e C, comprimento A–D. AG vai à coxa e acrescenta G. AT é collant. B é tornozelo, C barriga da perna, G coxa.",
            "Também se escolhe biqueira, cor, banda de silicone e tamanho curto ou normal.",
            "Na farmácia: pernas pesadas e viagens, doença já conhecida, ensinar a colocar, identificar finalidade, compressão, lote e instruções.",
            "Abandona-se por calor, preço, prurido e outras doenças. Veste-se de manhã, sentado. Lava-se como manda o rótulo, seca ao ar, longe de unhas, anéis e pomadas gordas.",
          ]),
        ],
      },
      {
        id: "descanso",
        label: "Descanso",
        items: [
          item("den", "DEN", "Prevenir, não tratar C4–C6", [
            "Serve a prevenção. Não exige consulta de especialidade para a compressão e o tamanho é simples de tirar.",
            "Vem em 6–60, 70 e 140 DEN. DEN é a espessura do fio. mmHg são a pressão no tornozelo.",
            "Objetivos: resistência, elasticidade, conforto, respirabilidade, ação antimicrobiana e hipoalergénica. Com prata, evitar contacto direto com fontes elétricas.",
          ]),
        ],
      },
    ],
  },
  parasitas: {
    eyebrow: "Aula 3 · pessoas e animais",
    title: "Antiparasitários",
    rule: "Sem piolho vivo não se trata. Permetrina mata o piolho e não o ovo. Dimeticone mata os dois. Permetrina animal nunca vai para o gato.",
    sections: [
      {
        id: "piolho",
        label: "O piolho",
        items: [
          item("especies", "Espécies", "Três sítios, três nomes", [
            "Pediculus humanus capitis no couro cabeludo. Pediculus humanus humanus no corpo. Phthirus pubis na região púbica; nas pestanas é raro.",
            "São ectoparasitas obrigatórios. A infestação é mundial, frequente em crianças e independente da higiene. Passa por contacto cabeça com cabeça. O piolho não voa.",
            "Sintoma: prurido e sensação de corpo estranho. O risco é a infeção da pele escoriada. A aula diz que não há estudos in vivo a mostrar o piolho como vetor de bactérias.",
          ]),
          item("passos", "Passos", "Confirmar, aplicar, repetir", [
            "Confirmar piolho vivo. Escolher físico ou químico. Cumprir quantidade, técnica e tempo. Voltar a procurar piolhos vivos. Repetir só se o produto e a ação ovicida o pedirem.",
            "Por vezes loção em vez de champô. Toalha clara, produto até ao couro, reforço na nuca e atrás das orelhas, em geral pelo menos 20 minutos, segunda vez aos 7–10 dias.",
            "O pente fino confirma e remove. Há pente manual e elétrico. O preço compara-se em mililitros, porque tem de dar para a segunda aplicação.",
          ]),
          item("casa", "Em casa", "Tratar só quem tem", [
            "Examinar contactos. Tratar ao mesmo tempo só os infestados. Evitar partilhar pentes, escovas, chapéus e almofadas. Cabelo comprido, apanhado.",
            "A criança pode ficar na escola depois de um tratamento adequado. A escola é informada.",
            "Não usar pediculicida como prevenção nem pulverizar a casa. Lavar só objetos relevantes e recentes. Óleos citados: citronela, árvore-do-chá, hortelã-pimenta, alfazema, laranja doce, girassol.",
          ]),
        ],
      },
      {
        id: "quadros",
        label: "Quadros",
        items: [
          item("quimico", "Químicos", "Neurotoxicidade", [
            "Paralisam e matam. A permetrina, piretroide, dominou no fim dos anos 1980 com Nix e Quitoso. O uso alargado selecionou resistência. É pediculicida, não é ovicida, e o efeito no humano é menor.",
            "O mesmo padrão, sem ovicida e com resistência, está no crisântemo, no malatião, no carbaril e na ivermectina. DDT e lindano são tóxicos e também ovicidas.",
            "O espinosade é a exceção do quadro: mata piolho e ovo, efeito menor, sem resistência assinalada.",
          ], {
            headers: ["Composto", "Grupo", "Ovo", "Nota"],
            rows: [
              ["Permetrina", "Piretroide", "Não", "Resistência. É o fármaco da aula"],
              ["Crisântemo", "Piretrina", "Não", "Resistência"],
              ["Malatião", "Organofosfato", "Não", "Resistência"],
              ["Carbaril", "Carbamato", "Não", "Tóxico e com resistência"],
              ["Ivermectina", "Lactona", "Não", "Resistência"],
              ["Espinosade", "Lactona", "Sim", "Sem resistência no quadro"],
              ["DDT e lindano", "Organoclorados", "Sim", "Tóxicos e com resistência"],
            ],
            marks: { 0: "warn", 5: "ok" },
          }),
          item("fisico", "Físicos", "Asfixia ou cutícula", [
            "Não há farmacologia. Tapam os espiráculos ou dissolvem a cutícula. A resistência não está documentada neste quadro.",
            "Ovicidas: dimeticone, ciclometicone e óleo mineral. Álcool benzílico e 1,2-octanodiol matam o piolho e deixam o ovo. No miristato e no dodecanol a ação ovicida fica por confirmar.",
          ], {
            headers: ["Composto", "Grupo", "Ovo"],
            rows: [
              ["Dimeticone", "Silicone sintético", "Sim"],
              ["Ciclometicone", "Silicone sintético", "Sim"],
              ["Óleo mineral", "Silicone natural", "Sim"],
              ["Álcool benzílico", "Álcool", "Não"],
              ["1,2-octanodiol", "Álcool", "Não"],
              ["Isopropil miristato", "Éster", "Por confirmar"],
              ["Dodecanol", "Álcool", "Por confirmar"],
            ],
            marks: { 0: "ok", 1: "ok", 2: "ok" },
          }),
          item("olho", "Demodex", "Borda da pálpebra", [
            "Blefarite: ardor, prurido, fotofobia, pálpebras oleosas e inchadas, triquíase e queda de cílios.",
            "Pode ser estafilococo, Candida, Malassezia furfur, Phthirus pubis, Demodex folliculorum ou Demodex brevis.",
            "Blephademodex: toalhete com terpineno-4-ol, desde os 18 anos. Ligeiro a moderado, 1 vez por dia. Mais grave, 2 vezes, em geral 4 semanas. Olho fechado, sem lentes, sem reutilizar.",
          ]),
        ],
      },
      {
        id: "animais",
        label: "Animais",
        items: [
          item("one", "One Health", "Cão, casa e pessoa", [
            "A carraça transmite agentes ao animal e à pessoa. A pulga dá dermatite alérgica e transmite alguns agentes. O mosquito é vetor humano. A estratégia junta animal, ambiente e risco local.",
            "A falha vem de dose, espécie ou peso errados, reinfestação e banhos. Resistência existe, mas a eficácia clínica da maioria dos produtos mantém-se. Guardar seco, sem luz, abaixo de 25 ºC.",
            "Isoxazolinas têm reações neurológicas raras. A escolha segue eficácia, preço, facilidade, espectro, segurança e frequência.",
          ]),
          item("formas", "Formas", "Coleira, pipeta, comprimido", [
            "Coleira: 6 a 8 meses. O banho reduz o efeito, a infestação grande responde pouco e o animal grande pode ficar com zonas a descoberto.",
            "Pipeta: começa quase logo e aguenta infestação grande. Perde com o banho, aplica-se todos os meses e distribui-se de forma irregular.",
            "Comprimido: não depende do banho e distribui-se por igual. Alguns animais recusam, e a exposição é sistémica.",
          ]),
          item("lista", "Produtos", "Quem pode receber o quê", [
            "Frontline Spot-On (fipronil), Combo (fipronil + metopreno) e Advantage (imidaclopride) são de cão e gato, em pipeta, de 4 em 4 semanas. Combo acrescenta ovos e piolhos. Advantage é só pulgas.",
            "Frontline Tri-Act e Advantix levam permetrina: só cão. Cobrem também insetos voadores. Scalibor, coleira de deltametrina, 6 meses, cão. Seresto, imidaclopride + flumetrina, 8 meses, cão, incluindo larvas de carraça.",
            "Bravecto, fluralaner, comprimido de 3 em 3 meses, cão, inclui larvas de pulga. NexGard, afoxolaner, de 4 em 4 semanas, cão. A dose é sempre da espécie e do peso.",
          ], {
            headers: ["Produto", "Animal", "Intervalo"],
            rows: [
              ["Spot-On, Combo, Advantage", "Cão e gato", "4 semanas"],
              ["Tri-Act e Advantix", "Só cão, têm permetrina", "4 semanas"],
              ["Scalibor", "Cão", "6 meses"],
              ["Seresto", "Cão", "8 meses"],
              ["Bravecto", "Cão", "3 meses"],
              ["NexGard", "Cão", "4 semanas"],
            ],
            marks: { 1: "warn" },
          }),
        ],
      },
    ],
  },
  oral: {
    eyebrow: "Fernando Moreira · higiene oral",
    title: "A boca",
    rule: "Estes produtos são cosméticos. A placa interrompe-se em casa. O tártaro só sai no dentista. Sangrar a escovar ainda é gengivite.",
    sections: [
      {
        id: "dente",
        label: "O dente",
        items: [
          item("dentes", "Dentição", "20, depois 32", [
            "De leite, 0–12 anos, 20 dentes: incisivos centrais e laterais, caninos, primeiros e segundos molares, quatro de cada.",
            "Mista dos 6 aos 12. Definitiva a partir dos 12, 32 dentes, com pré-molares e sisos.",
            "Arco de cima no maxilar, de baixo na mandíbula. Incisivos e caninos têm uma raiz. Pré-molares e molares têm duas raízes em baixo e três em cima.",
          ]),
          item("faces", "Faces", "Onde está a lesão", [
            "Vestibular é a face de fora: labial nos anteriores, bucal nos posteriores. Lingual olha a língua; no arco de cima diz-se palatina.",
            "Mesial olha o meio da boca. Distal olha para trás. São as faces do fio.",
            "Oclusal é a face que mastiga. Bordo incisal é o gume dos anteriores.",
          ]),
          item("camadas", "Camadas", "Quem dói", [
            "Esmalte e cemento não têm vasos nem nervos. A dentina não tem vasos, mas é inervada: dói antes de a cárie chegar à polpa.",
            "Polpa e canais têm vasos e nervos.",
          ]),
        ],
      },
      {
        id: "doenca",
        label: "Doenças",
        items: [
          item("carie", "Cárie", "Açúcar, ácido, esmalte", [
            "O biofilme fermenta açúcares, o pH desce e o esmalte desmineraliza. Entram cerca de 40 espécies, não só o Streptococcus mutans.",
            "Muitas vezes começa muda. Depois há dor, mancha clara e, no fim, escura. Pode haver febre. Há cárie da coroa e da raiz.",
            "Pode levar à perda do dente e a infeção sistémica. Riscos da aula: variante G20A da beta-defensina-1, falta de consulta semestral, não escovar nem usar fio ou flúor, boca seca por medicamentos.",
          ]),
          item("placa", "Placa", "Três tempos", [
            "Adesão, colonização, biofilme. Estreptococos ligam-se à saliva e abrem caminho a Actinomyces, Fusobacterium e, depois, anaeróbios.",
            "Parar essa ligação inicial trava cárie, tártaro e periodontite.",
            "Tártaro é placa mineralizada, amarela junto à gengiva, porosa. Só o dentista o remove. A pasta anti-tártaro previne cristais novos, com pirofosfatos e zinco.",
          ]),
          item("gengiva", "Gengiva", "Reversível, depois não", [
            "Gengivite é inflamação reversível. O primeiro sinal é sangrar a escovar.",
            "Periodontite já destruiu osso e fibras. Não volta atrás com a escova.",
            "A lista do Ministério também nomeia sensibilidade, traumatismos oro-faciais, desarmonias dento-faciais e cancro oral, sem os desenvolver no slide.",
          ]),
        ],
      },
      {
        id: "produtos",
        label: "Produtos",
        items: [
          item("escova", "Escova", "A aula compara e não elege", [
            "A manual reduz placa. Origem atribuída à China em 1498; a elétrica, à Suíça em 1939. A cabeça é de tufos. A aula discute ponta, nylon contra cerda natural e rigidez, citando a escala de Silverstone e Featherstone sem dar os valores.",
            "Padrões manuais em aberto: bloco, dois níveis, vários níveis, ondulado, cruzado, prolongamentos. Elétricas: lado a lado, rotativa, rotativa-oscilatória, contra-oscilatória, duas cabeças, ultrassónica. A Cochrane citada é Deacon, 2010.",
            "Manual contra elétrica fica em inflamação, placa, destreza, eficiência e custo. O slide não declara uma vencedora.",
          ]),
          item("fluor", "Flúor", "O número que importa", [
            "Fluoreto de sódio, de estanho, monofluorofosfato e de amina. Duas hipóteses: fluoroapatite e fluoreto de cálcio. Remineraliza, trava a desmineralização e inibe enzimas bacterianas.",
            "Cerca de 500 ppm não se distingue de zero. Abaixo de 1000 ppm a eficácia está em causa. Teto da UE no slide: 1500 ppm. Dos 2 aos 6 anos, máximo 1150. Riscos nomeados: fluorose e neurotoxicidade.",
            "A hidroxiapatite aparece como alternativa possível, ainda sem substituição decidida. Na criança mudam abrasivo, sabor e quantidade: grão de arroz ou só água nos mais pequenos, ervilha a seguir. As normas não coincidem.",
            "Maldupa separa pastas de cárie pelo teor de flúor, pastas periodontais, pastas de sensibilidade e branqueadoras distintas das descolorantes.",
          ]),
          item("outras", "Pastas", "Mancha, plantas, sensibilidade", [
            "Os nomes da embalagem não são classes iguais entre marcas. Branqueadoras tiram sobretudo mancha de fora: tabaco, vinho, alimentos, clorexidina, ferro.",
            "Abrasivos: sílica, carbonato de cálcio, fosfatos, alumínio, bicarbonato, perlite. Químicos: peróxidos, citrato, pirofosfato, papaína. O carvão pode atrapalhar o flúor e é abrasivo.",
            "Sensibilidade: nitrato de potássio, estrôncio, fluoretos, oxalatos, glutaraldeído, resinas, arginina. Ou acalmam o nervo ou fecham túbulos.",
            "Triclosan não dispensa flúor. Clorexidina na pasta é inativada por aniónicos. Extratos do slide: camomila, equinácea, sálvia, mirra, hortelã, miswak, aloé, mel, própolis e chá verde, com Paradontax, Meswak e AloeDent como marcas.",
          ]),
          item("colutorio", "Colutório", "Dura porque fica", [
            "Serve placa, halitose, língua, cárie, gengiva e fungos. A halitose vem de aminoácidos com enxofre transformados em compostos sulfurados voláteis. A escova reduz a carga. O colutório neutraliza ou mascara.",
            "Clorexidina 0,1%, Eludril, é a referência: bacteriostática em dose baixa, bactericida em dose alta, também antifúngica. O uso repetido pigmenta. A substantividade depende de concentração, química, pH, temperatura e tempo de contacto.",
            "Hexetidina 0,1%, Hextril, é forte em Candida e só se aproxima da clorexidina na placa se a concentração subir muito. Benzidamina 0,15% é o Tantum Verde. Óleos essenciais, o Listerine.",
          ]),
          item("fio", "Fio e prótese", "Onde a escova não chega", [
            "A ADA, citada na aula, fala em cerca de 80% da placa. As revisões do mesmo slide encontram efeito modesto ou ausente. PTFE passa melhor do que nylon em contactos apertados. Tira-se mais placa por fora e à frente.",
            "No aparelho: escovilhão, cera no bracket, colutório sem álcool. Fixador insolúvel é algodão, cera e alginato. O solúvel usa carboximetilcelulose e sais. O ganho mede-se pelo índice de Kapur, pela força da mordida e pelo movimento muscular.",
            "Também há escova da língua, passa-fio e evidenciador de placa.",
          ]),
        ],
      },
    ],
  },
};

const PERGUNTAS = [
  ["Uma partícula de 3 µm…", ["Fica na boca", "Chega ao pulmão profundo", "Sai quase toda"], 1, "1–5 µm é o intervalo da sedimentação. Abaixo de 1 µm é que se perde."],
  ["Como se inspira um DPI?", ["Devagar, como o pMDI", "Rápido e fundo", "Pelo nariz"], 1, "O fluxo desagrega o pó. O nariz pode cortar metade da dose."],
  ["Vários puffs na câmara de uma vez…", ["Aumentam a dose útil", "São um erro", "Substituem a pausa"], 1, "Um puff de cada vez. A câmara retém as partículas grandes."],
  ["Corticoide em suspensão no ultrassónico.", ["É a melhor escolha", "É má escolha", "Só falha se for barulhento"], 1, "O ultrassónico aquece. Pneumático e malha é que aceitam suspensão."],
  ["Soro acima de 3%.", ["É o isotónico", "Não tem risco local", "Pode irritar e arder"], 2, "Isotónico é 0,9%. Acima de 3% a aula associa irritação, edema e ardor."],
  ["CEAP C3. Que meia?", ["Classe 2, 23–32 mmHg", "Classe 4", "140 DEN"], 0, "C3 é edema. DEN não é mmHg. C5 e C6 é que sobem de classe."],
  ["Venoativo sozinho chega quando…", ["Há varizes C2", "Há doença arterial, intolerância ou calor", "A úlcera está aberta"], 1, "De C2 a C6 a primeira escolha é a meia."],
  ["A permetrina, no quadro…", ["Mata o ovo", "Mata o piolho, não o ovo, e tem resistência", "É um dispositivo médico"], 1, "O dimeticone mata os dois. O espinosade é o químico ovicida sem resistência assinalada."],
  ["Frontline Tri-Act no gato.", ["Sim", "Não, tem permetrina", "É igual ao Advantage"], 1, "Tri-Act e Advantix são de cão. Spot-On, Combo e Advantage é que servem os dois."],
  ["Sangrar a escovar é…", ["Periodontite", "Gengivite, ainda reversível", "Tártaro que a pasta dissolve"], 1, "Periodontite já levou osso. Tártaro só sai no dentista."],
  ["500 ppm de flúor…", ["Igual a 1500", "Não se distingue de zero", "É o teto da UE"], 1, "Abaixo de 1000 ppm a eficácia está em causa. O teto do slide é 1500 ppm."],
  ["Clorexidina a 0,1%…", ["A hexetidina substitui-a", "É referência no colutório e falha na pasta", "Funciona melhor em pasta"], 1, "Na pasta os aniónicos inativam-na. O uso repetido pigmenta os dentes."],
];

const memory = {};
const quiz = { i: 0, picked: null, score: 0, locked: false };

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function route() {
  const name = (location.hash || "#inicio").slice(1);
  return NAV.some(([id]) => id === name) ? name : "inicio";
}

function remember(page) {
  if (!memory[page.title]) {
    const section = page.sections[0];
    memory[page.title] = { section: section.id, item: section.items[0].id };
  }
  const saved = memory[page.title];
  const section = page.sections.find((entry) => entry.id === saved.section) || page.sections[0];
  const itemNow = section.items.find((entry) => entry.id === saved.item) || section.items[0];
  saved.section = section.id;
  saved.item = itemNow.id;
  return { section, item: itemNow };
}

function renderNav(current) {
  document.getElementById("rail").innerHTML = NAV.map(
    ([id, label]) => `<a href="#${id}" data-go="${id}" class="${id === current ? "is-on" : ""}">${esc(label)}</a>`,
  ).join("");
}

function renderHome() {
  return `
    <p class="kicker">CTeSP · Dispositivos Médicos II</p>
    <h1>Cinco aulas, um sítio para as perceber.</h1>
    <p class="deck">Cada página explica o mecanismo, a técnica e o erro que troca o resultado. O teste, no fim, corrige na hora.</p>
    <div class="home-grid">
      ${HOME.map(
        ([n, id, title, line]) => `
          <a class="home-card" href="#${id}" data-go="${id}">
            <span>${n}</span>
            <strong>${esc(title)}</strong>
            <em>${esc(line)}</em>
          </a>`,
      ).join("")}
    </div>
    <p class="note">Sara Machado: aerossol, ORL, meias e antiparasitários. Fernando Moreira: higiene oral. O artigo de apoio é Aguiar et al., 2017. Onde o slide só faz a pergunta, a página diz que a resposta não está lá.</p>
  `;
}

function tableHtml(table) {
  const head = table.headers.map((cell) => `<th>${esc(cell)}</th>`).join("");
  const body = table.rows
    .map((row, index) => {
      const mark = table.marks?.[index];
      const cls = mark === "warn" ? "warn" : mark === "ok" ? "ok" : "";
      return `<tr class="${cls}">${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`;
    })
    .join("");
  return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderPage(id) {
  const page = PAGES[id];
  const { section, item: current } = remember(page);
  const paragraphs = current.body.map((line) => `<p>${esc(line)}</p>`).join("");
  const table = current.extra ? tableHtml(current.extra) : "";
  return `
    <p class="kicker">${esc(page.eyebrow)}</p>
    <h1>${esc(page.title)}</h1>
    <div class="rule"><b>Para fixar</b>${esc(page.rule)}</div>
    <div class="sections">
      ${page.sections
        .map(
          (entry) =>
            `<button type="button" data-section="${esc(page.title)}" data-id="${esc(entry.id)}" class="${entry.id === section.id ? "is-on" : ""}">${esc(entry.label)}</button>`,
        )
        .join("")}
    </div>
    <div class="split">
      <div class="topics">
        ${section.items
          .map(
            (entry) =>
              `<button type="button" data-item="${esc(page.title)}" data-id="${esc(entry.id)}" class="${entry.id === current.id ? "is-on" : ""}">${esc(entry.label)}</button>`,
          )
          .join("")}
      </div>
      <div class="sheet">
        <h2>${esc(current.title)}</h2>
        ${paragraphs}
        ${table}
      </div>
    </div>
  `;
}

function renderQuiz() {
  if (quiz.i >= PERGUNTAS.length) {
    const tone = quiz.score >= 9 ? "good" : "bad";
    const line =
      quiz.score >= 9
        ? "A distinção principal de cada aula está segura."
        : "Volta à página da pergunta que falhou e lê o texto, não só o título.";
    return `
      <p class="kicker">Resultado</p>
      <h1>${quiz.score} em ${PERGUNTAS.length}</h1>
      <div class="feedback ${tone}"><p>${esc(line)}</p></div>
      <button class="ghost" type="button" id="restart">Recomeçar</button>
    `;
  }
  const [question, options, correct, why] = PERGUNTAS[quiz.i];
  const width = Math.round((quiz.i / PERGUNTAS.length) * 100);
  const choices = options
    .map((option, index) => {
      let cls = "choice";
      if (quiz.locked && index === correct) cls += " is-good";
      if (quiz.locked && index === quiz.picked && index !== correct) cls += " is-bad";
      return `<button type="button" class="${cls}" data-answer="${index}">${esc(option)}</button>`;
    })
    .join("");
  const feedback = quiz.locked
    ? `<div class="feedback ${quiz.picked === correct ? "good" : "bad"}"><p>${esc(why)}</p></div>
       <button class="ghost" type="button" id="next">${quiz.i === PERGUNTAS.length - 1 ? "Ver resultado" : "Seguinte"}</button>`
    : "";
  return `
    <p class="kicker">Teste</p>
    <div class="quiz-top">
      <div class="stat"><b>${quiz.i + 1}/${PERGUNTAS.length}</b><span>pergunta</span></div>
      <div class="stat"><b>${quiz.score}</b><span>certas</span></div>
    </div>
    <div class="progress"><i style="width:${width}%"></i></div>
    <h2>${esc(question)}</h2>
    <div class="choices">${choices}</div>
    ${feedback}
  `;
}

let shown = "";

function render() {
  const current = route();
  renderNav(current);
  const view = document.getElementById("view");
  if (current === "inicio") view.innerHTML = renderHome();
  else if (current === "teste") view.innerHTML = renderQuiz();
  else view.innerHTML = renderPage(current);
  if (shown !== current) {
    window.scrollTo(0, 0);
    shown = current;
  }
}

document.body.addEventListener("click", (event) => {
  const sectionButton = event.target.closest("[data-section]");
  if (sectionButton) {
    const page = Object.values(PAGES).find((entry) => entry.title === sectionButton.dataset.section);
    const section = page.sections.find((entry) => entry.id === sectionButton.dataset.id);
    memory[page.title] = { section: section.id, item: section.items[0].id };
    render();
    return;
  }
  const itemButton = event.target.closest("[data-item]");
  if (itemButton) {
    memory[itemButton.dataset.item].item = itemButton.dataset.id;
    render();
    return;
  }
  const answer = event.target.closest("[data-answer]");
  if (answer && !quiz.locked) {
    quiz.picked = Number(answer.dataset.answer);
    quiz.locked = true;
    if (quiz.picked === PERGUNTAS[quiz.i][2]) quiz.score += 1;
    render();
    return;
  }
  if (event.target.id === "next") {
    quiz.i += 1;
    quiz.picked = null;
    quiz.locked = false;
    render();
    return;
  }
  if (event.target.id === "restart") {
    quiz.i = 0;
    quiz.picked = null;
    quiz.score = 0;
    quiz.locked = false;
    render();
  }
});

window.addEventListener("hashchange", render);
render();
