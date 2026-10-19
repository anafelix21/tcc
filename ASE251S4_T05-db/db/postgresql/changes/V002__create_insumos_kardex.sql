--liquibase formatted sql logicalFilePath:db/postgresql/changes/V002__create_insumos_kardex.sql

--changeset ana-felix:V002
--comment: Crear tabla de kardex e inventario de insumos fitosanitarios y fertilizantes.
CREATE TABLE insumos_kardex (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(40) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    stock_actual NUMERIC(10, 2) NOT NULL CHECK (stock_actual >= 0),
    unidad_medida VARCHAR(20) NOT NULL,
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_insumos_kardex_tipo ON insumos_kardex(tipo);
--rollback DROP TABLE insumos_kardex;
