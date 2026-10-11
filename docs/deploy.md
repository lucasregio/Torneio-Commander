# Deploy — Torneio Commander 500

## Por que não Vercel (serverless) neste MVP

SQLite em arquivo precisa de disco persistente. Serverless Vercel = filesystem efêmero → dados somem. Alternativa futura: Turso/libSQL ou Postgres. Agora: **Fly.io / Railway / VPS** com volume.

## Fly.io (esboço)

```bash
# no repo GitHub real
fly launch --no-deploy   # app Node, sem Postgres
fly volumes create torneio_data --size 1
# no fly.toml: montar volume em /data
fly secrets set ORG_PIN='pin-forte' TORNEIO_DB_PATH=/data/torneio.sqlite
fly deploy
```

Ajuste `Dockerfile` ou use o buildpack Node (`npm run build` / `npm run start`). Garanta `better-sqlite3` compilado na imagem Linux.

## Railway

1. New project from GitHub repo  
2. Add volume → mount `/data`  
3. Variables: `ORG_PIN`, `TORNEIO_DB_PATH=/data/torneio.sqlite`, `PORT` (Railway injeta)  
4. Start: `npm run start`

## VPS

```bash
git clone <repo>
cd <repo> && npm ci && npm run build
ORG_PIN=... TORNEIO_DB_PATH=/var/lib/torneio/torneio.sqlite npm run start
# reverse proxy → porta 43127 (ou PORT)
```

## Bloqueio atual (cloud agent)

Enquanto o remote for Origin `agent_temp` (`tmp-…`), **não há PR GitHub** nem deploy a partir deste ambiente. Depois do Create repo, empurrar a branch e seguir o checklist do README.
