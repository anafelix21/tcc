package Agropacayales.valleGrande.service;

import Agropacayales.valleGrande.dto.request.ActividadCultivoRequestDto;
import Agropacayales.valleGrande.dto.response.ActividadCultivoResponseDto;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ActividadCultivoService {
    Flux<ActividadCultivoResponseDto> listarTodas();
    Flux<ActividadCultivoResponseDto> listarPorEstado(Boolean estado);
    Mono<ActividadCultivoResponseDto> listarPorId(Long id);
    Mono<ActividadCultivoResponseDto> crear(ActividadCultivoRequestDto request);
    Mono<ActividadCultivoResponseDto> editar(Long id, ActividadCultivoRequestDto request);
    Mono<ActividadCultivoResponseDto> eliminar(Long id);
    Mono<ActividadCultivoResponseDto> restaurar(Long id);
}
