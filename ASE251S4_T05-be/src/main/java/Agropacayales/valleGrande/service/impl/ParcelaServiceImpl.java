package Agropacayales.valleGrande.service.impl;

import Agropacayales.valleGrande.dto.response.ImportResultDto;
import Agropacayales.valleGrande.exception.BusinessValidationException;
import Agropacayales.valleGrande.exception.ResourceNotFoundException;
import Agropacayales.valleGrande.model.Parcela;
import Agropacayales.valleGrande.repository.mongo.ParcelaRepository;
import Agropacayales.valleGrande.service.ParcelaService;
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
public class ParcelaServiceImpl implements ParcelaService {

    private final ParcelaRepository parcelaRepository;
    private final TemplateEngine templateEngine;
    private final Validator validator;

    @Override
    public Flux<Parcela> listarTodos() {
        return parcelaRepository.findAll();
    }

    @Override
    public Flux<Parcela> listarPorEstado(Boolean estado) {
        return parcelaRepository.findByEstado(estado);
    }

    @Override
    public Mono<Parcela> listarPorId(String id) {
        return parcelaRepository.findById(id);
    }

    @Override
    public Mono<Parcela> crear(Parcela parcela) {
        if (parcela.getNombre() == null || parcela.getNombre().isBlank()) {
            return Mono.error(new BusinessValidationException("El nombre de la parcela es obligatorio."));
        }

        String nombreTrimmed = parcela.getNombre().trim();
        parcela.setNombre(nombreTrimmed);

        return parcelaRepository.existsByNombreIgnoreCase(nombreTrimmed)
                .flatMap(existe -> {
                    if (Boolean.TRUE.equals(existe)) {
                        return Mono.error(new BusinessValidationException(
                                "Ya existe una parcela con el nombre: " + nombreTrimmed
                        ));
                    }

                    parcela.setEstado(true);
                    parcela.setEnUso(Boolean.TRUE.equals(parcela.getEnUso()));
                    parcela.setCreatedAt(LocalDateTime.now());
                    parcela.setUpdatedAt(null);
                    parcela.setDeletedAt(null);
                    parcela.setRestoredAt(null);
                    return parcelaRepository.save(parcela);
                });
    }

    @Override
    public Mono<Parcela> editar(String id, Parcela datos) {
        if (datos.getNombre() == null || datos.getNombre().isBlank()) {
            return Mono.error(new BusinessValidationException("El nombre de la parcela es obligatorio."));
        }

        String nombreTrimmed = datos.getNombre().trim();

        return parcelaRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Parcela no encontrada con ID: " + id)))
                .flatMap(existente -> parcelaRepository.existsByNombreIgnoreCaseAndIdNot(nombreTrimmed, id)
                        .flatMap(existeDuplicado -> {
                            if (Boolean.TRUE.equals(existeDuplicado)) {
                                return Mono.error(new BusinessValidationException(
                                        "Ya existe otra parcela con el nombre: " + nombreTrimmed
                                ));
                            }

                            existente.setNombre(nombreTrimmed);
                            existente.setUbicacion(datos.getUbicacion());
                            existente.setAreaHectareas(datos.getAreaHectareas());
                            existente.setTipoSuelo(datos.getTipoSuelo());
                            existente.setResponsable(datos.getResponsable());
                            existente.setEstadoRiego(datos.getEstadoRiego());
                            existente.setFechaUltimaSiembra(datos.getFechaUltimaSiembra());
                            existente.setProduccionEstimada(datos.getProduccionEstimada());
                            existente.setCultivoActual(datos.getCultivoActual());
                            existente.setObservaciones(datos.getObservaciones());
                            if (datos.getEnUso() != null) {
                                existente.setEnUso(datos.getEnUso());
                            }
                            existente.setUpdatedAt(LocalDateTime.now());

                            return parcelaRepository.save(existente);
                        }));
    }

