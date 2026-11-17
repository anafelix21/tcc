-- ==============================================================================
-- AGROPACAYALES S.A.C. — SCRIPT IDEMPOTENTE SQL SERVER (3 TRANSACCIONALES)
-- Arquitectura Políglota: 3 Transaccionales Cabecera-Detalle (Hugo, Axel, Ana)
-- Claves Foráneas Lógicas Coherentes (INS-..., USR-..., PARC-...)
-- Integridad Completa: PRIMARY KEY, FOREIGN KEY, CHECK, UNIQUE y DEFAULT
-- Ingesta masiva (+800 registros) mediante BUCLES WHILE
-- ==============================================================================

USE master;
GO

-- ------------------------------------------------------------------------------
-- RECREACIÓN LIMPIA DE LA BASE DE DATOS (IDEMPOTENCIA GARANTIZADA)
-- ------------------------------------------------------------------------------
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'agropacayales_db')
BEGIN
    ALTER DATABASE agropacayales_db SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE agropacayales_db;
END;
GO

CREATE DATABASE agropacayales_db;
GO

USE agropacayales_db;
GO

-- ==============================================================================
-- 0. TABLA BASE DE SOPORTE: CULTIVOS (CROPS)
-- Clave compartida con plots._id: PARC-NOR-001, PARC-SUR-002, etc.
-- ==============================================================================
CREATE TABLE dbo.cultivos (
    id_cultivo INT IDENTITY(1,1) CONSTRAINT PK_cultivos PRIMARY KEY,
    id_parcela VARCHAR(30) NOT NULL CONSTRAINT CK_cultivos_id_parcela CHECK (id_parcela LIKE 'PARC-%'),
    nombre VARCHAR(100) NOT NULL CONSTRAINT CK_cultivos_nombre CHECK (LEN(TRIM(nombre)) > 0),
    tipo_cultivo VARCHAR(80) NOT NULL,
    frecuencia_riego_dias INT NOT NULL CONSTRAINT DF_cultivos_frecuencia DEFAULT 3 CONSTRAINT CK_cultivos_frecuencia CHECK (frecuencia_riego_dias > 0),
    temperatura_ideal DECIMAL(5,2) NOT NULL CONSTRAINT DF_cultivos_temp DEFAULT 22.0 CONSTRAINT CK_cultivos_temp CHECK (temperatura_ideal BETWEEN -5.0 AND 55.0),
    fecha_siembra DATE NOT NULL CONSTRAINT DF_cultivos_fecha DEFAULT CAST(GETDATE() AS DATE),
    requiere_sombra BIT NOT NULL CONSTRAINT DF_cultivos_sombra DEFAULT 0,
    observaciones VARCHAR(MAX) NULL,
    estado BIT NOT NULL CONSTRAINT DF_cultivos_estado DEFAULT 1,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_cultivos_created DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL
);
GO

-- ==============================================================================
-- 1. INTEGRANTE: HUGO FERNÁNDEZ
-- TRANSACCIONAL CABECERA - DETALLE: Actividades de Cultivo e Insumos Consumidos
-- Clave compartida con supplies._id: INS-FERT-001, INS-PEST-002, etc.
-- ==============================================================================
CREATE TABLE dbo.actividad_cultivo (
    id_actividad INT IDENTITY(1,1) CONSTRAINT PK_actividad PRIMARY KEY,
    id_cultivo INT NOT NULL CONSTRAINT FK_actividad_cultivo FOREIGN KEY REFERENCES dbo.cultivos(id_cultivo),
    tipo_actividad VARCHAR(50) NOT NULL CONSTRAINT CK_actividad_tipo CHECK (LEN(TRIM(tipo_actividad)) > 0),
    descripcion VARCHAR(MAX) NULL,
    fecha_actividad DATETIME2 NOT NULL CONSTRAINT DF_actividad_fecha DEFAULT SYSUTCDATETIME(),
    costo_total DECIMAL(10,2) NOT NULL CONSTRAINT DF_actividad_costo DEFAULT 0.0 CONSTRAINT CK_actividad_costo CHECK (costo_total >= 0.0),
    estado BIT NOT NULL CONSTRAINT DF_actividad_estado DEFAULT 1,
    completado BIT NOT NULL CONSTRAINT DF_actividad_completado DEFAULT 0,
    alerta_fitosanitaria_iot BIT NOT NULL CONSTRAINT DF_actividad_alerta DEFAULT 0,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_actividad_created DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,
    deleted_at DATETIME2 NULL,
    restored_at DATETIME2 NULL
);

