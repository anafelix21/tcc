--liquibase formatted sql logicalFilePath:db/postgresql/changes/V003__create_cosechas_calidad.sql

--changeset axel-huapaya:V003
--comment: Crear tabla de lotes de cosechas y rendimiento por cultivo.
CREATE TABLE cosechas_lote (
    id SERIAL PRIMARY KEY,
    codigo_lote VARCHAR(50) NOT NULL UNIQUE,
    id_cultivo INTEGER NOT NULL REFERENCES cultivos(id),
    fecha_cosecha DATE NOT NULL DEFAULT CURRENT_DATE,
    kilos_totales NUMERIC(10, 2) NOT NULL CHECK (kilos_totales >= 0),
    kilos_exportables NUMERIC(10, 2) NOT NULL CHECK (kilos_exportables >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_cosechas_lote_cultivo ON cosechas_lote(id_cultivo);
--rollback DROP TABLE cosechas_lote;
