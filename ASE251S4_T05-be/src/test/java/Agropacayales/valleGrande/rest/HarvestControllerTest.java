package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.ValleGrandeApplication;
import Agropacayales.valleGrande.dto.request.DetalleCosechaDTO;
import Agropacayales.valleGrande.dto.request.HarvestRequestDTO;
import Agropacayales.valleGrande.dto.response.DetalleResponseDTO;
import Agropacayales.valleGrande.dto.response.HarvestResponseDTO;
import Agropacayales.valleGrande.service.HarvestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@WebFluxTest(controllers = HarvestController.class)
@ContextConfiguration(classes = ValleGrandeApplication.class)
class HarvestControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockitoBean
    private HarvestService harvestService;

    private HarvestResponseDTO mockResponse;
    private HarvestRequestDTO mockRequest;

    @BeforeEach
    void setUp() {
        DetalleResponseDTO detResponse = DetalleResponseDTO.builder()
                .idHarvestDetail(1)
                .idCultivo(1)
                .kilosOptimos(new BigDecimal("950.00"))
                .kilosMerma(new BigDecimal("50.00"))
                .totalKilos(new BigDecimal("1000.00"))
                .build();

        mockResponse = HarvestResponseDTO.builder()
                .idHarvest(5)
                .responsable("Ana Félix")
                .fechaCosecha(LocalDate.of(2026, 3, 20))
                .estado(true)
                .createdAt(LocalDateTime.now())
                .detalles(List.of(detResponse))
                .build();

        mockRequest = HarvestRequestDTO.builder()
                .responsable("Ana Félix")
                .fechaCosecha(LocalDate.of(2026, 3, 20))
                .detalles(List.of(
                        DetalleCosechaDTO.builder()
                                .idCultivo(1)
                                .kilosOptimos(new BigDecimal("950.00"))
                                .kilosMerma(new BigDecimal("50.00"))
                                .build()
                ))
                .build();
    }

    @Test
    @DisplayName("GET /api/harvest debe retornar 200 y Flux con cabecera y detalles")
    void listarCosechas_DebeRetornar200() {
        when(harvestService.listarTodas()).thenReturn(Flux.just(mockResponse));

        webTestClient.get()
                .uri("/api/harvest")
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$[0].idHarvest").isEqualTo(5)
                .jsonPath("$[0].responsable").isEqualTo("Ana Félix")
                .jsonPath("$[0].detalles[0].totalKilos").isEqualTo(1000.00);
    }

    @Test
    @DisplayName("GET /api/harvest/{id} debe retornar 200 y Mono con cabecera y detalles")
    void obtenerCosecha_DebeRetornar200() {
        when(harvestService.listarPorId(5)).thenReturn(Mono.just(mockResponse));

        webTestClient.get()
                .uri("/api/harvest/5")
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.idHarvest").isEqualTo(5)
                .jsonPath("$.responsable").isEqualTo("Ana Félix");
    }

    @Test
    @DisplayName("POST /api/harvest debe registrar y retornar 201 Created")
    void crearCosecha_DebeRetornar201() {
        when(harvestService.crear(any(HarvestRequestDTO.class))).thenReturn(Mono.just(mockResponse));

        webTestClient.post()
                .uri("/api/harvest")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(mockRequest)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.idHarvest").isEqualTo(5);
    }

    @Test
    @DisplayName("PUT /api/harvest/{id} debe actualizar y retornar 200 OK")
    void editarCosecha_DebeRetornar200() {
        when(harvestService.editar(eq(5), any(HarvestRequestDTO.class))).thenReturn(Mono.just(mockResponse));

        webTestClient.put()
                .uri("/api/harvest/5")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(mockRequest)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.idHarvest").isEqualTo(5);
    }
}
