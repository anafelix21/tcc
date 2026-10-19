package pe.edu.vallegrande.checker.service;

import com.mongodb.client.model.Sorts;
import com.mongodb.reactivestreams.client.MongoClient;
import org.bson.Document;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.checker.config.CheckerProperties;
import pe.edu.vallegrande.checker.model.ChangeIdentity;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class DiagnosticsService {
    private final DatabaseClient postgres;
    private final MongoClient mongo;
    private final CheckerProperties properties;
    private final ManifestService manifest;

    public DiagnosticsService(DatabaseClient postgres, MongoClient mongo,
                              CheckerProperties properties, ManifestService manifest) {
        this.postgres = postgres;
        this.mongo = mongo;
        this.properties = properties;
        this.manifest = manifest;
    }

    public Mono<Map<String, Object>> diagnostics() {
        return Mono.zip(engineReport("postgresql"), engineReport("mongodb"))
                .map(tuple -> {
                    var engines = new LinkedHashMap<String, Object>();
                    engines.put("postgresql", tuple.getT1());
                    engines.put("mongodb", tuple.getT2());
                    boolean aligned = "ALIGNED".equals(tuple.getT1().get("status"))
                            && "ALIGNED".equals(tuple.getT2().get("status"));
                    var response = new LinkedHashMap<String, Object>();
                    response.put("status", aligned ? "UP" : "DEGRADED");
                    response.put("aligned", aligned);
                    response.put("expected", manifest.all());
                    response.put("engines", engines);
                    return response;
                });
    }

    public Mono<Map<String, Object>> changes() {
        return Mono.zip(engineReport("postgresql"), engineReport("mongodb"))
                .map(tuple -> Map.of("postgresql", tuple.getT1(), "mongodb", tuple.getT2()));
    }

    public Mono<Map<String, Object>> contract() {
        Mono<Set<String>> pg = postgres.sql("""
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name IN ('cultivos', 'insumos_kardex', 'cosechas_lote', 'fichas_campo', 'auditoria_labores')
                """).map((row, metadata) -> row.get("table_name", String.class)).all()
                .collect(() -> new LinkedHashSet<String>(), Set::add);
        Mono<Set<String>> mg = Flux.from(mongo.getDatabase(properties.mongodb().database()).listCollectionNames())
                .filter(name -> name.equals("parcelas") || name.equals("insumos") || name.equals("cosechas") || name.equals("fichas_campo") || name.equals("auditoria_labores"))
                .collect(() -> new LinkedHashSet<String>(), Set::add);
        return Mono.zip(safeSet(pg), safeSet(mg)).map(tuple -> {
            var expectedPg = Set.of("cultivos", "insumos_kardex");
            var expectedMg = Set.of("parcelas", "insumos");
            var response = new LinkedHashMap<String, Object>();
            response.put("expectedPostgres", expectedPg);
            response.put("expectedMongo", expectedMg);
            response.put("postgresql", Map.of("present", tuple.getT1(), "valid", tuple.getT1().containsAll(expectedPg)));
            response.put("mongodb", Map.of("present", tuple.getT2(), "valid", tuple.getT2().containsAll(expectedMg)));
            return response;
        });
    }

    private Mono<Set<String>> safeSet(Mono<Set<String>> source) {
        return source.onErrorReturn(Set.of());
    }

    private Mono<Map<String, Object>> engineReport(String engine) {
        Mono<List<Map<String, Object>>> history = engine.equals("postgresql") ? postgresHistory() : mongoHistory();
        return history.map(applied -> compare(engine, applied))
                .onErrorResume(error -> Mono.just(Map.of(
                        "status", "UNREACHABLE",
                        "error", error.getClass().getSimpleName() + ": " + safeMessage(error),
                        "expectedCount", manifest.expected(engine).size(),
                        "applied", List.of())));
    }

    private Mono<List<Map<String, Object>>> postgresHistory() {
        return postgres.sql("""
                SELECT id, author, filename, dateexecuted, md5sum, orderexecuted
                FROM databasechangelog ORDER BY orderexecuted
                """).map((row, metadata) -> change(
                        row.get("id", String.class), row.get("author", String.class), row.get("filename", String.class),
                        row.get("dateexecuted"), row.get("md5sum", String.class), row.get("orderexecuted")))
                .all().collectList();
    }

    private Mono<List<Map<String, Object>>> mongoHistory() {
        var database = mongo.getDatabase(properties.mongodb().database());
        return Flux.from(database.listCollectionNames())
                .filter(name -> name.equalsIgnoreCase("DATABASECHANGELOG"))
                .next()
                .switchIfEmpty(Mono.error(new IllegalStateException("DATABASECHANGELOG no existe")))
                .flatMapMany(name -> Flux.from(database.getCollection(name).find().sort(Sorts.ascending("orderExecuted"))))
                .map(document -> change(
                        text(document, "id"), text(document, "author"), text(document, "filePath", "filename"),
                        value(document, "dateExecuted", "dateexecuted"), text(document, "md5sum", "md5Sum"),
                        value(document, "orderExecuted", "orderexecuted")))
                .collectList();
    }

    private Map<String, Object> compare(String engine, List<Map<String, Object>> applied) {
        var expected = manifest.expected(engine);
        Set<String> expectedKeys = new LinkedHashSet<>();
        expected.forEach(item -> expectedKeys.add(item.key()));
        Set<String> appliedKeys = new LinkedHashSet<>();
        applied.forEach(item -> appliedKeys.add(new ChangeIdentity(
                String.valueOf(item.get("id")), String.valueOf(item.get("author")),
                String.valueOf(item.get("file"))).key()));
        var missing = new ArrayList<>(expectedKeys); missing.removeAll(appliedKeys);
        var unexpected = new ArrayList<>(appliedKeys); unexpected.removeAll(expectedKeys);
        var result = new LinkedHashMap<String, Object>();
        result.put("status", missing.isEmpty() && unexpected.isEmpty() ? "ALIGNED" : "DRIFT");
        result.put("expectedCount", expected.size());
        result.put("appliedCount", applied.size());
        result.put("missing", missing);
        result.put("unexpected", unexpected);
        result.put("applied", applied);
        return result;
    }

    private Map<String, Object> change(String id, String author, String file, Object date, String checksum, Object order) {
        var result = new LinkedHashMap<String, Object>();
        result.put("id", id); result.put("author", author); result.put("file", normalize(file));
        result.put("executedAt", String.valueOf(date)); result.put("checksum", checksum); result.put("order", order);
        return result;
    }

    private String normalize(String path) { return path == null ? "" : path.replace('\\', '/'); }
    private String safeMessage(Throwable error) { return error.getMessage() == null ? "sin detalle" : error.getMessage(); }
    private String text(Document document, String... keys) { var value = value(document, keys); return value == null ? "" : String.valueOf(value); }
    private Object value(Document document, String... keys) {
        for (String key : keys) {
            if (document.containsKey(key)) return document.get(key);
            for (String actual : document.keySet()) if (actual.equalsIgnoreCase(key)) return document.get(actual);
        }
        return null;
    }
}
