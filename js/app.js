/* InvestControl — app.js (JavaScript puro, sem dependências)
   Multi-utilizador com localStorage (demo). Para produção, trocar por API + base de dados. */
const $ = (s, r = document) => r.querySelector(s);
const app = $("#app");
const kz = n => Math.abs(n).toLocaleString("de-DE");
const sgn = n => (n >= 0 ? "+" : "-") + kz(n);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pc = n => n.toFixed(1).replace(".", ",") + "%";
const fdate = iso => new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
const sum = (a, f) => a.reduce((t, x) => t + f(x), 0);
const primeiro = s => s.split(" ")[0];

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove("show"), 2400);
}
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem("ic_" + k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem("ic_" + k, JSON.stringify(v)); } catch {} }
};
const sha = async s => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, "0")).join("");

/* ---------- Estado: utilizador e dados da conta ---------- */
let users = store.get("users", {}), U = users[store.get("sess", "")] || null, db = null;
const novoDb = () => ({ entidades: [], ativos: [], movs: [], notifs: [], ativa: null, sw: { cupoes: true, email: true, push: true } });
const carregar = () => { db = { ...novoDb(), ...store.get("db_" + U.email, {}) }; };
const save = () => { if (U) { store.set("db_" + U.email, db); lateral(); } };
const ent = id => db.entidades.find(e => e.id === id);
const nomeEnt = id => ent(id) ? esc(ent(id).nome) : "—";
if (U) carregar();

/* ---------- Notificações ---------- */
function notify(msg) {
  db.notifs.unshift({ id: Date.now(), msg, ts: new Date().toISOString(), lida: false });
  db.notifs = db.notifs.slice(0, 50); save(); badge();
}
function badge() {
  const n = U ? db.notifs.filter(x => !x.lida).length : 0, b = $("#badge");
  b.hidden = !n; b.textContent = n > 9 ? "9+" : n;
}
$("#bell").onclick = () => {
  if (!U) return;
  const n = db.notifs;
  const close = sheet(`<h2>Notificações</h2>${n.length ? n.map(x => `<div class="notif${x.lida ? "" : " new"}"><b>${esc(x.msg)}</b><small>${fdate(x.ts)} ${new Date(x.ts).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}</small></div>`).join("") : `<p class="empty">Sem notificações.</p>`}
    <div class="actions"><button class="btn" id="fx">Fechar</button></div>`);
  $("#fx").onclick = close;
  n.forEach(x => x.lida = true); save(); badge();
};

/* ---------- Barra lateral esquerda: dados do utilizador ---------- */
function lateral() {
  const el = $("#side-user"); if (!el) return;
  if (!U) { el.innerHTML = ""; return; }
  const ea = ent(db.ativa), pat = sum(db.ativos, a => a.valor);
  el.innerHTML = `<div class="su-top"><div class="avatar su-av">${esc(sigla(U.nome))}</div><div><b>${esc(U.nome)}</b><small>${esc(U.email)}</small></div></div>
    <dl><dt>Entidade ativa</dt><dd>${ea ? esc(ea.nome) : "—"}</dd>
    <dt>Entidades</dt><dd>${db.entidades.length}</dd>
    <dt>Investimentos</dt><dd>${db.ativos.length}</dd>
    <dt>Património</dt><dd class="num">${kz(pat)} Kz</dd>
    ${U.desde ? `<dt>Membro desde</dt><dd>${fdate(U.desde)}</dd>` : ""}</dl>
    <button class="btn full" id="side-sair"><span class="ms">logout</span>Terminar sessão</button>`;
  $("#side-sair").onclick = sair;
}

