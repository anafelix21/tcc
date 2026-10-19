-- ==============================================================================
-- V001_baseline.sql — Agro Pacayales S.A.C.
-- Línea Base (Versión 1) del Esquema Transaccional Relacional en SQL Server 2022
-- Arquitectura Políglota: MongoDB (Maestros) + SQL Server R2DBC (Transacciones)
-- Esquema: dbo (Transaccionales Cabecera - Detalle)
-- ==============================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'agropacayales_db')
BEGIN
    CREATE DATABASE agropacayales_db;
END;
GO

USE agropacayales_db;
GO

-- 1. Tabla de Cultivos (Entidad de soporte para las transacciones)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cultivos' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.cultivos (
        id_cultivo INT IDENTITY(1,1) CONSTRAINT PK_cultivos PRIMARY KEY,
        id_parcela VARCHAR(24) NOT NULL, -- Clave compartida con MongoDB parcelas._id
        nombre VARCHAR(100) NOT NULL,
        tipo_cultivo VARCHAR(80) NOT NULL,
        frecuencia_riego_dias INT NOT NULL DEFAULT 3,
        temperatura_ideal DECIMAL(5,2) NOT NULL DEFAULT 22.0,
        fecha_siembra DATE DEFAULT GETDATE(),
        requiere_sombra BIT DEFAULT 0,
        observaciones VARCHAR(MAX),
        estado BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2
    );
END;
GO

-- 2. Transaccional Hugo Fernández: Actividades de Cultivo (Cabecera)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'actividad_cultivo' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.actividad_cultivo (
        id_actividad INT IDENTITY(1,1) CONSTRAINT PK_actividad PRIMARY KEY,
        id_cultivo INT NOT NULL,
        tipo_actividad VARCHAR(50) NOT NULL,
        descripcion VARCHAR(MAX),
        fecha_actividad DATETIME2 NOT NULL DEFAULT GETDATE(),
        costo_total DECIMAL(10,2) NOT NULL DEFAULT 0.0,
        estado BIT DEFAULT 1,
        completado BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2,
        deleted_at DATETIME2,
        restored_at DATETIME2,
        CONSTRAINT FK_actividad_cultivos FOREIGN KEY (id_cultivo) REFERENCES dbo.cultivos(id_cultivo)
    );
END;
GO

-- 3. Transaccional Hugo Fernández: Detalle de Actividades (Detalle - Insumos consumidos)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'detalle_actividad' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.detalle_actividad (
        id_detalle INT IDENTITY(1,1) CONSTRAINT PK_detalle PRIMARY KEY,
        id_actividad INT NOT NULL,
        id_insumo VARCHAR(24) NOT NULL, -- Clave compartida con MongoDB insumos._id
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        CONSTRAINT FK_detalle_actividad_cabecera FOREIGN KEY (id_actividad) 
            REFERENCES dbo.actividad_cultivo(id_actividad) ON DELETE CASCADE
    );
END;
GO

-- 4. Transaccional Ana Félix: Cosechas - Harvest (Cabecera)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'harvest' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.harvest (
        id_harvest INT IDENTITY(1,1) CONSTRAINT PK_harvest PRIMARY KEY,
        responsable VARCHAR(100) NOT NULL,
        fecha_cosecha DATE NOT NULL DEFAULT GETDATE(),
        estado BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2
    );
END;
GO

-- 5. Transaccional Ana Félix: Detalle de Cosecha por Cultivo (Detalle)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'harvest_planting_cycle' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.harvest_planting_cycle (
        id_harvest_detail INT IDENTITY(1,1) CONSTRAINT PK_harvest_detail PRIMARY KEY,
        id_harvest INT NOT NULL,
        id_cultivo INT NOT NULL,
        kilos_optimos DECIMAL(10,2) NOT NULL,
        kilos_merma DECIMAL(10,2) NOT NULL,
        CONSTRAINT FK_harvest_detail_harvest FOREIGN KEY (id_harvest)
            REFERENCES dbo.harvest(id_harvest) ON DELETE CASCADE,
        CONSTRAINT FK_harvest_detail_cultivo FOREIGN KEY (id_cultivo)
            REFERENCES dbo.cultivos(id_cultivo)
    );
END;
GO

-- 6. Transaccional Axel Huapaya: Asignación de Trabajadores (Cabecera)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'asignacion_cabecera' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.asignacion_cabecera (
        id_asignacion_cabecera INT IDENTITY(1,1) CONSTRAINT PK_asignacion_cabecera PRIMARY KEY,
        id_actividad INT NOT NULL,
        fecha_asignacion DATETIME2 NOT NULL DEFAULT GETDATE(),
        horas_trabajadas DECIMAL(5,2) NOT NULL,
        costo_total_mano_obra DECIMAL(10,2) DEFAULT 0.0,
        observacion VARCHAR(MAX),
        estado BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2,
        CONSTRAINT FK_asig_cab_actividad FOREIGN KEY (id_actividad)
            REFERENCES dbo.actividad_cultivo(id_actividad)
    );
