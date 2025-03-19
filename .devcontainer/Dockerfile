# Use Node.js v20 base image on AMD64
FROM --platform=linux/amd64 node:20

# Environment variables for PostgreSQL user and password
ENV POSTGRES_USER=C21394933
ENV POSTGRES_PASSWORD=PASSWORD
ENV POSTGRES_DB=PASSWORD

# Install PostgreSQL server
RUN apt-get update && \
    apt-get install -y postgresql postgresql-contrib && \
    rm -rf /var/lib/apt/lists/*

# Configure PostgreSQL to accept external connections (optional)
RUN echo "listen_addresses='*'" >> /etc/postgresql/12/main/postgresql.conf || true

# Expose PostgreSQL port
EXPOSE 5432

# Initialize database and create user/database
USER postgres
RUN /etc/init.d/postgresql start && \
    psql --command "CREATE USER ${POSTGRES_USER} WITH SUPERUSER PASSWORD '${POSTGRES_PASSWORD}';" && \
    createdb -O ${POSTGRES_USER} ${POSTGRES_DB}

# Switch back to a non-root user for devcontainers
USER root
RUN useradd -ms /bin/bash devuser
USER devuser

# Working directory
WORKDIR /workspace

# Metadata for devcontainers
LABEL dev.containers.name="node20-postgres-devcontainer"

# Start bash by default
CMD ["bash"]
