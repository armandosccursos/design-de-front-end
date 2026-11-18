# 🌿 Gestor de Estudos

Plataforma de preparação para vestibulares (tema Forest: `#2E8B4A`, `#328246`, tons terrosos).
Front-end estático em JS puro (ES modules), sem build. Persistência em `localStorage` atrás de `js/store.js`.

```
python3 -m http.server 8000   # abrir http://localhost:8000
node tests/scheduler.test.mjs # testes do cronograma adaptativo
```

## Arquitetura
| Arquivo | Responsabilidade |
|---|---|
| `js/data.js` | Matérias, Questões (enunciado, alternativas, gabarito, tags_materia, nivel_dificuldade), flashcards, textos, vídeos |
| `js/store.js` | Usuarios, RegistroDesempenho, SessaoJogo; auth (SHA-256 local) |
| `js/scheduler.js` | Funções puras: prioridade por tema, plano diário, simulado, SM-2 dos flashcards |
| `js/app.js` | Views e eventos |

**Cronograma adaptativo:** prioridade do tema = taxa de erro ponderada por recência (meia-vida 14 dias, peso 75) + bônus de atraso de revisão espaçada (intervalo 1,2,4,8,14 dias conforme saldo acertos−erros). Recalculado a cada resposta; temas nunca praticados entram com prioridade 55.

**Repositório de erros:** cada erro é registrado automaticamente; cada card dispara a vídeo-aula do tema errado.

## Status por prioridade
1. ✅ Autenticação + Dashboard  2. ✅ Cronograma adaptativo  3. ✅ Erros + vídeos  4. ✅ Salas privadas (tempo real entre abas)  5. ✅ Leitura com anotações

## Limitações do MVP (próximos passos)
- Sem backend: contas/ranking/salas valem só no navegador. Para amigos em dispositivos diferentes, trocar `store.js` por API + WebSocket/SSE e hash de senha no servidor.
- Banco de questões pequeno (20); vídeos são buscas no YouTube (substituir por curadoria própria).
