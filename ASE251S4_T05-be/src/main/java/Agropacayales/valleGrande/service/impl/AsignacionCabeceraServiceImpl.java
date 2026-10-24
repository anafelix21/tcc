package Agropacayales.valleGrande.service.impl;

import Agropacayales.valleGrande.dto.request.AsignacionCabeceraRequestDto;
import Agropacayales.valleGrande.dto.response.AsignacionCabeceraResponseDto;
import Agropacayales.valleGrande.dto.response.AsignacionDetalleResponseDto;
import Agropacayales.valleGrande.exception.BusinessValidationException;
import Agropacayales.valleGrande.exception.ResourceNotFoundException;
import Agropacayales.valleGrande.model.Usuario;
import Agropacayales.valleGrande.model.r2dbc.ActividadCultivo;
import Agropacayales.valleGrande.model.r2dbc.AsignacionCabecera;
import Agropacayales.valleGrande.model.r2dbc.AsignacionDetalle;
import Agropacayales.valleGrande.model.r2dbc.Cultivo;
import Agropacayales.valleGrande.repository.mongo.UsuarioRepository;
import Agropacayales.valleGrande.repository.r2dbc.ActividadCultivoR2dbcRepository;
import Agropacayales.valleGrande.repository.r2dbc.AsignacionCabeceraR2dbcRepository;
import Agropacayales.valleGrande.repository.r2dbc.AsignacionDetalleR2dbcRepository;
import Agropacayales.valleGrande.repository.r2dbc.CultivoR2dbcRepository;
import Agropacayales.valleGrande.service.AsignacionCabeceraService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
public class AsignacionCabeceraServiceImpl implements AsignacionCabeceraService {

    private final AsignacionCabeceraR2dbcRepository cabeceraRepo;
    private final AsignacionDetalleR2dbcRepository detalleRepo;
    private final ActividadCultivoR2dbcRepository actividadRepo;
    private final CultivoR2dbcRepository cultivoRepo;
    private final UsuarioRepository usuarioRepo;
    private final TransactionalOperator transactionalOperator;

    public AsignacionCabeceraServiceImpl(
            AsignacionCabeceraR2dbcRepository cabeceraRepo,
            AsignacionDetalleR2dbcRepository detalleRepo,
            ActividadCultivoR2dbcRepository actividadRepo,
            CultivoR2dbcRepository cultivoRepo,
            UsuarioRepository usuarioRepo,
            TransactionalOperator transactionalOperator) {
        this.cabeceraRepo = cabeceraRepo;
        this.detalleRepo = detalleRepo;
        this.actividadRepo = actividadRepo;
        this.cultivoRepo = cultivoRepo;
        this.usuarioRepo = usuarioRepo;
        this.transactionalOperator = transactionalOperator;
    }

