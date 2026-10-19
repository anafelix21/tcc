-- ============================================================================
-- SCRIPT DE INICIALIZACIÓN DE TABLAS TRANSACCIONALES PARA SQL SERVER 2022
-- Proyecto: AgroPacayales (ASE251S4_T05)
-- Arquitectura Políglota: MongoDB (Maestros) + SQL Server R2DBC (Transacciones)
-- ============================================================================

USE agropacayales_db;
GO

-- 1. Tabla de Cultivos (Entidad de soporte para las transacciones)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cultivos')
BEGIN
    CREATE TABLE cultivos (
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
END
GO

-- 2. Transaccional Hugo Fernández: Actividades de Cultivo (Cabecera)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'actividad_cultivo')
BEGIN
    CREATE TABLE actividad_cultivo (
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
        CONSTRAINT FK_actividad_cultivos FOREIGN KEY (id_cultivo) REFERENCES cultivos(id_cultivo)
    );
END
GO

-- 3. Transaccional Hugo Fernández: Detalle de Actividades (Detalle - Insumos consumidos)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'detalle_actividad')
BEGIN
    CREATE TABLE detalle_actividad (
        id_detalle INT IDENTITY(1,1) CONSTRAINT PK_detalle PRIMARY KEY,
        id_actividad INT NOT NULL,
        id_insumo VARCHAR(24) NOT NULL, -- Clave compartida con MongoDB insumos._id
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        CONSTRAINT FK_detalle_actividad_cabecera FOREIGN KEY (id_actividad) 
            REFERENCES actividad_cultivo(id_actividad) ON DELETE CASCADE
    );
END
GO

-- 4. Transaccional Ana Félix: Cosechas - Harvest (Cabecera)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'harvest')
BEGIN
    CREATE TABLE harvest (
        id_harvest INT IDENTITY(1,1) CONSTRAINT PK_harvest PRIMARY KEY,
        responsable VARCHAR(100) NOT NULL,
        fecha_cosecha DATE NOT NULL DEFAULT GETDATE(),
        estado BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2
    );
END
GO

-- 5. Transaccional Ana Félix: Detalle de Cosecha por Cultivo (Detalle)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'harvest_planting_cycle')
BEGIN
    CREATE TABLE harvest_planting_cycle (
        id_harvest_detail INT IDENTITY(1,1) CONSTRAINT PK_harvest_detail PRIMARY KEY,
        id_harvest INT NOT NULL,
        id_cultivo INT NOT NULL,
        kilos_optimos DECIMAL(10,2) NOT NULL,
        kilos_merma DECIMAL(10,2) NOT NULL,
        CONSTRAINT FK_harvest_detail_harvest FOREIGN KEY (id_harvest)
            REFERENCES harvest(id_harvest) ON DELETE CASCADE,
        CONSTRAINT FK_harvest_detail_cultivo FOREIGN KEY (id_cultivo)
            REFERENCES cultivos(id_cultivo)
    );
END
GO

-- 6. Transaccional Axel Huapaya: Asignación de Trabajadores (Cabecera)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'asignacion_cabecera')
BEGIN
    CREATE TABLE asignacion_cabecera (
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
            REFERENCES actividad_cultivo(id_actividad)
    );
END
GO

-- 7. Transaccional Axel Huapaya: Detalle de Asignación de Trabajadores (Detalle)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'asignacion_detalle')
BEGIN
    CREATE TABLE asignacion_detalle (
        id_asignacion_detalle INT IDENTITY(1,1) CONSTRAINT PK_asignacion_detalle PRIMARY KEY,
        id_asignacion_cabecera INT NOT NULL,
        id_usuario VARCHAR(24) NOT NULL, -- Clave compartida con MongoDB usuarios._id
        costo_mano_obra DECIMAL(10,2) NOT NULL,
        CONSTRAINT FK_asig_det_cabecera FOREIGN KEY (id_asignacion_cabecera)
            REFERENCES asignacion_cabecera(id_asignacion_cabecera) ON DELETE CASCADE
    );
END
GO

-- ============================================================================
-- DATOS SEMILLA INICIALES (SEED DATA)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM cultivos WHERE id_cultivo = 1)
BEGIN
    SET IDENTITY_INSERT cultivos ON;
    INSERT INTO cultivos (id_cultivo, id_parcela, nombre, tipo_cultivo, frecuencia_riego_dias, temperatura_ideal, fecha_siembra, requiere_sombra, observaciones, estado)
    VALUES (1, '65f000000000000000000001', 'Palta Hass Lote A', 'Frutal', 3, 22.5, '2025-01-15', 0, 'Plantación de alta densidad en desarrollo vegetativo', 1);
    SET IDENTITY_INSERT cultivos OFF;
END
GO