/* ---------- Modais e formulários ---------- */
function sheet(html) {
  const m = $("#modal"); m.hidden = false; m.innerHTML = `<div class="sheet">${html}</div>`;
  const close = () => { m.hidden = true; m.innerHTML = ""; document.onkeydown = null; };
  m.onclick = e => { if (e.target === m) close(); };
  document.onkeydown = e => { if (e.key === "Escape") close(); };
  return close;
}
const fld = (id, l, inner) => `<label for="${id}">${l}</label><div class="field">${inner}</div>`;
const opts = (arr, sel) => arr.map(([v, l]) => `<option value="${esc(v)}"${v == sel ? " selected" : ""}>${esc(l)}</option>`).join("");
function formModal(titulo, campos, ok, cb) {
  const close = sheet(`<form id="form"><h2>${titulo}</h2>${campos}<div class="actions"><button class="btn primary" type="submit">${ok}</button><button class="btn" type="button" id="cancelar">Cancelar</button></div></form>`);
  $("#cancelar").onclick = close; $("#form input, #form select").focus();
  $("#form").onsubmit = e => { e.preventDefault(); cb(close); };
}
const precisaEntidade = () => { if (db.entidades.length) return false; toast("Adiciona primeiro uma entidade"); location.hash = "#entidades"; return true; };
const selEnt = id => `<select id="${id}">${opts(db.entidades.map(e => [e.id, e.nome]), db.ativa)}</select>`;

/* ---------- Autenticação ---------- */
function viewAuth(modo = "entrar") {
  document.body.classList.add("auth"); badge();
  const reg = modo === "criar";
  app.innerHTML = `<div class="auth-box"><span class="logo" style="margin:0 auto 6px">JJJ</span><p class="brand-name" style="text-align:center;font-weight:700;font-size:18px;margin-bottom:14px">INVESTCONTROL</p>
    <h1 style="text-align:center">${reg ? "Criar conta" : "Entrar"}</h1>
    <p class="sub" style="text-align:center;margin-bottom:16px">${reg ? "Cada conta tem as suas próprias entidades, investimentos e movimentos." : "Acede à tua carteira de investimentos."}</p>
    <form class="card" id="auth">
      ${reg ? fld("a-n", "Nome completo", `<input id="a-n" required maxlength="60" autocomplete="name">`) : ""}
      ${fld("a-e", "Email", `<input id="a-e" type="email" required autocomplete="email">`)}
      ${fld("a-p", "Palavra-passe", `<input id="a-p" type="password" required minlength="6" autocomplete="${reg ? "new-password" : "current-password"}">`)}
      <p class="err" id="a-err" role="alert"></p>
      <button class="btn primary full" style="margin-top:8px">${reg ? "Criar conta" : "Entrar"}</button></form>
    <p style="text-align:center"><button class="linkbtn" id="troca">${reg ? "Já tenho conta — entrar" : "Não tenho conta — registar"}</button></p></div>`;
  $("#troca").onclick = () => viewAuth(reg ? "entrar" : "criar");
  $("#auth").onsubmit = async ev => {
    ev.preventDefault();
    const email = $("#a-e").value.trim().toLowerCase(), h = await sha(email + $("#a-p").value), err = m => $("#a-err").textContent = m;
    if (reg) {
      if (users[email]) return err("Já existe uma conta com este email.");
      users[email] = { nome: $("#a-n").value.trim(), email, h, desde: new Date().toISOString() }; store.set("users", users); entrar(email, true);
    } else {
      if (!users[email] || users[email].h !== h) return err("Email ou palavra-passe incorretos.");
      entrar(email);
    }
  };
}
function entrar(email, novo) {
  U = users[email]; store.set("sess", email); carregar();
  if (novo) notify(`Bem-vindo, ${primeiro(U.nome)}! Começa por adicionar uma entidade.`);
  document.body.classList.remove("auth"); location.hash = "#dashboard"; router();
}
function sair() { store.set("sess", ""); U = db = null; router(); }

