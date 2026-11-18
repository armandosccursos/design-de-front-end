const assert = require("node:assert/strict"); const C = require("./cronograma.js");
const now = Date.now(), temas = [{materia:"Mat",tema:"A"},{materia:"Mat",tema:"B"},{materia:"Bio",tema:"C"}];
const r = (tema, acertou, dias = 0) => ({ materia: tema === "C" ? "Bio" : "Mat", tema, acertou, ts: now - dias * 864e5 });
const regs = [r("A", false), r("A", false), r("B", true), r("B", true)];
const p = C.gerarPlano(temas, regs, { n: 3, agora: now });
assert.equal(p[0].tema, "A"); assert.ok(p[0].tarefas.some(t => t.tipo === "aula"));
assert.equal(p.find(x => x.tema === "C").prioridade, 55);               // nunca praticado
const depois = C.gerarPlano(temas, regs.concat([r("A", true), r("A", true), r("A", true)]), { n: 3, agora: now }).find(x => x.tema === "A").prioridade;
assert.ok(depois < p[0].prioridade);                                      // reajuste após acertos
let c = C.revisarCartao(null, 2, now); assert.equal(c.intervalo, 1); c = C.revisarCartao(c, 2, now); assert.equal(c.intervalo, 3); assert.equal(C.revisarCartao(c, 0, now).rep, 0);
console.log("ok");
