# Use official PostgreSQL Alpine image (smaller size)
FROM postgres:13-alpine

# User and database only. The password comes from the environment
# (compose sets POSTGRES_PASSWORD); it must never be baked into the
# image. Schema and seed data are created by the API container on
# startup (Alembic migrations + api/seed.py), not by an init script.
ENV POSTGRES_USER=learn
ENV POSTGRES_DB=learn

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD pg_isready -U learn -d learn

# Expose PostgreSQL port
EXPOSE 5432