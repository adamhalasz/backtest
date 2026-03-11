#!/bin/bash
set -euo pipefail

MIGRATIONS_DIR="services/backend/src/db/migrations"
BACKEND_ENV_FILE="services/backend/.dev.vars"

if [[ -z "${DATABASE_URL:-}" && -f "$BACKEND_ENV_FILE" ]]; then
	while IFS= read -r line; do
		case "$line" in
			'' | '#'* )
				continue
				;;
			DATABASE_URL=*)
				DATABASE_URL="${line#DATABASE_URL=}"
				DATABASE_URL="${DATABASE_URL%\"}"
				DATABASE_URL="${DATABASE_URL#\"}"
				DATABASE_URL="${DATABASE_URL%\'}"
				DATABASE_URL="${DATABASE_URL#\'}"
				export DATABASE_URL
				break
				;;
			*)
				continue
				;;
		esac
	done < "$BACKEND_ENV_FILE"

	if [[ -n "${DATABASE_URL:-}" ]]; then
		echo "Loaded DATABASE_URL from $BACKEND_ENV_FILE"
	fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
	echo "DATABASE_URL is required. Export it or set it in $BACKEND_ENV_FILE first."
	exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
	echo "psql is required to apply migrations. Install the PostgreSQL client and try again."
	exit 1
fi

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
	echo "Migration directory not found: $MIGRATIONS_DIR"
	exit 1
fi

echo "Applying Neon migrations from $MIGRATIONS_DIR"

for migration in "$MIGRATIONS_DIR"/*.sql; do
	if [[ ! -f "$migration" ]]; then
		continue
	fi

	echo "-> $(basename "$migration")"
	psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
done

echo "Neon migrations applied successfully."