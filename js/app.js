import { MATERIAS, QUESTOES, FLASHCARDS, TEXTOS, VIDEOS } from './data.js';
import { db, auth, usuario } from './store.js';
import { gerarPlano, statsPorTema, montarSimulado, revisarCard } from './scheduler.js';

const $app = document.getElementById('app');
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const S = { view: 'dashboard', msg: '', simulado: null, card: null, flip: false, sala: null, texto: null };
const go = (v) => { S.view = v; S.msg = ''; render(); };

// ---------- Autenticação ----------
function authView(modo = 'entrar') {
  $app.innerHTML = `<div class="auth card"><h1>🌿 Gestor de Estudos</h1>
  <p class="muted">Seu caminho até a aprovação, passo a passo.</p>
  <form id="f">${modo === 'registrar' ? '<label>Nome<input name="nome" required></label>' : ''}
  <label>E-mail<input name="email" type="email" required></label>
  <label>Senha<input name="senha" type="password" minlength="6" required></label>
  <p class="erro-msg" id="m"></p>
  <button class="btn">${modo === 'entrar' ? 'Entrar' : 'Criar conta'}</button>
  <button type="button" class="btn sec" id="alt">${modo === 'entrar' ? 'Criar conta' : 'Já tenho conta'}</button></form></div>`;
  document.getElementById('alt').onclick = () => authView(modo === 'entrar' ? 'registrar' : 'entrar');
  document.getElementById('f').onsubmit = async (e) => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    try { modo === 'entrar' ? await auth.entrar(f.email, f.senha) : await auth.registrar(f.nome, f.email, f.senha); render(); }
    catch (err) { document.getElementById('m').textContent = err.message; }
  };
}

// ---------- Utilidades ----------
const bar = (pct, warn) => `<div class="bar ${warn ? 'warn' : ''}"><i style="width:${Math.round(pct)}%"></i></div>`;
const videoPara = (q) => VIDEOS.find(v => v.materia === q.tags_materia[0] && v.tema === q.tags_materia[1]);
const porId = (id) => QUESTOES.find(q => q.id === id);

// ---------- Views ----------
function dashboard(u) {
  const regs = usuario.registros(), plano = gerarPlano(QUESTOES, regs);
  const st = statsPorTema(QUESTOES, regs);
  const mat = MATERIAS.map(m => {
    const r = st.filter(s => s.materia === m), t = r.reduce((a, s) => a + s.total, 0), ac = r.reduce((a, s) => a + s.acertos, 0);
    return { m, t, pct: t ? ac / t * 100 : 0 };
  });
  const total = regs.length, acertos = regs.filter(r => r.acertou_bool).length;
  const pendentes = Object.values(u.erros).filter(e => !e.resolvido).length;
  return `<h2>Olá, ${esc(u.nome.split(' ')[0])} 👋</h2>
  <div class="grid">
    <div class="card"><b>Desempenho geral</b><h1>${total ? Math.round(acertos / total * 100) : 0}%</h1><span class="muted">${acertos}/${total} questões certas</span></div>
    <div class="card"><b>Erros a revisar</b><h1>${pendentes}</h1><button class="btn sec" data-go="erros">Abrir repositório</button></div>
    <div class="card"><b>Atalhos</b><div class="row" style="margin-top:8px"><button class="btn" data-go="simulado">Simulado rápido</button><button class="btn sec" data-go="flashcards">Flashcards</button></div></div>
  </div>
  <h3>📅 Cronograma de hoje <span class="muted" style="font-size:14px">(recalculado a cada exercício)</span></h3>
  ${plano.map(p => `<div class="card"><div class="row sb"><div><b>${esc(p.tema)}</b> <span class="tag">${p.materia}</span>
    ${p.prioridade >= 50 ? '<span class="tag pill-alta">prioridade alta</span>' : ''}</div><span class="muted">prioridade ${p.prioridade}</span></div>
    ${bar(p.prioridade, true)}<div class="row" style="margin-top:10px">${p.tarefas.map(t => t.tipo === 'video'
      ? `<a class="btn sec" href="${videoPara({ tags_materia: [p.materia, p.tema] })?.url}" target="_blank" rel="noopener">▶ ${t.rotulo}</a>`
      : `<button class="btn" data-sim-tema="${esc(p.tema)}" data-qtd="${t.qtd}">✏️ ${t.rotulo}</button>`).join('')}</div></div>`).join('')}
  <h3>📈 Evolução por disciplina</h3><div class="card">${mat.map(x => `<div style="margin:8px 0"><div class="row sb"><span>${x.m}</span><span class="muted">${x.t ? Math.round(x.pct) + '% · ' + x.t + ' questões' : 'sem dados'}</span></div>${bar(x.pct)}</div>`).join('')}</div>`;
}

