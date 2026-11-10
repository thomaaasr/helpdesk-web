# Help Desk Web

![CI](https://github.com/thomaaasr/helpdesk-web/actions/workflows/ci.yml/badge.svg)

**Demo:** [helpdesk-web-6ae7.onrender.com](https://helpdesk-web-6ae7.onrender.com) (o primeiro acesso pode levar cerca de 1 minuto, porque a API gratuita dorme quando fica parada)

**Contas de demonstração** (são públicas, não use dados reais nos chamados):

| Perfil      | E-mail                        | Senha            |
| ----------- | ----------------------------- | ---------------- |
| Técnico     | `tecnico@tecnico.com`         | `tecnico123`     |
| Solicitante | `solicitante@solicitante.com` | `solicitante123` |

Também dá para criar a sua própria conta, que entra como solicitante.

Interface web do sistema de chamados de TI, feita em **React e TypeScript**. Consome a
[Help Desk API](https://github.com/thomaaasr/helpdesk-api), feita em Python com FastAPI.

## O que dá para fazer

- Criar conta, entrar e sair (login com JWT, guardado no navegador)
- **Solicitante:** abrir chamados, acompanhar o status e o prazo, comentar e fechar ou reabrir depois de resolvido
- **Técnico:** ver todos os chamados, assumir, marcar como resolvido e alterar a prioridade
- Lista com filtro por status, filtro de atrasados e paginação
- Prazo de SLA destacado em vermelho quando passa da hora

Os botões aparecem conforme o perfil e o status do chamado, seguindo as mesmas regras da API.

## Tecnologias

- **React 19**, **TypeScript** e **Vite**
- **Vitest** e **Testing Library** (testes de componentes com a API simulada)
- **oxlint** e **Prettier**
- **GitHub Actions** (lint, formatação, testes e build a cada push) e deploy no **Render**

## Rodando no seu computador

Precisa da [Help Desk API](https://github.com/thomaaasr/helpdesk-api) rodando em `http://127.0.0.1:8000`.

```bash
npm install
npm run dev
```

O site abre em http://localhost:5173. Para usar outra API, defina a variável `VITE_API_URL`.

## Testes e qualidade

```bash
npm test
npm run lint
npm run format:check
```
