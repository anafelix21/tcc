--liquibase formatted sql logicalFilePath:db/sqlserver/changes/V004__create_fichas_campo.sql

--changeset hugo-fernandez:V004
--comment: Crear tabla relacional de fichas técnicas de campo y visitas de inspección.
CREATE TABLE dbo.fichas_campo (
    id INT IDENTITY(1,1) CONSTRAINT PK_fichas_campo PRIMARY KEY,
    codigo_ficha VARCHAR(50) NOT NULL CONSTRAINT UQ_fichas_campo_codigo UNIQUE,
    id_parcela VARCHAR(30) NOT NULL,
    evaluador VARCHAR(100) NOT NULL,
    fecha_visita DATE NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE),
    estado_fitosanitario VARCHAR(50) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX ix_fichas_campo_parcela ON dbo.fichas_campo(id_parcela);
--rollback DROP TABLE dbo.fichas_campo;