function renderQuestoes(titulo, lista) {
  const s = S.simulado;
  if (!s) return `<h2>${titulo}</h2><div class="card"><p>Questões focadas nos seus temas de menor desempenho.</p><button class="btn" data-start="5">Gerar simulado (5 questões)</button></div>`;
  if (s.i >= s.qs.length) return `<h2>Resultado</h2><div class="card"><h1>${s.acertos}/${s.qs.length}</h1><p class="muted">Seu cronograma foi reajustado.</p>
    <button class="btn" data-go="dashboard">Ver cronograma</button> <button class="btn sec" data-go="erros">Revisar erros</button></div>`;
  const q = s.qs[s.i];
  return `<h2>${titulo} ${s.i + 1}/${s.qs.length}</h2><div class="card"><span class="tag">${q.tags_materia.join(' · ')}</span><p><b>${esc(q.enunciado)}</b></p>
    ${q.alternativas.map((a, i) => `<button class="opt ${s.resp == null ? '' : i === q.gabarito ? 'certa' : i === s.resp ? 'errada' : ''}" data-resp="${i}" ${s.resp != null ? 'disabled' : ''}>${'ABCD'[i]}) ${esc(a)}</button>`).join('')}
    ${s.resp != null ? `<button class="btn" data-next>Próxima</button>` : ''}</div>`;
}

function flashcards(u) {
  const agora = Date.now();
  const devidos = FLASHCARDS.filter(c => !(u.flashcards[c.id]?.prox > agora));
  if (!devidos.length) return `<h2>Flashcards</h2><div class="card">🌱 Tudo revisado por hoje! Volte amanhã.</div>`;
  const c = devidos.find(x => x.id === S.card) || devidos[0]; S.card = c.id;
  return `<h2>Flashcards <span class="muted" style="font-size:14px">${devidos.length} para revisar</span></h2>
  <div class="card flip" data-flip><div><span class="tag">${c.materia}</span><br>${esc(S.flip ? c.verso : c.frente)}<br><small class="muted">${S.flip ? '' : 'toque para virar'}</small></div></div>
  ${S.flip ? `<div class="row"><button class="btn terra" data-nota="0">Errei</button><button class="btn sec" data-nota="1">Difícil</button><button class="btn" data-nota="2">Fácil</button></div>` : ''}`;
}

function erros(u) {
  const lista = Object.entries(u.erros).filter(([, e]) => !e.resolvido).map(([id, e]) => ({ q: porId(id), e })).filter(x => x.q);
  const semanal = lista.filter(x => Date.now() - x.e.ts < 7 * 86400000).length;
  return `<h2>Repositório de erros</h2><p class="muted">${semanal} erro(s) nesta semana — revisão semanal obrigatória.</p>
  ${lista.length ? lista.map(({ q }) => { const v = videoPara(q); return `<div class="card"><span class="tag">${q.tags_materia.join(' · ')}</span><p><b>${esc(q.enunciado)}</b></p>
    <p>✅ Resposta certa: <b>${esc(q.alternativas[q.gabarito])}</b></p>
    <div class="row"><a class="btn" href="${v.url}" target="_blank" rel="noopener" data-video-visto="${q.id}">▶ Assistir: ${esc(v.titulo)}</a><button class="btn sec" data-resolvido="${q.id}">Já entendi</button></div></div>`; }).join('')
    : '<div class="card">🌳 Nenhum erro pendente. Continue praticando!</div>'}`;
}

function materiais(u) {
  if (S.texto) {
    const t = TEXTOS.find(x => x.id === S.texto);
    return `<button class="btn sec" data-go="materiais">← Voltar</button><div class="card"><span class="tag">${t.materia}</span><h2>${esc(t.titulo)}</h2><p>${esc(t.corpo)}</p></div>
    <div class="card"><b>📝 Minhas anotações</b><textarea id="nota" rows="6" placeholder="Escreva suas anotações...">${esc(u.anotacoes_pessoais[t.id] || '')}</textarea><button class="btn" data-salvar-nota="${t.id}">Salvar</button> <span class="muted">${esc(S.msg)}</span></div>`;
  }
  return `<h2>Materiais</h2><h3>Textos</h3>${TEXTOS.map(t => `<div class="card row sb"><div><b>${esc(t.titulo)}</b> <span class="tag">${t.materia}</span>${u.anotacoes_pessoais[t.id] ? ' <span class="tag">com anotações</span>' : ''}</div><button class="btn" data-texto="${t.id}">Ler</button></div>`).join('')}
  <h3>Vídeo aulas</h3>${MATERIAS.map(m => `<div class="card"><b>${m}</b><div class="row" style="margin-top:6px">${VIDEOS.filter(v => v.materia === m).map(v => `<a class="btn sec" target="_blank" rel="noopener" href="${v.url}">▶ ${esc(v.tema)}</a>`).join('')}</div></div>`).join('')}`;
}