CREATE TABLE dbo.detalle_actividad (
    id_detalle INT IDENTITY(1,1) CONSTRAINT PK_detalle PRIMARY KEY,
    id_actividad INT NOT NULL CONSTRAINT FK_detalle_actividad_cabecera FOREIGN KEY REFERENCES dbo.actividad_cultivo(id_actividad) ON DELETE CASCADE,
    id_insumo VARCHAR(30) NOT NULL CONSTRAINT CK_detalle_id_insumo CHECK (id_insumo LIKE 'INS-%'),
    cantidad INT NOT NULL CONSTRAINT CK_detalle_cantidad CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CONSTRAINT CK_detalle_precio CHECK (precio_unitario > 0.0),
    subtotal DECIMAL(10,2) NOT NULL CONSTRAINT CK_detalle_subtotal CHECK (subtotal >= 0.0),
    CONSTRAINT UQ_detalle_actividad_insumo UNIQUE (id_actividad, id_insumo)
);
GO

-- ==============================================================================
-- 2. INTEGRANTE: AXEL HUAPAYA
-- TRANSACCIONAL CABECERA - DETALLE: Asignación de Cuadrillas y Costo de Mano de Obra
-- Clave compartida con users._id: USR-ADM-001, USR-SUP-004, USR-OPE-005, etc.
-- ==============================================================================
CREATE TABLE dbo.asignacion_cabecera (
    id_asignacion_cabecera INT IDENTITY(1,1) CONSTRAINT PK_asignacion_cabecera PRIMARY KEY,
    id_actividad INT NOT NULL CONSTRAINT FK_asig_cab_actividad FOREIGN KEY REFERENCES dbo.actividad_cultivo(id_actividad),
    fecha_asignacion DATETIME2 NOT NULL CONSTRAINT DF_asig_fecha DEFAULT SYSUTCDATETIME(),
    horas_trabajadas DECIMAL(5,2) NOT NULL CONSTRAINT CK_asig_horas CHECK (horas_trabajadas > 0.0 AND horas_trabajadas <= 24.0),
    costo_total_mano_obra DECIMAL(10,2) NOT NULL CONSTRAINT DF_asig_costo DEFAULT 0.0 CONSTRAINT CK_asig_costo CHECK (costo_total_mano_obra >= 0.0),
    observacion VARCHAR(MAX) NULL,
    estado BIT NOT NULL CONSTRAINT DF_asig_estado DEFAULT 1,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_asig_created DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL
);

CREATE TABLE dbo.asignacion_detalle (
    id_asignacion_detalle INT IDENTITY(1,1) CONSTRAINT PK_asignacion_detalle PRIMARY KEY,
    id_asignacion_cabecera INT NOT NULL CONSTRAINT FK_asig_det_cabecera FOREIGN KEY REFERENCES dbo.asignacion_cabecera(id_asignacion_cabecera) ON DELETE CASCADE,
    id_usuario VARCHAR(30) NOT NULL CONSTRAINT CK_asig_id_usuario CHECK (id_usuario LIKE 'USR-%'),
    costo_mano_obra DECIMAL(10,2) NOT NULL CONSTRAINT CK_asig_costo_mano CHECK (costo_mano_obra >= 0.0),
    CONSTRAINT UQ_asig_cabecera_usuario UNIQUE (id_asignacion_cabecera, id_usuario)
);
GO

-- ==============================================================================
-- 3. INTEGRANTE: ANA FÉLIX
-- TRANSACCIONAL CABECERA - DETALLE: Registro de Cosechas y Rendimiento por Cultivo
-- ==============================================================================
CREATE TABLE dbo.harvest (
    id_harvest INT IDENTITY(1,1) CONSTRAINT PK_harvest PRIMARY KEY,
    responsable VARCHAR(100) NOT NULL CONSTRAINT CK_harvest_responsable CHECK (LEN(TRIM(responsable)) > 0),
    fecha_cosecha DATE NOT NULL CONSTRAINT DF_harvest_fecha DEFAULT CAST(GETDATE() AS DATE),
    estado BIT NOT NULL CONSTRAINT DF_harvest_estado DEFAULT 1,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_harvest_created DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL
);

