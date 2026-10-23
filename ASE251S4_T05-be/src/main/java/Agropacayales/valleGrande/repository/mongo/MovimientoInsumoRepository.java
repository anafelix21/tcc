package Agropacayales.valleGrande.repository.mongo;

import Agropacayales.valleGrande.model.MovimientoInsumo;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface MovimientoInsumoRepository extends ReactiveMongoRepository<MovimientoInsumo, String> {

    Flux<MovimientoInsumo> findByIdInsumo(String idInsumo);

    Flux<MovimientoInsumo> findByTipoMovimiento(String tipoMovimiento);
}
