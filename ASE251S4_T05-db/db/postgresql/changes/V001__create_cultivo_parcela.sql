--liquibase formatted sql logicalFilePath:db/postgresql/changes/V001__create_cultivo_parcela.sql

--changeset hugo-fernandez:V001
--comment: Crear contrato relacional de cultivos vinculados a parcelas agrícolas de Agro Pacayales S.A.C.
CREATE TABLE cultivos (
    id SERIAL PRIMARY KEY,
    id_parcela VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    tipo_cultivo VARCHAR(60) NOT NULL,
    variedad VARCHAR(60) NOT NULL,
    hectareas NUMERIC(8, 2) NOT NULL CHECK (hectareas > 0),
    fecha_siembra DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_cultivos_tipo_cultivo ON cultivos(tipo_cultivo);
--rollback DROP TABLE cultivos;