CREATE TABLE dbo.harvest_planting_cycle (
    id_harvest_detail INT IDENTITY(1,1) CONSTRAINT PK_harvest_detail PRIMARY KEY,
    id_harvest INT NOT NULL CONSTRAINT FK_harvest_detail_harvest FOREIGN KEY REFERENCES dbo.harvest(id_harvest) ON DELETE CASCADE,
    id_cultivo INT NOT NULL CONSTRAINT FK_harvest_detail_cultivo FOREIGN KEY REFERENCES dbo.cultivos(id_cultivo),
    kilos_optimos DECIMAL(10,2) NOT NULL CONSTRAINT CK_harvest_kilos_optimos CHECK (kilos_optimos >= 0.0),
    kilos_merma DECIMAL(10,2) NOT NULL CONSTRAINT CK_harvest_kilos_merma CHECK (kilos_merma >= 0.0),
    CONSTRAINT UQ_harvest_cultivo_ciclo UNIQUE (id_harvest, id_cultivo)
);
GO

-- ------------------------------------------------------------------------------
-- SINÓNIMOS EN INGLÉS (ACCESO BILINGÜE Y COMPATIBILIDAD CON BACKEND)
-- ------------------------------------------------------------------------------
CREATE SYNONYM dbo.crops FOR dbo.cultivos;
CREATE SYNONYM dbo.crop_activities FOR dbo.actividad_cultivo;
CREATE SYNONYM dbo.crop_activity_details FOR dbo.detalle_actividad;
CREATE SYNONYM dbo.task_assignments FOR dbo.asignacion_cabecera;
CREATE SYNONYM dbo.task_assignment_details FOR dbo.asignacion_detalle;
CREATE SYNONYM dbo.harvest_records FOR dbo.harvest;
CREATE SYNONYM dbo.harvest_crop_details FOR dbo.harvest_planting_cycle;
GO

-- ==============================================================================
-- POBLACIÓN AUTOMATIZADA CON BUCLES (IDENTIFICADORES COHERENTES ENLAZADOS)
-- ==============================================================================

-- BUCLE 0: 50 CULTIVOS ASOCIADOS A PARCELAS (PARC-NOR-001, etc.)
PRINT 'Insertando 50 Cultivos mediante Bucle...';
DECLARE @i INT = 1;
WHILE @i <= 50
BEGIN
    DECLARE @sec_code VARCHAR(3) = CASE ((@i - 1) % 5)
        WHEN 0 THEN 'NOR' WHEN 1 THEN 'SUR' WHEN 2 THEN 'CEN' WHEN 3 THEN 'LOM' ELSE 'SAN'
    END;
    DECLARE @coherent_plot VARCHAR(30) = 'PARC-' + @sec_code + '-' + RIGHT('000' + CAST(@i AS VARCHAR(10)), 3);

    INSERT INTO dbo.cultivos (id_parcela, nombre, tipo_cultivo, frecuencia_riego_dias, temperatura_ideal, fecha_siembra, requiere_sombra, observaciones, estado)
    VALUES (
        @coherent_plot,
        CASE (@i % 5)
            WHEN 0 THEN 'Palta Hass Exportación - Lote ' + CAST(@i AS VARCHAR(10))
            WHEN 1 THEN 'Arándano Biloxi - Lote ' + CAST(@i AS VARCHAR(10))
            WHEN 2 THEN 'Espárrago Verde UC-157 - Lote ' + CAST(@i AS VARCHAR(10))
            WHEN 3 THEN 'Uva de Mesa Red Globe - Lote ' + CAST(@i AS VARCHAR(10))
            ELSE 'Mandarina W. Murcott - Lote ' + CAST(@i AS VARCHAR(10))
        END,
        CASE (@i % 5)
            WHEN 0 THEN 'Frutal Perenne'
            WHEN 1 THEN 'Arbusto Frutal'
            WHEN 2 THEN 'Hortaliza'
            WHEN 3 THEN 'Frutal Caducifolio'
            ELSE 'Cítrico'
        END,
        2 + (@i % 4),
        19.0 + (@i % 6) * 1.0,
        DATEADD(DAY, -(@i * 7), CAST(GETDATE() AS DATE)),
        CASE WHEN @i % 3 = 0 THEN 1 ELSE 0 END,
        'Cultivo tecnificado en parcela ' + @coherent_plot,
        1
    );
    SET @i = @i + 1;
