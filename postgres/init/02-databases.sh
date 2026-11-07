#!/bin/bash
# O Postgres já cria POSTGRES_DB (produtoschat) antes dos scripts de init.
# CREATE DATABASE não pode ficar no mesmo .sql das extensões: um erro
# anterior aborta o arquivo, e CREATE DATABASE produtoschat falha porque
# esse banco já existe.
set -eu

n8n_db="${POSTGRES_DB_N8N:-n8n}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<SQL
SELECT format('CREATE DATABASE %I OWNER %I', '${n8n_db}', '${POSTGRES_USER}')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${n8n_db}')\gexec
SQL
