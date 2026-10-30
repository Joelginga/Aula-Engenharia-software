/* InvestControl — app.js (JavaScript puro, sem dependências) */
const $ = (s, r = document) => r.querySelector(s);
const app = $("#app");
const kz = n => Math.abs(n).toLocaleString("de-DE");               // 1.250.000
const sgn = n => (n >= 0 ? "+" : "-") + kz(n);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const money = (n, cls = "") => `<span class="num ${cls}">${n}</span>`;

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove("show"), 2400);
}
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem("ic_" + k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem("ic_" + k, JSON.stringify(v)); } catch {} }
};

/* ---------- Movimentos ---------- */
const mov = { busca: "", filtro: "todas", periodo: "mes", lista: store.get("movs", DATA.movimentos), extra: store.get("extra", { e: 0, s: 0 }) };

function viewMovimentos() {
  const s = DATA.resumoMes, e = s.entradas + mov.extra.e, sd = s.saidas + mov.extra.s, liq = e - sd;
  app.innerHTML = `
    <div class="page-head">
      <span class="crumb">Gestão de Tesouraria • Outubro 2024</span>
      <h1>Movimentações Financeiras</h1>
      <p class="sub">Histórico consolidado de entradas, saídas e rendimentos em Kwanzas (Kz)</p>
      <div class="actions"><button class="btn primary" id="novo"><span class="ms">add</span>Registar movimento</button></div>
    </div>
    <div class="grid cols3">
      <section class="card"><div class="card-h"><span class="label">Total entradas</span><span class="tile pos"><span class="ms pos">south_west</span></span></div>
        <p class="big pos">${sgn(e)}<small>Kz</small></p><p class="note pos">+${s.variacao}% face ao mês anterior</p></section>
      <section class="card"><div class="card-h"><span class="label">Total saídas</span><span class="tile neg"><span class="ms neg">north_east</span></span></div>
        <p class="big neg">-${kz(sd)}<small>Kz</small></p><p class="note">Inclui custódia &amp; aportes de capital</p></section>
      <section class="card"><div class="card-h"><span class="label">Saldo líquido</span><span class="tile blue"><span class="ms blue">account_balance_wallet</span></span></div>
        <p class="big">${sgn(liq)}<small>Kz</small></p><p class="note"><span class="badge pos">${liq >= 0 ? "Superavitário" : "Deficitário"}</span> Taxa de liquidez: ${(liq / e * 100).toFixed(1).replace(".", ",")}%</p></section>
    </div>
    <section class="card">
      <label class="field"><span class="ms">search</span><input id="busca" type="search" placeholder="Procurar por descrição, título ou entidade..." value="${esc(mov.busca)}"></label>
      <div class="row"><label class="field"><span class="ms">calendar_today</span>
        <select id="periodo"><option value="mes">Período: Este Mês</option><option value="trim">Este Trimestre</option><option value="ano">Este Ano</option></select></label></div>
      <div class="tabs" role="tablist" id="tabs"></div>
    </section>
    <section class="card list" id="lista"></section>`;
  $("#periodo").value = mov.periodo;
  desenharLista();
  $("#novo").onclick = abrirModal;
  $("#busca").oninput = ev => { mov.busca = ev.target.value; desenharLista(); };
  $("#periodo").onchange = ev => { mov.periodo = ev.target.value; toast("Período: " + ev.target.selectedOptions[0].text); };
}

