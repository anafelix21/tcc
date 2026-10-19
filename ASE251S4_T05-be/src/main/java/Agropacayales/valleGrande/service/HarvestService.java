package Agropacayales.valleGrande.service;

import Agropacayales.valleGrande.dto.request.HarvestRequestDTO;
import Agropacayales.valleGrande.dto.response.HarvestResponseDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface HarvestService {
    Flux<HarvestResponseDTO> listarTodas();
    Mono<HarvestResponseDTO> listarPorId(Integer id);
    Mono<HarvestResponseDTO> crear(HarvestRequestDTO request);
    Mono<HarvestResponseDTO> editar(Integer id, HarvestRequestDTO request);
    Mono<Void> eliminarLogico(Integer id);
}
