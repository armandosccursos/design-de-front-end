import assert from 'node:assert/strict';
import { QUESTOES } from '../js/data.js';
import { gerarPlano, revisarCard } from '../js/scheduler.js';

const agora = Date.now();
const qid = (tema) => QUESTOES.find(q => q.tags_materia[1] === tema).id;
const reg = (tema, ok, dias = 0) => ({ questao_id: qid(tema), acertou_bool: ok, data_timestamp: agora - dias * 86400000 });

// Tema com mais erros sobe ao topo.
const regs = [reg('Funções', false), reg('Funções', false), reg('Porcentagem', true), reg('Porcentagem', true)];
const plano = gerarPlano(QUESTOES, regs, { n: 3, agora });
assert.equal(plano[0].tema, 'Funções');
assert.ok(plano[0].tarefas.some(t => t.tipo === 'video'));

// Reajuste: depois de acertar, a prioridade de Funções cai.
const antes = plano[0].prioridade;
const depois = gerarPlano(QUESTOES, [...regs, reg('Funções', true), reg('Funções', true), reg('Funções', true)], { n: 30, agora }).find(p => p.tema === 'Funções').prioridade;
assert.ok(depois < antes, `esperava ${depois} < ${antes}`);

// SM-2: errar zera; acertar espaça.
let c = revisarCard(undefined, 2, agora); assert.equal(c.intervalo, 1);
c = revisarCard(c, 2, agora); assert.equal(c.intervalo, 3);
c = revisarCard(c, 0, agora); assert.equal(c.rep, 0);
console.log('ok');
