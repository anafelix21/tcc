package Agropacayales.valleGrande.service.impl;

import Agropacayales.valleGrande.dto.request.ActividadCultivoRequestDto;
import Agropacayales.valleGrande.dto.request.DetalleActividadRequestDto;
import Agropacayales.valleGrande.dto.response.ActividadCultivoResponseDto;
import Agropacayales.valleGrande.dto.response.DetalleActividadResponseDto;
import Agropacayales.valleGrande.exception.BusinessValidationException;
import Agropacayales.valleGrande.exception.ResourceNotFoundException;
import Agropacayales.valleGrande.model.Insumo;
import Agropacayales.valleGrande.model.r2dbc.ActividadCultivo;
import Agropacayales.valleGrande.model.r2dbc.Cultivo;
import Agropacayales.valleGrande.model.r2dbc.DetalleActividad;
import Agropacayales.valleGrande.repository.mongo.InsumoRepository;
import Agropacayales.valleGrande.repository.r2dbc.ActividadCultivoR2dbcRepository;
import Agropacayales.valleGrande.repository.r2dbc.CultivoR2dbcRepository;
import Agropacayales.valleGrande.repository.r2dbc.DetalleActividadR2dbcRepository;
import Agropacayales.valleGrande.service.ActividadCultivoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActividadCultivoServiceImpl implements ActividadCultivoService {

    private final ActividadCultivoR2dbcRepository actividadRepo;
    private final DetalleActividadR2dbcRepository detalleRepo;
    private final CultivoR2dbcRepository cultivoRepo;
    private final InsumoRepository insumoRepo;
    private final TransactionalOperator transactionalOperator;

    @Override
    public Flux<ActividadCultivoResponseDto> listarTodas() {
        return actividadRepo.findAll()
                .flatMapSequential(this::populateResponseDto);
    }

    @Override
    public Flux<ActividadCultivoResponseDto> listarPorEstado(Boolean estado) {
        return actividadRepo.findByEstado(estado)
                .flatMapSequential(this::populateResponseDto);
    }

    @Override
    public Mono<ActividadCultivoResponseDto> listarPorId(Long id) {
        return actividadRepo.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Actividad de cultivo no encontrada con ID: " + id)))
                .flatMap(this::populateResponseDto);
    }

    @Override
    public Mono<ActividadCultivoResponseDto> crear(ActividadCultivoRequestDto request) {
        if (request.getDetalles() == null || request.getDetalles().isEmpty()) {
            return Mono.error(new BusinessValidationException("Debe ingresar al menos un insumo consumido en el detalle."));
        }

        // Resolver y validar insumos contra MongoDB de forma reactiva
        return Flux.fromIterable(request.getDetalles())
                .flatMap(detDto -> insumoRepo.findById(detDto.getIdInsumo())
                        .switchIfEmpty(Mono.error(new BusinessValidationException("El insumo con ID " + detDto.getIdInsumo() + " no existe en MongoDB.")))
                        .flatMap(insumo -> {
                            if (!Boolean.TRUE.equals(insumo.getEstado())) {
                                return Mono.error(new BusinessValidationException("El insumo '" + insumo.getNombre() + "' se encuentra inactivo."));
                            }
                            BigDecimal precioUnitario = insumo.getPrecio() != null ? insumo.getPrecio() : BigDecimal.ZERO;
                            BigDecimal subtotal = precioUnitario.multiply(BigDecimal.valueOf(detDto.getCantidad()));
                            DetalleActividad entityDet = DetalleActividad.builder()
                                    .idInsumo(insumo.getId())
                                    .cantidad(detDto.getCantidad())
                                    .precioUnitario(precioUnitario)
                                    .subtotal(subtotal)
                                    .build();
                            return Mono.just(entityDet);
                        })
                )
                .collectList()
                .flatMap(detallesPreparados -> {
                    BigDecimal costoTotal = detallesPreparados.stream()
                            .map(DetalleActividad::getSubtotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    ActividadCultivo cabecera = ActividadCultivo.builder()
                            .idCultivo(request.getIdCultivo())
                            .tipoActividad(request.getTipoActividad().trim())
                            .descripcion(request.getDescripcion())
                            .fechaActividad(LocalDateTime.now())
                            .costoTotal(costoTotal)
                            .estado(true)
                            .completado(false)
                            .createdAt(LocalDateTime.now())
                            .build();

                    // Guardar cabecera en SQL Server y luego sus detalles
                    return actividadRepo.save(cabecera)
                            .flatMap(guardada -> {
                                detallesPreparados.forEach(d -> d.setIdActividad(guardada.getIdActividad()));
                                return detalleRepo.saveAll(detallesPreparados)
                                        .collectList()
                                        .flatMap(savedDetails -> populateResponseDto(guardada));
                            });
                })
                .as(transactionalOperator::transactional);
    }

    @Override
    public Mono<ActividadCultivoResponseDto> editar(Long id, ActividadCultivoRequestDto request) {
        if (request.getDetalles() == null || request.getDetalles().isEmpty()) {
            return Mono.error(new BusinessValidationException("Debe ingresar al menos un insumo en los detalles para editar."));
        }

        return actividadRepo.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Actividad de cultivo no encontrada con ID: " + id)))
                .flatMap(existente -> {
                    if (!Boolean.TRUE.equals(existente.getEstado())) {
                        return Mono.error(new BusinessValidationException("No se puede editar una actividad de cultivo que se encuentra inactiva."));
                    }

                    return Flux.fromIterable(request.getDetalles())
                            .flatMap(detDto -> insumoRepo.findById(detDto.getIdInsumo())
                                    .switchIfEmpty(Mono.error(new BusinessValidationException("El insumo con ID " + detDto.getIdInsumo() + " no existe en MongoDB.")))
                                    .map(insumo -> {
                                        BigDecimal precioUnitario = insumo.getPrecio() != null ? insumo.getPrecio() : BigDecimal.ZERO;
                                        BigDecimal subtotal = precioUnitario.multiply(BigDecimal.valueOf(detDto.getCantidad()));
                                        return DetalleActividad.builder()
                                                .idActividad(existente.getIdActividad())
                                                .idInsumo(insumo.getId())
                                                .cantidad(detDto.getCantidad())
                                                .precioUnitario(precioUnitario)
                                                .subtotal(subtotal)
                                                .build();
                                    })
                            )
                            .collectList()
                            .flatMap(nuevosDetalles -> {
                                BigDecimal costoTotal = nuevosDetalles.stream()
                                        .map(DetalleActividad::getSubtotal)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                                existente.setIdCultivo(request.getIdCultivo());
                                existente.setTipoActividad(request.getTipoActividad().trim());
                                existente.setDescripcion(request.getDescripcion());
                                existente.setCostoTotal(costoTotal);
                                existente.setUpdatedAt(LocalDateTime.now());

                                return actividadRepo.save(existente)
                                        .flatMap(actualizada -> detalleRepo.deleteByIdActividad(id)
                                                .thenMany(detalleRepo.saveAll(nuevosDetalles))
                                                .collectList()
                                                .flatMap(detallesGuardados -> populateResponseDto(actualizada))
                                        );
                            });
                })
                .as(transactionalOperator::transactional);
    }

    @Override
    public Mono<ActividadCultivoResponseDto> eliminar(Long id) {
        return actividadRepo.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Actividad de cultivo no encontrada con ID: " + id)))
                .flatMap(act -> {
                    act.setEstado(false);
                    act.setDeletedAt(LocalDateTime.now());
                    return actividadRepo.save(act)
                            .flatMap(this::populateResponseDto);
                });
    }

    @Override
    public Mono<ActividadCultivoResponseDto> restaurar(Long id) {
        return actividadRepo.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Actividad de cultivo no encontrada con ID: " + id)))
                .flatMap(act -> {
                    act.setEstado(true);
                    act.setRestoredAt(LocalDateTime.now());
                    return actividadRepo.save(act)
                            .flatMap(this::populateResponseDto);
                });
    }

    private Mono<ActividadCultivoResponseDto> populateResponseDto(ActividadCultivo act) {
        Mono<String> nombreCultivoMono = cultivoRepo.findById(act.getIdCultivo())
                .map(Cultivo::getNombre)
                .defaultIfEmpty("Cultivo #" + act.getIdCultivo());

        Mono<List<DetalleActividadResponseDto>> detallesMono = detalleRepo.findByIdActividad(act.getIdActividad())
                .flatMap(det -> insumoRepo.findById(det.getIdInsumo())
                        .map(Insumo::getNombre)
                        .defaultIfEmpty("Insumo desconocido (" + det.getIdInsumo() + ")")
                        .map(nombreInsumo -> DetalleActividadResponseDto.builder()
                                .idDetalle(det.getIdDetalle())
                                .idInsumo(det.getIdInsumo())
                                .nombreInsumo(nombreInsumo)
                                .cantidad(det.getCantidad())
                                .precioUnitario(det.getPrecioUnitario())
                                .subtotal(det.getSubtotal())
                                .build()
                        )
                )
                .collectList();

        return Mono.zip(nombreCultivoMono, detallesMono)
                .map(tuple -> ActividadCultivoResponseDto.builder()
                        .idActividad(act.getIdActividad())
                        .idCultivo(act.getIdCultivo())
                        .nombreCultivo(tuple.getT1())
                        .tipoActividad(act.getTipoActividad())
                        .descripcion(act.getDescripcion())
                        .fechaActividad(act.getFechaActividad())
                        .costoTotal(act.getCostoTotal())
                        .estado(act.getEstado())
                        .completado(act.getCompletado())
                        .createdAt(act.getCreatedAt())
                        .updatedAt(act.getUpdatedAt())
                        .detalles(tuple.getT2())
                        .build()
                );
    }
}
