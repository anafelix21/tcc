package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.ValleGrandeApplication;
import Agropacayales.valleGrande.dto.request.ActividadCultivoRequestDto;
import Agropacayales.valleGrande.dto.request.DetalleActividadRequestDto;
import Agropacayales.valleGrande.dto.response.ActividadCultivoResponseDto;
import Agropacayales.valleGrande.dto.response.DetalleActividadResponseDto;
import Agropacayales.valleGrande.service.ActividadCultivoService;
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
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@WebFluxTest(controllers = ActividadCultivoController.class)
@ContextConfiguration(classes = ValleGrandeApplication.class)
class ActividadCultivoControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockitoBean
    private ActividadCultivoService actividadService;

    private ActividadCultivoResponseDto mockResponse;
    private ActividadCultivoRequestDto mockRequest;

    @BeforeEach
    void setUp() {
        DetalleActividadResponseDto detResponse = DetalleActividadResponseDto.builder()
                .idDetalle(1L)
                .idInsumo("65f000000000000000000001")
                .nombreInsumo("Urea Agrícola")
                .cantidad(5)
                .precioUnitario(new BigDecimal("85.50"))
                .subtotal(new BigDecimal("427.50"))
                .build();

        mockResponse = ActividadCultivoResponseDto.builder()
                .idActividad(10L)
                .idCultivo(1L)
                .nombreCultivo("Palta Hass Lote A")
                .tipoActividad("Fertilización")
                .descripcion("Aplicación de fertilizante foliar")
                .fechaActividad(LocalDateTime.now())
                .costoTotal(new BigDecimal("427.50"))
                .estado(true)
                .completado(false)
                .detalles(List.of(detResponse))
                .build();

        mockRequest = ActividadCultivoRequestDto.builder()
                .idCultivo(1L)
                .tipoActividad("Fertilización")
                .descripcion("Aplicación de fertilizante foliar")
                .detalles(List.of(
                        DetalleActividadRequestDto.builder()
                                .idInsumo("65f000000000000000000001")
                                .cantidad(5)
                                .build()
                ))
                .build();
    }

    @Test
    @DisplayName("GET /api/actividades-cultivos debe retornar 200 y Flux con cabecera y detalle")
    void listarTodas_DebeRetornar200() {
        when(actividadService.listarTodas()).thenReturn(Flux.just(mockResponse));

        webTestClient.get()
                .uri("/api/actividades-cultivos")
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$[0].idActividad").isEqualTo(10)
                .jsonPath("$[0].tipoActividad").isEqualTo("Fertilización")
                .jsonPath("$[0].detalles[0].nombreInsumo").isEqualTo("Urea Agrícola");
    }

    @Test
    @DisplayName("GET /api/actividades-cultivos/{id} debe retornar 200 y Mono de cabecera y detalle")
    void listarPorId_DebeRetornar200() {
        when(actividadService.listarPorId(10L)).thenReturn(Mono.just(mockResponse));

        webTestClient.get()
                .uri("/api/actividades-cultivos/10")
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.idActividad").isEqualTo(10)
                .jsonPath("$.costoTotal").isEqualTo(427.50);
    }

    @Test
    @DisplayName("POST /api/actividades-cultivos debe registrar cabecera y detalles retornando 201")
    void crear_DebeRetornar201() {
        when(actividadService.crear(any(ActividadCultivoRequestDto.class))).thenReturn(Mono.just(mockResponse));

        webTestClient.post()
                .uri("/api/actividades-cultivos")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(mockRequest)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.idActividad").isEqualTo(10);
    }

    @Test
    @DisplayName("PUT /api/actividades-cultivos/{id} debe actualizar cabecera y detalles retornando 200")
    void editar_DebeRetornar200() {
        when(actividadService.editar(eq(10L), any(ActividadCultivoRequestDto.class))).thenReturn(Mono.just(mockResponse));

        webTestClient.put()
                .uri("/api/actividades-cultivos/10")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(mockRequest)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.idActividad").isEqualTo(10);
    }
}
