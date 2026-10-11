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

## Deploy (hospedagem)

O app usa **SQLite em arquivo** (`better-sqlite3` + `data/torneio.sqlite`). Isso precisa de **filesystem persistente** e runtime **Node** (não Edge).

### Não use Vercel “puro” para este MVP

No plano serverless da Vercel o disco é efêmero: o `.sqlite` some entre deploys/instâncias e não há volume local estável. Dá para adaptar depois (Turso/libSQL, Postgres), mas **não** é o caminho barato agora.

### Opções baratas (recomendadas)

1. **Fly.io** — máquina pequena + volume montado em `/data`  
   - Set `ORG_PIN` como secret  
   - Aponte o DB para o volume (ex. env `TORNEIO_DB_PATH=/data/torneio.sqlite` se configurado no código; hoje o path padrão é `data/torneio.sqlite` relativo ao cwd — rode o processo com cwd no volume ou ajuste o path)
2. **Railway** — serviço Node + volume, mesmo cuidado de path persistente
3. **VPS simples** (qualquer $) — `npm run build && npm run start` atrás de Caddy/nginx; backup do arquivo SQLite

### Checklist pós–Create repo (GitHub)

1. Criar o repositório real no GitHub (sair do `agent_temp` / Origin tmp)
2. Apontar `origin` para o repo GitHub e dar push da branch `cursor/torneio-commander-500-5f40`
3. Abrir PR → `main`
4. Provisionar host com volume (Fly/Railway/VPS)
5. Env: `ORG_PIN=...` (não usar o default `500` em produção)
6. Health: abrir `/` e `GET /api/event`

### Env de produção

```bash
ORG_PIN=troque-este-pin
NODE_ENV=production
```

Build: `npm run build` · Start: `npm run start` (porta `43127` no script local; em host use `PORT` do provedor se necessário — ajuste o script `start` para `next start -p $PORT` no deploy).