    private Flux<AsignacionCabeceraResponseDto> buildBatchResponseDtos(List<AsignacionCabecera> cabeceras) {
        if (cabeceras.isEmpty()) {
            return Flux.empty();
        }

        Mono<java.util.Map<Long, ActividadCultivo>> actividadesMapMono = actividadRepo.findAll()
                .collectMap(ActividadCultivo::getIdActividad, java.util.function.Function.identity());

        Mono<java.util.Map<Long, String>> cultivosMapMono = cultivoRepo.findAll()
                .collectMap(Cultivo::getIdCultivo, Cultivo::getNombre);

        Mono<java.util.Map<Long, List<AsignacionDetalle>>> detallesMapMono = detalleRepo.findAll()
                .collectList()
                .map(list -> list.stream().collect(java.util.stream.Collectors.groupingBy(AsignacionDetalle::getIdAsignacionCabecera)));

        Mono<java.util.Map<String, String>> usuariosMapMono = usuarioRepo.findAll()
                .collectMap(Usuario::getId, u -> u.getNombre() + " " + u.getApellido());

        return Mono.zip(actividadesMapMono, cultivosMapMono, detallesMapMono, usuariosMapMono)
                .flatMapMany(tuple -> {
                    java.util.Map<Long, ActividadCultivo> actividadesMap = tuple.getT1();
                    java.util.Map<Long, String> cultivosMap = tuple.getT2();
                    java.util.Map<Long, List<AsignacionDetalle>> detallesMap = tuple.getT3();
                    java.util.Map<String, String> usuariosMap = tuple.getT4();

                    List<AsignacionCabeceraResponseDto> dtos = cabeceras.stream()
                            .map(cab -> {
                                ActividadCultivo act = actividadesMap.get(cab.getIdActividad());
                                String tipoActividad = act != null ? act.getTipoActividad() : "Actividad #" + cab.getIdActividad();
                                String nombreCultivo = (act != null && act.getIdCultivo() != null)
                                        ? cultivosMap.getOrDefault(act.getIdCultivo(), "Cultivo #" + act.getIdCultivo())
                                        : "Cultivo General";

                                List<AsignacionDetalle> dets = detallesMap.getOrDefault(cab.getIdAsignacionCabecera(), java.util.Collections.emptyList());
                                List<AsignacionDetalleResponseDto> detDtos = dets.stream()
                                        .map(d -> AsignacionDetalleResponseDto.builder()
                                                .idAsignacionDetalle(d.getIdAsignacionDetalle())
                                                .idUsuario(d.getIdUsuario())
                                                .nombreCompletoUsuario(usuariosMap.getOrDefault(d.getIdUsuario(), "Usuario " + d.getIdUsuario()))
                                                .costoManoObra(d.getCostoManoObra())
                                                .build())
                                        .collect(java.util.stream.Collectors.toList());

                                return AsignacionCabeceraResponseDto.builder()
                                        .idAsignacionCabecera(cab.getIdAsignacionCabecera())
                                        .idActividad(cab.getIdActividad())
                                        .tipoActividad(tipoActividad)
                                        .nombreCultivo(nombreCultivo)
                                        .fechaAsignacion(cab.getFechaAsignacion())
                                        .horasTrabajadas(cab.getHorasTrabajadas())
                                        .costoTotalManoObra(cab.getCostoTotalManoObra())
                                        .observacion(cab.getObservacion())
                                        .estado(cab.getEstado())
                                        .createdAt(cab.getCreatedAt())
                                        .updatedAt(cab.getUpdatedAt())
                                        .detalles(detDtos)
                                        .build();
                            })
                            .collect(java.util.stream.Collectors.toList());

                    return Flux.fromIterable(dtos);
                });
    }

    @Override
    public Flux<AsignacionCabeceraResponseDto> listarTodas() {
        return cabeceraRepo.findAll()
                .collectList()
                .flatMapMany(this::buildBatchResponseDtos);
    }

    @Override
    public Flux<AsignacionCabeceraResponseDto> listarPorEstado(Boolean estado) {
        return cabeceraRepo.findAll()
                .filter(c -> estado == null || estado.equals(c.getEstado()))
                .collectList()
                .flatMapMany(this::buildBatchResponseDtos);
    }

    @Override
    public Flux<AsignacionCabeceraResponseDto> listarPorActividad(Long idActividad) {
        return cabeceraRepo.findByIdActividad(idActividad)
                .collectList()
                .flatMapMany(this::buildBatchResponseDtos);
    }

    @Override
    public Mono<AsignacionCabeceraResponseDto> listarPorId(Long id) {
        return cabeceraRepo.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Asignación de trabajadores no encontrada con ID: " + id)))
                .flatMap(this::populateResponseDto);
    }

