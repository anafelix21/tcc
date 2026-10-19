package Agropacayales.valleGrande.service.impl;

import Agropacayales.valleGrande.dto.request.DetalleCosechaDTO;
import Agropacayales.valleGrande.dto.request.HarvestRequestDTO;
import Agropacayales.valleGrande.dto.response.DetalleResponseDTO;
import Agropacayales.valleGrande.dto.response.HarvestResponseDTO;
import Agropacayales.valleGrande.exception.BusinessValidationException;
import Agropacayales.valleGrande.exception.ResourceNotFoundException;
import Agropacayales.valleGrande.model.r2dbc.Harvest;
import Agropacayales.valleGrande.model.r2dbc.HarvestPlantingCycle;
import Agropacayales.valleGrande.repository.r2dbc.HarvestPlantingCycleR2dbcRepository;
import Agropacayales.valleGrande.repository.r2dbc.HarvestR2dbcRepository;
import Agropacayales.valleGrande.service.HarvestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class HarvestServiceImpl implements HarvestService {

    private final HarvestR2dbcRepository harvestRepo;
    private final HarvestPlantingCycleR2dbcRepository detalleRepo;
    private final TransactionalOperator transactionalOperator;

    @Override
    public Flux<HarvestResponseDTO> listarTodas() {
        return harvestRepo.findByEstado(true)
                .flatMapSequential(this::populateResponseDTO);
    }

    @Override
    public Mono<HarvestResponseDTO> listarPorId(Integer id) {
        return harvestRepo.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("La cosecha solicitada con ID " + id + " no existe en el sistema.")))
                .flatMap(this::populateResponseDTO);
    }

    @Override
    public Mono<HarvestResponseDTO> crear(HarvestRequestDTO request) {
        if (request.getDetalles() == null || request.getDetalles().isEmpty()) {
            return Mono.error(new BusinessValidationException("La cosecha debe incluir al menos un detalle de cultivo."));
        }

        // Validación de merma (Regla de negocio: no exceder el 20%)
        for (DetalleCosechaDTO d : request.getDetalles()) {
            BigDecimal optimos = d.getKilosOptimos();
            BigDecimal merma = d.getKilosMerma();
            BigDecimal total = optimos.add(merma);

            if (total.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal porcentajeMerma = merma.divide(total, 4, RoundingMode.HALF_UP);
                if (porcentajeMerma.compareTo(new BigDecimal("0.20")) > 0) {
                    return Mono.error(new BusinessValidationException(
                            "El cultivo con ID " + d.getIdCultivo() +
                            " excede el límite crítico de merma tolerada (20%). Operación abortada."
                    ));
                }
            }
        }

        Harvest harvest = Harvest.builder()
                .responsable(request.getResponsable().trim())
                .fechaCosecha(request.getFechaCosecha())
                .estado(true)
                .createdAt(LocalDateTime.now())
                .build();

        return harvestRepo.save(harvest)
                .flatMap(guardada -> {
                    List<HarvestPlantingCycle> entityDetails = request.getDetalles().stream().map(d ->
                            HarvestPlantingCycle.builder()
                                    .idHarvest(guardada.getIdHarvest())
                                    .idCultivo(d.getIdCultivo())
                                    .kilosOptimos(d.getKilosOptimos())
                                    .kilosMerma(d.getKilosMerma())
                                    .build()
                    ).toList();

                    return detalleRepo.saveAll(entityDetails)
                            .collectList()
                            .flatMap(savedDetails -> populateResponseDTO(guardada));
                })
                .as(transactionalOperator::transactional);
    }

    @Override
    public Mono<HarvestResponseDTO> editar(Integer id, HarvestRequestDTO request) {
        if (request.getDetalles() == null || request.getDetalles().isEmpty()) {
            return Mono.error(new BusinessValidationException("La cosecha debe incluir al menos un detalle de cultivo para actualizar."));
        }

        for (DetalleCosechaDTO d : request.getDetalles()) {
            BigDecimal optimos = d.getKilosOptimos();
            BigDecimal merma = d.getKilosMerma();
            BigDecimal total = optimos.add(merma);

            if (total.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal porcentajeMerma = merma.divide(total, 4, RoundingMode.HALF_UP);
                if (porcentajeMerma.compareTo(new BigDecimal("0.20")) > 0) {
                    return Mono.error(new BusinessValidationException(
                            "El cultivo con ID " + d.getIdCultivo() +
                            " excede el límite crítico de merma tolerada (20%). Operación abortada."
                    ));
                }
            }
        }

        return harvestRepo.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("La cosecha con ID " + id + " no existe.")))
                .flatMap(existente -> {
                    if (!Boolean.TRUE.equals(existente.getEstado())) {
                        return Mono.error(new BusinessValidationException("No se puede editar una cosecha que ha sido dada de baja."));
                    }

                    existente.setResponsable(request.getResponsable().trim());
                    existente.setFechaCosecha(request.getFechaCosecha());
                    existente.setUpdatedAt(LocalDateTime.now());

                    List<HarvestPlantingCycle> nuevosDetalles = request.getDetalles().stream().map(d ->
                            HarvestPlantingCycle.builder()
                                    .idHarvest(existente.getIdHarvest())
                                    .idCultivo(d.getIdCultivo())
                                    .kilosOptimos(d.getKilosOptimos())
                                    .kilosMerma(d.getKilosMerma())
                                    .build()
                    ).toList();

                    return harvestRepo.save(existente)
                            .flatMap(actualizada -> detalleRepo.deleteByIdHarvest(id)
                                    .thenMany(detalleRepo.saveAll(nuevosDetalles))
                                    .collectList()
                                    .flatMap(savedDetails -> populateResponseDTO(actualizada))
                            );
                })
                .as(transactionalOperator::transactional);
    }

    @Override
    public Mono<Void> eliminarLogico(Integer id) {
        return harvestRepo.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("La cosecha que intenta dar de baja con ID " + id + " no existe.")))
                .flatMap(harvest -> {
                    harvest.setEstado(false);
                    harvest.setUpdatedAt(LocalDateTime.now());
                    return harvestRepo.save(harvest);
                })
                .then();
    }

    private Mono<HarvestResponseDTO> populateResponseDTO(Harvest harvest) {
        return detalleRepo.findByIdHarvest(harvest.getIdHarvest())
                .map(d -> DetalleResponseDTO.builder()
                        .idHarvestDetail(d.getIdHarvestDetail())
                        .idCultivo(d.getIdCultivo())
                        .kilosOptimos(d.getKilosOptimos())
                        .kilosMerma(d.getKilosMerma())
                        .totalKilos(d.getKilosOptimos().add(d.getKilosMerma()))
                        .build()
                )
                .collectList()
                .map(detalles -> HarvestResponseDTO.builder()
                        .idHarvest(harvest.getIdHarvest())
                        .responsable(harvest.getResponsable())
                        .fechaCosecha(harvest.getFechaCosecha())
                        .estado(harvest.getEstado())
                        .createdAt(harvest.getCreatedAt())
                        .updatedAt(harvest.getUpdatedAt())
                        .detalles(detalles)
                        .build()
                );
    }
}
