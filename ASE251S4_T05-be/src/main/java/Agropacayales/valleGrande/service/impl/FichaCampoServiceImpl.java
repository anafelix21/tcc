package Agropacayales.valleGrande.service.impl;

import Agropacayales.valleGrande.exception.ResourceNotFoundException;
import Agropacayales.valleGrande.model.FichaCampo;
import Agropacayales.valleGrande.repository.mongo.FichaCampoRepository;
import Agropacayales.valleGrande.repository.mongo.UsuarioRepository;
import Agropacayales.valleGrande.repository.r2dbc.CultivoR2dbcRepository;
import Agropacayales.valleGrande.service.FichaCampoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class FichaCampoServiceImpl implements FichaCampoService {

    private final FichaCampoRepository fichaRepo;
    private final CultivoR2dbcRepository cultivoRepo;
    private final UsuarioRepository usuarioRepo;

    @Override
    public Flux<FichaCampo> listarTodos() {
        return fichaRepo.findAll();
    }

    @Override
    public Flux<FichaCampo> listarPorEstado(Boolean estado) {
        return fichaRepo.findByEstado(estado);
    }

    @Override
    public Mono<FichaCampo> buscarPorId(String id) {
        return fichaRepo.findById(id)
                .switchIfEmpty(fichaRepo.findByCodigoFicha(id).next())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Ficha de campo no encontrada con identificador: " + id)));
    }

    @Override
    public Mono<FichaCampo> crear(FichaCampo ficha) {
        ficha.setEstado(true);
        ficha.setCreatedAt(LocalDateTime.now());
        if (ficha.getFechaRegistro() == null || ficha.getFechaRegistro().isBlank()) {
            ficha.setFechaRegistro(LocalDate.now().toString());
        }
        if (ficha.getCodigoFicha() == null || ficha.getCodigoFicha().isBlank()) {
            ficha.setCodigoFicha("FC-" + System.currentTimeMillis() % 100000);
        }

        Mono<Void> enrichCultivo = Mono.empty();
        if (ficha.getIdCultivo() != null && (ficha.getNombreCultivo() == null || ficha.getNombreCultivo().isBlank())) {
            enrichCultivo = cultivoRepo.findById(ficha.getIdCultivo())
                    .doOnNext(c -> ficha.setNombreCultivo(c.getNombre()))
                    .then();
        }

        Mono<Void> enrichUsuario = Mono.empty();
        if (ficha.getIdUsuario() != null && (ficha.getNombreUsuario() == null || ficha.getNombreUsuario().isBlank())) {
            enrichUsuario = usuarioRepo.findById(ficha.getIdUsuario())
                    .doOnNext(u -> ficha.setNombreUsuario(u.getNombre() + " " + u.getApellido()))
                    .then();
        }

        return Mono.when(enrichCultivo, enrichUsuario)
                .then(fichaRepo.save(ficha))
                .doOnSuccess(saved -> log.info("Ficha de campo registrada exitosamente: {}", saved.getId()));
    }

    @Override
    public Mono<FichaCampo> editar(String id, FichaCampo ficha) {
        return buscarPorId(id)
                .flatMap(existente -> {
                    if (ficha.getIdCultivo() != null) existente.setIdCultivo(ficha.getIdCultivo());
                    if (ficha.getNombreCultivo() != null) existente.setNombreCultivo(ficha.getNombreCultivo());
                    if (ficha.getIdUsuario() != null) existente.setIdUsuario(ficha.getIdUsuario());
                    if (ficha.getNombreUsuario() != null) existente.setNombreUsuario(ficha.getNombreUsuario());
                    if (ficha.getEtapaFenologica() != null) existente.setEtapaFenologica(ficha.getEtapaFenologica());
                    if (ficha.getTemperaturaAmb() != null) existente.setTemperaturaAmb(ficha.getTemperaturaAmb());
                    if (ficha.getHumedadRelativa() != null) existente.setHumedadRelativa(ficha.getHumedadRelativa());
                    if (ficha.getCondicionClima() != null) existente.setCondicionClima(ficha.getCondicionClima());
                    if (ficha.getEstadoCultivo() != null) existente.setEstadoCultivo(ficha.getEstadoCultivo());
                    if (ficha.getNecesitaRiego() != null) existente.setNecesitaRiego(ficha.getNecesitaRiego());
                    if (ficha.getNecesitaFumigacion() != null) existente.setNecesitaFumigacion(ficha.getNecesitaFumigacion());
                    if (ficha.getDiagnostico() != null) existente.setDiagnostico(ficha.getDiagnostico());
                    if (ficha.getAccionTomada() != null) existente.setAccionTomada(ficha.getAccionTomada());
                    if (ficha.getAccionPendiente() != null) existente.setAccionPendiente(ficha.getAccionPendiente());
                    existente.setUpdatedAt(LocalDateTime.now());

                    Mono<Void> enrichCultivo = Mono.empty();
                    if (existente.getIdCultivo() != null && (existente.getNombreCultivo() == null || existente.getNombreCultivo().isBlank())) {
                        enrichCultivo = cultivoRepo.findById(existente.getIdCultivo())
                                .doOnNext(c -> existente.setNombreCultivo(c.getNombre()))
                                .then();
                    }

                    return Mono.when(enrichCultivo)
                            .then(fichaRepo.save(existente));
                })
                .doOnSuccess(updated -> log.info("Ficha de campo actualizada: {}", id));
    }

    @Override
    public Mono<FichaCampo> eliminar(String id) {
        return buscarPorId(id)
                .flatMap(f -> {
                    f.setEstado(false);
                    f.setDeletedAt(LocalDateTime.now());
                    return fichaRepo.save(f);
                })
                .doOnSuccess(f -> log.info("Ficha de campo desactivada lógicamente: {}", id));
    }

    @Override
    public Mono<FichaCampo> restaurar(String id) {
        return buscarPorId(id)
                .flatMap(f -> {
                    f.setEstado(true);
                    f.setRestoredAt(LocalDateTime.now());
                    return fichaRepo.save(f);
                })
                .doOnSuccess(f -> log.info("Ficha de campo restaurada: {}", id));
    }
}
