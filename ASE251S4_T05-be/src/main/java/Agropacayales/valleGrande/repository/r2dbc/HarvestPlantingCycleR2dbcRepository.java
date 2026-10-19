package Agropacayales.valleGrande.repository.r2dbc;

import Agropacayales.valleGrande.model.r2dbc.HarvestPlantingCycle;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface HarvestPlantingCycleR2dbcRepository extends ReactiveCrudRepository<HarvestPlantingCycle, Integer> {
    Flux<HarvestPlantingCycle> findByIdHarvest(Integer idHarvest);
    Mono<Void> deleteByIdHarvest(Integer idHarvest);
}
