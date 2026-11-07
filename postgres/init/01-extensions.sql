-- Habilita o PostGIS para dados geoespaciais
CREATE EXTENSION IF NOT EXISTS postgis;

-- Habilita o TimescaleDB para séries temporais
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Habilita o pgvectorscale (CASCADE instala o pgvector automaticamente)
CREATE EXTENSION IF NOT EXISTS vectorscale CASCADE;

-- A extensão se chama vector. vectorscale já a instala via CASCADE.
CREATE EXTENSION IF NOT EXISTS vector;

-- Habilita o pgcrypto para funções criptográficas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Habilita o pg_trgm para indexação de trigramas
CREATE EXTENSION IF NOT EXISTS pg_trgm;


