package Agropacayales.valleGrande.repository.r2dbc;

import Agropacayales.valleGrande.model.r2dbc.Cultivo;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface CultivoR2dbcRepository extends ReactiveCrudRepository<Cultivo, Long> {
    Flux<Cultivo> findByEstado(Boolean estado);
    Flux<Cultivo> findByIdParcela(String idParcela);
}
