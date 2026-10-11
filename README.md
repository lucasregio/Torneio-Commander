# Torneio Commander 500

App web simples de **classificação suíça** para o torneio Commander 500 do grupo (pt-BR). Sem login e sem banco: tudo fica no `localStorage` do navegador.

## Rodar local

```bash
npm install
npm run dev
```

Abre em [http://127.0.0.1:43127](http://127.0.0.1:43127).

PIN da organizadora (MVP): padrão `500`, ou `NEXT_PUBLIC_ORG_PIN` no `.env.local`.

## Estados do evento

| Estado | Quem faz o quê |
| --- | --- |
| `inscricoes_abertas` | Cada aparelho cria/edita **uma** ficha (nome, comandante, link) |
| `lock` | Torneio rolando: grupo só lê classificação/mesas/decks; organizadora faz pairing e resultados |
| `encerrado` | Encerrado (leitura); organizadora pode reabrir/ajustar |

**Modo organizador:** botão + PIN (sessão no `sessionStorage`). Sem OAuth.

## O que faz (MVP)

1. **Jogadores** — ficha com nome, comandante e link do deck
2. **Rodadas** — gerar mesas suíças (pods de 4; de 3 se precisar; bye se sobrar 1)
3. **Resultados** — vitória / empate da mesa / bye
4. **Classificação** — pontos e desempate

### Pontos

| Resultado | Pontos |
| --- | --- |
| Vitória | 3 |
| Empate (mesa inteira) | 1 |
| Derrota | 0 |
| Bye | 3 (conta como vitória) |

### Pairing (v1)

- Ordena pela classificação atual e monta mesas em blocos.
- Bye para quem tem **menos byes**, preferindo o pior ranking.
- Micro-swap local para reduzir rematches quando é fácil.
- **Limitação:** não é pairing ótimo (sem backtracking completo). Em campo pequeno (~13) após várias rodadas, rematches ainda podem acontecer.

### Desempate

1. Pontos de match  
2. **PO** — soma dos pontos dos oponentes enfrentados (bye não entra)  
3. Menos byes  
4. Mais vitórias  
5. Nome (pt-BR)

Sem top cut: o ranking final é o standings do suíço.

## Stack

Next.js · TypeScript · Tailwind · shadcn/ui