function ranking(u) {
  const d = db.get();
  const linhas = Object.values(d.usuarios).filter(x => x.perfil.rankingPublico || x.email === u.email).map(x => {
    const r = d.desempenho.filter(y => y.usuario_id === x.email), ac = r.filter(y => y.acertou_bool).length;
    return { nome: x.nome, ac, t: r.length, pct: r.length ? ac / r.length : 0 };
  }).sort((a, b) => b.ac - a.ac || b.pct - a.pct);
  return `<h2>Ranking global</h2><div class="card"><label><input type="checkbox" id="pub" style="width:auto" ${u.perfil.rankingPublico ? 'checked' : ''}> Aparecer no ranking global</label>
  <table><tr><th>#</th><th>Aluno</th><th>Acertos</th><th>Aproveitamento</th></tr>${linhas.map((l, i) => `<tr><td>${i + 1}</td><td>${esc(l.nome)}</td><td>${l.ac}</td><td>${Math.round(l.pct * 100)}%</td></tr>`).join('')}</table></div>`;
}

// ---------- Jogo (salas privadas) ----------
// Sincronização em tempo real entre abas via evento 'storage'. Com backend: WebSocket/SSE.
const novoCodigo = () => Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
function jogo(u) {
  const d = db.get(), sala = S.sala && d.salas[S.sala];
  if (!sala) return `<h2>Jogo com amigos</h2><div class="grid">
    <div class="card"><b>Entrar com código</b><input id="cod" maxlength="5" placeholder="ABCDE" style="text-transform:uppercase"><button class="btn" data-entrar>Entrar</button><p class="erro-msg">${esc(S.msg)}</p></div>
    <div class="card"><b>Criar sala</b><p class="muted">Monte perguntas para seus amigos responderem.</p>
    <div id="qs"></div><textarea id="qtxt" rows="5" placeholder="Uma pergunta por linha:&#10;Pergunta ? | alternativa certa | errada 1 | errada 2 | errada 3"></textarea><button class="btn" data-criar>Criar sala</button></div></div>`;
  const ps = Object.values(sala.participantes).sort((a, b) => b.pontos - a.pontos), eu = sala.participantes[u.email];
  const i = Object.keys(eu.respondidas).length, q = sala.perguntas[i];
  return `<div class="row sb"><h2>Sala <span class="code">${sala.codigo}</span></h2><button class="btn sec" data-sair-sala>Sair</button></div>
  <div class="grid"><div class="card">${sala.status === 'aguardando' ? `<p>Aguardando início…</p>${sala.id_criador === u.email ? `<button class="btn" data-iniciar>Iniciar (${ps.length} jogador/es)</button>` : ''}`
    : !q ? '<h3>🏁 Você terminou!</h3>' : `<p><b>${i + 1}/${sala.perguntas.length}. ${esc(q.enunciado)}</b></p>${q.alternativas.map((a, k) => `<button class="opt" data-jresp="${k}">${esc(a)}</button>`).join('')}`}</div>
  <div class="card"><b>🏆 Ranking ao vivo</b><table>${ps.map((p, k) => `<tr><td>${k + 1}</td><td>${esc(p.nome)}</td><td>${p.pontos} pts</td></tr>`).join('')}</table></div></div>`;
}
window.addEventListener('storage', () => { if (S.view === 'jogo' && auth.atual()) render(); });

function criarSala(u, texto) {
  const perguntas = texto.split('\n').map(l => l.split('|').map(x => x.trim())).filter(p => p.length >= 3 && p[0]).map(p => {
    const alts = p.slice(1), cert = alts[0], emb = alts.map((a, i) => [a, i]).sort(() => Math.random() - .5);
    return { enunciado: p[0], alternativas: emb.map(e => e[0]), gabarito: emb.findIndex(e => e[1] === 0), cert };
  });
  if (!perguntas.length) { S.msg = 'Escreva ao menos uma pergunta no formato indicado.'; return; }
  let cod; db.update(d => { do cod = novoCodigo(); while (d.salas[cod]);
    d.salas[cod] = { codigo: cod, id_criador: u.email, perguntas, status: 'aguardando', participantes: { [u.email]: { nome: u.nome, pontos: 0, respondidas: {} } } }; });
  S.sala = cod;
}

