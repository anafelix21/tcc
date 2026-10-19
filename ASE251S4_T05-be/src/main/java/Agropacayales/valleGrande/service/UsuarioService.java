package Agropacayales.valleGrande.service;

import Agropacayales.valleGrande.dto.response.ImportResultDto;
import Agropacayales.valleGrande.model.Usuario;
import org.springframework.http.codec.multipart.FilePart;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface UsuarioService {

    Flux<Usuario> listarTodos();

    Flux<Usuario> listarPorEstado(Boolean estado);

    Mono<Usuario> buscarPorId(String id);

    Mono<Usuario> guardar(Usuario usuario);

    Mono<Usuario> actualizar(String id, Usuario usuario);

    Mono<Usuario> eliminarLogico(String id);

    Mono<Usuario> restaurarLogico(String id);

    Mono<ImportResultDto> importarCsv(FilePart file);

    Mono<ImportResultDto> importarExcel(FilePart file);

    Mono<byte[]> exportarExcel();

    Mono<byte[]> exportarPdf();
}