    @Override
    public Mono<Parcela> eliminar(String id) {
        return parcelaRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Parcela no encontrada con ID: " + id)))
                .flatMap(existente -> {
                    existente.setEstado(false);
                    existente.setDeletedAt(LocalDateTime.now());
                    return parcelaRepository.save(existente);
                });
    }

    @Override
    public Mono<Parcela> restaurar(String id) {
        return parcelaRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Parcela no encontrada con ID: " + id)))
                .flatMap(existente -> {
                    existente.setEstado(true);
                    existente.setRestoredAt(LocalDateTime.now());
                    return parcelaRepository.save(existente);
                });
    }

    // ===================== IMPORTACIÓN =====================
    // Columnas: nombre,ubicacion,areaHectareas,tipoSuelo,responsable,estadoRiego,
    //           fechaUltimaSiembra,produccionEstimada,cultivoActual,observaciones

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
                .flatMap(b -> Mono.fromCallable(() -> ArchivoUtil.filasExcel(b, 10))
                        .subscribeOn(Schedulers.boundedElastic()))
                .flatMap(this::guardarFilas);
    }

    private Mono<ImportResultDto> guardarFilas(List<String[]> filas) {
        // reutiliza crear(): valida nombre y rechaza nombres duplicados
        return ArchivoUtil.<Parcela>procesar(filas, 10, this::aParcela, validator, this::crear);
    }

    private Parcela aParcela(String[] c, int fila) {
        return Parcela.builder()
                .nombre(c[0])
                .ubicacion(c[1])
                .areaHectareas(ArchivoUtil.decimal(c[2], "areaHectareas"))
                .tipoSuelo(c[3])
                .responsable(c[4])
                .estadoRiego(c[5])
                .fechaUltimaSiembra(ArchivoUtil.fecha(c[6], "fechaUltimaSiembra"))
                .produccionEstimada(c[7])
                .cultivoActual(c[8])
                .observaciones(c[9])
                .build();
    }

    // ===================== EXPORTACIÓN =====================

    @Override
    public Mono<byte[]> exportarExcel() {
        return parcelaRepository.findAll()
                .collectList()
                .flatMap(lista -> Mono.fromCallable(() -> {
                    String[] cabeceras = {"NOMBRE", "UBICACIÓN", "ÁREA (HA)", "TIPO SUELO", "RESPONSABLE",
                            "ESTADO RIEGO", "ÚLTIMA SIEMBRA", "PRODUCCIÓN ESTIMADA", "CULTIVO ACTUAL",
                            "OBSERVACIONES", "EN USO", "ESTADO"};
                    List<Object[]> filas = lista.stream()
                            .map(p -> new Object[]{
                                    ArchivoUtil.nvl(p.getNombre()),
                                    ArchivoUtil.nvl(p.getUbicacion()),
                                    p.getAreaHectareas(),
                                    ArchivoUtil.nvl(p.getTipoSuelo()),
                                    ArchivoUtil.nvl(p.getResponsable()),
                                    ArchivoUtil.nvl(p.getEstadoRiego()),
                                    p.getFechaUltimaSiembra() != null ? p.getFechaUltimaSiembra().toString() : "",
                                    ArchivoUtil.nvl(p.getProduccionEstimada()),
                                    ArchivoUtil.nvl(p.getCultivoActual()),
                                    ArchivoUtil.nvl(p.getObservaciones()),
                                    Boolean.TRUE.equals(p.getEnUso()) ? "SI" : "NO",
                                    Boolean.TRUE.equals(p.getEstado()) ? "ACTIVO" : "INACTIVO"})
                            .toList();
                    return ArchivoUtil.crearExcel("Parcelas", cabeceras, filas);
                }).subscribeOn(Schedulers.boundedElastic()));
    }

    @Override
    public Mono<byte[]> exportarPdf() {
        return parcelaRepository.findAll()
                .collectList()
                .flatMap(lista -> Mono.fromCallable(() -> {
                    Context context = new Context();
                    context.setVariable("parcelas", lista);
                    return ArchivoUtil.htmlAPdf(templateEngine.process("parcelas", context));
                }).subscribeOn(Schedulers.boundedElastic()));
    }
}
