--liquibase formatted sql logicalFilePath:db/sqlserver/changes/V001__create_cultivo_parcela.sql

--changeset hugo-fernandez:V001
--comment: Crear contrato relacional de cultivos vinculados a parcelas agrícolas de Agro Pacayales S.A.C.
CREATE TABLE dbo.cultivos (
    id INT IDENTITY(1,1) CONSTRAINT PK_cultivos PRIMARY KEY,
    id_parcela VARCHAR(30) NOT NULL CONSTRAINT UQ_cultivos_parcela UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    tipo_cultivo VARCHAR(60) NOT NULL,
    variedad VARCHAR(60) NOT NULL,
    hectareas NUMERIC(8, 2) NOT NULL CHECK (hectareas > 0),
    fecha_siembra DATE NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE),
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX ix_cultivos_tipo_cultivo ON dbo.cultivos(tipo_cultivo);
--rollback DROP TABLE dbo.cultivos;
