--liquibase formatted sql logicalFilePath:db/sqlserver/changes/V002__create_insumos_kardex.sql

--changeset ana-felix:V002
--comment: Crear tabla de kardex e inventario de insumos fitosanitarios y fertilizantes.
CREATE TABLE dbo.insumos_kardex (
    id INT IDENTITY(1,1) CONSTRAINT PK_insumos_kardex PRIMARY KEY,
    sku VARCHAR(40) NOT NULL CONSTRAINT UQ_insumos_kardex_sku UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    stock_actual NUMERIC(10, 2) NOT NULL CHECK (stock_actual >= 0),
    unidad_medida VARCHAR(20) NOT NULL,
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX ix_insumos_kardex_tipo ON dbo.insumos_kardex(tipo);
--rollback DROP TABLE dbo.insumos_kardex;
