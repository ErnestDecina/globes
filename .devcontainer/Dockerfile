FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Install PostgreSQL client tools (optional, if you want to interact with PostgreSQL from your app container)
RUN apt-get update && apt-get install -y postgresql-client

# Set up your environment (optional)
ENV NODE_ENV=development

# Install TypeScript globally
RUN npm install -g typescript
