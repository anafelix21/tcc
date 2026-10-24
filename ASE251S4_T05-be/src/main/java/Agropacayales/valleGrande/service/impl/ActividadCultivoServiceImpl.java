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
import Agropacayales.valleGrande.model.r2dbc.AsignacionCabecera;
import Agropacayales.valleGrande.model.r2dbc.AsignacionDetalle;
import Agropacayales.valleGrande.repository.r2dbc.AsignacionCabeceraR2dbcRepository;
import Agropacayales.valleGrande.repository.r2dbc.AsignacionDetalleR2dbcRepository;
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
@Slf4j
public class ActividadCultivoServiceImpl implements ActividadCultivoService {

    private final ActividadCultivoR2dbcRepository actividadRepo;
    private final DetalleActividadR2dbcRepository detalleRepo;
    private final CultivoR2dbcRepository cultivoRepo;
    private final InsumoRepository insumoRepo;
    private final AsignacionCabeceraR2dbcRepository asignacionCabeceraRepo;
    private final AsignacionDetalleR2dbcRepository asignacionDetalleRepo;
    private final TransactionalOperator transactionalOperator;

    public ActividadCultivoServiceImpl(
            ActividadCultivoR2dbcRepository actividadRepo,
            DetalleActividadR2dbcRepository detalleRepo,
            CultivoR2dbcRepository cultivoRepo,
            InsumoRepository insumoRepo,
            AsignacionCabeceraR2dbcRepository asignacionCabeceraRepo,
            AsignacionDetalleR2dbcRepository asignacionDetalleRepo,
            TransactionalOperator transactionalOperator) {
        this.actividadRepo = actividadRepo;
        this.detalleRepo = detalleRepo;
        this.cultivoRepo = cultivoRepo;
        this.insumoRepo = insumoRepo;
        this.asignacionCabeceraRepo = asignacionCabeceraRepo;
        this.asignacionDetalleRepo = asignacionDetalleRepo;
        this.transactionalOperator = transactionalOperator;
    }

    private Flux<ActividadCultivoResponseDto> buildBatchResponseDtos(List<ActividadCultivo> actividades) {
        if (actividades.isEmpty()) {
            return Flux.empty();
        }

        Mono<java.util.Map<Long, String>> cultivosMapMono = cultivoRepo.findAll()
                .collectMap(Cultivo::getIdCultivo, Cultivo::getNombre);

        Mono<java.util.Map<Long, List<DetalleActividad>>> detallesMapMono = detalleRepo.findAll()
                .collectList()
                .map(list -> list.stream().collect(java.util.stream.Collectors.groupingBy(DetalleActividad::getIdActividad)));

        Mono<java.util.Map<String, String>> insumosMapMono = insumoRepo.findAll()
                .collectMap(Insumo::getId, Insumo::getNombre);

        return Mono.zip(cultivosMapMono, detallesMapMono, insumosMapMono)
                .flatMapMany(tuple -> {
                    java.util.Map<Long, String> cultivosMap = tuple.getT1();
                    java.util.Map<Long, List<DetalleActividad>> detallesMap = tuple.getT2();
                    java.util.Map<String, String> insumosMap = tuple.getT3();

                    List<ActividadCultivoResponseDto> dtos = actividades.stream()
                            .map(act -> {
                                String nombreCultivo = cultivosMap.getOrDefault(act.getIdCultivo(), "Cultivo #" + act.getIdCultivo());
                                List<DetalleActividad> dets = detallesMap.getOrDefault(act.getIdActividad(), java.util.Collections.emptyList());

                                List<DetalleActividadResponseDto> detalleDtos = dets.stream()
                                        .map(det -> DetalleActividadResponseDto.builder()
                                                .idDetalle(det.getIdDetalle())
                                                .idInsumo(det.getIdInsumo())
                                                .nombreInsumo(insumosMap.getOrDefault(det.getIdInsumo(), "Insumo " + det.getIdInsumo()))
                                                .cantidad(det.getCantidad())
                                                .precioUnitario(det.getPrecioUnitario())
                                                .subtotal(det.getSubtotal())
                                                .build())
                                        .collect(java.util.stream.Collectors.toList());

                                return ActividadCultivoResponseDto.builder()
                                        .idActividad(act.getIdActividad())
                                        .idCultivo(act.getIdCultivo())
                                        .nombreCultivo(nombreCultivo)
                                        .tipoActividad(act.getTipoActividad())
                                        .descripcion(act.getDescripcion())
                                        .fechaActividad(act.getFechaActividad())
                                        .costoTotal(act.getCostoTotal())
                                        .estado(act.getEstado())
                                        .completado(act.getCompletado())
                                        .createdAt(act.getCreatedAt())
                                        .updatedAt(act.getUpdatedAt())
                                        .detalles(detalleDtos)
                                        .build();
                            })
                            .collect(java.util.stream.Collectors.toList());

                    return Flux.fromIterable(dtos);
                });
    }