function desenharLista() {
  const q = mov.busca.trim().toLowerCase();
  const base = mov.lista.filter(m => !q || (m.titulo + m.entidade).toLowerCase().includes(q));
  const filtros = [["todas", "Todas"], ["entrada", "Entrada de Capital"], ["saida", "Saída de Capital"], ["rendimento", "Rendimento"], ["despesa", "Despesa"]];
  $("#tabs").innerHTML = filtros.map(([k, l]) => `<button class="tab" role="tab" data-k="${k}" aria-selected="${mov.filtro === k}">${l}${k === "todas" ? `<span class="n">${base.length}</span>` : ""}</button>`).join("");
  $("#tabs").onclick = ev => { const b = ev.target.closest(".tab"); if (b) { mov.filtro = b.dataset.k; desenharLista(); } };
  const lista = base.filter(m => mov.filtro === "todas" || m.tipo === mov.filtro);
  $("#lista").innerHTML = lista.length ? lista.map(m => {
    const t = DATA.tipos[m.tipo], pos = m.valor >= 0;
    return `<article class="item"><span class="tile ${t.cls}"><span class="ms ${t.cls}">${m.icon}</span></span>
      <div><h3>${esc(m.titulo)}</h3><p class="meta"><span class="ms">domain</span>${esc(m.entidade)}</p>
      <p style="margin-top:8px"><span class="badge ${t.cls}">${t.label}</span></p>
      <p class="status"><i class="${pos || m.estado === "Concluído" ? "" : "off"}"></i>${esc(m.estado)}</p>
      <p class="meta">${esc(m.data)}</p>
      <p class="amount ${pos ? "pos" : "neg"}">${sgn(m.valor)} <small>Kz</small></p></div></article>`;
  }).join("") : `<div class="empty">Nenhum movimento encontrado. Ajusta a pesquisa ou o filtro.</div>`;
  $("#lista").insertAdjacentHTML("beforeend", `<div class="pager"><span>A apresentar ${lista.length} de ${DATA.totalRegistos + mov.lista.length - DATA.movimentos.length} registos</span><span><b>1</b></span></div>`);
}

function abrirModal() {
  const m = $("#modal");
  m.hidden = false;
  m.innerHTML = `<form class="sheet" id="form" method="dialog">
    <h2>Registar movimento</h2>
    <label for="f-t">Descrição</label><div class="field"><input id="f-t" required maxlength="60" placeholder="Ex.: Cupão OT-NR 2028"></div>
    <label for="f-e">Entidade</label><div class="field"><select id="f-e">${DATA.entidades.map(e => `<option>${esc(e.nome)}</option>`).join("")}</select></div>
    <label for="f-k">Tipo</label><div class="field"><select id="f-k">${Object.entries(DATA.tipos).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("")}</select></div>
    <label for="f-v">Valor (Kz)</label><div class="field"><input id="f-v" type="number" min="1" step="any" required placeholder="0"></div>
    <div class="actions"><button class="btn primary" type="submit">Guardar movimento</button><button class="btn" type="button" id="cancelar">Cancelar</button></div></form>`;
  $("#f-t").focus();
  const fechar = () => { m.hidden = true; m.innerHTML = ""; };
  $("#cancelar").onclick = fechar;
  m.onclick = ev => { if (ev.target === m) fechar(); };
  document.onkeydown = ev => { if (ev.key === "Escape") fechar(); };
  $("#form").onsubmit = ev => {
    ev.preventDefault();
    const tipo = $("#f-k").value, v = Math.abs(parseFloat($("#f-v").value)), saida = DATA.tipos[tipo].cls === "neg";
    const icons = { rendimento: "payments", entrada: "account_balance", saida: "currency_exchange", despesa: "receipt_long" };
    mov.lista.unshift({ id: Date.now(), titulo: $("#f-t").value.trim(), entidade: $("#f-e").value, tipo, estado: "Concluído", data: "Hoje", valor: saida ? -v : v, icon: icons[tipo] });
    mov.extra[saida ? "s" : "e"] += v;
    store.set("movs", mov.lista); store.set("extra", mov.extra);
    fechar(); viewMovimentos(); toast("Movimento registado");
  };
}

