package Agropacayales.valleGrande.service;

import Agropacayales.valleGrande.model.FichaCampo;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface FichaCampoService {

    Flux<FichaCampo> listarTodos();

    Flux<FichaCampo> listarPorEstado(Boolean estado);

    Mono<FichaCampo> buscarPorId(String id);

    Mono<FichaCampo> crear(FichaCampo ficha);

    Mono<FichaCampo> editar(String id, FichaCampo ficha);

    Mono<FichaCampo> eliminar(String id);

    Mono<FichaCampo> restaurar(String id);
}
