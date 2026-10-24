package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.model.Parcela;
import Agropacayales.valleGrande.model.r2dbc.Cultivo;
import Agropacayales.valleGrande.repository.mongo.ParcelaRepository;
import Agropacayales.valleGrande.repository.r2dbc.CultivoR2dbcRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/cultivos")
@Tag(name = "Cultivo-Controller", description = "Catálogo de cultivos (SQL Server) sincronizado con Parcelas (MongoDB Atlas)")
public class CultivoController {

    private final CultivoR2dbcRepository cultivoRepository;
    private final ParcelaRepository parcelaRepository;

    public CultivoController(CultivoR2dbcRepository cultivoRepository, ParcelaRepository parcelaRepository) {
        this.cultivoRepository = cultivoRepository;
        this.parcelaRepository = parcelaRepository;
    }

    private Mono<Cultivo> populateParcela(Cultivo cultivo) {
        if (cultivo == null || cultivo.getIdParcela() == null || cultivo.getIdParcela().isBlank()) {
            return Mono.justOrEmpty(cultivo);
        }
        return parcelaRepository.findById(cultivo.getIdParcela())
                .map(p -> {
                    cultivo.setParcela(p);
                    return cultivo;
                })
                .defaultIfEmpty(cultivo);
    }

    @GetMapping
    @Operation(summary = "Listar cultivos activos sincronizados con parcelas")
    public Flux<Cultivo> listarActivos() {
        return listarPorEstado(true);
    }