END;
GO

-- BUCLE 1 (HUGO FERNÁNDEZ): 150 ACTIVIDADES Y 200 DETALLES DE INSUMO (INS-FERT-001, etc.)
PRINT 'Insertando 150 Actividades y 200 Detalles de Insumos (Hugo Fernández)...';
DECLARE @act_id INT = 1;
WHILE @act_id <= 150
BEGIN
    INSERT INTO dbo.actividad_cultivo (id_cultivo, tipo_actividad, descripcion, fecha_actividad, costo_total, estado, completado, alerta_fitosanitaria_iot)
    VALUES (
        ((@act_id - 1) % 50) + 1,
        CASE (@act_id % 4)
            WHEN 0 THEN 'Fertirriego Nutricional'
            WHEN 1 THEN 'Control Fitosanitario'
            WHEN 2 THEN 'Poda y Deschuponado'
            ELSE 'Monitoreo Técnico y Foliar'
        END,
        'Actividad programada de campo para mantenimiento agronómico.',
        DATEADD(HOUR, -(@act_id * 12), GETDATE()),
        180.00 + (@act_id % 15) * 25.50,
        1,
        CASE WHEN @act_id % 5 = 0 THEN 0 ELSE 1 END,
        CASE WHEN @act_id % 7 = 0 THEN 1 ELSE 0 END
    );
    SET @act_id = @act_id + 1;
END;

DECLARE @det_id INT = 1;
WHILE @det_id <= 200
BEGIN
    DECLARE @current_act INT = ((@det_id - 1) % 150) + 1;
    DECLARE @insumo_offset INT = CASE WHEN @det_id > 150 THEN 100 ELSE 0 END;
    DECLARE @supply_num INT = (((@det_id * 3 + @insumo_offset) % 190) + 1);

    DECLARE @ins_code VARCHAR(4) = CASE ((@supply_num - 1) % 10)
        WHEN 0 THEN 'FERT' WHEN 1 THEN 'FERT' WHEN 2 THEN 'FERT' WHEN 3 THEN 'FERT'
        WHEN 4 THEN 'HERB' WHEN 5 THEN 'PEST' WHEN 6 THEN 'FUNG' WHEN 7 THEN 'SEMI'
        WHEN 8 THEN 'SEMI' ELSE 'BIO'
    END;
    DECLARE @coherent_supply VARCHAR(30) = 'INS-' + @ins_code + '-' + RIGHT('000' + CAST(@supply_num AS VARCHAR(10)), 3);

    INSERT INTO dbo.detalle_actividad (id_actividad, id_insumo, cantidad, precio_unitario, subtotal)
    VALUES (
        @current_act,
        @coherent_supply,
        2 + (@det_id % 8),
        45.00 + (@det_id % 10) * 12.50,
        (2 + (@det_id % 8)) * (45.00 + (@det_id % 10) * 12.50)
    );
    SET @det_id = @det_id + 1;
END;
GO

-- BUCLE 2 (AXEL HUAPAYA): 80 ASIGNACIONES Y 160 DETALLES DE TRABAJADORES (USR-ADM-001, USR-SUP-..., etc.)
PRINT 'Insertando 80 Asignaciones y 160 Jornales de Trabajadores (Axel Huapaya)...';
DECLARE @asig_id INT = 1;
WHILE @asig_id <= 80
BEGIN
    INSERT INTO dbo.asignacion_cabecera (id_actividad, fecha_asignacion, horas_trabajadas, costo_total_mano_obra, observacion, estado)
    VALUES (
        ((@asig_id - 1) % 150) + 1,
        DATEADD(DAY, -(@asig_id % 30), GETDATE()),
        6.0 + (@asig_id % 4) * 1.0,
        120.00 + (@asig_id % 5) * 30.00,
        'Cuadrilla de operarios asignada a la labor técnica.',
        1
    );
    SET @asig_id = @asig_id + 1;
END;

