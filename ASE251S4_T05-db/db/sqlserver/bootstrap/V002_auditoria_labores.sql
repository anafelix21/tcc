-- ==============================================================================
-- V002_auditoria_labores.sql — Agro Pacayales S.A.C.
-- Evolución de Esquema (Versión 2): Auditoría y Trazabilidad Transaccional
-- Esquema: dbo (Auditoría sobre actividad_cultivo)
-- ==============================================================================

USE agropacayales_db;
GO

-- 1. Tabla de Auditoría Inmutable de Actividades y Transacciones
IF OBJECT_ID(N'dbo.auditoria_actividades', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.auditoria_actividades (
        id_auditoria INT IDENTITY(1,1) PRIMARY KEY,
        id_actividad INT NOT NULL,
        id_cultivo INT NOT NULL,
        accion VARCHAR(20) NOT NULL,
        detalles_modificacion NVARCHAR(MAX) NULL,
        fecha_auditoria DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
        usuario_sistema NVARCHAR(100) NOT NULL DEFAULT SUSER_SNAME()
    );
END;
GO

-- 2. Nueva Columna de Telemetría IoT en Actividades de Cultivo
IF COL_LENGTH(N'dbo.actividad_cultivo', N'alerta_fitosanitaria_iot') IS NULL
BEGIN
    ALTER TABLE dbo.actividad_cultivo
    ADD alerta_fitosanitaria_iot BIT NOT NULL CONSTRAINT DF_actividad_alerta DEFAULT 0;
END;
GO

-- 3. Trigger de Trazabilidad Automática en Actividades
CREATE OR ALTER TRIGGER dbo.trg_auditar_actividades
ON dbo.actividad_cultivo
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.auditoria_actividades (id_actividad, id_cultivo, accion, detalles_modificacion)
    SELECT 
        i.id_actividad,
        i.id_cultivo,
        CASE WHEN d.id_actividad IS NULL THEN 'REGISTRO_INICIAL' ELSE 'ACTUALIZACION_COSTO' END,
        CONCAT('Tipo: ', i.tipo_actividad, ' | Costo total: USD ', i.costo_total, ' | Completado: ', i.completado)
    FROM inserted i
    LEFT JOIN deleted d ON i.id_actividad = d.id_actividad;
END;
GO

-- 4. Registrar auditoría retroactiva de las actividades existentes en V1
IF NOT EXISTS (SELECT 1 FROM dbo.auditoria_actividades)
BEGIN
    INSERT INTO dbo.auditoria_actividades (id_actividad, id_cultivo, accion, detalles_modificacion)
    SELECT id_actividad, id_cultivo, 'MIGRACION_V002', CONCAT('Migración inicial de actividad ', tipo_actividad)
    FROM dbo.actividad_cultivo;
END;
GO

PRINT 'SQL Server: V002 aplicado con éxito (Auditoría de transacciones y alerta IoT integrada).';