/* ---------- Investimentos (Relatórios & Análise) ---------- */
function viewInvestimentos() {
  const r = DATA.relatorio, max = Math.max(...r.meses.map(m => m.rend));
  const kpi = (l, v, ic, nota, cls = "") => `<section class="card"><div class="card-h"><span class="label">${l}</span><span class="tile blue"><span class="ms blue">${ic}</span></span></div>
    <p class="big ${cls}">${v}</p><p class="note">${nota}</p></section>`;
  app.innerHTML = `
    <div class="page-head"><span class="crumb"><span class="ms" style="font-size:14px">verified_user</span>Regime Tributário AGT 2024 / Conformidade BNA</span>
      <h1>Relatórios &amp; Análise</h1><p class="sub">Desempenho patrimonial e análise de rentabilidade fiscal AGT em Kwanzas (Kz).</p>
      <div class="actions"><button class="btn" id="csv"><span class="ms">table_view</span>Excel / CSV</button><button class="btn primary" id="pdf"><span class="ms">picture_as_pdf</span>Exportar PDF</button></div></div>
    <div class="seg" id="seg">${["30 Dias", "Este Trimestre", "Ano 2024", "Personalizado"].map((t, i) => `<button aria-pressed="${i === 2}">${t}</button>`).join("")}</div>
    <div class="grid cols2">
      ${kpi("Património líquido consolidado", `${kz(r.patrimonio)}<small>Kz</small>`, "account_balance_wallet", `<span class="badge pos">+${r.crescimento}% a.a.</span> vs. período anterior`)}
      ${kpi("Rentabilidade global realizada", `+${kz(r.rentabilidade)}<small>Kz</small>`, "trending_up", "Cupões e juros liquidados", "pos")}
      ${kpi("Total encargos &amp; despesas", `${kz(r.encargos)}<small>Kz</small>`, "receipt_long", "Comissões de custódia e corretagem")}
      ${kpi("ROI médio ponderado", `${String(r.roi).replace(".", ",")}%`, "percent", "Acima da taxa Luibor de referência", "blue")}
    </div>
    <section class="card"><h2 style="font-size:20px">Evolução de Rendimentos vs. Despesas</h2><p class="note">Valores mensais consolidados em Kwanzas (Kz)</p>
      <div class="legend"><span><i style="background:var(--blue)"></i>Rendimentos</span><span><i style="background:#cbd5e1"></i>Despesas</span></div>
      ${r.meses.map(m => `<div class="bar-row"><header><span>${m.nome}</span><span class="pos">Liq: +${kz(m.rend - m.desp)} Kz</span></header>
        <div class="bar"><b style="width:${m.rend / max * 90}%;background:var(--blue)"></b><b style="width:${m.desp / max * 90}%;background:#cbd5e1"></b></div>
        <header><span class="pos">+${kz(m.rend)} Kz</span><span class="neg">-${kz(m.desp)} Kz</span></header></div>`).join("")}
      <div class="foot"><span>Rácio de Eficiência Operacional: ${String(r.eficiencia).replace(".", ",")}%</span><span><b>Base de Liquidação:</b> BNA / BODIVA</span></div></section>
    <section class="card"><h2 style="font-size:20px">Composição da Carteira</h2><p class="note">Por classe de risco e regime fiscal AGT</p>
      <div class="bar" style="height:10px;margin:14px 0">${r.carteira.map(c => `<b style="width:${c.valor / r.patrimonio * 100}%;background:${c.cor}"></b>`).join("")}</div>
      ${r.carteira.map(c => `<div class="comp" style="border-color:${c.cor}"><div><b>${c.nome}</b><br><span class="tag">${c.nota}</span></div>
        <div class="v">${kz(c.valor)} Kz<br><small class="note">${Math.round(c.valor / r.patrimonio * 100)}% do total</small></div></div>`).join("")}
      <div class="foot"><span>Volume Total Alocado:</span><b class="num" style="color:var(--ink)">${kz(r.patrimonio)} Kz</b></div></section>
    <section class="card"><h2 style="font-size:20px">Resumo de Eficiência por Investimento</h2><p class="note">Rentabilidade anualizada e perfil de mitigação de risco</p>
      <div class="tbl-wrap"><table><thead><tr><th>Ativo / Aplicação</th><th>Perfil de risco</th><th class="r">Volume alocado</th></tr></thead><tbody>
      ${r.ativos.map(a => `<tr><td><span class="mono">${a.sigla}</span><b>${a.nome}</b><br><span class="note">${a.info}</span></td><td><span class="badge neu">${a.risco}</span></td><td class="r num">${kz(a.valor)} Kz</td></tr>`).join("")}
      </tbody></table></div>
      <div class="foot"><span>Auditoria e conciliação em conformidade com o Banco Central de Angola (BNA)</span></div></section>`;
  $("#seg").onclick = ev => { const b = ev.target.closest("button"); if (!b) return; document.querySelectorAll("#seg button").forEach(x => x.setAttribute("aria-pressed", x === b)); toast("Período: " + b.textContent); };
  $("#pdf").onclick = () => window.print();
  $("#csv").onclick = () => {
    const linhas = [["Ativo", "Perfil de risco", "Volume (Kz)"], ...r.ativos.map(a => [a.nome, a.risco, a.valor])];
    const blob = new Blob(["\ufeff" + linhas.map(l => l.join(";")).join("\n")], { type: "text/csv" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "investcontrol-relatorio.csv" }); a.click(); toast("CSV exportado");
  };
}

