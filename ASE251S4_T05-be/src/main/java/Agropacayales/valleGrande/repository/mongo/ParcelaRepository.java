package Agropacayales.valleGrande.repository.mongo;

import Agropacayales.valleGrande.model.Parcela;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ParcelaRepository extends ReactiveMongoRepository<Parcela, String> {

    Flux<Parcela> findByEstado(Boolean estado);

    Mono<Boolean> existsByNombreIgnoreCase(String nombre);

    Mono<Boolean> existsByNombreIgnoreCaseAndIdNot(String nombre, String id);
}
