package Agropacayales.valleGrande.repository.mongo;

import Agropacayales.valleGrande.model.FichaCampo;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface FichaCampoRepository extends ReactiveMongoRepository<FichaCampo, String> {

    Flux<FichaCampo> findByEstado(Boolean estado);

    Flux<FichaCampo> findByIdCultivo(Long idCultivo);

    Flux<FichaCampo> findByCodigoFicha(String codigoFicha);
}
