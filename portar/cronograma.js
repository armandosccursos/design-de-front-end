/* Cronograma adaptativo + repetição espaçada (SM-2). Sem dependências, sem DOM, sem storage.
   Funciona no navegador (window.TVCronograma) e no Node/backend (module.exports).
   Registro esperado: { materia, tema, acertou: bool, ts: ms }  — adapte o mapeamento no seu /api. */
(function (root) {
"use strict";
var DIA = 86400000;
function peso(ts, agora) { return Math.pow(0.5, (agora - ts) / (14 * DIA)); } // meia-vida 14 dias

/** temas: [{materia, tema}] (catálogo completo, para incluir temas nunca praticados). */
function statsPorTema(temas, registros, agora) {
  agora = agora || Date.now(); var m = {};
  temas.forEach(function (t) { m[t.materia + "|" + t.tema] = { materia: t.materia, tema: t.tema, total: 0, acertos: 0, erroPond: 0, totalPond: 0, ultima: 0 }; });
  registros.forEach(function (r) {
    var s = m[r.materia + "|" + r.tema]; if (!s) return; var w = peso(r.ts, agora);
    s.total++; s.totalPond += w; if (r.acertou) s.acertos++; else s.erroPond += w; if (r.ts > s.ultima) s.ultima = r.ts;
  });
  return Object.keys(m).map(function (k) { return m[k]; });
}

/** 0..100. Mais erros recentes => maior; revisão atrasada => bônus; nunca praticado => 55. */
function prioridade(s, agora) {
  agora = agora || Date.now(); if (!s.total) return 55;
  var taxaErro = s.totalPond ? s.erroPond / s.totalPond : 0;
  var intervalo = Math.min(14, Math.pow(2, Math.max(0, s.acertos - (s.total - s.acertos))));
  var atraso = Math.max(0, (agora - s.ultima) / DIA - intervalo);
  return Math.round(Math.min(100, taxaErro * 75 + Math.min(25, atraso * 5)));
}

function gerarPlano(temas, registros, opt) {
  opt = opt || {}; var n = opt.n || 4, agora = opt.agora || Date.now();
  return statsPorTema(temas, registros, agora)
    .map(function (s) { s.prioridade = prioridade(s, agora); return s; })
    .sort(function (a, b) { return b.prioridade - a.prioridade || a.tema.localeCompare(b.tema); })
    .slice(0, n)
    .map(function (s) {
      var alta = s.prioridade >= 50;
      return { materia: s.materia, tema: s.tema, prioridade: s.prioridade,
        tarefas: (alta ? [{ tipo: "aula", rotulo: "Rever a aula" }] : []).concat([{ tipo: "exercicios", rotulo: alta ? "5 questões de reforço" : "3 questões de revisão", qtd: alta ? 5 : 3 }]) };
    });
}

/** Cartões: SM-2 simplificado. nota 0=errei 1=difícil 2=fácil. */
function revisarCartao(e, nota, agora) {
  agora = agora || Date.now(); e = e || { rep: 0, fac: 2.5, intervalo: 0, prox: 0 };
  var rep = e.rep, fac = e.fac, iv = e.intervalo;
  if (nota === 0) { rep = 0; iv = 1; fac = Math.max(1.3, fac - 0.2); }
  else { rep++; iv = rep === 1 ? 1 : rep === 2 ? 3 : Math.round(iv * fac); fac = nota === 2 ? fac + 0.1 : Math.max(1.3, fac - 0.1); }
  return { rep: rep, fac: fac, intervalo: iv, prox: agora + iv * DIA };
}

var api = { statsPorTema: statsPorTema, prioridade: prioridade, gerarPlano: gerarPlano, revisarCartao: revisarCartao };
if (typeof module !== "undefined" && module.exports) module.exports = api; else root.TVCronograma = api;
})(typeof window !== "undefined" ? window : globalThis);