    @Override
    public Mono<AsignacionCabeceraResponseDto> crear(AsignacionCabeceraRequestDto request) {
        if (request.getDetalles() == null || request.getDetalles().isEmpty()) {
            return Mono.error(new BusinessValidationException("Debe asignar al menos un trabajador en el detalle."));
        }

        return actividadRepo.findById(request.getIdActividad())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Actividad de cultivo no encontrada con ID: " + request.getIdActividad())))
                .flatMap(actividad -> {
                    if (!Boolean.TRUE.equals(actividad.getEstado())) {
                        return Mono.error(new BusinessValidationException("La actividad de cultivo seleccionada está inactiva."));
                    }

                    // Validar usuarios en MongoDB reactivamente
                    return Flux.fromIterable(request.getDetalles())
                            .flatMap(detDto -> usuarioRepo.findById(detDto.getIdUsuario())
                                    .switchIfEmpty(Mono.error(new BusinessValidationException("El usuario con ID " + detDto.getIdUsuario() + " no existe en MongoDB.")))
                                    .flatMap(user -> {
                                        if (!Boolean.TRUE.equals(user.getEstado())) {
                                            return Mono.error(new BusinessValidationException("El usuario '" + user.getNombre() + " " + user.getApellido() + "' está inactivo."));
                                        }
                                        BigDecimal costo = detDto.getCostoManoObra() != null ? detDto.getCostoManoObra() : BigDecimal.ZERO;
                                        AsignacionDetalle det = AsignacionDetalle.builder()
                                                .idUsuario(user.getId())
                                                .costoManoObra(costo)
                                                .build();
                                        return Mono.just(det);
                                    })
                            )
                            .collectList()
                            .flatMap(detallesPreparados -> {
                                BigDecimal totalManoObra = detallesPreparados.stream()
                                        .map(AsignacionDetalle::getCostoManoObra)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                                AsignacionCabecera cabecera = AsignacionCabecera.builder()
                                        .idActividad(request.getIdActividad())
                                        .fechaAsignacion(LocalDateTime.now())
                                        .horasTrabajadas(request.getHorasTrabajadas())
                                        .costoTotalManoObra(totalManoObra)
                                        .observacion(request.getObservacion())
                                        .estado(true)
                                        .createdAt(LocalDateTime.now())
                                        .build();

                                return cabeceraRepo.save(cabecera)
                                        .flatMap(guardada -> {
                                            detallesPreparados.forEach(d -> d.setIdAsignacionCabecera(guardada.getIdAsignacionCabecera()));

                                            // Actualizar costo de la actividad en SQL Server
                                            BigDecimal costoActualActividad = actividad.getCostoTotal() != null ? actividad.getCostoTotal() : BigDecimal.ZERO;
                                            actividad.setCostoTotal(costoActualActividad.add(totalManoObra));
                                            actividad.setUpdatedAt(LocalDateTime.now());

                                            return actividadRepo.save(actividad)
                                                    .thenMany(detalleRepo.saveAll(detallesPreparados))
                                                    .collectList()
                                                    .flatMap(detallesGuardados -> populateResponseDto(guardada));
                                        });
                            });
                })
                .as(transactionalOperator::transactional);
    }

    @Override
    public Mono<AsignacionCabeceraResponseDto> editar(Long id, AsignacionCabeceraRequestDto request) {
        if (request.getDetalles() == null || request.getDetalles().isEmpty()) {
            return Mono.error(new BusinessValidationException("Debe asignar al menos un trabajador en el detalle para editar."));
        }

        return cabeceraRepo.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Asignación no encontrada con ID: " + id)))
                .flatMap(existente -> {
                    if (!Boolean.TRUE.equals(existente.getEstado())) {
                        return Mono.error(new BusinessValidationException("No se puede editar una asignación que se encuentra inactiva."));
                    }

                    return Flux.fromIterable(request.getDetalles())
                            .flatMap(detDto -> usuarioRepo.findById(detDto.getIdUsuario())
                                    .switchIfEmpty(Mono.error(new BusinessValidationException("El usuario con ID " + detDto.getIdUsuario() + " no existe en MongoDB.")))
                                    .map(user -> {
                                        BigDecimal costo = detDto.getCostoManoObra() != null ? detDto.getCostoManoObra() : BigDecimal.ZERO;
                                        return AsignacionDetalle.builder()
                                                .idAsignacionCabecera(existente.getIdAsignacionCabecera())
                                                .idUsuario(user.getId())
                                                .costoManoObra(costo)
                                                .build();
                                    })
                            )
                            .collectList()
                            .flatMap(nuevosDetalles -> {
                                BigDecimal totalManoObra = nuevosDetalles.stream()
                                        .map(AsignacionDetalle::getCostoManoObra)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                                BigDecimal costoAnterior = existente.getCostoTotalManoObra() != null ? existente.getCostoTotalManoObra() : BigDecimal.ZERO;
                                BigDecimal diferenciaCosto = totalManoObra.subtract(costoAnterior);

                                existente.setIdActividad(request.getIdActividad());
                                existente.setHorasTrabajadas(request.getHorasTrabajadas());
                                existente.setObservacion(request.getObservacion());
                                existente.setCostoTotalManoObra(totalManoObra);
                                existente.setUpdatedAt(LocalDateTime.now());

                                return cabeceraRepo.save(existente)
                                        .flatMap(actualizada -> actividadRepo.findById(actualizada.getIdActividad())
                                                .flatMap(act -> {
                                                    BigDecimal costoActual = act.getCostoTotal() != null ? act.getCostoTotal() : BigDecimal.ZERO;
                                                    act.setCostoTotal(costoActual.add(diferenciaCosto));
                                                    act.setUpdatedAt(LocalDateTime.now());
                                                    return actividadRepo.save(act);
                                                })
                                                .then(detalleRepo.deleteByIdAsignacionCabecera(id))
                                                .thenMany(detalleRepo.saveAll(nuevosDetalles))
                                                .collectList()
                                                .flatMap(detallesGuardados -> populateResponseDto(actualizada))
                                        );
                            });
                })
                .as(transactionalOperator::transactional);
    }

