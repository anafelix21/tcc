package Agropacayales.valleGrande.repository.r2dbc;

import Agropacayales.valleGrande.model.r2dbc.Harvest;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface HarvestR2dbcRepository extends ReactiveCrudRepository<Harvest, Integer> {
    Flux<Harvest> findByEstado(Boolean estado);
}