/* ---------- Definições ---------- */
function viewDefinicoes() {
  const sw = store.get("sw", { bio: true, cupoes: true, email: true, push: true });
  const link = (ic, t, s) => `<button class="link-row"><span class="ms" style="color:var(--mute)">${ic}</span><div><b>${t}</b><small>${s}</small></div><span class="ms" style="color:var(--mute)">chevron_right</span></button>`;
  const tog = (k, ic, t, s) => `<div class="link-row"><span class="ms" style="color:var(--mute)">${ic}</span><div><b>${t}</b><small>${s}</small></div><button class="switch" role="switch" data-k="${k}" aria-checked="${sw[k]}" aria-label="${t}"></button></div>`;
  const head = (ic, t, s) => `<div class="set-h"><span class="tile blue"><span class="ms blue">${ic}</span></span><div><h2>${t}</h2><p class="note" style="margin:0">${s}</p></div></div>`;
  app.innerHTML = `
    <div class="page-head"><span class="crumb">Gestão institucional &amp; segurança</span><h1>Definições da Conta</h1><p class="sub">Configurações da entidade, segurança biométrica e preferências fiscais.</p></div>
    <section class="card"><div class="profile"><div class="avatar">MS</div><div><h2 style="font-size:20px">Dr. Mateus Silva</h2>
      <span class="badge" style="background:#dbeafe;color:var(--blue);margin:4px 0;display:inline-block">Conta Verificada AGT</span>
      <p class="note" style="margin:0">mateus.silva@atlantico.co.ao</p><p class="note" style="margin:0">Pessoa Singular &amp; Gestor Corporativo — Grupo Atlântico S.A.</p></div></div>
      <div class="actions"><button class="btn" id="perfil"><span class="ms">sync</span>Trocar perfil</button></div></section>
    <section class="card">${head("badge", "Perfil e Entidades", "Vínculos institucionais e registo fiscal")}
      ${link("domain", "Alternar Entidade Ativa", "Grupo Atlântico S.A. selecionado")}${link("description", "Dados Fiscais e NIF", "NIF: 5418290312 • Regime Geral AGT")}${link("location_on", "Endereço e Contactos Comerciais", "Torre Atlântico, 14º Andar, Luanda")}
      <div class="foot"><span>Jurisdição: República de Angola</span><button>Editar detalhes</button></div></section>
    <section class="card">${head("shield", "Segurança & Acesso", "Proteção em camadas e biometria")}
      ${link("password", "Palavra-passe e Autenticação de Dois Fatores (2FA)", "Ativo via SMS/App Autenticador")}
      ${tog("bio", "fingerprint", "Acesso Biométrico (Touch ID / Face ID)", "Desbloqueio rápido no dispositivo")}
      ${link("devices", "Sessões Ativas e Histórico de Dispositivos", "2 dispositivos autorizados em Luanda")}
      <div class="foot"><span>Último login: Hoje, 09:42 (MacBook Pro)</span><button>Gerir acessos</button></div></section>
    <section class="card">${head("notifications_active", "Notificações & Alertas Financeiros", "Acompanhamento contínuo de liquidez e títulos")}
      ${tog("cupoes", "attach_money", "Alertas de Pagamento de Cupões & Rendas", "Títulos do Tesouro (OT-NR, OT-TX) e dividendos")}
      ${tog("email", "forward_to_inbox", "Relatórios Semanais por Email", "Sumário consolidado de rentabilidade e TIR")}
      ${tog("push", "sensors", "Notificações Push de Movimentações", "Depósitos, transferências e ordens executadas")}
      <div class="foot"><span>Canal prioritário: SMS + App</span><button>Personalizar limiares</button></div></section>
    <section class="card">${head("tune", "Preferências do Sistema", "Moeda de reporte, localização e conformidade")}
      ${link("currency_exchange", "Moeda Padrão", "Kwanza Angolano (AOA / Kz)")}${link("translate", "Idioma da Interface", "Português (AO)")}${link("gavel", "Termos de Uso e Política de Privacidade", "Em conformidade com a Lei de Proteção de Dados (APD)")}
      <div class="foot"><span>Versão da App: v3.4.2 (Fintech Enterprise)</span><button>Ver notas</button></div></section>
    <button class="btn logout full" id="sair"><span class="ms">logout</span>Terminar sessão</button>
    <p class="note" style="text-align:center;margin-top:16px">InvestControl Institutional Wealth Management • Licenciada e Auditada</p>`;
  app.onclick = ev => {
    const s = ev.target.closest(".switch");
    if (s) { sw[s.dataset.k] = s.getAttribute("aria-checked") !== "true"; s.setAttribute("aria-checked", sw[s.dataset.k]); store.set("sw", sw); toast("Preferência guardada"); }
    else if (ev.target.closest(".link-row")) toast("Ecrã por implementar");
  };
  $("#perfil").onclick = () => toast("Perfil alternado");
  $("#sair").onclick = () => toast("Sessão terminada (demo)");
}

