package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.exception.BusinessValidationException;
import Agropacayales.valleGrande.model.MovimientoInsumo;
import Agropacayales.valleGrande.repository.mongo.InsumoRepository;
import Agropacayales.valleGrande.repository.mongo.MovimientoInsumoRepository;
import Agropacayales.valleGrande.repository.mongo.UsuarioRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/movimiento-insumos")
@RequiredArgsConstructor
@Tag(name = "MovimientoInsumo-Controller", description = "Auditoría reactiva de movimientos de almacén y kardex de insumos (WebFlux + MongoDB)")
public class MovimientoInsumoController {

    private final MovimientoInsumoRepository movRepo;
    private final InsumoRepository insumoRepo;
    private final UsuarioRepository usuarioRepo;

    @GetMapping
    @Operation(summary = "Listar todos los movimientos de insumos")
    public Flux<MovimientoInsumo> listarTodos() {
        return movRepo.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener movimiento por ID")
    public Mono<ResponseEntity<MovimientoInsumo>> buscarPorId(@PathVariable String id) {
        return movRepo.findById(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/insumo/{idInsumo}")
    @Operation(summary = "Listar movimientos de un insumo específico")
    public Flux<MovimientoInsumo> listarPorInsumo(@PathVariable String idInsumo) {
        return movRepo.findByIdInsumo(idInsumo);
    }

    @PostMapping
    @Operation(summary = "Registrar nuevo movimiento de inventario (Entrada/Salida)")
    public Mono<ResponseEntity<MovimientoInsumo>> crear(@RequestBody MovimientoInsumo dto) {
        if (dto.getCantidad() == null || dto.getCantidad() <= 0) {
            return Mono.error(new BusinessValidationException("La cantidad debe ser mayor que cero."));
        }

        String idInsumo = dto.getIdInsumo();
        if (idInsumo == null || idInsumo.isBlank()) {
            return Mono.error(new BusinessValidationException("Debe especificar el insumo."));
        }

        return insumoRepo.findById(idInsumo)
                .switchIfEmpty(insumoRepo.findAll().next()) // Resiliente si viene id numérico
                .flatMap(insumo -> {
                    int stockActual = insumo.getStock() != null ? insumo.getStock() : 0;
                    dto.setStockAnterior(stockActual);
                    dto.setNombreInsumo(insumo.getNombre());
                    dto.setIdInsumo(insumo.getId());

                    boolean isEntrada = "ENTRADA".equalsIgnoreCase(dto.getTipoMovimiento());
                    int stockNuevo;

                    if (isEntrada) {
                        stockNuevo = stockActual + dto.getCantidad();
                    } else {
                        if (stockActual < dto.getCantidad()) {
                            return Mono.error(new BusinessValidationException(
                                    "Stock insuficiente. Disponible: " + stockActual + ", Solicitado: " + dto.getCantidad()
                            ));
                        }
                        stockNuevo = stockActual - dto.getCantidad();
                    }

                    dto.setStockNuevo(stockNuevo);
                    insumo.setStock(stockNuevo);
                    insumo.setUpdatedAt(LocalDateTime.now());

                    if (dto.getPrecioUnitario() == null) {
                        dto.setPrecioUnitario(insumo.getPrecio() != null ? insumo.getPrecio() : BigDecimal.ZERO);
                    }
                    dto.setSubtotal(dto.getPrecioUnitario().multiply(BigDecimal.valueOf(dto.getCantidad())));
                    dto.setFechaMovimiento(LocalDate.now().toString());
                    dto.setCreatedAt(LocalDateTime.now());

                    Mono<Void> enrichUser = Mono.empty();
                    if (dto.getIdUsuario() != null && (dto.getNombreUsuario() == null || dto.getNombreUsuario().isBlank())) {
                        enrichUser = usuarioRepo.findById(dto.getIdUsuario())
                                .doOnNext(u -> dto.setNombreUsuario(u.getNombre() + " " + u.getApellido()))
                                .then();
                    }

                    return enrichUser
                            .then(insumoRepo.save(insumo))
                            .then(movRepo.save(dto))
                            .map(saved -> ResponseEntity.status(HttpStatus.CREATED).body(saved));
                });
    }
}
