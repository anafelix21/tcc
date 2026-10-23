--liquibase formatted sql logicalFilePath:db/sqlserver/changes/V005__create_auditoria_labores.sql

--changeset ana-felix:V005
--comment: Crear tabla de auditoría inmutable de labores agrícolas y trazabilidad.
CREATE TABLE dbo.auditoria_labores (
    id INT IDENTITY(1,1) CONSTRAINT PK_auditoria_labores PRIMARY KEY,
    entidad VARCHAR(60) NOT NULL,
    accion VARCHAR(40) NOT NULL,
    usuario VARCHAR(80) NOT NULL,
    detalles VARCHAR(255) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX ix_auditoria_labores_entidad ON dbo.auditoria_labores(entidad);
--rollback DROP TABLE dbo.auditoria_labores;
