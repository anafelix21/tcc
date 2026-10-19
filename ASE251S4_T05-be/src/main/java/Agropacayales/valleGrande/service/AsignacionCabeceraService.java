package Agropacayales.valleGrande.service;

import Agropacayales.valleGrande.dto.request.AsignacionCabeceraRequestDto;
import Agropacayales.valleGrande.dto.response.AsignacionCabeceraResponseDto;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface AsignacionCabeceraService {
    Flux<AsignacionCabeceraResponseDto> listarTodas();
    Flux<AsignacionCabeceraResponseDto> listarPorEstado(Boolean estado);
    Flux<AsignacionCabeceraResponseDto> listarPorActividad(Long idActividad);
    Mono<AsignacionCabeceraResponseDto> listarPorId(Long id);
    Mono<AsignacionCabeceraResponseDto> crear(AsignacionCabeceraRequestDto request);
    Mono<AsignacionCabeceraResponseDto> editar(Long id, AsignacionCabeceraRequestDto request);
    Mono<AsignacionCabeceraResponseDto> eliminar(Long id);
    Mono<AsignacionCabeceraResponseDto> restaurar(Long id);
}
