# GBD — Fundamentos de bases de datos vectoriales (material del equipo)

**Equipo:** Ana Félix · Hugo Fernández · Axel Huapaya

| Archivo | Para qué sirve | Quién lo usa |
| :-- | :-- | :-- |
| `INFORME_BD_VECTORIALES.md` | **Parte 1** (definiciones, tabla, caso y fuentes: 1 página) y **anexo** con las capturas y explicaciones de la parte 2. Copiar a Google Docs o Word y pegar las capturas donde dice *[Pegar captura]* | Todos |
| `GUION_VIDEO_VECTORES.md` | Qué decir, qué hacer y qué pegar en el video (~8 min) | Todos |
| `fichas.json` | Los 6 documentos con campo vectorial → se pegan en Atlas (Insert Document) | Ana Félix |
| `indice_vectorial.json` | Definición del índice vectorial → se pega en el JSON Editor de Atlas | Hugo Fernández |
| `busquedas.js` | Las 2 búsquedas `$vectorSearch`, el contraste por palabra y una búsqueda opcional con filtro | Hugo Fernández y Axel Huapaya |
| `crear_coleccion.js` | Alternativa por `mongosh` para crear la colección | Opcional |
| `calcular_puntuaciones.py` | Calcula las puntuaciones esperadas (`python calcular_puntuaciones.py`) para comprobar lo que muestra Atlas | Opcional |

**Datos clave:** base `agropacayales_vectores`, colección `fichas_tecnicas`, campo vectorial `embedding` (5 dimensiones: agua/riego, plagas, nutrientes, cosecha, clima/calor), índice `vector_index` con similitud `cosine`.

**Resultados esperados** (verificados con MongoDB 8.3 y `$similarityCosine`, que usa la misma fórmula `(1 + coseno) / 2`):

| Búsqueda | 1.° | 2.° | 3.° |
| :-- | :-- | :-- | :-- |
| 1 · calor y falta de agua | FICHA-05 · 0.9919 | FICHA-01 · 0.9560 | FICHA-02 · 0.6770 |
| 2 · insectos en la fruta antes de cosechar | FICHA-06 · 0.9982 | FICHA-02 · 0.9203 | FICHA-04 · 0.7958 |