    @Override
    public Flux<ActividadCultivoResponseDto> listarTodas() {
        return actividadRepo.findAll()
                .collectList()
                .flatMapMany(this::buildBatchResponseDtos);
    }

    @Override
    public Flux<ActividadCultivoResponseDto> listarPorEstado(Boolean estado) {
        return actividadRepo.findAll()
                .filter(act -> estado == null || estado.equals(act.getEstado()))
                .collectList()
                .flatMapMany(this::buildBatchResponseDtos);
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

    @Override
    public Mono<ActividadCultivoResponseDto> finalizar(Long id) {
        return actividadRepo.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Actividad de cultivo no encontrada con ID: " + id)))
                .flatMap(act -> {
                    if (Boolean.TRUE.equals(act.getCompletado())) {
                        return populateResponseDto(act);
                    }
                    act.setCompletado(true);
                    act.setUpdatedAt(LocalDateTime.now());

                    // Descontar automáticamente insumos del inventario MongoDB (colección supplies)
                    return detalleRepo.findByIdActividad(id)
                            .flatMap(det -> insumoRepo.findById(det.getIdInsumo())
                                    .flatMap(insumo -> {
                                        int stockActual = insumo.getStock() != null ? insumo.getStock() : 0;
                                        int cantidadUsada = det.getCantidad() != null ? det.getCantidad() : 0;
                                        int nuevoStock = Math.max(0, stockActual - cantidadUsada);
                                        insumo.setStock(nuevoStock);
                                        insumo.setUpdatedAt(LocalDateTime.now());
                                        log.info("Descontando insumo {} ({}): stock previo={}, consumo={}, nuevo stock={}",
                                                insumo.getId(), insumo.getNombre(), stockActual, cantidadUsada, nuevoStock);
                                        return insumoRepo.save(insumo);
                                    })
                            )
                            .then(actividadRepo.save(act))
                            .flatMap(this::populateResponseDto);
                });
    }

    @Override
    public Flux<ActividadCultivoResponseDto> listarPorOperario(String idUsuario) {
        if (idUsuario == null || idUsuario.isBlank() || "null".equalsIgnoreCase(idUsuario)) {
            return actividadRepo.findAll()
                    .filter(act -> Boolean.TRUE.equals(act.getEstado()) && !Boolean.TRUE.equals(act.getCompletado()))
                    .collectList()
                    .flatMapMany(this::buildBatchResponseDtos);
        }

        return asignacionDetalleRepo.findAll()
                .filter(d -> idUsuario.equalsIgnoreCase(d.getIdUsuario()))
                .map(AsignacionDetalle::getIdAsignacionCabecera)
                .distinct()
                .collectList()
                .flatMap(cabeceraIds -> asignacionCabeceraRepo.findAll()
                        .filter(c -> cabeceraIds.contains(c.getIdAsignacionCabecera()))
                        .map(AsignacionCabecera::getIdActividad)
                        .distinct()
                        .collectList())
                .flatMapMany(actividadIds -> {
                    if (actividadIds.isEmpty()) {
                        return actividadRepo.findAll()
                                .filter(act -> Boolean.TRUE.equals(act.getEstado()) && !Boolean.TRUE.equals(act.getCompletado()))
                                .collectList()
                                .flatMapMany(this::buildBatchResponseDtos);
                    }
                    return actividadRepo.findAll()
                            .filter(act -> actividadIds.contains(act.getIdActividad()) && Boolean.TRUE.equals(act.getEstado()))
                            .collectList()
                            .flatMapMany(this::buildBatchResponseDtos);
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
