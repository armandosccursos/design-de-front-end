// Conteúdo seed: matérias, questões, flashcards, textos. Em produção viria de uma API.
export const MATERIAS = ['Matemática','Português','Biologia','Química','Física','História'];

const q = (materia, tema, enunciado, alternativas, gabarito, nivel = 1) =>
  ({ id: `${materia}-${tema}-${enunciado.length}${gabarito}`.replace(/\s+/g,'_'), enunciado, alternativas, gabarito, tags_materia: [materia, tema], nivel_dificuldade: nivel });

export const QUESTOES = [
  q('Matemática','Porcentagem','Um produto de R$ 200 recebe 15% de desconto. Qual o preço final?',['R$ 170','R$ 185','R$ 150','R$ 175'],0),
  q('Matemática','Funções','Se f(x) = 2x + 3, quanto vale f(5)?',['10','13','8','15'],1),
  q('Matemática','Geometria','Área de um círculo de raio 3 (use π≈3,14):',['18,84','28,26','9,42','37,68'],1,2),
  q('Matemática','Probabilidade','Ao lançar um dado justo, a probabilidade de sair número par é:',['1/6','1/3','1/2','2/3'],2),
  q('Português','Concordância','Assinale a frase correta:',['Haviam muitos alunos.','Houveram problemas.','Havia muitos alunos.','Fazem dois anos.'],2),
  q('Português','Figuras de linguagem','"Aquele homem é uma rocha" é exemplo de:',['Metáfora','Metonímia','Ironia','Hipérbole'],0),
  q('Português','Crase','Qual alternativa usa a crase corretamente?',['Fui à pé.','Vou à escola.','Estou disposto à ajudar.','Referiu-se à ele.'],1),
  q('Português','Interpretação','Em um texto, a "ideia central" corresponde:',['A um detalhe','Ao assunto principal defendido','Ao título apenas','À última frase'],1),
  q('Biologia','Citologia','Organela responsável pela respiração celular:',['Ribossomo','Mitocôndria','Lisossomo','Golgi'],1),
  q('Biologia','Genética','Cruzamento Aa x Aa: proporção genotípica esperada:',['1:1','3:1','1:2:1','100% Aa'],2,2),
  q('Biologia','Ecologia','Os seres que produzem seu próprio alimento são:',['Decompositores','Consumidores','Produtores','Parasitas'],2),
  q('Química','Tabela periódica','Os gases nobres pertencem ao grupo:',['1','17','18','2'],2),
  q('Química','Estequiometria','Massa molar da água (H=1, O=16):',['16 g/mol','18 g/mol','20 g/mol','34 g/mol'],1),
  q('Química','Ácidos e bases','Uma solução com pH 3 é:',['Básica','Neutra','Ácida','Salina'],2),
  q('Física','Cinemática','Um carro a 20 m/s percorre quantos metros em 5 s (MU)?',['25','100','4','50'],1),
  q('Física','Leis de Newton','A unidade de força no SI é:',['Joule','Watt','Newton','Pascal'],2),
  q('Física','Eletricidade','Pela Lei de Ohm, V =',['R/I','I/R','R·I','R+I'],2),
  q('História','Brasil Colônia','O primeiro ciclo econômico do Brasil colonial foi:',['Ouro','Pau-brasil','Café','Borracha'],1),
  q('História','Revolução Francesa','A Revolução Francesa começou em:',['1776','1789','1815','1822'],1),
  q('História','República','A Proclamação da República no Brasil ocorreu em:',['1822','1888','1889','1930'],2),
];

export const FLASHCARDS = [
  ['Matemática','Fórmula de Bhaskara','x = (−b ± √Δ) / 2a, com Δ = b² − 4ac'],
  ['Matemática','Área do triângulo','base × altura / 2'],
  ['Português','O que é metonímia?','Troca de um termo por outro com relação de proximidade (ex.: "ler Machado").'],
  ['Biologia','Função do ribossomo','Síntese de proteínas.'],
  ['Biologia','1ª Lei de Mendel','Cada característica é determinada por dois fatores que se separam na formação dos gametas.'],
  ['Química','Número de Avogadro','6,02 × 10²³ entidades por mol.'],
  ['Física','2ª Lei de Newton','F = m · a'],
  ['Física','Energia cinética','Ec = m·v² / 2'],
  ['História','Inconfidência Mineira','1789, ligada à cobrança de impostos (derrama); líder: Tiradentes.'],
  ['História','Lei Áurea','13/05/1888 — abolição da escravidão no Brasil.'],
].map(([materia, frente, verso], i) => ({ id: 'fc' + i, materia, frente, verso }));

export const TEXTOS = [
  { id: 't1', materia: 'Biologia', titulo: 'Mitocôndrias e energia', corpo: 'As mitocôndrias convertem nutrientes em ATP por meio da respiração celular aeróbia, composta por glicólise, ciclo de Krebs e cadeia respiratória.' },
  { id: 't2', materia: 'História', titulo: 'Ciclos econômicos do Brasil', corpo: 'Pau-brasil, cana-de-açúcar, ouro, café e borracha marcaram fases distintas da economia brasileira, moldando a ocupação do território.' },
  { id: 't3', materia: 'Matemática', titulo: 'Porcentagem sem medo', corpo: 'Desconto de p% equivale a multiplicar por (1 − p/100). Acréscimo de p% equivale a multiplicar por (1 + p/100).' },
];

// Biblioteca de vídeo-aulas por tema (links de busca no YouTube: estáveis e sem IDs inventados).
const yt = (t) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(t);
export const VIDEOS = [...new Set(QUESTOES.map(x => x.tags_materia.join('|')))].map(k => {
  const [materia, tema] = k.split('|');
  return { id: 'v-' + k, materia, tema, titulo: `${tema} — aula completa`, url: yt(`${tema} ${materia} aula vestibular`) };
});
