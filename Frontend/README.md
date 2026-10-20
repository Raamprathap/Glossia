# Glossia Analytics

Next.js dashboard shell for Glossia usage and conversion analytics.

## Local setup

```bash
cd Frontend
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` if the Flask API is not running at `http://localhost:5000/api`.

## PostgreSQL migration

The backend uses PostgreSQL through SQLAlchemy. From the repository root:

```bash
# 1. Create the database once (adjust the role/password for your machine).
createdb signsec

# 2. Apply the baseline schema to a fresh database.
psql postgresql://postgres:postgres@localhost:5432/signsec \
	-f migrations/001_init.sql

# 3. Apply analytics tables. This is also the upgrade command for an
#    existing database that already has 001_init.sql.
psql postgresql://postgres:postgres@localhost:5432/signsec \
	-f migrations/002_analytics.sql
```

Configure Flask with the SQLAlchemy URL before starting it:

```bash
export DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/signsec
export JWT_SECRET='replace-this-in-development'
```

To verify the migration:

```bash
psql postgresql://postgres:postgres@localhost:5432/signsec \
	-c '\dt extension_*'
```

The expected tables are `extension_sessions` and `extension_events`.

## Commands

- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm run lint` runs ESLint.
