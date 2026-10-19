package Agropacayales.valleGrande.service;

import Agropacayales.valleGrande.exception.BusinessValidationException;
import Agropacayales.valleGrande.exception.ResourceNotFoundException;
import Agropacayales.valleGrande.model.Parcela;
import Agropacayales.valleGrande.repository.mongo.ParcelaRepository;
import Agropacayales.valleGrande.service.impl.ParcelaServiceImpl;
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
import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ParcelaServiceTest {

    @Mock
    private ParcelaRepository parcelaRepository;

    @InjectMocks
    private ParcelaServiceImpl parcelaService;

    private Parcela parcelaMock;

    @BeforeEach
    void setUp() {
        parcelaMock = Parcela.builder()
                .id("64fa3b1234567890abcdef56")
                .nombre("Parcela Norte 1")
                .ubicacion("Sector A - Lote 1")
                .areaHectareas(new BigDecimal("12.50"))
                .tipoSuelo("Arcilloso")
                .responsable("Juan Perez")
                .estadoRiego("Completo")
                .fechaUltimaSiembra(LocalDate.of(2024, 5, 10))
                .produccionEstimada("50 toneladas")
                .cultivoActual("Maiz")
                .observaciones("Suelo con buena retención")
                .enUso(false)
                .estado(true)
                .build();
    }

    @Test
    @DisplayName("Listar todas las parcelas debe retornar un Flux")
    void listarTodos_DebeRetornarFlux() {
        when(parcelaRepository.findAll()).thenReturn(Flux.just(parcelaMock));

        StepVerifier.create(parcelaService.listarTodos())
                .expectNextMatches(p -> p.getNombre().equals("Parcela Norte 1"))
                .verifyComplete();
    }

    @Test
    @DisplayName("Crear parcela válida debe guardarla en MongoDB")
    void crear_ParcelaValida_DebeGuardar() {
        when(parcelaRepository.existsByNombreIgnoreCase(anyString())).thenReturn(Mono.just(false));
        when(parcelaRepository.save(any(Parcela.class))).thenReturn(Mono.just(parcelaMock));

        StepVerifier.create(parcelaService.crear(parcelaMock))
                .expectNext(parcelaMock)
                .verifyComplete();
    }

    @Test
    @DisplayName("Crear parcela con nombre duplicado debe lanzar BusinessValidationException")
    void crear_NombreDuplicado_DebeLanzarError() {
        when(parcelaRepository.existsByNombreIgnoreCase(anyString())).thenReturn(Mono.just(true));

        StepVerifier.create(parcelaService.crear(parcelaMock))
                .expectError(BusinessValidationException.class)
                .verify();
    }

    @Test
    @DisplayName("Eliminar parcela existente debe desactivarla")
    void eliminar_ParcelaExistente_DebeDesactivar() {
        when(parcelaRepository.findById("64fa3b1234567890abcdef56")).thenReturn(Mono.just(parcelaMock));
        when(parcelaRepository.save(any(Parcela.class))).thenAnswer(i -> Mono.just(i.getArgument(0)));

        StepVerifier.create(parcelaService.eliminar("64fa3b1234567890abcdef56"))
                .expectNextMatches(p -> Boolean.FALSE.equals(p.getEstado()) && p.getDeletedAt() != null)
                .verifyComplete();
    }

    @Test
    @DisplayName("Restaurar parcela existente debe activarla")
    void restaurar_ParcelaExistente_DebeActivar() {
        parcelaMock.setEstado(false);
        when(parcelaRepository.findById("64fa3b1234567890abcdef56")).thenReturn(Mono.just(parcelaMock));
        when(parcelaRepository.save(any(Parcela.class))).thenAnswer(i -> Mono.just(i.getArgument(0)));

        StepVerifier.create(parcelaService.restaurar("64fa3b1234567890abcdef56"))
                .expectNextMatches(p -> Boolean.TRUE.equals(p.getEstado()) && p.getRestoredAt() != null)
                .verifyComplete();
    }
}
