# 📱 AgroPacayales Mobile (React Native + Expo + TypeScript)

App móvil que cubre **todos los módulos del Backend 1 (Spring Boot)** y el **dashboard del Backend 2 (Flask)**. La app nunca toca la base de datos directamente: todo pasa por **servicios** (`src/services`) que consumen la API REST.

Diseño: verde (campo), blanco y marrón claro (tierra) — `src/theme/colors.ts`.

## Módulos

| Módulo | Base de datos | Operaciones en la app |
|---|---|---|
| 🧪 Insumos | MongoDB | listar, buscar, registrar, editar, eliminar, restaurar, importar CSV/Excel, exportar Excel/PDF |
| 🌾 Parcelas | MongoDB (con suelo y riego **embebidos**) | igual que insumos |
| 👩‍🌾 Usuarios | MongoDB | igual que insumos |
| 🧺 Cosechas (Ana Félix) | SQL Server cabecera + detalle | listar, registrar con varios cultivos, editar, dar de baja, restaurar |
| 🚜 Actividades (Hugo Fernández) | SQL Server + insumos de MongoDB | registrar con insumos consumidos (costo con precio del maestro), editar, eliminar, restaurar |
| 🧑‍🤝‍🧑 Asignaciones (Axel Huapaya) | SQL Server + usuarios de MongoDB | registrar con trabajadores, editar, eliminar, restaurar |
| 📊 Dashboard | Backend 2 analítico | General + secciones de Ana, Hugo y Axel: cards, barras, dona y tabla |
| 🔐 Login | JWT del Backend 1 | iniciar sesión o entrar como invitado |

## Estructura de carpetas

```text
src/
├── app/                          # Pantallas (Expo Router: cada archivo es una ruta)
│   ├── _layout.tsx               # Navegación Stack + AuthProvider
│   ├── index.tsx                 # Login
│   ├── inicio.tsx                # Menú principal
│   ├── dashboard.tsx             # Dashboard analítico
│   ├── maestro/[modulo]/         # insumos | parcelas | usuarios
│   │   ├── index.tsx             #   lista + importar/exportar
│   │   ├── [id].tsx              #   detalle + eliminar/restaurar
│   │   └── formulario.tsx        #   registrar / editar
│   └── transaccion/[modulo]/     # cosechas | actividades | asignaciones
│       ├── index.tsx, [id].tsx, formulario.tsx   (cabecera + detalle dinámico)
├── modules/                      # Definición de cada módulo (campos, validaciones, resumen)
│   ├── maestros.ts, transacciones.ts, types.ts
├── services/                     # apiClient (fetch + JWT), crudService (CRUD + catálogos), authService
├── components/                   # Boton, CampoTexto, SelectorChips, SelectorEntidad, CampoFormulario, Graficos, ui
├── context/AuthContext.tsx       # Sesión y token
├── hooks/useCarga.ts             # Carga de datos al enfocar la pantalla
├── config/env.ts                 # URLs de los backends
├── theme/colors.ts               # Paleta verde / blanco / marrón
└── utils/                        # validaciones, formatos, diálogos
```

Las pantallas son **genéricas**: agregar un maestro nuevo solo requiere describirlo en `modules/maestros.ts`.

## Ejecutar

```bash
npm install --legacy-peer-deps
copy .env.example .env      # IP de su PC (ipconfig) o URL de AWS
npx expo start              # escanear el QR con Expo Go
npx expo start --web        # versión navegador
npm run typecheck
```

Requiere el Backend 1 (puerto 8081) y el Backend 2 (puerto 5000) levantados. Ver `docs/PROBAR_TODO.md`.

> Regla de negocio: un insumo solo se elimina con **stock 0** (edítelo primero).
