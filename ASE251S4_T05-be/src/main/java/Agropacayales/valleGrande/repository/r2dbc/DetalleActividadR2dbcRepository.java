package Agropacayales.valleGrande.repository.r2dbc;

import Agropacayales.valleGrande.model.r2dbc.DetalleActividad;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface DetalleActividadR2dbcRepository extends ReactiveCrudRepository<DetalleActividad, Long> {
    Flux<DetalleActividad> findByIdActividad(Long idActividad);
    Mono<Void> deleteByIdActividad(Long idActividad);
}
