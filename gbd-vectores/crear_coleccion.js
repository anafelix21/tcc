// =============================================================================
// GBD - Crea la colección con las 6 fichas técnicas (alternativa por mongosh).
// En Atlas también se puede hacer sin comandos: Data Explorer -> Insert Document
// -> vista JSON -> pegar el contenido de fichas.json.
//
// Uso:  mongosh "<cadena de conexión de Atlas>" --file crear_coleccion.js
// =============================================================================

use("agropacayales_vectores");

db.fichas_tecnicas.drop();   // empezar limpio si se repite la demostración

db.fichas_tecnicas.insertMany([
  { codigo: "FICHA-01", titulo: "Riego por goteo en uva Red Globe", cultivo: "Uva", categoria: "Riego",
    descripcion: "Programación del riego por goteo según la etapa del cultivo para mantener la humedad del suelo sin encharcar.",
    embedding: [0.95, 0.05, 0.20, 0.10, 0.30] },
  { codigo: "FICHA-02", titulo: "Control de oídio con fungicida en la vid", cultivo: "Uva", categoria: "Sanidad",
    descripcion: "Manchas blancas de hongo en hojas y racimos; se aplica azufre o un fungicida sistémico en horas frescas.",
    embedding: [0.10, 0.95, 0.15, 0.05, 0.35] },
  { codigo: "FICHA-03", titulo: "Fertilización nitrogenada en palta", cultivo: "Palta", categoria: "Nutrición",
    descripcion: "Dosis de nitrógeno fraccionada durante la brotación para mejorar el crecimiento y el calibre del fruto.",
    embedding: [0.25, 0.05, 0.95, 0.20, 0.05] },
  { codigo: "FICHA-04", titulo: "Rendimiento por hectárea en la cosecha de mango", cultivo: "Mango", categoria: "Cosecha",
    descripcion: "Registro de kilos cosechados por hectárea y porcentaje de fruta con calidad de exportación por lote.",
    embedding: [0.05, 0.05, 0.15, 0.95, 0.10] },
  { codigo: "FICHA-05", titulo: "Estrés hídrico por ola de calor", cultivo: "Palta", categoria: "Riego",
    descripcion: "Las altas temperaturas aumentan la evaporación; se adelanta el riego y se programa en las horas más frescas del día.",
    embedding: [0.70, 0.10, 0.05, 0.10, 0.85] },
  { codigo: "FICHA-06", titulo: "Mosca de la fruta antes de la cosecha", cultivo: "Mango", categoria: "Sanidad",
    descripcion: "Las larvas de Ceratitis capitata dañan la pulpa del fruto maduro; se colocan trampas y se adelanta la cosecha.",
    embedding: [0.05, 0.80, 0.05, 0.60, 0.15] }
]);

print("Documentos en fichas_tecnicas: " + db.fichas_tecnicas.countDocuments());
