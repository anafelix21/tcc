package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.ValleGrandeApplication;
import Agropacayales.valleGrande.model.Parcela;
import Agropacayales.valleGrande.service.ParcelaService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@WebFluxTest(controllers = ParcelaController.class)
@ContextConfiguration(classes = ValleGrandeApplication.class)
class ParcelaControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockitoBean
    private ParcelaService parcelaService;

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
    @DisplayName("GET /api/parcelas debe retornar Flux con status 200")
    void listarTodos_DebeRetornar200YFlux() {
        when(parcelaService.listarTodos()).thenReturn(Flux.just(parcelaMock));

        webTestClient.get()
                .uri("/api/parcelas")
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(Parcela.class)
                .hasSize(1)
                .contains(parcelaMock);
    }

    @Test
    @DisplayName("GET /api/parcelas/{id} debe retornar Mono con status 200")
    void listarPorId_Existente_DebeRetornar200() {
        when(parcelaService.listarPorId("64fa3b1234567890abcdef56")).thenReturn(Mono.just(parcelaMock));

        webTestClient.get()
                .uri("/api/parcelas/64fa3b1234567890abcdef56")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.id").isEqualTo("64fa3b1234567890abcdef56")
                .jsonPath("$.nombre").isEqualTo("Parcela Norte 1");
    }

    @Test
    @DisplayName("POST /api/parcelas debe retornar 201 Created")
    void crear_ParcelaValida_DebeRetornar201() {
        when(parcelaService.crear(any(Parcela.class))).thenReturn(Mono.just(parcelaMock));

        webTestClient.post()
                .uri("/api/parcelas")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(parcelaMock)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.id").isEqualTo("64fa3b1234567890abcdef56")
                .jsonPath("$.nombre").isEqualTo("Parcela Norte 1");
    }

    @Test
    @DisplayName("PUT /api/parcelas/{id} debe retornar 200 OK")
    void editar_ParcelaValida_DebeRetornar200() {
        when(parcelaService.editar(eq("64fa3b1234567890abcdef56"), any(Parcela.class))).thenReturn(Mono.just(parcelaMock));

        webTestClient.put()
                .uri("/api/parcelas/64fa3b1234567890abcdef56")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(parcelaMock)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.id").isEqualTo("64fa3b1234567890abcdef56");
    }

    @Test
    @DisplayName("PATCH /api/parcelas/{id}/eliminar debe retornar 200 OK")
    void eliminar_ParcelaExistente_DebeRetornar200() {
        parcelaMock.setEstado(false);
        when(parcelaService.eliminar("64fa3b1234567890abcdef56")).thenReturn(Mono.just(parcelaMock));

        webTestClient.patch()
                .uri("/api/parcelas/64fa3b1234567890abcdef56/eliminar")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.estado").isEqualTo(false);
    }

    @Test
    @DisplayName("PATCH /api/parcelas/{id}/restaurar debe retornar 200 OK")
    void restaurar_ParcelaExistente_DebeRetornar200() {
        parcelaMock.setEstado(true);
        when(parcelaService.restaurar("64fa3b1234567890abcdef56")).thenReturn(Mono.just(parcelaMock));

        webTestClient.patch()
                .uri("/api/parcelas/64fa3b1234567890abcdef56/restaurar")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.estado").isEqualTo(true);
    }
}