// ---------- Shell + eventos ----------
const NAV = [['dashboard','🏠 Painel'],['simulado','✏️ Simulado'],['flashcards','🃏 Flashcards'],['erros','❌ Erros'],['materiais','📚 Materiais'],['jogo','🎮 Jogo'],['ranking','🏆 Ranking']];
function render() {
  const u = auth.atual(); if (!u) return authView();
  const body = { dashboard, simulado: () => renderQuestoes('Simulado rápido', S.simulado), flashcards, erros, materiais, jogo, ranking }[S.view](u);
  $app.innerHTML = `<div class="shell"><nav><div class="brand">🌿 Gestor de Estudos</div>${NAV.map(([k, l]) => `<button data-go="${k}" class="${S.view === k ? 'on' : ''}">${l}</button>`).join('')}<button class="sair" data-sair>Sair</button></nav><main>${body}</main></div>`;
}

function startSimulado(tema, qtd = 5) {
  const regs = usuario.registros();
  let qs = tema ? QUESTOES.filter(q => q.tags_materia[1] === tema).sort(() => Math.random() - .5).slice(0, qtd) : montarSimulado(QUESTOES, regs, qtd);
  S.simulado = { qs, i: 0, resp: null, acertos: 0 }; S.view = 'simulado';
}

$app.addEventListener('click', (e) => {
  const t = e.target.closest('button,a,[data-flip]'); if (!t) return; const D = t.dataset, u = auth.atual();
  if ('go' in D) { if (D.go === 'simulado' && S.view !== 'simulado') S.simulado = null; if (D.go === 'materiais') S.texto = null; return go(D.go); }
  if ('sair' in D) { auth.sair(); return render(); }
  if ('start' in D) { startSimulado(null, +D.start); return render(); }
  if ('simTema' in D) { startSimulado(D.simTema, +D.qtd); return render(); }
  if ('resp' in D) { const s = S.simulado, q = s.qs[s.i]; s.resp = +D.resp; const ok = s.resp === q.gabarito; if (ok) s.acertos++; usuario.registrar(q, ok); return render(); }
  if ('next' in D) { S.simulado.i++; S.simulado.resp = null; return render(); }
  if ('flip' in D) { S.flip = !S.flip; return render(); }
  if ('nota' in D) { const id = S.card; usuario.patch(x => { x.flashcards[id] = revisarCard(x.flashcards[id], +D.nota); }); S.flip = false; S.card = null; return render(); }
  if ('resolvido' in D) { usuario.patch(x => { x.erros[D.resolvido].resolvido = true; }); return render(); }
  if ('videoVisto' in D) return; // link abre em nova aba
  if ('texto' in D) { S.texto = D.texto; S.msg = ''; return render(); }
  if ('salvarNota' in D) { const v = document.getElementById('nota').value; usuario.patch(x => { x.anotacoes_pessoais[D.salvarNota] = v; }); S.msg = 'Salvo ✔'; return render(); }
  if ('criar' in D) { criarSala(u, document.getElementById('qtxt').value); return render(); }
  if ('entrar' in D) {
    const cod = document.getElementById('cod').value.trim().toUpperCase(), s = db.get().salas[cod];
    if (!s) { S.msg = 'Sala não encontrada.'; return render(); }
    if (s.status !== 'aguardando' && !s.participantes[u.email]) { S.msg = 'A partida já começou.'; return render(); }
    db.update(d => { d.salas[cod].participantes[u.email] ||= { nome: u.nome, pontos: 0, respondidas: {} }; }); S.sala = cod; S.msg = ''; return render();
  }
  if ('iniciar' in D) { db.update(d => { d.salas[S.sala].status = 'em_andamento'; }); return render(); }
  if ('sairSala' in D) { S.sala = null; return render(); }
  if ('jresp' in D) {
    db.update(d => { const s = d.salas[S.sala], p = s.participantes[u.email], i = Object.keys(p.respondidas).length, ok = +D.jresp === s.perguntas[i].gabarito;
      p.respondidas[i] = ok; if (ok) p.pontos += 10; if (Object.keys(s.participantes).every(x => Object.keys(s.participantes[x].respondidas).length >= s.perguntas.length)) s.status = 'finalizada'; });
    return render();
  }
});
$app.addEventListener('change', (e) => { if (e.target.id === 'pub') { usuario.patch(x => { x.perfil.rankingPublico = e.target.checked; }); render(); } });
render();