    @Override
    public Mono<AsignacionCabeceraResponseDto> eliminar(Long id) {
        return cabeceraRepo.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Asignación no encontrada con ID: " + id)))
                .flatMap(cabecera -> {
                    cabecera.setEstado(false);
                    cabecera.setUpdatedAt(LocalDateTime.now());
                    return cabeceraRepo.save(cabecera)
                            .flatMap(this::populateResponseDto);
                });
    }

    @Override
    public Mono<AsignacionCabeceraResponseDto> restaurar(Long id) {
        return cabeceraRepo.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Asignación no encontrada con ID: " + id)))
                .flatMap(cabecera -> {
                    cabecera.setEstado(true);
                    cabecera.setUpdatedAt(LocalDateTime.now());
                    return cabeceraRepo.save(cabecera)
                            .flatMap(this::populateResponseDto);
                });
    }

    private Mono<AsignacionCabeceraResponseDto> populateResponseDto(AsignacionCabecera cabecera) {
        Mono<ActividadCultivo> actividadMono = actividadRepo.findById(cabecera.getIdActividad())
                .defaultIfEmpty(ActividadCultivo.builder()
                        .tipoActividad("Actividad #" + cabecera.getIdActividad())
                        .idCultivo(1L)
                        .build());

        return actividadMono.flatMap(act -> {
            Mono<String> nombreCultivoMono = act.getIdCultivo() != null
                    ? cultivoRepo.findById(act.getIdCultivo()).map(Cultivo::getNombre).defaultIfEmpty("Cultivo General")
                    : Mono.just("Cultivo General");

            Mono<List<AsignacionDetalleResponseDto>> detallesMono = detalleRepo.findByIdAsignacionCabecera(cabecera.getIdAsignacionCabecera())
                    .flatMap(det -> usuarioRepo.findById(det.getIdUsuario())
                            .map(u -> u.getNombre() + " " + u.getApellido())
                            .defaultIfEmpty("Usuario #" + det.getIdUsuario())
                            .map(nombreCompleto -> AsignacionDetalleResponseDto.builder()
                                    .idAsignacionDetalle(det.getIdAsignacionDetalle())
                                    .idUsuario(det.getIdUsuario())
                                    .nombreCompletoUsuario(nombreCompleto)
                                    .costoManoObra(det.getCostoManoObra())
                                    .build()
                            )
                    )
                    .collectList();

            return Mono.zip(nombreCultivoMono, detallesMono)
                    .map(tuple -> AsignacionCabeceraResponseDto.builder()
                            .idAsignacionCabecera(cabecera.getIdAsignacionCabecera())
                            .idActividad(cabecera.getIdActividad())
                            .tipoActividad(act.getTipoActividad())
                            .nombreCultivo(tuple.getT1())
                            .fechaAsignacion(cabecera.getFechaAsignacion())
                            .horasTrabajadas(cabecera.getHorasTrabajadas())
                            .costoTotalManoObra(cabecera.getCostoTotalManoObra())
                            .observacion(cabecera.getObservacion())
                            .estado(cabecera.getEstado())
                            .createdAt(cabecera.getCreatedAt())
                            .updatedAt(cabecera.getUpdatedAt())
                            .detalles(tuple.getT2())
                            .build()
                    );
        });
    }
}
