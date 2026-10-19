package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.dto.response.ImportResultDto;
import Agropacayales.valleGrande.model.Usuario;
import Agropacayales.valleGrande.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@Tag(name = "Usuario-Controller", description = "Operaciones reactivas de gestión de usuarios (WebFlux + MongoDB)")
public class UsuarioController {

    private final UsuarioService usuarioService;

    // GET - Listar todos los usuarios (FLUX)
    @GetMapping
    @Operation(summary = "Listar todos los usuarios", description = "Obtiene un flujo reactivo con todos los usuarios registrados")
    public Flux<Usuario> listar() {
        return usuarioService.listarTodos();
    }

    // GET - Listar usuarios por estado (FLUX)
    @GetMapping("/estado/{estado}")
    @Operation(summary = "Listar usuarios por estado", description = "Filtra usuarios activos o inactivos retornando un Flux")
    public Flux<Usuario> listarPorEstado(@PathVariable Boolean estado) {
        return usuarioService.listarPorEstado(estado);
    }

    // GET - Buscar usuario por ID (MONO)
    @GetMapping("/{id}")
    @Operation(summary = "Buscar usuario por ID", description = "Obtiene un usuario específico por su ID único")
    @ApiResponse(responseCode = "200", description = "Usuario encontrado")
    @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    public Mono<ResponseEntity<Usuario>> buscarPorId(@PathVariable String id) {
        return usuarioService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    // POST - Registrar nuevo usuario (MONO)
    @PostMapping
    @Operation(summary = "Registrar usuario", description = "Crea un nuevo usuario en la base de datos reactiva")
    @ApiResponse(responseCode = "201", description = "Usuario creado exitosamente")
    @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos o correo duplicado")
    public Mono<ResponseEntity<Usuario>> registrar(@Valid @RequestBody Usuario usuario) {
        return usuarioService.guardar(usuario)
                .map(nuevo -> ResponseEntity.status(HttpStatus.CREATED).body(nuevo));
    }

    // PUT - Actualizar usuario existente (MONO)
    @PutMapping("/{id}")
    @Operation(summary = "Actualizar usuario", description = "Modifica los datos de un usuario existente")
    @ApiResponse(responseCode = "200", description = "Usuario actualizado exitosamente")
    @ApiResponse(responseCode = "400", description = "Datos inválidos o conflicto de correo")
    @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    public Mono<ResponseEntity<Usuario>> editar(@PathVariable String id, @Valid @RequestBody Usuario usuario) {
        return usuarioService.actualizar(id, usuario)
                .map(ResponseEntity::ok);
    }

    // PATCH - Eliminar lógico (MONO)
    @PatchMapping("/{id}/eliminar")
    @Operation(summary = "Eliminar usuario (Lógico)", description = "Desactiva al usuario cambiando su estado a false")
    @ApiResponse(responseCode = "200", description = "Usuario desactivado lógicamente")
    @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    public Mono<ResponseEntity<Usuario>> eliminar(@PathVariable String id) {
        return usuarioService.eliminarLogico(id)
                .map(ResponseEntity::ok);
    }

    // PATCH - Restaurar lógico (MONO)
    @PatchMapping("/{id}/restaurar")
    @Operation(summary = "Restaurar usuario (Lógico)", description = "Activa nuevamente al usuario cambiando su estado a true")
    @ApiResponse(responseCode = "200", description = "Usuario restaurado lógicamente")
    @ApiResponse(responseCode = "404", description = "Usuario no encontrado")
    public Mono<ResponseEntity<Usuario>> restaurar(@PathVariable String id) {
        return usuarioService.restaurarLogico(id)
                .map(ResponseEntity::ok);
    }

    // POST - Importación masiva CSV
    @PostMapping(value = "/importar/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importar usuarios desde CSV", description = "Carga masiva. Columnas: nombre,apellido,correo,password,rol,fechaNacimiento,fechaContratacion")
    public Mono<ImportResultDto> importarCsv(@RequestPart("file") FilePart file) {
        return usuarioService.importarCsv(file);
    }

    // POST - Importación masiva Excel
    @PostMapping(value = "/importar/excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importar usuarios desde Excel (.xlsx)", description = "Carga masiva. Mismas columnas que el CSV, primera hoja")
    public Mono<ImportResultDto> importarExcel(@RequestPart("file") FilePart file) {
        return usuarioService.importarExcel(file);
    }

    // GET - Exportar Excel
    @GetMapping("/exportar/excel")
    @Operation(summary = "Exportar usuarios a Excel")
    public Mono<ResponseEntity<byte[]>> exportarExcel() {
        return usuarioService.exportarExcel()
                .map(bytes -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=usuarios.xlsx")
                        .contentType(MediaType.parseMediaType(
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(bytes));
    }

    // GET - Exportar PDF
    @GetMapping("/exportar/pdf")
    @Operation(summary = "Exportar usuarios a PDF")
    public Mono<ResponseEntity<byte[]>> exportarPdf() {
        return usuarioService.exportarPdf()
                .map(bytes -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=usuarios.pdf")
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(bytes));
    }
}
