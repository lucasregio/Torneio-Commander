# Torneio Commander 500

Site compartilhado (pt-BR) de **classificação suíça** para o Torneio Commander 500 do grupo. Vários celulares veem o **mesmo** evento: inscrição, mesas e standings.

## Stack

- Next.js + TypeScript + Tailwind + shadcn/ui
- **SQLite em arquivo** (`data/torneio.sqlite`) via `better-sqlite3` — sem secrets, barato de operar no cloud agent
- API Route Handlers no mesmo app

## Rodar local

```bash
npm install
npm run dev
```

Abre em [http://127.0.0.1:43127](http://127.0.0.1:43127).

O banco é criado automaticamente em `data/torneio.sqlite` (ignorado no git).

### PIN da organizadora

- Env: `ORG_PIN` (preferido) ou `NEXT_PUBLIC_ORG_PIN`
- Default documentado: **`500`**
- Exemplo: copie `.env.example` → `.env.local`

## Dados compartilhados

Não é mais localStorage-only. O estado do evento (`inscricoes_abertas` | `lock` | `encerrado`), jogadores, rodadas e resultados ficam no SQLite do servidor. A UI faz poll leve (~8s) para os outros aparelhos atualizarem.

- **Jogador:** inscrição pública (nome, comandante, link). Token de edição fica no aparelho (`localStorage`) e vai no header `X-Player-Token`. Deck só edita com inscrições abertas.
- **Organizador:** PIN → cookie httpOnly de sessão. Lock/abrir/encerrar, pairing, resultados, correções, zerar.

Slug fixo do evento: `commander-500`.

## Estados

| Estado | Quem faz o quê |
| --- | --- |
| `inscricoes_abertas` | Cada aparelho cria/edita **sua** ficha |
| `lock` | Grupo só lê; organizadora faz pairing e resultados |
| `encerrado` | Leitura; org pode reabrir/ajustar |

## Pontos e regras (MVP)

| Resultado | Pontos |
| --- | --- |
| Vitória | 3 |
| Empate (mesa) | 1 |
| Derrota | 0 |
| Bye | 3 |

Pods de 4 (3 se precisar). Desempate: pontos → PO (pontos dos oponentes) → menos byes → vitórias → nome. Sem top cut. Bracket 2 / Bo1.

### Pairing (v1)

Ordena pelo standing, monta mesas, bye com menos byes, micro-swap para reduzir rematch. Não é pairing ótimo — rematches podem ocorrer em campo pequeno.
