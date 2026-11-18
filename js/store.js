// Camada de persistência (localStorage). Trocar por API REST mantendo esta interface.
// Modelos: Usuarios, RegistroDesempenho, SessaoJogo conforme a arquitetura.
const K = 'gestor-estudos:v1';
const load = () => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch { return {}; } };
const save = (d) => localStorage.setItem(K, JSON.stringify(d));

export const db = {
  get: () => ({ usuarios: {}, desempenho: [], salas: {}, sessao: null, ...load() }),
  set: save,
  update(fn) { const d = this.get(); fn(d); save(d); return d; },
};

async function hash(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

export const auth = {
  async registrar(nome, email, senha) {
    email = email.trim().toLowerCase();
    if (!nome.trim() || !email || senha.length < 6) throw new Error('Preencha nome, e-mail e senha (mín. 6 caracteres).');
    const d = db.get(); if (d.usuarios[email]) throw new Error('E-mail já cadastrado.');
    d.usuarios[email] = { email, nome: nome.trim(), senha: await hash(senha), perfil: { rankingPublico: true }, progresso: {}, cronograma_ativo: [], anotacoes_pessoais: {}, flashcards: {}, erros: {} };
    d.sessao = email; db.set(d);
  },
  async entrar(email, senha) {
    email = email.trim().toLowerCase();
    const d = db.get(), u = d.usuarios[email];
    if (!u || u.senha !== await hash(senha)) throw new Error('E-mail ou senha inválidos.');
    d.sessao = email; db.set(d);
  },
  sair: () => db.update(d => { d.sessao = null; }),
  atual() { const d = db.get(); return d.sessao ? d.usuarios[d.sessao] : null; },
};

export const usuario = { // atualiza o usuário logado
  patch: (fn) => db.update(d => fn(d.usuarios[d.sessao])),
  registros: () => { const d = db.get(); return d.desempenho.filter(r => r.usuario_id === d.sessao); },
  registrar(questao, acertou) {
    db.update(d => {
      d.desempenho.push({ usuario_id: d.sessao, questao_id: questao.id, acertou_bool: acertou, data_timestamp: Date.now() });
      const u = d.usuarios[d.sessao];
      if (!acertou) u.erros[questao.id] = { visto: false, ts: Date.now() };       // Repositório de erros
      else if (u.erros[questao.id]) u.erros[questao.id].resolvido = true;
    });
  },
};