/* ---------- Dashboard & Entidades ---------- */
function viewDashboard() {
  const r = DATA.relatorio, m = DATA.resumoMes;
  app.innerHTML = `<div class="page-head"><h1>Dashboard</h1><p class="sub">Visão geral do património e da tesouraria do mês.</p></div>
    <div class="grid cols3">
      <section class="card"><span class="label">Património líquido</span><p class="big">${kz(r.patrimonio)}<small>Kz</small></p></section>
      <section class="card"><span class="label">Entradas do mês</span><p class="big pos">+${kz(m.entradas)}<small>Kz</small></p></section>
      <section class="card"><span class="label">Saídas do mês</span><p class="big neg">-${kz(m.saidas)}<small>Kz</small></p></section></div>
    <div class="actions"><a class="btn primary" href="#movimentos">Ver movimentos</a><a class="btn" href="#investimentos">Ver relatórios</a></div>`;
}
function viewEntidades() {
  app.innerHTML = `<div class="page-head"><h1>Entidades</h1><p class="sub">Empresas e veículos de investimento associados à conta.</p></div>
    <section class="card list">${DATA.entidades.map((e, i) => `<article class="item"><span class="tile blue"><span class="ms blue">domain</span></span>
      <div><h3>${e.nome}</h3><p class="meta">${e.tipo} • NIF ${e.nif}</p>${i === 0 ? `<p style="margin-top:8px"><span class="badge pos">Entidade ativa</span></p>` : ""}</div></article>`).join("")}</section>`;
}

/* ---------- Router ---------- */
const routes = { dashboard: viewDashboard, investimentos: viewInvestimentos, movimentos: viewMovimentos, entidades: viewEntidades, definicoes: viewDefinicoes };
function router() {
  const r = (location.hash.slice(1) in routes) ? location.hash.slice(1) : "movimentos";
  app.onclick = null; routes[r]();
  document.querySelectorAll(".bottom-nav a").forEach(a => a.classList.toggle("active", a.dataset.route === r));
  window.scrollTo(0, 0);
}
addEventListener("hashchange", router);
router();
