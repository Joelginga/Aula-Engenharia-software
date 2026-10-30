// Dados estáticos (tipos, classes) + dados de exemplo opcionais. Os dados reais de cada utilizador ficam em localStorage.
const DATA = {
  tipos: {
    rendimento: { label: "Rendimento", cls: "pos" },
    entrada: { label: "Entrada de Capital", cls: "pos" },
    saida: { label: "Saída de Capital", cls: "neg" },
    despesa: { label: "Despesa", cls: "neg" }
  },
  icons: { rendimento: "payments", entrada: "account_balance", saida: "currency_exchange", despesa: "receipt_long" },
  classes: {
    divida: { label: "Dívida Pública (Obrigações do Tesouro)", risco: "Baixo Risco (Soberano)", nota: "Isenção Total de IAC (Art. 11º Cód. IAC)", cor: "#10243a" },
    imobiliario: { label: "Ativos Imobiliários Comerciais", risco: "Médio Risco (Real Estate)", nota: "Regime IP Predial (15% Retenção)", cor: "#2563eb" },
    agro: { label: "Participações Societárias & Agro", risco: "Moderado / Agro", nota: "Incentivo PRODESI / Isenção Imp. Industrial", cor: "#16a34a" }
  },
  tiposEntidade: ["Sociedade Anónima", "Imobiliário Comercial", "Agronegócio", "Pessoa Singular", "Outro"],
  demo: {
    entidades: [
      { id: 1, nome: "Grupo Atlântico S.A.", tipo: "Sociedade Anónima", nif: "5418290312" },
      { id: 2, nome: "Talatona Corporate", tipo: "Imobiliário Comercial", nif: "5417003345" },
      { id: 3, nome: "Plantio Café Kwanza", tipo: "Agronegócio", nif: "5419988120" }
    ],
    ativos: [
      { id: 1, eid: 1, nome: "Títulos do Tesouro OT-NR", classe: "divida", info: "Maturidade: Nov 2028 • Emissão BNA", valor: 114390000, taxa: 12.5 },
      { id: 2, eid: 2, nome: "Edifício Talatona Corporate", classe: "imobiliario", info: "Renda Comercial • Luanda Sul", valor: 51660000, taxa: 9 },
      { id: 3, eid: 3, nome: "Fazenda Kwanza", classe: "agro", info: "Agronegócio • Cuanza Sul", valor: 18450000, taxa: 6 }
    ],
    movs: [
      { id: 1, eid: 1, titulo: "Cupão OT-NR 2027", tipo: "rendimento", valor: 2400000, dias: 0 },
      { id: 2, eid: 3, titulo: "Aporte de Tesouraria", tipo: "entrada", valor: 15000000, dias: 8 },
      { id: 3, eid: 1, titulo: "Comissão de Custódia BODIVA", tipo: "despesa", valor: -350000, dias: 9 },
      { id: 4, eid: 2, titulo: "Renda Edifício Luanda Sul", tipo: "rendimento", valor: 3850000, dias: 11 },
      { id: 5, eid: 1, titulo: "Resgate Parcial de Depósito", tipo: "saida", valor: -5000000, dias: 15 },
      { id: 6, eid: 2, titulo: "Manutenção & Condomínio", tipo: "despesa", valor: -620000, dias: 20 }
    ]
  }
};