END;
GO

-- 7. Transaccional Axel Huapaya: Detalle de Asignación de Trabajadores (Detalle)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'asignacion_detalle' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.asignacion_detalle (
        id_asignacion_detalle INT IDENTITY(1,1) CONSTRAINT PK_asignacion_detalle PRIMARY KEY,
        id_asignacion_cabecera INT NOT NULL,
        id_usuario VARCHAR(24) NOT NULL, -- Clave compartida con MongoDB usuarios._id
        costo_mano_obra DECIMAL(10,2) NOT NULL,
        CONSTRAINT FK_asig_det_cabecera FOREIGN KEY (id_asignacion_cabecera)
            REFERENCES dbo.asignacion_cabecera(id_asignacion_cabecera) ON DELETE CASCADE
    );
END;
GO

-- 8. Vista de Integración Transaccional (Resumen de Costos Operativos por Cultivo)
CREATE OR ALTER VIEW dbo.vw_resumen_operativo_cultivos AS
SELECT 
    c.id_cultivo,
    c.id_parcela,
    c.nombre AS cultivo,
    c.tipo_cultivo,
    COUNT(DISTINCT a.id_actividad) AS total_actividades,
    ISNULL(SUM(a.costo_total), 0.00) AS costo_total_insumos,
    ISNULL(SUM(asig.costo_total_mano_obra), 0.00) AS costo_total_mano_obra,
    (ISNULL(SUM(a.costo_total), 0.00) + ISNULL(SUM(asig.costo_total_mano_obra), 0.00)) AS costo_operativo_total
FROM dbo.cultivos c
LEFT JOIN dbo.actividad_cultivo a ON c.id_cultivo = a.id_cultivo
LEFT JOIN dbo.asignacion_cabecera asig ON a.id_actividad = asig.id_actividad
GROUP BY c.id_cultivo, c.id_parcela, c.nombre, c.tipo_cultivo;
GO

-- 9. Datos Semilla Iniciales (Línea Base V1)
IF NOT EXISTS (SELECT 1 FROM dbo.cultivos)
BEGIN
    INSERT INTO dbo.cultivos (id_parcela, nombre, tipo_cultivo, frecuencia_riego_dias, temperatura_ideal, fecha_siembra, requiere_sombra, observaciones, estado)
    VALUES 
    ('PARC-NORTE-A1', 'Palto Hass Exportación', 'Frutal Perenne', 4, 21.50, '2023-03-15', 0, 'Lote certificado GlobalGAP para exportación', 1),
    ('PARC-SUR-B2', 'Arándano Biloxi', 'Arbusto Frutal', 2, 19.50, '2024-01-10', 1, 'Malla sombra y fertirriego tecnificado', 1);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.actividad_cultivo)
BEGIN
    INSERT INTO dbo.actividad_cultivo (id_cultivo, tipo_actividad, descripcion, fecha_actividad, costo_total, estado, completado)
    VALUES 
    (1, 'Control Fitosanitario', 'Fumigación preventiva foliar contra queresas y hongos', '2026-03-10T08:00:00', 600.00, 1, 1),
    (2, 'Fertirriego Nutricional', 'Inyección de macro y micronutrientes por goteo', '2026-03-12T07:30:00', 425.00, 1, 1);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.detalle_actividad)
BEGIN
    INSERT INTO dbo.detalle_actividad (id_actividad, id_insumo, cantidad, precio_unitario, subtotal)
    VALUES 
    (1, 'INS-BIO-001', 5, 120.00, 600.00),
    (2, 'INS-FERT-002', 5, 85.00, 425.00);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.harvest)
BEGIN
    INSERT INTO dbo.harvest (responsable, fecha_cosecha, estado)
    VALUES 
    ('Ana Félix', '2026-03-14', 1);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.harvest_planting_cycle)
BEGIN
    INSERT INTO dbo.harvest_planting_cycle (id_harvest, id_cultivo, kilos_optimos, kilos_merma)
    VALUES 
    (1, 1, 4400.00, 120.00);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.asignacion_cabecera)
BEGIN
    INSERT INTO dbo.asignacion_cabecera (id_actividad, fecha_asignacion, horas_trabajadas, costo_total_mano_obra, observacion, estado)
    VALUES 
    (1, '2026-03-10T07:00:00', 8.0, 160.00, 'Jornada diurna de aplicación en lote A1', 1);
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.asignacion_detalle)
BEGIN
    INSERT INTO dbo.asignacion_detalle (id_asignacion_cabecera, id_usuario, costo_mano_obra)
    VALUES 
    (1, 'USR-OPER-001', 80.00),
    (1, 'USR-OPER-002', 80.00);
END;
GO
