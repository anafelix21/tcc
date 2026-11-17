// =============================================================================
// GBD - Búsquedas vectoriales en MongoDB Atlas (base agropacayales_vectores)
// Se pegan en mongosh o en la pestaña Aggregation de Atlas / Compass.
// Requisito: el índice "vector_index" (indice_vectorial.json) en estado Ready.
//
// Dimensiones del vector (cada número es un tema, de 0 a 1):
//   [ agua/riego, plagas/enfermedades, nutrientes/fertilización, cosecha/rendimiento, clima/calor ]
// =============================================================================

use("agropacayales_vectores");

// -----------------------------------------------------------------------------
// BÚSQUEDA 1: "¿Qué hago con mis cultivos cuando hace mucho calor y falta agua?"
//   La pregunta habla de AGUA y de CALOR  ->  vector alto en la 1.a y 5.a posición.
//   Esperado: 1° FICHA-05 (0.9919) · 2° FICHA-01 (0.9560) · 3° FICHA-02 (0.6770)
// -----------------------------------------------------------------------------
db.fichas_tecnicas.aggregate([
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: [0.80, 0.05, 0.10, 0.05, 0.70],
      numCandidates: 6,
      limit: 3
    }
  },
  { $project: { _id: 0, codigo: 1, titulo: 1, categoria: 1, embedding: 1, score: { $meta: "vectorSearchScore" } } }
]);

// -----------------------------------------------------------------------------
// BÚSQUEDA 2: "¿Qué hago si aparecen insectos en la fruta antes de cosechar?"
//   La pregunta habla de PLAGAS y de COSECHA  ->  vector alto en la 2.a y 4.a posición.
//   Esperado: 1° FICHA-06 (0.9982) · 2° FICHA-02 (0.9203) · 3° FICHA-04 (0.7958)
// -----------------------------------------------------------------------------
db.fichas_tecnicas.aggregate([
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: [0.05, 0.85, 0.05, 0.55, 0.10],
      numCandidates: 6,
      limit: 3
    }
  },
  { $project: { _id: 0, codigo: 1, titulo: 1, categoria: 1, embedding: 1, score: { $meta: "vectorSearchScore" } } }
]);

// -----------------------------------------------------------------------------
// CONTRASTE (búsqueda por PALABRA, no por significado):
//   Ninguna ficha contiene la palabra "insecto", así que devuelve 0 documentos,
//   aunque la búsqueda vectorial sí encontró "Mosca de la fruta".
// -----------------------------------------------------------------------------
db.fichas_tecnicas.countDocuments({
  $or: [{ titulo: /insecto/i }, { descripcion: /insecto/i }]
});

// -----------------------------------------------------------------------------
// OPCIONAL: búsqueda 1 con PRE-FILTRO por categoría (usa el campo "filter" del índice).
//   Solo considera fichas de la categoría "Riego".
//   Esperado: 1° FICHA-05 (0.9919) · 2° FICHA-01 (0.9560)
// -----------------------------------------------------------------------------
db.fichas_tecnicas.aggregate([
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: [0.80, 0.05, 0.10, 0.05, 0.70],
      numCandidates: 6,
      limit: 3,
      filter: { categoria: "Riego" }
    }
  },
  { $project: { _id: 0, codigo: 1, titulo: 1, categoria: 1, score: { $meta: "vectorSearchScore" } } }
]);
