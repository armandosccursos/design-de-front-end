# Prompt para colar no Claude Code, na VPS do vestibular.midinova.com.br

Antes: copie `cronograma.js` e `cronograma.test.js` desta pasta para a VPS (ex.: `scp portar/cronograma*.js vps:/caminho/do/site/`).

---

Você está na pasta do site Midinova Vestibular (front em JS puro: `app.js`, `correcao.js`, `provas.js`, `aulas.js`, `style.css`, com backend Node em `/api`). Quero portar para ele três funcionalidades novas, **sem quebrar nada do que existe** e **sem trocar a identidade visual**.

## Antes de começar
1. Leia `app.js` (helpers `TV.h`, `TV.api`, `TV.S`, `TV.render`, mapa de telas em `S.tela`, `$nav`) e o servidor (rotas `/api/*`, como guarda dados e como autentica). Resuma em 10 linhas como são os dados de questões, desempenho/simulados corrigidos, trilha, ranking e aulas, e **só então** proponha o plano. Não invente tabelas/campos: reaproveite o que já existe.
2. Crie uma branch/commit de backup (`git switch -c feat/gestor-estudos` ou copie a pasta) antes de editar.

## Restrições do site (já verificadas)
- CSP: `default-src 'self'`, **proibido `style=""` inline e script inline**; estilo via CSSOM (`el.style.cssText`, como o `h()` já faz) ou classes em `style.css`. Frames só `youtube-nocookie`; imagens só `self`, `data:` e `i.ytimg.com`.
- Marca: usar as variáveis CSS existentes (`--navy`, `--verde`, `--verde-tx`, `--surface`, `--line`, `--ok`, `--bad` etc.), tema claro/escuro automático, fontes Montserrat/Nunito Sans. **Não usar a paleta "Forest" do protótipo.**
- Nada de `innerHTML` com texto de usuário (usar `h()`/textContent).
- Acessibilidade: foco visível, `role="alert"/"status"` nas mensagens como o resto do site.

## Funcionalidades a portar
### 1) Cronograma adaptativo ("Plano de hoje")
- Use `cronograma.js` (já testado: `node cronograma.test.js`). No servidor, `require` para calcular; ou no front, `<script src="cronograma.js">` (expõe `window.TVCronograma`).
- Entrada: catálogo de temas `[{materia,tema}]` + registros `{materia,tema,acertou,ts}` do aluno (derive do que `correcao.js`/`provas.js` já guardam por questão; se hoje só há nota por prova, proponha a menor mudança para guardar acerto por questão/tema).
- Tela/card "Plano de hoje" no início da trilha: 4 temas por prioridade, barra de prioridade, tarefas ("Rever a aula" → abre a aula do tema em `aulas.js`; "N questões" → gera mini-simulado do tema). Recalcular a cada correção concluída. Regra: mais erros ⇒ maior frequência.

### 2) Repositório de erros estratégicos
- Toda questão errada (em simulados corrigidos por IA e em listas) é registrada automaticamente por aluno: questão, tema, resposta dada, gabarito, data, `resolvido`.
- Tela "Meus erros": lista por tema, mostra a resposta certa e botão **"Assistir aula do tema"** que abre o player existente de `aulas.js` (gatilho de vídeo vindo do erro), + "Já entendi" (marca resolvido). Aviso "revisão semanal" com contagem dos erros dos últimos 7 dias.

### 3) Salas privadas de desafio (jogo com amigos)
- Criar sala com código de 5 caracteres (sem 0/O/1/I), o criador digita perguntas de múltipla escolha; amigos entram pelo código; ranking ao vivo (SSE ou polling de 3 s no `/api`, o que for mais simples no servidor atual); +10 pts por acerto. Modelo `SessaoJogo`: `id_criador, participantes, perguntas, status (aguardando|em_andamento|finalizada)`.
- Validar no servidor: tamanho das perguntas, nº máximo de perguntas/participantes, limite de criação de salas por aluno, e **o gabarito nunca vai para o cliente antes de ele responder**.
- Reaproveitar o ranking existente se fizer sentido, respeitando a opção de aparecer ou não no ranking global.

## Entrega
- Mudanças pequenas e revisáveis, um commit por funcionalidade. Rode o que já existe de teste e `node cronograma.test.js`; teste manualmente no navegador (claro e escuro, celular).
- **Não faça deploy/restart de serviço nem altere nginx/CSP sem eu confirmar.** Ao final, liste arquivos alterados, endpoints novos, migrações de dados e como reverter.