    @GetMapping("/estado/{estado}")
    @Operation(summary = "Listar cultivos por estado (activos/inactivos)")
    public Flux<Cultivo> listarPorEstado(@PathVariable Boolean estado) {
        Mono<java.util.List<Cultivo>> cultivosMono = cultivoRepository.findAll()
                .filter(c -> estado == null || estado.equals(c.getEstado()))
                .collectList();

        Mono<java.util.Map<String, Parcela>> parcelasMapMono = parcelaRepository.findAll()
                .collectMap(Parcela::getId, java.util.function.Function.identity());

        return Mono.zip(cultivosMono, parcelasMapMono)
                .flatMapMany(tuple -> {
                    java.util.List<Cultivo> list = tuple.getT1();
                    java.util.Map<String, Parcela> map = tuple.getT2();
                    list.forEach(c -> {
                        if (c.getIdParcela() != null) {
                            c.setParcela(map.get(c.getIdParcela()));
                        }
                    });
                    return Flux.fromIterable(list);
                });
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener cultivo por ID con datos de su parcela")
    public Mono<ResponseEntity<Cultivo>> obtener(@PathVariable Long id) {
        return cultivoRepository.findById(id)
                .flatMap(this::populateParcela)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/parcela/{idParcela}")
    @Operation(summary = "Listar cultivos de una parcela (id de MongoDB)")
    public Flux<Cultivo> listarPorParcela(@PathVariable String idParcela) {
        return cultivoRepository.findAll()
                .filter(c -> idParcela != null && idParcela.equalsIgnoreCase(c.getIdParcela()))
                .collectList()
                .flatMapMany(list -> Flux.fromIterable(list).concatMap(this::populateParcela));
    }

    @PostMapping
    @Operation(summary = "Registrar nuevo cultivo y sincronizar con parcela en MongoDB")
    public Mono<ResponseEntity<Cultivo>> crear(@RequestBody Cultivo cultivo) {
        cultivo.setCreatedAt(LocalDateTime.now());
        if (cultivo.getEstado() == null) {
            cultivo.setEstado(true);
        }
        return cultivoRepository.save(cultivo)
                .flatMap(guardado -> {
                    if (guardado.getIdParcela() != null && !guardado.getIdParcela().isBlank()) {
                        return parcelaRepository.findById(guardado.getIdParcela())
                                .flatMap(p -> {
                                    p.setCultivoActual(guardado.getNombre());
                                    p.setEnUso(true);
                                    p.setUpdatedAt(LocalDateTime.now());
                                    return parcelaRepository.save(p);
                                })
                                .map(p -> {
                                    guardado.setParcela(p);
                                    return guardado;
                                })
                                .defaultIfEmpty(guardado);
                    }
                    return Mono.just(guardado);
                })
                .map(c -> ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(c));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar cultivo existente y sincronizar con parcela en MongoDB")
    public Mono<ResponseEntity<Cultivo>> editar(@PathVariable Long id, @RequestBody Cultivo c) {
        return cultivoRepository.findById(id)
                .flatMap(existente -> {
                    String parcelaAnterior = existente.getIdParcela();
                    if (c.getNombre() != null) existente.setNombre(c.getNombre());
                    if (c.getTipoCultivo() != null) existente.setTipoCultivo(c.getTipoCultivo());
                    if (c.getIdParcela() != null) existente.setIdParcela(c.getIdParcela());
                    if (c.getFrecuenciaRiegoDias() != null) existente.setFrecuenciaRiegoDias(c.getFrecuenciaRiegoDias());
                    if (c.getTemperaturaIdeal() != null) existente.setTemperaturaIdeal(c.getTemperaturaIdeal());
                    if (c.getFechaSiembra() != null) existente.setFechaSiembra(c.getFechaSiembra());
                    if (c.getRequiereSombra() != null) existente.setRequiereSombra(c.getRequiereSombra());
                    if (c.getObservaciones() != null) existente.setObservaciones(c.getObservaciones());
                    existente.setUpdatedAt(LocalDateTime.now());

                    return cultivoRepository.save(existente)
                            .flatMap(actualizado -> {
                                Mono<Void> liberarAnterior = Mono.empty();
                                if (parcelaAnterior != null && !parcelaAnterior.equalsIgnoreCase(actualizado.getIdParcela())) {
                                    liberarAnterior = parcelaRepository.findById(parcelaAnterior)
                                            .flatMap(pAnt -> {
                                                pAnt.setCultivoActual(null);
                                                pAnt.setEnUso(false);
                                                pAnt.setUpdatedAt(LocalDateTime.now());
                                                return parcelaRepository.save(pAnt);
                                            }).then();
                                }

                                if (actualizado.getIdParcela() != null && !actualizado.getIdParcela().isBlank()) {
                                    return liberarAnterior.then(parcelaRepository.findById(actualizado.getIdParcela())
                                            .flatMap(p -> {
                                                p.setCultivoActual(actualizado.getNombre());
                                                p.setEnUso(true);
                                                p.setUpdatedAt(LocalDateTime.now());
                                                return parcelaRepository.save(p);
                                            })
                                            .map(p -> {
                                                actualizado.setParcela(p);
                                                return actualizado;
                                            })
                                            .defaultIfEmpty(actualizado));
                                }
                                return liberarAnterior.thenReturn(actualizado);
                            });
                })
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/eliminar")
    @Operation(summary = "Desactivar cultivo lógicamente y liberar la parcela en MongoDB")
    public Mono<ResponseEntity<Cultivo>> eliminar(@PathVariable Long id) {
        return cultivoRepository.findById(id)
                .flatMap(existente -> {
                    existente.setEstado(false);
                    existente.setUpdatedAt(LocalDateTime.now());
                    return cultivoRepository.save(existente)
                            .flatMap(guardado -> {
                                if (guardado.getIdParcela() != null && !guardado.getIdParcela().isBlank()) {
                                    return parcelaRepository.findById(guardado.getIdParcela())
                                            .flatMap(p -> {
                                                p.setCultivoActual(null);
                                                p.setEnUso(false);
                                                p.setUpdatedAt(LocalDateTime.now());
                                                return parcelaRepository.save(p);
                                            })
                                            .thenReturn(guardado);
                                }
                                return Mono.just(guardado);
                            });
                })
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/restaurar")
    @Operation(summary = "Restaurar cultivo inactivo y re-asignar la parcela en MongoDB")
    public Mono<ResponseEntity<Cultivo>> restaurar(@PathVariable Long id) {
        return cultivoRepository.findById(id)
                .flatMap(existente -> {
                    existente.setEstado(true);
                    existente.setUpdatedAt(LocalDateTime.now());
                    return cultivoRepository.save(existente)
                            .flatMap(guardado -> {
                                if (guardado.getIdParcela() != null && !guardado.getIdParcela().isBlank()) {
                                    return parcelaRepository.findById(guardado.getIdParcela())
                                            .flatMap(p -> {
                                                p.setCultivoActual(guardado.getNombre());
                                                p.setEnUso(true);
                                                p.setUpdatedAt(LocalDateTime.now());
                                                return parcelaRepository.save(p);
                                            })
                                            .map(p -> {
                                                guardado.setParcela(p);
                                                return guardado;
                                            })
                                            .defaultIfEmpty(guardado);
                                }
                                return Mono.just(guardado);
                            });
                })
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar cultivo (alias REST)")
    public Mono<ResponseEntity<Cultivo>> eliminarAlias(@PathVariable Long id) {
        return eliminar(id);
    }
}
