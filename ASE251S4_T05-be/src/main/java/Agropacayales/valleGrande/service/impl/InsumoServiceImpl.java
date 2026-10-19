package Agropacayales.valleGrande.service.impl;

import Agropacayales.valleGrande.dto.response.ImportResultDto;
import Agropacayales.valleGrande.exception.BusinessValidationException;
import Agropacayales.valleGrande.exception.ResourceNotFoundException;
import Agropacayales.valleGrande.model.Insumo;
import Agropacayales.valleGrande.repository.mongo.InsumoRepository;
import Agropacayales.valleGrande.service.InsumoService;
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
public class InsumoServiceImpl implements InsumoService {

    private final InsumoRepository insumoRepository;
    private final TemplateEngine templateEngine;
    private final Validator validator;

    private static final List<String> TIPOS_PERMITIDOS = List.of(
            "FERTILIZANTE", "PESTICIDA", "HERBICIDA", "FUNGICIDA", "SEMILLA", "OTRO"
    );

    private static final List<String> UNIDADES_PERMITIDAS = List.of(
            "kg", "g", "L", "ml", "unidad", "bolsa", "saco", "bidon", "tonelada"
    );

    @Override
    public Flux<Insumo> listarTodos() {
        return insumoRepository.findAll();
    }

    @Override
    public Flux<Insumo> listarPorEstado(Boolean estado) {
        return insumoRepository.findByEstado(estado);
    }

    @Override
    public Mono<Insumo> listarPorId(String id) {
        return insumoRepository.findById(id);
    }

    @Override
    public Mono<Insumo> crear(Insumo insumo) {
        try {
            validarDatosEstaticosInsumo(insumo);
        } catch (BusinessValidationException ex) {
            return Mono.error(ex);
        }

        String nombreTrimmed = insumo.getNombre().trim();
        insumo.setNombre(nombreTrimmed);

        return insumoRepository.existsByNombreIgnoreCaseAndEstadoTrue(nombreTrimmed)
                .flatMap(existeDuplicado -> {
                    if (Boolean.TRUE.equals(existeDuplicado)) {
                        return Mono.error(new BusinessValidationException(
                                "Ya existe un insumo activo registrado con el nombre '" + nombreTrimmed + "'."
                        ));
                    }

                    insumo.setEstado(true);
                    insumo.setCreatedAt(LocalDateTime.now());
                    insumo.setUpdatedAt(null);
                    insumo.setDeletedAt(null);
                    insumo.setRestoredAt(null);
                    return insumoRepository.save(insumo);
                });
    }

    @Override
    public Mono<Insumo> editar(String id, Insumo insumo) {
        try {
            validarDatosEstaticosInsumo(insumo);
        } catch (BusinessValidationException ex) {
            return Mono.error(ex);
        }

        String nombreTrimmed = insumo.getNombre().trim();
        insumo.setNombre(nombreTrimmed);

        return insumoRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Insumo no encontrado con ID: " + id)))
                .flatMap(existente -> {
                    if (!Boolean.TRUE.equals(existente.getEstado())) {
                        return Mono.error(new BusinessValidationException(
                                "No se puede editar el insumo '" + existente.getNombre() +
                                "' porque se encuentra inactivo/eliminado. Por favor, restaure el insumo primero."
                        ));
                    }

                    return insumoRepository.existsByNombreIgnoreCaseAndEstadoTrueAndIdNot(nombreTrimmed, id)
                            .flatMap(existeDuplicado -> {
                                if (Boolean.TRUE.equals(existeDuplicado)) {
                                    return Mono.error(new BusinessValidationException(
                                            "Ya existe otro insumo activo registrado con el nombre '" + nombreTrimmed + "'."
                                    ));
                                }

                                existente.setNombre(nombreTrimmed);
                                existente.setDescripcion(insumo.getDescripcion());
                                existente.setPrecio(insumo.getPrecio());
                                existente.setStock(insumo.getStock());
                                existente.setUnidadMedida(insumo.getUnidadMedida());
                                existente.setTipoInsumo(insumo.getTipoInsumo());
                                existente.setProveedor(insumo.getProveedor());
                                existente.setPresentacion(insumo.getPresentacion());
                                existente.setUpdatedAt(LocalDateTime.now());

                                return insumoRepository.save(existente);
                            });
                });
    }

    @Override
    public Mono<Insumo> eliminar(String id) {
        return insumoRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Insumo no encontrado con ID: " + id)))
                .flatMap(existente -> {
                    if (existente.getStock() != null && existente.getStock() > 0) {
                        return Mono.error(new BusinessValidationException(
                                "No se puede eliminar/archivar el insumo '" + existente.getNombre() +
                                "' porque todavía cuenta con " + existente.getStock() + " " +
                                existente.getUnidadMedida() + " disponibles en el inventario activo."
                        ));
                    }

                    existente.setEstado(false);
                    existente.setDeletedAt(LocalDateTime.now());
                    return insumoRepository.save(existente);
                });
    }

    @Override
    public Mono<Insumo> restaurar(String id) {
        return insumoRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Insumo no encontrado con ID: " + id)))
                .flatMap(existente -> {
                    existente.setEstado(true);
                    existente.setRestoredAt(LocalDateTime.now());
                    return insumoRepository.save(existente);
                });
    }

