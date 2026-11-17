# Guion del video — MongoDB Atlas con vectores ($vectorSearch)

**Curso:** Gestión de Base de Datos · **Equipo:** Ana Félix · Hugo Fernández · Axel Huapaya
**Duración objetivo: ~8 min** (mínimo 5, máximo 10) · **Cámara activa de los tres** · cada uno **opera** su parte en pantalla.

| Integrante | Minutos | Qué demuestra |
| :-- | :-- | :-- |
| **Ana Félix** | 0:00 – 2:45 | Conceptos y **colección con 6 documentos** con campo vectorial |
| **Hugo Fernández** | 2:45 – 5:30 | **Índice vectorial** y **búsqueda 1** |
| **Axel Huapaya** | 5:30 – 8:15 | **Búsqueda 2**, contraste con búsqueda por palabra y cierre |

---

## ✅ Antes de grabar (nadie lo ve)

1. **Clúster de Atlas:** usar el clúster del equipo (el de Hugo). **Hugo** invita a Ana y a Axel a su proyecto para que cada uno pueda operar desde su PC: **Project → Access Manager → Invite to Project**, con rol *Project Owner* o *Project Data Access Admin*.
   - El clúster gratuito admite **máximo 3 índices** de búsqueda/vectoriales. Si ya tienen 3, borren uno que no usen o creen un clúster gratuito nuevo.
2. **No crear nada todavía:** la colección y el índice se crean **en vivo** durante el video.
3. **Tener abiertos** estos archivos (de la carpeta `gbd-vectores`): `fichas.json`, `indice_vectorial.json` y `busquedas.js` (para copiar), y el `INFORME_BD_VECTORIALES.md` (para la tabla de conceptos).
4. **Grabar** por Meet o Teams con las tres cámaras encendidas; cada uno comparte pantalla en su turno.
5. **Capturas para el informe** (cada responsable las toma en su parte):
   - Captura 1: índice `vector_index` en **Ready** — *Hugo*
   - Captura 2: resultados de la búsqueda 1 con puntuaciones — *Hugo*
   - Captura 3: resultados de la búsqueda 2 con puntuaciones — *Axel*

> Si la interfaz de Atlas muestra nombres un poco distintos (cambia seguido), busquen la opción equivalente. Todo se puede hacer también en **mongosh** o en **Compass** con los archivos `crear_coleccion.js` y `busquedas.js`.

---

## 🟩 ANA FÉLIX · 0:00 – 2:45 · Conceptos y colección vectorial

### 0:00 – 0:20 · Presentación *(cámara)*
> **ANA:** "Buenas tardes, profesor. Somos Ana Félix, Hugo Fernández y Axel Huapaya. En este video demostramos cómo **MongoDB Atlas** trabaja con **vectores**: vamos a crear una colección con seis documentos que tienen un campo vectorial, configurar un índice vectorial y ejecutar dos búsquedas con `$vectorSearch`, explicando por qué sale primero cada resultado."

### 0:20 – 1:10 · Conceptos *(pantalla: la tabla del informe)*
> **ANA:** "Primero, dos conceptos. Una **base de datos vectorial** guarda junto a cada dato un **vector**, una lista de números que representa su significado. Datos con significado parecido tienen vectores cercanos.
> Por eso permite la **búsqueda semántica**: buscar por lo que se quiere decir y no por las palabras exactas. La consulta también se convierte en vector y se devuelven los documentos más cercanos.
> Como resume nuestra tabla, una base **relacional** busca coincidencias exactas en tablas, una **documental** filtra campos de documentos JSON, y una **vectorial** busca por **similitud** y devuelve cada resultado con una **puntuación**."

### 1:10 – 2:45 · Crear la colección e insertar los 6 documentos *(pantalla: Atlas)*

**Pasos en pantalla:**
1. En Atlas, abrir **Data Explorer** → **Create Database**:
   - Database name: `agropacayales_vectores`
   - Collection name: `fichas_tecnicas`
   - → **Create**
2. Entrar a `fichas_tecnicas` → **Insert Document** → cambiar a la vista JSON (ícono `{}`) → borrar lo que aparece → pegar **todo** el contenido de `fichas.json` → **Insert**.
3. Mostrar la lista con los **6 documentos** y abrir uno, por ejemplo la **FICHA-05**.

