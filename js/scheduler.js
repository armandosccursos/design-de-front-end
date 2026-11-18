// Cronograma adaptativo: prioridade por tema = erros (com decaimento) + intervalo de revisão espaçada.
// Funções puras: recebem registros de desempenho e retornam o plano. Sem acesso a DOM/storage.
const DIA = 86400000;

/** Peso decrescente por idade: erro recente pesa mais (meia-vida de 14 dias). */
const peso = (ts, agora) => Math.pow(0.5, (agora - ts) / (14 * DIA));

/** Estatísticas por tema [materia, tema] a partir dos registros. */
export function statsPorTema(questoes, registros, agora = Date.now()) {
  const porQ = new Map(questoes.map(q => [q.id, q]));
  const out = new Map();
  for (const q of questoes) {
    const tema = q.tags_materia[1];
    if (!out.has(tema)) out.set(tema, { materia: q.tags_materia[0], tema, total: 0, acertos: 0, erroPond: 0, totalPond: 0, ultima: 0 });
  }
  for (const r of registros) {
    const q = porQ.get(r.questao_id); if (!q) continue;
    const s = out.get(q.tags_materia[1]); const w = peso(r.data_timestamp, agora);
    s.total++; s.totalPond += w;
    if (r.acertou_bool) s.acertos++; else s.erroPond += w;
    s.ultima = Math.max(s.ultima, r.data_timestamp);
  }
  return [...out.values()];
}

/**
 * Prioridade 0..100.
 *  - Nunca praticado: prioridade média-alta (explorar).
 *  - Taxa de erro ponderada domina (regra de negócio: mais erros => mais frequência).
 *  - Repetição espaçada: intervalo alvo cresce com acertos; passou do prazo => bônus.
 */
export function prioridade(s, agora = Date.now()) {
  if (s.total === 0) return 55;
  const taxaErro = s.totalPond ? s.erroPond / s.totalPond : 0;
  const intervaloDias = Math.min(14, Math.pow(2, Math.max(0, s.acertos - (s.total - s.acertos)))); // 1,2,4,8,14
  const atraso = Math.max(0, (agora - s.ultima) / DIA - intervaloDias);
  const bonusRevisao = Math.min(25, atraso * 5);
  return Math.round(Math.min(100, taxaErro * 75 + bonusRevisao));
}

/** Plano do dia: top N temas; tarefas variam conforme a prioridade. */
export function gerarPlano(questoes, registros, { n = 4, agora = Date.now() } = {}) {
  return statsPorTema(questoes, registros, agora)
    .map(s => ({ ...s, prioridade: prioridade(s, agora) }))
    .sort((a, b) => b.prioridade - a.prioridade || a.tema.localeCompare(b.tema))
    .slice(0, n)
    .map(s => ({
      materia: s.materia, tema: s.tema, prioridade: s.prioridade,
      tarefas: [
        ...(s.prioridade >= 50 ? [{ tipo: 'video', rotulo: 'Rever a aula' }] : []),
        { tipo: 'exercicios', rotulo: s.prioridade >= 50 ? '5 questões de reforço' : '3 questões de revisão', qtd: s.prioridade >= 50 ? 5 : 3 },
      ],
    }));
}

/** Seleciona questões para simulado focando nos temas de menor desempenho. */
export function montarSimulado(questoes, registros, qtd = 5, agora = Date.now()) {
  const pr = new Map(statsPorTema(questoes, registros, agora).map(s => [s.tema, prioridade(s, agora)]));
  return questoes
    .map(q => ({ q, p: (pr.get(q.tags_materia[1]) ?? 50) + Math.random() * 10 }))
    .sort((a, b) => b.p - a.p).slice(0, qtd).map(x => x.q);
}

/** Flashcards: SM-2 simplificado. nota: 0 (errei) | 1 (difícil) | 2 (fácil). */
export function revisarCard(estado = { rep: 0, fac: 2.5, intervalo: 0, prox: 0 }, nota, agora = Date.now()) {
  let { rep, fac, intervalo } = estado;
  if (nota === 0) { rep = 0; intervalo = 1; fac = Math.max(1.3, fac - 0.2); }
  else {
    rep++; intervalo = rep === 1 ? 1 : rep === 2 ? 3 : Math.round(intervalo * fac);
    if (nota === 2) fac += 0.1; else fac = Math.max(1.3, fac - 0.1);
  }
  return { rep, fac, intervalo, prox: agora + intervalo * DIA };
}