    @Override
    public Flux<Insumo> buscarPorNombre(String nombre) {
        return insumoRepository.findByNombreContainingIgnoreCase(nombre);
    }

    @Override
    public Flux<Insumo> filtrarPorTipo(String tipo) {
        return insumoRepository.findByTipoInsumoIgnoreCase(tipo);
    }

    private void validarDatosEstaticosInsumo(Insumo insumo) {
        if (insumo.getUnidadMedida() == null || insumo.getUnidadMedida().isBlank()) {
            throw new BusinessValidationException("La unidad de medida es obligatoria.");
        }

        String unidadTrimmed = insumo.getUnidadMedida().trim();
        String unidadNormalizada = null;
        for (String unidad : UNIDADES_PERMITIDAS) {
            if (unidad.equalsIgnoreCase(unidadTrimmed)) {
                unidadNormalizada = unidad;
                break;
            }
        }

        if (unidadNormalizada == null) {
            throw new BusinessValidationException(
                    "La unidad de medida '" + unidadTrimmed + "' no es válida. " +
                    "Unidades aceptadas: " + String.join(", ", UNIDADES_PERMITIDAS)
            );
        }
        insumo.setUnidadMedida(unidadNormalizada);

        if (insumo.getTipoInsumo() == null || insumo.getTipoInsumo().isBlank()) {
            throw new BusinessValidationException("El tipo de insumo es obligatorio.");
        }

        String tipoUpper = insumo.getTipoInsumo().trim().toUpperCase();
        if (!TIPOS_PERMITIDOS.contains(tipoUpper)) {
            throw new BusinessValidationException(
                    "El tipo de insumo '" + insumo.getTipoInsumo() + "' no es válido. " +
                    "Tipos aceptados: " + String.join(", ", TIPOS_PERMITIDOS)
            );
        }
        insumo.setTipoInsumo(tipoUpper);

        if (insumo.getNombre() == null || insumo.getNombre().isBlank()) {
            throw new BusinessValidationException("El nombre del insumo es obligatorio.");
        }

        if (insumo.getStock() != null && insumo.getStock() > 1000000) {
            throw new BusinessValidationException(
                    "El stock ingresado (" + insumo.getStock() + ") supera el límite máximo permitido en almacén (1,000,000 unidades)."
            );
        }
        if (insumo.getPrecio() != null && insumo.getPrecio().doubleValue() > 50000.0) {
            throw new BusinessValidationException(
                    "El precio ingresado ($" + insumo.getPrecio() + ") supera el precio unitario máximo razonable ($50,000.00)."
            );
        }
    }

    // ===================== IMPORTACIÓN =====================
    // Columnas: nombre,descripcion,precio,stock,unidadMedida,tipoInsumo,proveedor,presentacion

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
                .flatMap(b -> Mono.fromCallable(() -> ArchivoUtil.filasExcel(b, 8))
                        .subscribeOn(Schedulers.boundedElastic()))
                .flatMap(this::guardarFilas);
    }

    private Mono<ImportResultDto> guardarFilas(List<String[]> filas) {
        // reutiliza crear(): aplica todas las reglas de negocio existentes (unidad, tipo, duplicados, límites)
        return ArchivoUtil.<Insumo>procesar(filas, 8, this::aInsumo, validator, this::crear);
    }

    private Insumo aInsumo(String[] c, int fila) {
        return Insumo.builder()
                .nombre(c[0])
                .descripcion(c[1])
                .precio(ArchivoUtil.decimal(c[2], "precio"))
                .stock(ArchivoUtil.entero(c[3], "stock"))
                .unidadMedida(c[4])
                .tipoInsumo(c[5])
                .proveedor(c[6])
                .presentacion(c[7])
                .build();
    }

    // ===================== EXPORTACIÓN =====================

    @Override
    public Mono<byte[]> exportarExcel() {
        return insumoRepository.findAll()
                .collectList()
                .flatMap(lista -> Mono.fromCallable(() -> {
                    String[] cabeceras = {"NOMBRE", "DESCRIPCIÓN", "PRECIO", "STOCK", "UNIDAD",
                            "TIPO", "PROVEEDOR", "PRESENTACIÓN", "ESTADO"};
                    List<Object[]> filas = lista.stream()
                            .map(i -> new Object[]{
                                    ArchivoUtil.nvl(i.getNombre()),
                                    ArchivoUtil.nvl(i.getDescripcion()),
                                    i.getPrecio(),
                                    i.getStock(),
                                    ArchivoUtil.nvl(i.getUnidadMedida()),
                                    ArchivoUtil.nvl(i.getTipoInsumo()),
                                    ArchivoUtil.nvl(i.getProveedor()),
                                    ArchivoUtil.nvl(i.getPresentacion()),
                                    Boolean.TRUE.equals(i.getEstado()) ? "ACTIVO" : "INACTIVO"})
                            .toList();
                    return ArchivoUtil.crearExcel("Insumos", cabeceras, filas);
                }).subscribeOn(Schedulers.boundedElastic()));
    }

    @Override
    public Mono<byte[]> exportarPdf() {
        return insumoRepository.findAll()
                .collectList()
                .flatMap(lista -> Mono.fromCallable(() -> {
                    Context context = new Context();
                    context.setVariable("insumos", lista);
                    return ArchivoUtil.htmlAPdf(templateEngine.process("insumos", context));
                }).subscribeOn(Schedulers.boundedElastic()));
    }
}
