# Cómo probar que TODO está listo

## Opción rápida (un comando)

Requisitos: Docker Desktop abierto, Python, Node y Java 21.

```powershell
cd C:\Users\anacr\OneDrive\Imágenes\Desktop\sprint8\tcc
.\probar-todo.ps1
```

El script hace, en orden:

| Paso | Qué hace | Qué demuestra |
|---|---|---|
| 1 | `pytest` (26), `mvn test` (35), `tsc` de la app | El código de los 3 proyectos compila y sus pruebas pasan |
| 2 | Levanta SQL Server (Docker, con V001+V002), Backend 1 y Backend 2 | La persistencia políglota funciona |
| 3 | `scripts/sembrar_demo.py` | Carga parcelas, cultivos, actividades, asignaciones y cosechas **enlazadas** con insumos/usuarios reales de MongoDB |
| 4 | `scripts/probar_todo.py` | **86 pruebas de punta a punta** (ver abajo) y muestra PASA / FALLA |

Si los servicios ya están corriendo: `.\probar-todo.ps1 -SoloPruebas -SinUnitarias`

### Qué valida la prueba integral (86 pruebas)
- **Servicios:** BE1, BE2, MongoDB, SQL Server, Swagger de ambos.
- **Seguridad:** 401 sin token, 401 con credenciales malas, `/usuarios` no devuelve contraseñas.
  (Para probar login real: `$env:PRUEBA_CORREO="hugo@agro.com"; $env:PRUEBA_PASSWORD="..."`)
- **Maestros (insumos, parcelas, usuarios):** registrar, auditoría, obtener, editar, eliminar, ver en eliminados, restaurar, exportar Excel y PDF.
- **Importación:** CSV con 10 registros → 10 importados.
- **Transacciones:** actividad con insumo real (precio tomado del maestro), rechazo de insumo inexistente, asignación con usuario real, cosecha; editar, eliminar y restaurar cada una.
- **Analítico:** los 18 indicadores, las 3 secciones y el dashboard general (≥3 cards + circular + barras + tabla), validación 422.
- **Integración BE1 → BE2:** llegan eventos CREACION, ACTUALIZACION, ELIMINACION, RESTAURACION, IMPORTACION, EXPORTACION.

Los registros de prueba usan el prefijo `PRUEBA-` y se borran al final.

---

## Prueba manual de la API con Swagger UI (Sin Postman)

Para probar, demostrar y evaluar los endpoints de forma interactiva en el navegador:

1. **Backend 1 (Maestros, Transacciones, Auth):** 👉 [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)
2. **Backend 2 (Analítico, 18 Indicadores, Eventos):** 👉 [http://localhost:5000/apidocs](http://localhost:5000/apidocs)

📖 **Guía completa con ejemplos JSON listos para copiar y pegar:** Consultar [docs/GUIA_SWAGGER.md](file:///c:/Users/anacr/OneDrive/Imágenes/Desktop/sprint8/tcc/docs/GUIA_SWAGGER.md).

---

## Prueba manual de la app móvil (para el video)

```powershell
cd ASE251S4_T05-mobile
copy .env.example .env      # poner la IP de la PC (ipconfig → IPv4), p. ej. http://192.168.1.10:8081/api
npx expo start
```
Escanee el QR con **Expo Go** (celular y PC en la misma Wi-Fi). Para verla en el navegador: `npx expo start --web`.

Checklist:
1. **Login** con un usuario de MongoDB (o "Continuar como invitado").
2. **Inicio:** 3 maestros + 3 transacciones + Dashboard.
3. **Insumos:** lista (15+ registros), buscar, **Registrar** (formulario con validaciones), abrir detalle, **Editar** (poner stock 0), **Eliminar**, pestaña *Eliminados*, **Restaurar**.
4. **Importar** un CSV/Excel y **Exportar** Excel/PDF.
5. **Parcelas / Usuarios:** lo mismo (parcelas incluye suelo y riego embebidos).
6. **Cosechas:** Registrar con 2 cultivos (botón *Agregar ítem*), ver detalle, dar de baja, restaurar.
7. **Actividades:** Registrar eligiendo cultivo + insumos (se calcula el costo con el precio de MongoDB).
8. **Asignaciones:** Registrar eligiendo actividad + trabajadores.
9. **Dashboard:** pestañas General / Ana / Hugo / Axel con cards, barras, dona y tabla.

## Problemas encontrados y corregidos al probar
| Problema | Causa | Corrección |
|---|---|---|
| No se podía crear ninguna parcela (colección vacía) | El validador `$jsonSchema` de la versión V002 de MongoDB exige `_id` texto, `hectareas`, `condiciones_edaficas` y `sistema_riego`; el modelo de Spring no los tenía | `Parcela.java` ahora genera `_id` `PARC-XXXXXXXX` y guarda los subdocumentos embebidos |
| Listados de actividades / asignaciones / cosechas daban error 500 con datos | El driver `r2dbc-mssql` 1.0.x comparte la caché de sentencias preparadas entre conexiones del pool | Pool R2DBC de 1 conexión (`application.yml`, variable `R2DBC_POOL_SIZE`) |
| Las cosechas no se podían restaurar | Faltaba el endpoint | `PUT /api/harvest/restaurar/{id}` |
| No había forma de listar cultivos para elegirlos | Faltaba el endpoint | `GET /api/cultivos` |
