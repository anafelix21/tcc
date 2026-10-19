--liquibase formatted sql logicalFilePath:db/postgresql/changes/V004__create_fichas_campo.sql

--changeset hugo-fernandez:V004
--comment: Crear tabla relacional de fichas técnicas de campo y visitas de inspección.
CREATE TABLE fichas_campo (
    id SERIAL PRIMARY KEY,
    codigo_ficha VARCHAR(50) NOT NULL UNIQUE,
    id_parcela VARCHAR(30) NOT NULL,
    evaluador VARCHAR(100) NOT NULL,
    fecha_visita DATE NOT NULL DEFAULT CURRENT_DATE,
    estado_fitosanitario VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_fichas_campo_parcela ON fichas_campo(id_parcela);
--rollback DROP TABLE fichas_campo;
