# Use official PostgreSQL Alpine image (smaller size)
FROM postgres:13-alpine

# Set environment variables
ENV POSTGRES_USER=learn
ENV POSTGRES_PASSWORD=example
ENV POSTGRES_DB=learn

# Copy initialization scripts
COPY init.sql /docker-entrypoint-initdb.d/

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD pg_isready -U learn -d learn

# Expose PostgreSQL port
EXPOSE 5432