--liquibase formatted sql logicalFilePath:db/sqlserver/changes/V003__create_cosechas_calidad.sql

--changeset axel-huapaya:V003
--comment: Crear tabla de lotes de cosechas y rendimiento por cultivo.
CREATE TABLE dbo.cosechas_lote (
    id INT IDENTITY(1,1) CONSTRAINT PK_cosechas_lote PRIMARY KEY,
    codigo_lote VARCHAR(50) NOT NULL CONSTRAINT UQ_cosechas_lote_codigo UNIQUE,
    id_cultivo INT NOT NULL CONSTRAINT FK_cosechas_lote_cultivos REFERENCES dbo.cultivos(id),
    fecha_cosecha DATE NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE),
    kilos_totales NUMERIC(10, 2) NOT NULL CHECK (kilos_totales >= 0),
    kilos_exportables NUMERIC(10, 2) NOT NULL CHECK (kilos_exportables >= 0),
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX ix_cosechas_lote_cultivo ON dbo.cosechas_lote(id_cultivo);
--rollback DROP TABLE dbo.cosechas_lote;
