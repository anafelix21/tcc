# Fundamentos de bases de datos vectoriales

**Curso:** Gestión de Base de Datos · **Proyecto:** AgroPacayales S.A.C.
**Equipo:** Ana Félix · Hugo Fernández · Axel Huapaya

## 1. Definiciones

**Base de datos vectorial.** Es una base de datos que guarda, además de los datos, un **vector**: una lista de números (*embedding*) que representa el significado de un texto, una imagen o un audio. Los elementos con significado parecido tienen vectores cercanos. En vez de buscar coincidencias exactas, compara vectores con una medida de similitud (por ejemplo, el **coseno** del ángulo entre ellos) y usa índices especiales para encontrar rápido los "vecinos más cercanos" (IBM, s. f.; MongoDB, s. f.-b).

**Búsqueda semántica.** Es buscar por **lo que se quiere decir** y no por las palabras exactas. La consulta también se convierte en vector y se devuelven los documentos cuyos vectores están más cerca; por eso entiende sinónimos e intención: "insectos en la fruta" encuentra "mosca de la fruta" aunque no comparta palabras (Google Cloud, s. f.; MongoDB, s. f.-a).

## 2. Comparación

| Criterio | Relacional (SQL Server) | Documental (MongoDB) | Vectorial (MongoDB Atlas Vector Search) |
| :-- | :-- | :-- | :-- |
| **Cómo guarda los datos** | Tablas con filas y columnas, esquema fijo y relaciones por claves foráneas | Documentos JSON/BSON flexibles agrupados en colecciones | Vectores numéricos (*embeddings*) junto al dato original, con un índice vectorial |
| **Cómo busca** | Coincidencia exacta o por rangos con SQL (`WHERE`, `JOIN`) usando índices B-tree | Filtros sobre campos del documento (`find`, `$match`, agregaciones) | Por similitud: compara el vector de la consulta y devuelve los más cercanos con una puntuación (`$vectorSearch`) |
| **Para qué se usa** | Transacciones con integridad ACID: ventas, inventarios, cosechas registradas | Datos variables o semiestructurados: catálogos, fichas, eventos | Búsqueda semántica, recomendaciones, chatbots con RAG, detección de anomalías |

## 3. Caso propuesto en AgroPacayales

**Buscador semántico de fichas técnicas de campo.** Hoy un técnico que ve un problema en el cultivo debe buscar con las mismas palabras con que se registró. Con búsqueda semántica podría escribir *"manchas blancas en las hojas de la uva"* y el sistema le devolvería la ficha de **oídio** y el **fungicida** recomendado, aunque no use esas palabras. Cada ficha de la colección `field_records` guardaría un campo `embedding` generado por un modelo de lenguaje; un índice vectorial de MongoDB Atlas y una consulta `$vectorSearch` desde el backend Spring WebFlux devolverían las fichas más parecidas con su puntuación. **Beneficio:** diagnósticos más rápidos y reutilización del conocimiento de campañas anteriores.

## 4. Fuentes

1. IBM. (s. f.). *¿Qué es una base de datos vectorial?* IBM Think. https://www.ibm.com/mx-es/think/topics/vector-database
2. Google Cloud. (s. f.). *¿Qué es la búsqueda semántica y cómo funciona?* https://cloud.google.com/discover/what-is-semantic-search?hl=es
3. MongoDB. (s. f.-a). *$vectorSearch aggregation stage*. MongoDB Docs. https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-stage/
4. MongoDB. (s. f.-b). *How to index fields for vector search*. MongoDB Docs. https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-type/
5. MongoDB. (s. f.-c). *knnBeta operator (cálculo de la puntuación: score = (1 + coseno) / 2)*. MongoDB Docs. https://www.mongodb.com/docs/atlas/atlas-search/knn-beta

---

# Anexo — Evidencias de la demostración en MongoDB Atlas

**Colección:** `agropacayales_vectores.fichas_tecnicas` (6 fichas técnicas). **Campo vectorial:** `embedding`, de 5 dimensiones. Cada número (de 0 a 1) indica cuánto trata la ficha de un tema:

`[ agua/riego, plagas/enfermedades, nutrientes/fertilización, cosecha/rendimiento, clima/calor ]`

> En un sistema real, el vector lo genera un modelo de *embeddings* y tiene cientos de dimensiones. Aquí se definió a mano con 5 dimensiones con nombre, para poder explicar cada resultado.

**Captura 1 — Índice vectorial activo.** *[Pegar captura: Search & Vector Search → índice `vector_index` con Status **Ready**]*
Índice `vector_index` de tipo *Vector Search* sobre `embedding`: `numDimensions: 5` y `similarity: "cosine"`. Incluye un campo `filter` en `categoria` para filtrar antes de comparar vectores. El estado **Ready** indica que ya se puede consultar.

**Captura 2 — Búsqueda 1:** *"¿Qué hago con mis cultivos cuando hace mucho calor y falta agua?"* → `queryVector: [0.80, 0.05, 0.10, 0.05, 0.70]` *[Pegar captura]*

| Puesto | Ficha | Puntuación |
| :-: | :-- | :-: |
| 1 | FICHA-05 · Estrés hídrico por ola de calor | 0.9919 |
| 2 | FICHA-01 · Riego por goteo en uva Red Globe | 0.9560 |
| 3 | FICHA-02 · Control de oídio con fungicida en la vid | 0.6770 |

**Por qué salió primero:** la consulta es alta en *agua* (0.80) y *calor* (0.70). La FICHA-05 es la única alta en **ambos** temas (0.70 y 0.85), así que su vector apunta casi en la misma dirección: coseno 0.98. La FICHA-01 es muy alta en agua pero baja en calor, por eso queda segunda.

**Captura 3 — Búsqueda 2:** *"¿Qué hago si aparecen insectos en la fruta antes de cosechar?"* → `queryVector: [0.05, 0.85, 0.05, 0.55, 0.10]` *[Pegar captura]*

| Puesto | Ficha | Puntuación |
| :-: | :-- | :-: |
| 1 | FICHA-06 · Mosca de la fruta antes de la cosecha | 0.9982 |
| 2 | FICHA-02 · Control de oídio con fungicida en la vid | 0.9203 |
| 3 | FICHA-04 · Rendimiento por hectárea en la cosecha de mango | 0.7958 |

**Por qué salió primero:** la consulta combina *plagas* (0.85) y *cosecha* (0.55), igual que la FICHA-06 (0.80 y 0.60): son casi paralelas, con coseno 0.996. La FICHA-02 es de plagas pero no de cosecha; la FICHA-04 es de cosecha pero no de plagas. Además, **ninguna ficha contiene la palabra "insecto"**: una búsqueda por palabra devuelve 0 documentos y la vectorial encuentra la respuesta correcta.

**Cómo se calcula la puntuación:** con `similarity: "cosine"`, Atlas devuelve `score = (1 + coseno) / 2`, un valor entre 0 y 1 donde 1 significa "misma dirección" (MongoDB, s. f.-c).