DECLARE @asig_det_id INT = 1;
WHILE @asig_det_id <= 160
BEGIN
    DECLARE @header_id INT = ((@asig_det_id - 1) / 2) + 1;
    DECLARE @worker_slot INT = (@asig_det_id - 1) % 2;
    DECLARE @user_num INT = (((@header_id * 2 + @worker_slot) % 140) + 1);

    DECLARE @usr_code VARCHAR(3) = CASE
        WHEN @user_num <= 3 THEN 'ADM'
        ELSE CASE (@user_num % 5)
            WHEN 0 THEN 'ADM' WHEN 1 THEN 'SUP' WHEN 2 THEN 'OPE' WHEN 3 THEN 'TEC' ELSE 'AGR'
        END
    END;
    DECLARE @coherent_user VARCHAR(30) = 'USR-' + @usr_code + '-' + RIGHT('000' + CAST(@user_num AS VARCHAR(10)), 3);

    INSERT INTO dbo.asignacion_detalle (id_asignacion_cabecera, id_usuario, costo_mano_obra)
    VALUES (
        @header_id,
        @coherent_user,
        60.00 + (@asig_det_id % 6) * 15.00
    );
    SET @asig_det_id = @asig_det_id + 1;
END;
GO

-- BUCLE 3 (ANA FÉLIX): 60 COSECHAS Y 120 DETALLES DE RENDIMIENTO
PRINT 'Insertando 60 Cosechas y 120 Detalles de Rendimiento (Ana Félix)...';
DECLARE @harv_id INT = 1;
WHILE @harv_id <= 60
BEGIN
    INSERT INTO dbo.harvest (responsable, fecha_cosecha, estado)
    VALUES (
        CASE (@harv_id % 3)
            WHEN 0 THEN 'Ana Félix'
            WHEN 1 THEN 'Hugo Fernández'
            ELSE 'Axel Huapaya'
        END,
        DATEADD(DAY, -(@harv_id * 3), CAST(GETDATE() AS DATE)),
        1
    );
    SET @harv_id = @harv_id + 1;
END;

DECLARE @harv_det_id INT = 1;
WHILE @harv_det_id <= 120
BEGIN
    DECLARE @h_id INT = ((@harv_det_id - 1) / 2) + 1;
    DECLARE @crop_slot INT = (@harv_det_id - 1) % 2;
    DECLARE @crop_id INT = (((@h_id + @crop_slot * 10 - 1) % 50) + 1);

    INSERT INTO dbo.harvest_planting_cycle (id_harvest, id_cultivo, kilos_optimos, kilos_merma)
    VALUES (
        @h_id,
        @crop_id,
        3200.00 + (@harv_det_id % 20) * 150.00,
        80.00 + (@harv_det_id % 10) * 8.50
    );
    SET @harv_det_id = @harv_det_id + 1;
END;
GO

-- ------------------------------------------------------------------------------
-- RESUMEN FINAL SQL SERVER
-- ------------------------------------------------------------------------------
PRINT '==============================================================================';
PRINT '¡SQL SERVER POBLADO CON IDENTIFICADORES COHERENTES (INS-..., USR-..., PARC-...)!';
PRINT '==============================================================================';
SELECT 'cultivos / crops (Soporte)' AS Entidad, COUNT(*) AS Total_Registros FROM dbo.cultivos
UNION ALL
SELECT 'actividad_cultivo (Hugo Fernández - Cabecera)', COUNT(*) FROM dbo.actividad_cultivo
UNION ALL
SELECT 'detalle_actividad (Hugo Fernández - Detalle Insumo)', COUNT(*) FROM dbo.detalle_actividad
UNION ALL
SELECT 'asignacion_cabecera (Axel Huapaya - Cabecera)', COUNT(*) FROM dbo.asignacion_cabecera
UNION ALL
SELECT 'asignacion_detalle (Axel Huapaya - Detalle Usuario)', COUNT(*) FROM dbo.asignacion_detalle
UNION ALL
SELECT 'harvest (Ana Félix - Cabecera)', COUNT(*) FROM dbo.harvest
UNION ALL
SELECT 'harvest_planting_cycle (Ana Félix - Detalle Rendimiento)', COUNT(*) FROM dbo.harvest_planting_cycle;
GO
