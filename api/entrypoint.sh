#!/bin/sh
# API container entrypoint: bring the schema to the latest migration,
# seed the sample course if the database is empty, then serve.
# Databases created by the old db/init.sql (tables, no alembic_version)
# are stamped at the baseline instead of re-created.
set -e
cd "$(dirname "$0")"

MODE=$(python3 -c "
import os
from sqlalchemy import create_engine, inspect
engine = create_engine(os.environ['DATABASE_URL'])
tables = inspect(engine).get_table_names()
print('stamp' if 'courses' in tables and 'alembic_version' not in tables else 'upgrade')
")

if [ "$MODE" = "stamp" ]; then
  echo "Entrypoint: existing pre-migration schema found, stamping baseline."
  alembic stamp head
else
  alembic upgrade head
fi

python3 seed.py

exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-18766}"
