package Agropacayales.valleGrande.repository.r2dbc;

import Agropacayales.valleGrande.model.r2dbc.AsignacionCabecera;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface AsignacionCabeceraR2dbcRepository extends ReactiveCrudRepository<AsignacionCabecera, Long> {
    Flux<AsignacionCabecera> findByEstado(Boolean estado);
    Flux<AsignacionCabecera> findByIdActividad(Long idActividad);
}
