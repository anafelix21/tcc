package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.ValleGrandeApplication;
import Agropacayales.valleGrande.model.Insumo;
import Agropacayales.valleGrande.service.InsumoService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@WebFluxTest(controllers = InsumoController.class)
@ContextConfiguration(classes = ValleGrandeApplication.class)
class InsumoControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockitoBean
    private InsumoService insumoService;

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
    @DisplayName("GET /api/insumos debe retornar Flux con status 200")
    void listarTodos_DebeRetornar200YFlux() {
        when(insumoService.listarTodos()).thenReturn(Flux.just(insumoMock));

        webTestClient.get()
                .uri("/api/insumos")
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(Insumo.class)
                .hasSize(1)
                .contains(insumoMock);
    }

    @Test
    @DisplayName("GET /api/insumos/{id} debe retornar Mono con status 200")
    void listarPorId_Existente_DebeRetornar200() {
        when(insumoService.listarPorId("64fa3b1234567890abcdef34")).thenReturn(Mono.just(insumoMock));

        webTestClient.get()
                .uri("/api/insumos/64fa3b1234567890abcdef34")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.id").isEqualTo("64fa3b1234567890abcdef34")
                .jsonPath("$.nombre").isEqualTo("Urea");
    }

    @Test
    @DisplayName("POST /api/insumos debe retornar 201 Created")
    void crear_InsumoValido_DebeRetornar201() {
        when(insumoService.crear(any(Insumo.class))).thenReturn(Mono.just(insumoMock));

        webTestClient.post()
                .uri("/api/insumos")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(insumoMock)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.id").isEqualTo("64fa3b1234567890abcdef34")
                .jsonPath("$.nombre").isEqualTo("Urea");
    }

    @Test
    @DisplayName("PUT /api/insumos/{id} debe retornar 200 OK")
    void editar_InsumoValido_DebeRetornar200() {
        when(insumoService.editar(eq("64fa3b1234567890abcdef34"), any(Insumo.class))).thenReturn(Mono.just(insumoMock));

        webTestClient.put()
                .uri("/api/insumos/64fa3b1234567890abcdef34")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(insumoMock)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.id").isEqualTo("64fa3b1234567890abcdef34");
    }

    @Test
    @DisplayName("PATCH /api/insumos/{id}/eliminar debe retornar 200 OK")
    void eliminar_InsumoExistente_DebeRetornar200() {
        insumoMock.setEstado(false);
        when(insumoService.eliminar("64fa3b1234567890abcdef34")).thenReturn(Mono.just(insumoMock));

        webTestClient.patch()
                .uri("/api/insumos/64fa3b1234567890abcdef34/eliminar")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.estado").isEqualTo(false);
    }

    @Test
    @DisplayName("PATCH /api/insumos/{id}/restaurar debe retornar 200 OK")
    void restaurar_InsumoExistente_DebeRetornar200() {
        insumoMock.setEstado(true);
        when(insumoService.restaurar("64fa3b1234567890abcdef34")).thenReturn(Mono.just(insumoMock));

        webTestClient.patch()
                .uri("/api/insumos/64fa3b1234567890abcdef34/restaurar")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.estado").isEqualTo(true);
    }
}
