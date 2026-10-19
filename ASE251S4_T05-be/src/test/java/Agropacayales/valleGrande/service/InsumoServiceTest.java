package Agropacayales.valleGrande.service;

import Agropacayales.valleGrande.exception.BusinessValidationException;
import Agropacayales.valleGrande.exception.ResourceNotFoundException;
import Agropacayales.valleGrande.model.Insumo;
import Agropacayales.valleGrande.repository.mongo.InsumoRepository;
import Agropacayales.valleGrande.service.impl.InsumoServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InsumoServiceTest {

    @Mock
    private InsumoRepository insumoRepository;

    @InjectMocks
    private InsumoServiceImpl insumoService;

    private Insumo insumoMock;

    @BeforeEach
    void setUp() {
        insumoMock = Insumo.builder()
                .id("64fa3b1234567890abcdef34")
                .nombre("Urea")
                .descripcion("Fertilizante nitrogenado")
                .precio(new BigDecimal("85.50"))
                .stock(150)
                .unidadMedida("kg")
                .tipoInsumo("FERTILIZANTE")
                .proveedor("Fertisur")
                .presentacion("Saco 50kg")
                .estado(true)
                .build();
    }

    @Test
    @DisplayName("Listar todos los insumos debe retornar un Flux")
    void listarTodos_DebeRetornarFlux() {
        when(insumoRepository.findAll()).thenReturn(Flux.just(insumoMock));

        StepVerifier.create(insumoService.listarTodos())
                .expectNextMatches(i -> i.getNombre().equals("Urea") && i.getTipoInsumo().equals("FERTILIZANTE"))
                .verifyComplete();
    }

    @Test
    @DisplayName("Crear insumo válido debe guardarlo en MongoDB")
    void crear_InsumoValido_DebeGuardar() {
        when(insumoRepository.existsByNombreIgnoreCaseAndEstadoTrue(anyString())).thenReturn(Mono.just(false));
        when(insumoRepository.save(any(Insumo.class))).thenReturn(Mono.just(insumoMock));

        StepVerifier.create(insumoService.crear(insumoMock))
                .expectNext(insumoMock)
                .verifyComplete();
    }

    @Test
    @DisplayName("Crear insumo con tipo no permitido debe lanzar BusinessValidationException")
    void crear_TipoInvalido_DebeLanzarError() {
        insumoMock.setTipoInsumo("TIPO_DESCONOCIDO");

        StepVerifier.create(insumoService.crear(insumoMock))
                .expectError(BusinessValidationException.class)
                .verify();
    }

    @Test
    @DisplayName("Eliminar insumo con stock remanente > 0 debe lanzar BusinessValidationException")
    void eliminar_ConStockRemanente_DebeLanzarError() {
        insumoMock.setStock(50);
        when(insumoRepository.findById("64fa3b1234567890abcdef34")).thenReturn(Mono.just(insumoMock));

        StepVerifier.create(insumoService.eliminar("64fa3b1234567890abcdef34"))
                .expectError(BusinessValidationException.class)
                .verify();
    }

    @Test
    @DisplayName("Eliminar insumo con stock 0 debe desactivarlo")
    void eliminar_ConStockCero_DebeDesactivar() {
        insumoMock.setStock(0);
        when(insumoRepository.findById("64fa3b1234567890abcdef34")).thenReturn(Mono.just(insumoMock));
        when(insumoRepository.save(any(Insumo.class))).thenAnswer(i -> Mono.just(i.getArgument(0)));

        StepVerifier.create(insumoService.eliminar("64fa3b1234567890abcdef34"))
                .expectNextMatches(i -> Boolean.FALSE.equals(i.getEstado()) && i.getDeletedAt() != null)
                .verifyComplete();
    }

    @Test
    @DisplayName("Restaurar insumo debe activarlo nuevamente")
    void restaurar_InsumoExistente_DebeActivar() {
        insumoMock.setEstado(false);
        when(insumoRepository.findById("64fa3b1234567890abcdef34")).thenReturn(Mono.just(insumoMock));
        when(insumoRepository.save(any(Insumo.class))).thenAnswer(i -> Mono.just(i.getArgument(0)));

        StepVerifier.create(insumoService.restaurar("64fa3b1234567890abcdef34"))
                .expectNextMatches(i -> Boolean.TRUE.equals(i.getEstado()) && i.getRestoredAt() != null)
                .verifyComplete();
    }
}
