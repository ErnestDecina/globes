FROM mcr.microsoft.com/devcontainers/javascript-node:20

RUN apt-get update && apt-get install -y postgresql-client && sudo apt-get install -y libreoffice && sudo apt-get install -y ghostscript
ENV NODE_ENV=development
RUN npm install -g typescript