/* ---------- Utilitários de cálculo ---------- */
const noPeriodo = p => {
  const d = new Date(), i = p === "ano" ? new Date(d.getFullYear(), 0, 1) : p === "trim" ? new Date(d.getFullYear(), d.getMonth() - d.getMonth() % 3, 1) : new Date(d.getFullYear(), d.getMonth(), 1);
  return m => new Date(m.ts) >= i;
};
const totais = movs => { const e = sum(movs.filter(m => m.valor > 0), m => m.valor), s = sum(movs.filter(m => m.valor < 0), m => -m.valor); return { e, s, liq: e - s }; };
const sigla = n => n.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
function carregarDemo() {
  const d = DATA.demo, t = Date.now();
  db.entidades = d.entidades.map(e => ({ ...e })); db.ativa = d.entidades[0].id;
  db.ativos = d.ativos.map(a => ({ ...a }));
  db.movs = d.movs.map(({ dias, ...m }) => ({ ...m, estado: "Concluído", ts: new Date(t - dias * 864e5).toISOString() }));
  notify("Dados de exemplo carregados."); toast("Dados de exemplo carregados"); router();
}
const btnDemo = () => (!db.entidades.length && !db.ativos.length && !db.movs.length) ? `<button class="btn" id="demo">Carregar dados de exemplo</button>` : "";
const ligarDemo = () => { const b = $("#demo"); if (b) b.onclick = carregarDemo; };

/* ---------- Dashboard ---------- */
function viewDashboard() {
  const pat = sum(db.ativos, a => a.valor), t = totais(db.movs.filter(noPeriodo("mes")));
  const passos = [["Adicionar uma entidade", db.entidades.length, "#entidades"], ["Registar um investimento", db.ativos.length, "#investimentos"], ["Registar um movimento", db.movs.length, "#movimentos"]];
  app.innerHTML = `<div class="page-head"><h1>Olá, ${esc(primeiro(U.nome))}</h1><p class="sub">Visão geral do património e da tesouraria do mês.</p></div>
    ${passos.every(p => p[1]) ? "" : `<section class="card"><h2 style="font-size:18px">Primeiros passos</h2>
      ${passos.map(([t, ok, h]) => `<a class="link-row" href="${h}"><span class="ms ${ok ? "pos" : ""}">${ok ? "check_circle" : "radio_button_unchecked"}</span><div><b>${t}</b></div></a>`).join("")}
      <div class="actions">${btnDemo()}</div></section>`}
    <div class="grid cols3">
      <section class="card"><span class="label">Património líquido</span><p class="big">${kz(pat)}<small>Kz</small></p><p class="note">${db.ativos.length} investimento(s) em ${db.entidades.length} entidade(s)</p></section>
      <section class="card"><span class="label">Entradas do mês</span><p class="big pos">+${kz(t.e)}<small>Kz</small></p></section>
      <section class="card"><span class="label">Saídas do mês</span><p class="big neg">-${kz(t.s)}<small>Kz</small></p></section></div>
    <div class="actions"><a class="btn primary" href="#movimentos">Ver movimentos</a><a class="btn" href="#investimentos">Ver relatórios</a></div>`;
  ligarDemo();
}

/* ---------- Movimentos ---------- */
const mov = { busca: "", filtro: "todas", periodo: "mes" };

