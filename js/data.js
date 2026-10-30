// Dados de exemplo — substitui por API/BD quando quiseres.
const DATA = {
  resumoMes: { entradas: 17400000, saidas: 4820000, variacao: 8.4 },
  totalRegistos: 48,
  movimentos: [
    { id: 1, titulo: "Cupão OT-NR 2027", entidade: "Grupo Atlântico S.A.", tipo: "rendimento", estado: "Liquidado", data: "Hoje, 09:42", valor: 2400000, icon: "payments" },
    { id: 2, titulo: "Aporte de Tesouraria", entidade: "Plantio Café Kwanza", tipo: "entrada", estado: "Concluído", data: "22 Out 2024", valor: 15000000, icon: "account_balance" },
    { id: 3, titulo: "Comissão de Custódia BODIVA", entidade: "BFA Gestão de Ativos", tipo: "despesa", estado: "Debitado", data: "21 Out 2024", valor: -350000, icon: "receipt_long" },
    { id: 4, titulo: "Renda Edifício Luanda Sul", entidade: "Talatona Corporate", tipo: "rendimento", estado: "Creditado", data: "19 Out 2024", valor: 3850000, icon: "apartment" },
    { id: 5, titulo: "Resgate Parcial de Depósito", entidade: "Depósito BFA", tipo: "saida", estado: "Concluído", data: "15 Out 2024", valor: -5000000, icon: "currency_exchange" },
    { id: 6, titulo: "Manutenção & Condomínio", entidade: "Talatona Corporate", tipo: "despesa", estado: "Debitado", data: "10 Out 2024", valor: -620000, icon: "build" }
  ],
  tipos: {
    rendimento: { label: "Rendimento", cls: "pos" },
    entrada: { label: "Entrada de Capital", cls: "pos" },
    saida: { label: "Saída de Capital", cls: "neg" },
    despesa: { label: "Despesa", cls: "neg" }
  },
  relatorio: {
    patrimonio: 184500000, crescimento: 14.8, rentabilidade: 28340000,
    encargos: 4820000, roi: 15.35, eficiencia: 82.9,
    meses: [
      { nome: "Jan / Fev 2024", rend: 4500000, desp: 650000 },
      { nome: "Mar / Abr 2024", rend: 6200000, desp: 790000 },
      { nome: "Mai / Jun 2024", rend: 7900000, desp: 950000 },
      { nome: "Jul / Ago 2024 (Cupão OT-NR)", rend: 9740000, desp: 1430000 }
    ],
    carteira: [
      { nome: "Dívida Pública (Obrigações do Tesouro)", nota: "Isenção Total de IAC (Art. 11º Cód. IAC)", valor: 114390000, cor: "#10243a" },
      { nome: "Ativos Imobiliários Comerciais", nota: "Regime IP Predial (15% Retenção)", valor: 51660000, cor: "#2563eb" },
      { nome: "Participações Societárias & Agro", nota: "Incentivo PRODESI / Isenção Imp. Industrial", valor: 18450000, cor: "#16a34a" }
    ],
    ativos: [
      { sigla: "OT", nome: "Títulos do Tesouro OT-NR", info: "Maturidade: Nov 2028 • Emissão BNA", risco: "Baixo Risco (Soberano)", valor: 114390000 },
      { sigla: "TC", nome: "Edifício Talatona Corporate", info: "Renda Comercial • Luanda Sul", risco: "Médio Risco (Real Estate)", valor: 51660000 },
      { sigla: "FK", nome: "Fazenda Kwanza", info: "Agronegócio • Cuanza Sul", risco: "Moderado / Agro", valor: 18450000 }
    ]
  },
  entidades: [
    { nome: "Grupo Atlântico S.A.", tipo: "Sociedade Anónima", nif: "5418290312" },
    { nome: "Talatona Corporate", tipo: "Imobiliário Comercial", nif: "5417003345" },
    { nome: "Plantio Café Kwanza", tipo: "Agronegócio", nif: "5419988120" }
  ]
};
