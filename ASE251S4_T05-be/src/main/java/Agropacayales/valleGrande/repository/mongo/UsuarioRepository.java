package Agropacayales.valleGrande.repository.mongo;

import Agropacayales.valleGrande.model.Usuario;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface UsuarioRepository extends ReactiveMongoRepository<Usuario, String> {

    Flux<Usuario> findByEstado(Boolean estado);

    Mono<Usuario> findByCorreoIgnoreCase(String correo);

    Mono<Boolean> existsByCorreoIgnoreCase(String correo);

    Mono<Boolean> existsByCorreoIgnoreCaseAndIdNot(String correo, String id);
}
