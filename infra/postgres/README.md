# infra/postgres

Local PostgreSQL 18 for development.

## Why it exists

The API and `packages/db` need a real database. Docker Compose gives everyone the same one with no install.

## Use it

```bash
pnpm infra:postgres:up     # start (or pnpm infra:up for Postgres + storage)
pnpm infra:postgres:down   # stop (data is kept in the postgres-data volume)
```

Connects on `localhost:5432`, database `littleprogress`, user and password `postgres` (throwaway local credentials, allow-listed in `.infisicalignore`). The matching `DATABASE_URL` is stored in Infisical `dev` under `/api`.

## Tests

None. Check it is up with `docker compose -f infra/postgres/docker-compose.yml ps`, then `pnpm db:migrate`.

## Depends on / used by

Needs Docker. Used by `packages/db` and `apps/api`.