function viewMovimentos() {
  const t = totais(db.movs.filter(noPeriodo(mov.periodo)));
  app.innerHTML = `
    <div class="page-head">
      <span class="crumb">Gestão de Tesouraria • ${new Date().toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}</span>
      <h1>Movimentações Financeiras</h1>
      <p class="sub">Histórico consolidado de entradas, saídas e rendimentos em Kwanzas (Kz)</p>
      <div class="actions"><button class="btn primary" id="novo"><span class="ms">add</span>Registar movimento</button></div>
    </div>
    <div class="grid cols3">
      <section class="card"><div class="card-h"><span class="label">Total entradas</span><span class="tile pos"><span class="ms pos">south_west</span></span></div>
        <p class="big pos">${sgn(t.e)}<small>Kz</small></p></section>
      <section class="card"><div class="card-h"><span class="label">Total saídas</span><span class="tile neg"><span class="ms neg">north_east</span></span></div>
        <p class="big neg">-${kz(t.s)}<small>Kz</small></p><p class="note">Inclui custódia &amp; aportes de capital</p></section>
      <section class="card"><div class="card-h"><span class="label">Saldo líquido</span><span class="tile blue"><span class="ms blue">account_balance_wallet</span></span></div>
        <p class="big">${sgn(t.liq)}<small>Kz</small></p><p class="note"><span class="badge ${t.liq >= 0 ? "pos" : "neg"}">${t.liq >= 0 ? "Superavitário" : "Deficitário"}</span> Taxa de liquidez: ${t.e ? pc(t.liq / t.e * 100) : "—"}</p></section>
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
  $("#novo").onclick = abrirMov;
  $("#busca").oninput = ev => { mov.busca = ev.target.value; desenharLista(); };
  $("#periodo").onchange = ev => { mov.periodo = ev.target.value; viewMovimentos(); };
}

function desenharLista() {
  const q = mov.busca.trim().toLowerCase();
  const base = db.movs.filter(noPeriodo(mov.periodo)).filter(m => !q || (m.titulo + (ent(m.eid)?.nome || "")).toLowerCase().includes(q));
  const filtros = [["todas", "Todas"], ["entrada", "Entrada de Capital"], ["saida", "Saída de Capital"], ["rendimento", "Rendimento"], ["despesa", "Despesa"]];
  $("#tabs").innerHTML = filtros.map(([k, l]) => `<button class="tab" role="tab" data-k="${k}" aria-selected="${mov.filtro === k}">${l}${k === "todas" ? `<span class="n">${base.length}</span>` : ""}</button>`).join("");
  $("#tabs").onclick = ev => { const b = ev.target.closest(".tab"); if (b) { mov.filtro = b.dataset.k; desenharLista(); } };
  const lista = base.filter(m => mov.filtro === "todas" || m.tipo === mov.filtro);
  $("#lista").innerHTML = lista.length ? lista.map(m => {
    const t = DATA.tipos[m.tipo], pos = m.valor >= 0;
    return `<article class="item"><span class="tile ${t.cls}"><span class="ms ${t.cls}">${DATA.icons[m.tipo]}</span></span>
      <div><h3>${esc(m.titulo)}</h3><p class="meta"><span class="ms">domain</span>${nomeEnt(m.eid)}</p>
      <p style="margin-top:8px"><span class="badge ${t.cls}">${t.label}</span></p>
      <p class="status"><i></i>${esc(m.estado)}</p><p class="meta">${fdate(m.ts)}</p>
      <p class="amount ${pos ? "pos" : "neg"}">${sgn(m.valor)} <small>Kz</small></p></div></article>`;
  }).join("") : `<div class="empty">Nenhum movimento encontrado. Regista um movimento ou ajusta a pesquisa e o filtro.</div>`;
  $("#lista").insertAdjacentHTML("beforeend", `<div class="pager"><span>A apresentar ${lista.length} de ${db.movs.length} registos</span></div>`);
}

function abrirMov() {
  if (precisaEntidade()) return;
  formModal("Registar movimento",
    fld("f-t", "Descrição", `<input id="f-t" required maxlength="60" placeholder="Ex.: Cupão OT-NR 2028">`) +
    fld("f-e", "Entidade", selEnt("f-e")) +
    fld("f-k", "Tipo", `<select id="f-k">${opts(Object.entries(DATA.tipos).map(([k, v]) => [k, v.label]))}</select>`) +
    fld("f-v", "Valor (Kz)", `<input id="f-v" type="number" min="1" step="any" required placeholder="0">`),
    "Guardar movimento", close => {
      const tipo = $("#f-k").value, v = Math.abs(parseFloat($("#f-v").value)), saida = DATA.tipos[tipo].cls === "neg", titulo = $("#f-t").value.trim();
      db.movs.unshift({ id: Date.now(), eid: +$("#f-e").value, titulo, tipo, estado: "Concluído", ts: new Date().toISOString(), valor: saida ? -v : v });
      notify(`Movimento registado: ${titulo} (${sgn(saida ? -v : v)} Kz)`);
      close(); viewMovimentos(); toast("Movimento registado");
    });
}

/* ---------- Investimentos (Relatórios & Análise) ---------- */
function viewInvestimentos() {
  const A = [...db.ativos].sort((a, b) => b.valor - a.valor), pat = sum(A, a => a.valor);
  const cab = `<div class="page-head"><span class="crumb"><span class="ms" style="font-size:14px">verified_user</span>Regime Tributário AGT / Conformidade BNA</span>
    <h1>Relatórios &amp; Análise</h1><p class="sub">Desempenho patrimonial e análise de rentabilidade em Kwanzas (Kz).</p>
    <div class="actions"><button class="btn primary" id="novoA"><span class="ms">add</span>Novo investimento</button>
    ${A.length ? `<button class="btn" id="csv"><span class="ms">table_view</span>Excel / CSV</button><button class="btn" id="pdf"><span class="ms">picture_as_pdf</span>Exportar PDF</button>` : btnDemo()}</div></div>`;
  if (!A.length) {
    app.innerHTML = cab + `<section class="card"><p class="empty">Ainda não tens investimentos. Adiciona o primeiro para ver a análise de rentabilidade e risco.</p></section>`;
    $("#novoA").onclick = abrirAtivo; ligarDemo(); return;
  }
  const rend = sum(db.movs.filter(m => m.tipo === "rendimento"), m => m.valor), enc = sum(db.movs.filter(m => m.tipo === "despesa"), m => -m.valor);
  const yp = sum(A, a => a.valor * a.taxa) / pat, efic = rend ? (rend - enc) / rend * 100 : 0;
  const meses = [...Array(6)].map((_, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); const k = d.getFullYear() * 12 + d.getMonth();
    const ms = db.movs.filter(m => { const x = new Date(m.ts); return x.getFullYear() * 12 + x.getMonth() === k; });
    return { nome: d.toLocaleDateString("pt-PT", { month: "short", year: "numeric" }), rend: sum(ms.filter(m => m.valor > 0), m => m.valor), desp: sum(ms.filter(m => m.valor < 0), m => -m.valor) };
  });
  const max = Math.max(1, ...meses.map(m => Math.max(m.rend, m.desp)));
  const cls = Object.entries(DATA.classes).map(([k, c]) => ({ ...c, valor: sum(A.filter(a => a.classe === k), a => a.valor) })).filter(c => c.valor);
  const kpi = (l, v, ic, nota, c = "") => `<section class="card"><div class="card-h"><span class="label">${l}</span><span class="tile blue"><span class="ms blue">${ic}</span></span></div><p class="big ${c}">${v}</p><p class="note">${nota}</p></section>`;
  app.innerHTML = cab + `
    <div class="grid cols2">
      ${kpi("Património líquido consolidado", `${kz(pat)}<small>Kz</small>`, "account_balance_wallet", `${A.length} investimento(s) ativo(s)`)}
      ${kpi("Rentabilidade global realizada", `+${kz(rend)}<small>Kz</small>`, "trending_up", "Cupões, rendas e juros liquidados", "pos")}
      ${kpi("Total encargos &amp; despesas", `${kz(enc)}<small>Kz</small>`, "receipt_long", "Comissões, manutenção e custódia")}
      ${kpi("Rentabilidade anual ponderada", pc(yp), "percent", `Rácio de eficiência: ${pc(efic)}`, "blue")}
    </div>
    <section class="card"><h2 style="font-size:20px">Evolução de Rendimentos vs. Despesas</h2><p class="note">Últimos 6 meses, a partir dos teus movimentos</p>
      <div class="legend"><span><i style="background:var(--blue)"></i>Entradas</span><span><i style="background:#cbd5e1"></i>Saídas</span></div>
      ${meses.map(m => `<div class="bar-row"><header><span>${m.nome}</span><span class="${m.rend >= m.desp ? "pos" : "neg"}">Liq: ${sgn(m.rend - m.desp)} Kz</span></header>
        <div class="bar"><b style="width:${m.rend / max * 90}%;background:var(--blue)"></b><b style="width:${m.desp / max * 90}%;background:#cbd5e1"></b></div></div>`).join("")}</section>
    <section class="card"><h2 style="font-size:20px">Composição da Carteira</h2><p class="note">Por classe de risco e regime fiscal</p>
      <div class="bar" style="height:10px;margin:14px 0">${cls.map(c => `<b style="width:${c.valor / pat * 100}%;background:${c.cor}"></b>`).join("")}</div>
      ${cls.map(c => `<div class="comp" style="border-color:${c.cor}"><div><b>${c.label}</b><br><span class="tag">${c.nota}</span></div>
        <div class="v">${kz(c.valor)} Kz<br><small class="note">${Math.round(c.valor / pat * 100)}% do total</small></div></div>`).join("")}
      <div class="foot"><span>Volume Total Alocado:</span><b class="num" style="color:var(--ink)">${kz(pat)} Kz</b></div></section>
    <section class="card"><h2 style="font-size:20px">Resumo de Eficiência por Investimento</h2><p class="note">Rentabilidade anual, peso na carteira e perfil de risco</p>
      <div class="tbl-wrap"><table><thead><tr><th>Ativo / Aplicação</th><th>Perfil de risco</th><th class="r">Rent. anual</th><th>Peso</th><th class="r">Volume</th><th></th></tr></thead><tbody id="tb">
      ${A.map(a => { const c = DATA.classes[a.classe], w = a.valor / pat * 100; return `<tr><td><span class="mono">${esc(sigla(a.nome))}</span><b>${esc(a.nome)}</b><br><span class="note">${nomeEnt(a.eid)}${a.info ? " • " + esc(a.info) : ""}</span></td>
        <td><span class="badge neu">${c.risco}</span></td><td class="r num">${pc(a.taxa)}</td>
        <td class="num">${pc(w)}<div class="bar" style="height:6px"><b style="width:${w}%;background:${c.cor}"></b></div></td>
        <td class="r num">${kz(a.valor)} Kz</td><td class="r"><button class="icon-btn" data-del="${a.id}" aria-label="Remover ${esc(a.nome)}"><span class="ms">delete</span></button></td></tr>`; }).join("")}
      </tbody></table></div>
      <div class="foot"><span>Auditoria e conciliação em conformidade com o Banco Nacional de Angola (BNA)</span></div></section>`;
  $("#novoA").onclick = abrirAtivo;
  $("#pdf").onclick = () => window.print();
  $("#csv").onclick = () => {
    const linhas = [["Ativo", "Entidade", "Perfil de risco", "Rent. anual (%)", "Volume (Kz)"], ...A.map(a => [a.nome, ent(a.eid)?.nome || "", DATA.classes[a.classe].risco, a.taxa, a.valor])];
    const blob = new Blob(["\ufeff" + linhas.map(l => l.join(";")).join("\n")], { type: "text/csv" });
    Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "investcontrol-relatorio.csv" }).click(); toast("CSV exportado");
  };
  $("#tb").onclick = ev => {
    const b = ev.target.closest("[data-del]"); if (!b) return;
    const a = db.ativos.find(x => x.id === +b.dataset.del);
    if (a && confirm(`Remover "${a.nome}"?`)) { db.ativos = db.ativos.filter(x => x !== a); notify(`Investimento removido: ${a.nome}`); viewInvestimentos(); }
  };
}

function abrirAtivo() {
  if (precisaEntidade()) return;
  formModal("Novo investimento",
    fld("i-n", "Designação", `<input id="i-n" required maxlength="60" placeholder="Ex.: Títulos do Tesouro OT-NR">`) +
    fld("i-e", "Entidade", selEnt("i-e")) +
    fld("i-c", "Classe", `<select id="i-c">${opts(Object.entries(DATA.classes).map(([k, c]) => [k, c.label]))}</select>`) +
    fld("i-i", "Detalhe (opcional)", `<input id="i-i" maxlength="60" placeholder="Ex.: Maturidade Nov 2028">`) +
    fld("i-v", "Volume alocado (Kz)", `<input id="i-v" type="number" min="1" step="any" required>`) +
    fld("i-t", "Rentabilidade anual (%)", `<input id="i-t" type="number" min="0" max="100" step="any" required>`),
    "Guardar investimento", close => {
      const a = { id: Date.now(), eid: +$("#i-e").value, nome: $("#i-n").value.trim(), classe: $("#i-c").value, info: $("#i-i").value.trim(), valor: parseFloat($("#i-v").value), taxa: parseFloat($("#i-t").value) };
      db.ativos.push(a); notify(`Novo investimento: ${a.nome} (${kz(a.valor)} Kz)`);
      close(); viewInvestimentos(); toast("Investimento guardado");
    });
}

/* ---------- Entidades ---------- */
function viewEntidades() {
  app.innerHTML = `<div class="page-head"><h1>Entidades</h1><p class="sub">Empresas e veículos de investimento associados à conta.</p>
    <div class="actions"><button class="btn primary" id="novaE"><span class="ms">add</span>Nova entidade</button>${btnDemo()}</div></div>
    <section class="card list" id="ents">${db.entidades.length ? db.entidades.map(e => {
      const as = db.ativos.filter(a => a.eid === e.id), ativa = db.ativa === e.id;
      return `<article class="item"><span class="tile blue"><span class="ms blue">domain</span></span>
        <div><h3>${esc(e.nome)}</h3><p class="meta">${esc(e.tipo)} • NIF ${esc(e.nif)}</p>
        <p class="meta">${as.length} investimento(s) • ${kz(sum(as, a => a.valor))} Kz</p>
        <div class="actions">${ativa ? `<span class="badge pos">Entidade ativa</span>` : `<button class="btn" data-ativa="${e.id}">Tornar ativa</button>`}
        <button class="btn" data-rm="${e.id}" aria-label="Remover ${esc(e.nome)}"><span class="ms">delete</span></button></div></div></article>`;
    }).join("") : `<div class="empty">Ainda não tens entidades. Adiciona a primeira para começar a registar investimentos.</div>`}</section>`;
  ligarDemo();
  $("#novaE").onclick = () => formModal("Nova entidade",
    fld("e-n", "Nome", `<input id="e-n" required maxlength="60">`) +
    fld("e-t", "Tipo", `<select id="e-t">${opts(DATA.tiposEntidade.map(t => [t, t]))}</select>`) +
    fld("e-f", "NIF", `<input id="e-f" required minlength="9" maxlength="14" pattern="[A-Za-z0-9]+" title="Só letras e números">`),
    "Guardar entidade", close => {
      const nif = $("#e-f").value.trim();
      if (db.entidades.some(e => e.nif === nif)) return toast("Já existe uma entidade com este NIF");
      const e = { id: Date.now(), nome: $("#e-n").value.trim(), tipo: $("#e-t").value, nif };
      db.entidades.push(e); if (!db.ativa) db.ativa = e.id;
      notify(`Entidade adicionada: ${e.nome}`); close(); viewEntidades(); toast("Entidade guardada");
    });
  $("#ents").onclick = ev => {
    const a = ev.target.closest("[data-ativa]"), r = ev.target.closest("[data-rm]");
    if (a) { db.ativa = +a.dataset.ativa; save(); viewEntidades(); }
    if (r) {
      const id = +r.dataset.rm, e = ent(id);
      if (db.ativos.some(x => x.eid === id) || db.movs.some(x => x.eid === id)) return toast("Remove primeiro os investimentos e movimentos desta entidade");
      if (!confirm(`Remover "${e.nome}"?`)) return;
      db.entidades = db.entidades.filter(x => x.id !== id); if (db.ativa === id) db.ativa = db.entidades[0]?.id ?? null;
      notify(`Entidade removida: ${e.nome}`); viewEntidades();
    }
  };
}

/* ---------- Definições ---------- */
function viewDefinicoes() {
  const sw = db.sw, ea = ent(db.ativa);
  const link = (ic, t, s) => `<button class="link-row"><span class="ms" style="color:var(--mute)">${ic}</span><div><b>${t}</b><small>${s}</small></div><span class="ms" style="color:var(--mute)">chevron_right</span></button>`;
  const tog = (k, ic, t, s) => `<div class="link-row"><span class="ms" style="color:var(--mute)">${ic}</span><div><b>${t}</b><small>${s}</small></div><button class="switch" role="switch" data-k="${k}" aria-checked="${sw[k]}" aria-label="${t}"></button></div>`;
  const head = (ic, t, s) => `<div class="set-h"><span class="tile blue"><span class="ms blue">${ic}</span></span><div><h2>${t}</h2><p class="note" style="margin:0">${s}</p></div></div>`;
  app.innerHTML = `
    <div class="page-head"><span class="crumb">Gestão institucional &amp; segurança</span><h1>Definições da Conta</h1><p class="sub">Dados da conta e preferências de alertas.</p></div>
    <section class="card"><div class="profile"><div class="avatar">${esc(sigla(U.nome))}</div><div><h2 style="font-size:20px">${esc(U.nome)}</h2>
      <p class="note" style="margin:4px 0 0">${esc(U.email)}</p>
      <p class="note" style="margin:0">${ea ? "Entidade ativa: " + esc(ea.nome) : "Sem entidade ativa"}</p></div></div></section>
    <section class="card">${head("notifications_active", "Notificações & Alertas", "Acompanhamento de liquidez e movimentos")}
      ${tog("cupoes", "attach_money", "Alertas de Pagamento de Cupões & Rendas", "Títulos do Tesouro e rendas")}
      ${tog("email", "forward_to_inbox", "Relatórios Semanais por Email", "Sumário de rentabilidade")}
      ${tog("push", "sensors", "Notificações de Movimentações", "Depósitos, transferências e ordens")}</section>
    <section class="card">${head("shield", "Segurança & Acesso", "Proteção da conta")}
      ${link("password", "Alterar palavra-passe", "Ecrã por implementar")}${link("devices", "Sessões ativas", "Ecrã por implementar")}</section>
    <button class="btn logout full" id="sair"><span class="ms">logout</span>Terminar sessão</button>`;
  app.onclick = ev => {
    const s = ev.target.closest(".switch");
    if (s) { sw[s.dataset.k] = s.getAttribute("aria-checked") !== "true"; s.setAttribute("aria-checked", sw[s.dataset.k]); save(); toast("Preferência guardada"); }
    else if (ev.target.closest(".link-row")) toast("Ecrã por implementar");
  };
  $("#sair").onclick = sair;
}

/* ---------- Router ---------- */
const routes = { dashboard: viewDashboard, investimentos: viewInvestimentos, movimentos: viewMovimentos, entidades: viewEntidades, definicoes: viewDefinicoes };
function router() {
  app.onclick = null;
  if (!U) { lateral(); return viewAuth(); }
  document.body.classList.remove("auth");
  const r = (location.hash.slice(1) in routes) ? location.hash.slice(1) : "dashboard";
  routes[r](); badge(); lateral();
  document.querySelectorAll(".bottom-nav a").forEach(a => a.classList.toggle("active", a.dataset.route === r));
  window.scrollTo(0, 0);
}
addEventListener("hashchange", router);
router();
