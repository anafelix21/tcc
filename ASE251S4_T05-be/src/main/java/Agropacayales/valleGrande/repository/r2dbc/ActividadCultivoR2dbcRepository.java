package Agropacayales.valleGrande.repository.r2dbc;

import Agropacayales.valleGrande.model.r2dbc.ActividadCultivo;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface ActividadCultivoR2dbcRepository extends ReactiveCrudRepository<ActividadCultivo, Long> {
    Flux<ActividadCultivo> findByEstado(Boolean estado);
    Flux<ActividadCultivo> findByIdCultivo(Long idCultivo);
}
