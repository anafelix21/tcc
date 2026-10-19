package Agropacayales.valleGrande.service;

import Agropacayales.valleGrande.dto.response.ImportResultDto;
import Agropacayales.valleGrande.model.Insumo;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface InsumoService {

    Flux<Insumo> listarTodos();

    Flux<Insumo> listarPorEstado(Boolean estado);

    Mono<Insumo> listarPorId(String id);

    Mono<Insumo> crear(Insumo insumo);

    Mono<Insumo> editar(String id, Insumo insumo);

    Mono<Insumo> eliminar(String id);

    Mono<Insumo> restaurar(String id);

    Flux<Insumo> buscarPorNombre(String nombre);

    Flux<Insumo> filtrarPorTipo(String tipo);

    Mono<ImportResultDto> importarCsv(FilePart file);

    Mono<ImportResultDto> importarExcel(FilePart file);

    Mono<byte[]> exportarExcel();

    Mono<byte[]> exportarPdf();
}
