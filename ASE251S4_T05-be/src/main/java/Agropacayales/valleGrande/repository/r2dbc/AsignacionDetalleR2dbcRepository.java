package Agropacayales.valleGrande.repository.r2dbc;

import Agropacayales.valleGrande.model.r2dbc.AsignacionDetalle;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface AsignacionDetalleR2dbcRepository extends ReactiveCrudRepository<AsignacionDetalle, Long> {
    Flux<AsignacionDetalle> findByIdAsignacionCabecera(Long idAsignacionCabecera);
    Mono<Void> deleteByIdAsignacionCabecera(Long idAsignacionCabecera);
}
