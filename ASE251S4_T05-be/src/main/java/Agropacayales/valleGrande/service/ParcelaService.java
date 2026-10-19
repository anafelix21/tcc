package Agropacayales.valleGrande.service;

import Agropacayales.valleGrande.dto.response.ImportResultDto;
import Agropacayales.valleGrande.model.Parcela;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ParcelaService {

    Flux<Parcela> listarTodos();

    Flux<Parcela> listarPorEstado(Boolean estado);

    Mono<Parcela> listarPorId(String id);

    Mono<Parcela> crear(Parcela parcela);

    Mono<Parcela> editar(String id, Parcela parcela);

    Mono<Parcela> eliminar(String id);

    Mono<Parcela> restaurar(String id);

    Mono<ImportResultDto> importarCsv(FilePart file);

    Mono<ImportResultDto> importarExcel(FilePart file);

    Mono<byte[]> exportarExcel();

    Mono<byte[]> exportarPdf();
}