> **ANA** *(mientras pega)*: "Creamos la base `agropacayales_vectores` con la colección `fichas_tecnicas`, que guarda fichas técnicas de nuestro proyecto agrícola. Insertamos seis documentos."
>
> **ANA** *(señalando el campo `embedding` de la FICHA-05)*: "Cada documento tiene un campo vectorial llamado **`embedding`**, con **cinco números entre 0 y 1**. Cada posición es un tema: **agua o riego, plagas, nutrientes, cosecha y clima o calor**. Por ejemplo, la ficha 'Estrés hídrico por ola de calor' tiene 0.70 en agua y 0.85 en calor, porque trata de esos dos temas.
> En un sistema real, el vector lo genera un modelo de inteligencia artificial y tiene cientos de dimensiones. Aquí lo armamos con cinco dimensiones con nombre para poder explicar cada resultado. Ahora Hugo crea el índice vectorial."

---

## 🟦 HUGO FERNÁNDEZ · 2:45 – 5:30 · Índice vectorial y búsqueda 1

### 2:45 – 4:00 · Crear el índice *(pantalla: Atlas)*

**Pasos en pantalla:**
1. En la barra lateral, **Search & Vector Search** → **Create Search Index**.
2. Search Type: **Vector Search**. Si pregunta cómo configurar los vectores: **Bring your own embeddings** (usamos nuestros propios vectores).
3. Configuration Method: **JSON Editor** → **Next**.
4. Index Name: `vector_index` · Database y collection: `agropacayales_vectores.fichas_tecnicas`.
5. Borrar el contenido del editor y pegar `indice_vectorial.json`:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 5, "similarity": "cosine" },
    { "type": "filter", "path": "categoria" }
  ]
}
```

6. **Next** → **Create Vector Search Index**.
7. Esperar a que el **Status** pase de **Pending** a **Ready** (menos de un minuto). 📸 **Captura 1.**

> **HUGO:** "Gracias, Ana. Para buscar por similitud, MongoDB necesita un **índice vectorial**. Lo creamos en *Search & Vector Search*, de tipo *Vector Search*, con nuestros propios vectores.
> En la definición, `path` indica el campo que se indexa: `embedding`. `numDimensions` es 5, porque cada vector tiene cinco números; si no coincide, la búsqueda no funciona. `similarity` es **coseno**, que compara la **dirección** de los vectores, es decir, de qué temas habla cada ficha. Y el campo de tipo `filter` sobre `categoria` permite filtrar antes de comparar.
> *(Cuando aparezca Ready)* El índice está en estado **Ready**: ya se puede consultar."

### 4:00 – 5:30 · Búsqueda 1 *(pantalla: Data Explorer → `fichas_tecnicas` → pestaña **Aggregation** → vista **Text**)*

Pegar este pipeline (también está en `busquedas.js`):

```json
[
  { "$vectorSearch": {
      "index": "vector_index",
      "path": "embedding",
      "queryVector": [0.80, 0.05, 0.10, 0.05, 0.70],
      "numCandidates": 6,
      "limit": 3 } },
  { "$project": { "_id": 0, "codigo": 1, "titulo": 1, "embedding": 1, "score": { "$meta": "vectorSearchScore" } } }
]
```

Resultado esperado (📸 **Captura 2**):

| Puesto | Ficha | Puntuación |
| :-: | :-- | :-: |
| 1 | FICHA-05 · Estrés hídrico por ola de calor | **0.9919** |
| 2 | FICHA-01 · Riego por goteo en uva Red Globe | 0.9560 |
| 3 | FICHA-02 · Control de oídio con fungicida en la vid | 0.6770 |

> **HUGO:** "La primera búsqueda responde a la pregunta *'¿qué hago con mis cultivos cuando hace mucho calor y falta agua?'*. Esa pregunta habla de **agua** y de **calor**, así que su vector es alto en la primera posición, 0.80, y en la última, 0.70.
> En `$vectorSearch` indicamos el índice, el campo y el vector de la consulta. `numCandidates` es 6 para que considere todos los documentos, y `limit` es 3 para devolver los tres mejores. La puntuación se obtiene con `$meta: vectorSearchScore`.
> **Salió primero 'Estrés hídrico por ola de calor', con 0.9919**, porque es la única ficha alta en **los dos** temas: 0.70 en agua y 0.85 en calor. Su vector apunta casi en la misma dirección que la consulta. **Segundo, 'Riego por goteo', con 0.9560**: es muy alta en agua, pero baja en calor. **Tercero, el oídio, con 0.6770**, porque solo tiene algo de clima.
> Con similitud coseno, Atlas convierte el resultado en una puntuación entre 0 y 1 con la fórmula **(1 + coseno) / 2**: 1 significa exactamente la misma dirección. Ahora Axel hace la segunda búsqueda."

---

## 🟨 AXEL HUAPAYA · 5:30 – 8:15 · Búsqueda 2, contraste y cierre

### 5:30 – 6:50 · Búsqueda 2 *(pantalla: Aggregation → Text)*

Pegar:

```json
[
  { "$vectorSearch": {
      "index": "vector_index",
      "path": "embedding",
      "queryVector": [0.05, 0.85, 0.05, 0.55, 0.10],
      "numCandidates": 6,
      "limit": 3 } },
  { "$project": { "_id": 0, "codigo": 1, "titulo": 1, "embedding": 1, "score": { "$meta": "vectorSearchScore" } } }
]
```

Resultado esperado (📸 **Captura 3**):

| Puesto | Ficha | Puntuación |
| :-: | :-- | :-: |
| 1 | FICHA-06 · Mosca de la fruta antes de la cosecha | **0.9982** |
| 2 | FICHA-02 · Control de oídio con fungicida en la vid | 0.9203 |
| 3 | FICHA-04 · Rendimiento por hectárea en la cosecha de mango | 0.7958 |

> **AXEL:** "Gracias, Hugo. La segunda búsqueda responde a *'¿qué hago si aparecen insectos en la fruta antes de cosechar?'*. Ahora la pregunta habla de **plagas**, 0.85, y de **cosecha**, 0.55.
> **Salió primero 'Mosca de la fruta antes de la cosecha', con 0.9982**, porque combina exactamente esos dos temas: 0.80 en plagas y 0.60 en cosecha. Es casi idéntica a la consulta. **Segundo, el control de oídio, con 0.9203**: es de plagas, pero no habla de cosecha. **Tercero, el rendimiento de la cosecha de mango, con 0.7958**: es de cosecha, pero no de plagas.
> Fíjense en que el orden no depende de un solo tema, sino de la **combinación**: gana el documento cuyo vector apunta en la misma dirección que la pregunta."

### 6:50 – 7:30 · Contraste con una búsqueda por palabra *(pantalla: pestaña Documents → barra de filtro)*

En la barra **Filter** escribir y presionar **Find**:

```json
{ "$or": [ { "titulo": { "$regex": "insecto", "$options": "i" } }, { "descripcion": { "$regex": "insecto", "$options": "i" } } ] }
```

Resultado: **0 documentos**.

> **AXEL:** "Ahora busco la palabra **'insecto'** como lo haría una búsqueda tradicional: **cero resultados**, porque ninguna ficha usa esa palabra. Sin embargo, la búsqueda vectorial encontró 'Mosca de la fruta', que es justo lo que se necesitaba. Esa es la diferencia de la **búsqueda semántica**: busca por significado, no por coincidencia de palabras."

### 7:30 – 8:15 · Caso del proyecto y cierre *(cámara)*

> **AXEL:** "En nuestro proyecto AgroPacayales, esto serviría como **buscador semántico de fichas de campo**: un técnico podría escribir *'manchas blancas en las hojas de la uva'* y el sistema le mostraría la ficha de oídio y el fungicida recomendado, aunque no use esas palabras.
> En resumen: creamos una colección con seis documentos con campo vectorial, configuramos un índice vectorial con similitud coseno y ejecutamos dos búsquedas con `$vectorSearch`, donde gana el documento más cercano a la consulta. Muchas gracias."

*(Los tres en cámara, 3 segundos: "Gracias".)*

---

## ➕ Opcional (si les sobra tiempo; el video puede durar hasta 10 min)

**Búsqueda con pre-filtro** — la búsqueda 1 limitada a la categoría `Riego` (usa el campo `filter` del índice):

```json
[
  { "$vectorSearch": { "index": "vector_index", "path": "embedding",
      "queryVector": [0.80, 0.05, 0.10, 0.05, 0.70], "numCandidates": 6, "limit": 3,
      "filter": { "categoria": "Riego" } } },
  { "$project": { "_id": 0, "codigo": 1, "titulo": 1, "categoria": 1, "score": { "$meta": "vectorSearchScore" } } }
]
```

Esperado: solo **FICHA-05 (0.9919)** y **FICHA-01 (0.9560)**, porque son las únicas de categoría Riego.

## 🆘 Si algo falla al grabar

| Síntoma | Qué hacer |
| :-- | :-- |
| La búsqueda devuelve **0 resultados** | El índice no está **Ready**, o el nombre no es exactamente `vector_index`, o es de otra colección |
| Error de dimensiones | `numDimensions` debe ser **5** y los vectores deben tener 5 números |
| No deja crear el índice | El clúster gratuito ya tiene 3 índices: borrar uno que no usen |
| No aparece la vista **Text** en Aggregation | Usar **Compass** conectado a Atlas (pestaña Aggregations → `</>`) o **mongosh** con `busquedas.js` |
| Las puntuaciones tienen más decimales | Es normal: se redondean a 4 decimales para explicarlas (0.99189… = 0.9919) |
| Hay que repetir la toma | Borrar la colección (**Drop Collection**) y volver a insertar `fichas.json`; el índice se puede dejar |
