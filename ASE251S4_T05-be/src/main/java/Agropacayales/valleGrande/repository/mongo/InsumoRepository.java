package Agropacayales.valleGrande.repository.mongo;

import Agropacayales.valleGrande.model.Insumo;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface InsumoRepository extends ReactiveMongoRepository<Insumo, String> {

    Flux<Insumo> findByEstado(Boolean estado);

    // Validar si existe otro insumo activo con el mismo nombre (ignora mayúsculas/minúsculas)
    Mono<Boolean> existsByNombreIgnoreCaseAndEstadoTrue(String nombre);

    // Validar si existe otro insumo activo con el mismo nombre, excluyendo el ID actual (para edición)
    Mono<Boolean> existsByNombreIgnoreCaseAndEstadoTrueAndIdNot(String nombre, String id);

    // Buscar por coincidencia de nombre parcial (insensible a mayúsculas)
    Flux<Insumo> findByNombreContainingIgnoreCase(String nombre);

    // Buscar por tipo de insumo (insensible a mayúsculas)
    Flux<Insumo> findByTipoInsumoIgnoreCase(String tipoInsumo);
}
