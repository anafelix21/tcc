package Agropacayales.valleGrande.service.impl;

import Agropacayales.valleGrande.dto.response.ImportResultDto;
import Agropacayales.valleGrande.exception.BusinessValidationException;
import Agropacayales.valleGrande.exception.ResourceNotFoundException;
import Agropacayales.valleGrande.model.Usuario;
import Agropacayales.valleGrande.repository.mongo.UsuarioRepository;
import Agropacayales.valleGrande.service.UsuarioService;
import Agropacayales.valleGrande.util.ArchivoUtil;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final TemplateEngine templateEngine;
    private final Validator validator;

    @Override
    public Flux<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    @Override
    public Flux<Usuario> listarPorEstado(Boolean estado) {
        return usuarioRepository.findByEstado(estado);
    }

    @Override
    public Mono<Usuario> buscarPorId(String id) {
        return usuarioRepository.findById(id);
    }

    @Override
    public Mono<Usuario> guardar(Usuario usuario) {
        if (usuario.getCorreo() == null || usuario.getCorreo().isBlank()) {
            return Mono.error(new BusinessValidationException("El correo del usuario es obligatorio."));
        }
        if (usuario.getPassword() == null || usuario.getPassword().trim().length() < 6) {
            return Mono.error(new BusinessValidationException("La contraseña es obligatoria y debe tener al menos 6 caracteres."));
        }

        String correoTrimmed = usuario.getCorreo().trim();
        usuario.setCorreo(correoTrimmed);

        return usuarioRepository.existsByCorreoIgnoreCase(correoTrimmed)
                .flatMap(existe -> {
                    if (Boolean.TRUE.equals(existe)) {
                        return Mono.error(new BusinessValidationException(
                                "Ya existe un usuario registrado con el correo '" + correoTrimmed + "'."
                        ));
                    }
                    if (usuario.getId() == null || usuario.getId().isBlank()) {
                        String rolCode = resolverCodigoRol(usuario.getRol());
                        long randomNum = (long) (Math.random() * 900) + 100;
                        usuario.setId("USR-" + rolCode + "-" + randomNum);
                    }
                    usuario.setEstado(true);
                    usuario.setCreatedAt(LocalDateTime.now());
                    usuario.setUpdatedAt(null);
                    usuario.setDeletedAt(null);
                    usuario.setRestoredAt(null);
                    return usuarioRepository.save(usuario);
                });
    }

    @Override
    public Mono<Usuario> actualizar(String id, Usuario datos) {
        return usuarioRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Usuario no encontrado con ID: " + id)))
                .flatMap(existente -> {
                    String correoTrimmed = datos.getCorreo() != null ? datos.getCorreo().trim() : existente.getCorreo();

                    return usuarioRepository.existsByCorreoIgnoreCaseAndIdNot(correoTrimmed, id)
                            .flatMap(existeDuplicado -> {
                                if (Boolean.TRUE.equals(existeDuplicado)) {
                                    return Mono.error(new BusinessValidationException(
                                            "Ya existe otro usuario registrado con el correo '" + correoTrimmed + "'."
                                    ));
                                }

                                existente.setNombre(datos.getNombre());
                                existente.setApellido(datos.getApellido());
                                existente.setCorreo(correoTrimmed);
                                if (datos.getPassword() != null && !datos.getPassword().trim().isEmpty()) {
                                    if (datos.getPassword().trim().length() < 6) {
                                        return Mono.error(new BusinessValidationException("La contraseña debe tener al menos 6 caracteres."));
                                    }
                                    existente.setPassword(datos.getPassword().trim());
                                }
                                existente.setRol(datos.getRol());
                                existente.setFechaNacimiento(datos.getFechaNacimiento());
                                existente.setFechaContratacion(datos.getFechaContratacion());
                                existente.setUpdatedAt(LocalDateTime.now());

                                return usuarioRepository.save(existente);
                            });
                });
    }

    @Override
    public Mono<Usuario> eliminarLogico(String id) {
        return usuarioRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Usuario no encontrado con ID: " + id)))
                .flatMap(existente -> {
                    existente.setEstado(false);
                    existente.setDeletedAt(LocalDateTime.now());
                    return usuarioRepository.save(existente);
                });
    }

    @Override
    public Mono<Usuario> restaurarLogico(String id) {
        return usuarioRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Usuario no encontrado con ID: " + id)))
                .flatMap(existente -> {
                    existente.setEstado(true);
                    existente.setRestoredAt(LocalDateTime.now());
                    return usuarioRepository.save(existente);
                });
    }

    // ===================== IMPORTACIÓN (CARGA MASIVA) =====================
    // Orden de columnas: nombre,apellido,correo,password,rol,fechaNacimiento,fechaContratacion
    @Override
    public Mono<ImportResultDto> importarCsv(FilePart file) {
        return ArchivoUtil.leerBytes(file)
                .flatMap(b -> Mono.fromCallable(() -> ArchivoUtil.filasCsv(b))
                        .subscribeOn(Schedulers.boundedElastic()))
                .flatMap(this::guardarFilas);
    }

    @Override
    public Mono<ImportResultDto> importarExcel(FilePart file) {
        return ArchivoUtil.leerBytes(file)
                .flatMap(b -> Mono.fromCallable(() -> ArchivoUtil.filasExcel(b, 7))
                        .subscribeOn(Schedulers.boundedElastic()))
                .flatMap(this::guardarFilas);
    }

    private Mono<ImportResultDto> guardarFilas(List<String[]> filas) {
        return ArchivoUtil.<Usuario>procesar(filas, 7, this::aUsuario, validator, this::guardar);
    }

    private Usuario aUsuario(String[] c, int fila) {
        return Usuario.builder()
                .nombre(c[0])
                .apellido(c[1])
                .correo(c[2])
                .password(c[3])
                .rol(c[4])
                .fechaNacimiento(ArchivoUtil.fecha(c[5], "fechaNacimiento"))
                .fechaContratacion(ArchivoUtil.fecha(c[6], "fechaContratacion"))
                .build();
    }

    // ===================== EXPORTACIÓN =====================
    @Override
    public Mono<byte[]> exportarExcel() {
        return usuarioRepository.findAll()
                .collectList()
                .flatMap(usuarios -> Mono.fromCallable(() -> {
                    String[] cabeceras = {"NOMBRE", "APELLIDO", "CORREO", "ROL", "FECHA NACIMIENTO", "FECHA CONTRATACIÓN", "ESTADO"};
                    List<Object[]> filas = usuarios.stream()
                            .map(u -> new Object[]{
                                    ArchivoUtil.nvl(u.getNombre()),
                                    ArchivoUtil.nvl(u.getApellido()),
                                    ArchivoUtil.nvl(u.getCorreo()),
                                    ArchivoUtil.nvl(u.getRol()),
                                    u.getFechaNacimiento() != null ? u.getFechaNacimiento().toString() : "",
                                    u.getFechaContratacion() != null ? u.getFechaContratacion().toString() : "",
                                    Boolean.TRUE.equals(u.getEstado()) ? "ACTIVO" : "INACTIVO"
                            })
                            .toList();
                    return ArchivoUtil.crearExcel("Usuarios", cabeceras, filas);
                }).subscribeOn(Schedulers.boundedElastic()));
    }

    @Override
    public Mono<byte[]> exportarPdf() {
        return usuarioRepository.findAll()
                .collectList()
                .flatMap(usuarios -> Mono.fromCallable(() -> {
                    Context context = new Context();
                    context.setVariable("usuarios", usuarios);
                    return ArchivoUtil.htmlAPdf(templateEngine.process("usuarios", context));
                }).subscribeOn(Schedulers.boundedElastic()));
    }

    private String resolverCodigoRol(String rol) {
        if (rol == null) return "OPE";
        String r = rol.trim().toUpperCase();
        if (r.contains("ADMIN")) return "ADM";
        if (r.contains("SUPERVISOR")) return "SUP";
        if (r.contains("TECNICO")) return "TEC";
        if (r.contains("AGRONOMO")) return "AGR";
        return "OPE";
    }
}
