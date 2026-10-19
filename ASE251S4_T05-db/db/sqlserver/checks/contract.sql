SET NOCOUNT ON;

DECLARE @requested_version INT = $(target_schema_version);

IF OBJECT_ID(N'dbo.schema_changes', N'U') IS NULL
    THROW 50001, 'No existe dbo.schema_changes en SQL Server', 1;

IF (SELECT COUNT(*) FROM dbo.schema_changes) <> @requested_version
   OR (SELECT ISNULL(MIN([sequence]), 0) FROM dbo.schema_changes) <> 1
   OR (SELECT ISNULL(MAX([sequence]), 0) FROM dbo.schema_changes) <> @requested_version
    THROW 50002, 'Historial de cambios discontinuo o distinto de la versión solicitada', 1;

-- Verificación de objetos base (V1) en esquema dbo
IF OBJECT_ID(N'dbo.cultivos', N'U') IS NULL
   OR OBJECT_ID(N'dbo.actividad_cultivo', N'U') IS NULL
   OR OBJECT_ID(N'dbo.detalle_actividad', N'U') IS NULL
   OR OBJECT_ID(N'dbo.harvest', N'U') IS NULL
   OR OBJECT_ID(N'dbo.harvest_planting_cycle', N'U') IS NULL
   OR OBJECT_ID(N'dbo.asignacion_cabecera', N'U') IS NULL
   OR OBJECT_ID(N'dbo.asignacion_detalle', N'U') IS NULL
    THROW 50003, 'Faltan tablas transaccionales base de SQL Server en esquema dbo (agropacayales_db)', 1;

-- Verificación de registros semilla
IF NOT EXISTS (SELECT 1 FROM dbo.cultivos WHERE id_parcela = 'PARC-NORTE-A1')
   OR NOT EXISTS (SELECT 1 FROM dbo.actividad_cultivo WHERE id_actividad = 1)
   OR NOT EXISTS (SELECT 1 FROM dbo.harvest WHERE responsable = 'Ana Félix')
   OR NOT EXISTS (SELECT 1 FROM dbo.asignacion_cabecera WHERE id_asignacion_cabecera = 1)
    THROW 50004, 'Faltan registros semilla requeridos en SQL Server', 1;

-- Verificación de V2 (Evolución)
IF @requested_version >= 2
BEGIN
    IF OBJECT_ID(N'dbo.auditoria_actividades', N'U') IS NULL
        THROW 50005, 'V2 requiere la tabla dbo.auditoria_actividades', 1;

    IF COL_LENGTH(N'dbo.actividad_cultivo', N'alerta_fitosanitaria_iot') IS NULL
        THROW 50006, 'V2 requiere la columna alerta_fitosanitaria_iot en dbo.actividad_cultivo', 1;
END;

PRINT 'SQL Server: contrato ' + CONVERT(VARCHAR(12), @requested_version) + ' verificado con éxito.';
