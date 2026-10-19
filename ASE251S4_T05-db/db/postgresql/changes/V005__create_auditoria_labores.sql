--liquibase formatted sql logicalFilePath:db/postgresql/changes/V005__create_auditoria_labores.sql

--changeset ana-felix:V005
--comment: Crear tabla de auditoría inmutable de labores agrícolas y trazabilidad.
CREATE TABLE auditoria_labores (
    id SERIAL PRIMARY KEY,
    entidad VARCHAR(60) NOT NULL,
    accion VARCHAR(40) NOT NULL,
    usuario VARCHAR(80) NOT NULL,
    detalles VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_auditoria_labores_entidad ON auditoria_labores(entidad);
--rollback DROP TABLE auditoria_labores;
