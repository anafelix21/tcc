package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.ValleGrandeApplication;
import Agropacayales.valleGrande.dto.request.AsignacionCabeceraRequestDto;
import Agropacayales.valleGrande.dto.request.AsignacionDetalleRequestDto;
import Agropacayales.valleGrande.dto.response.AsignacionCabeceraResponseDto;
import Agropacayales.valleGrande.dto.response.AsignacionDetalleResponseDto;
import Agropacayales.valleGrande.service.AsignacionCabeceraService;
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

@WebFluxTest(controllers = AsignacionCabeceraController.class)
@ContextConfiguration(classes = ValleGrandeApplication.class)
class AsignacionCabeceraControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockitoBean
    private AsignacionCabeceraService asignacionService;

    private AsignacionCabeceraResponseDto mockResponse;
    private AsignacionCabeceraRequestDto mockRequest;

    @BeforeEach
    void setUp() {
        AsignacionDetalleResponseDto detResponse = AsignacionDetalleResponseDto.builder()
                .idAsignacionDetalle(1L)
                .idUsuario("65f000000000000000000009")
                .nombreCompletoUsuario("Axel Huapaya")
                .costoManoObra(new BigDecimal("120.00"))
                .build();

        mockResponse = AsignacionCabeceraResponseDto.builder()
                .idAsignacionCabecera(3L)
                .idActividad(10L)
                .tipoActividad("Fertilización")
                .nombreCultivo("Palta Hass Lote A")
                .fechaAsignacion(LocalDateTime.now())
                .horasTrabajadas(new BigDecimal("8.00"))
                .costoTotalManoObra(new BigDecimal("120.00"))
                .observacion("Jornal completo")
                .estado(true)
                .createdAt(LocalDateTime.now())
                .detalles(List.of(detResponse))
                .build();

        mockRequest = AsignacionCabeceraRequestDto.builder()
                .idActividad(10L)
                .horasTrabajadas(new BigDecimal("8.00"))
                .observacion("Jornal completo")
                .detalles(List.of(
                        AsignacionDetalleRequestDto.builder()
                                .idUsuario("65f000000000000000000009")
                                .costoManoObra(new BigDecimal("120.00"))
                                .build()
                ))
                .build();
    }

    @Test
    @DisplayName("GET /api/asignaciones-trabajadores debe retornar 200 y Flux con cabecera y detalle")
    void listar_DebeRetornar200() {
        when(asignacionService.listarTodas()).thenReturn(Flux.just(mockResponse));

        webTestClient.get()
                .uri("/api/asignaciones-trabajadores")
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$[0].idAsignacionCabecera").isEqualTo(3)
                .jsonPath("$[0].detalles[0].nombreCompletoUsuario").isEqualTo("Axel Huapaya");
    }

    @Test
    @DisplayName("GET /api/asignaciones-trabajadores/{id} debe retornar 200 y Mono con cabecera y detalle")
    void buscar_DebeRetornar200() {
        when(asignacionService.listarPorId(3L)).thenReturn(Mono.just(mockResponse));

        webTestClient.get()
                .uri("/api/asignaciones-trabajadores/3")
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.idAsignacionCabecera").isEqualTo(3)
                .jsonPath("$.costoTotalManoObra").isEqualTo(120.00);
    }

    @Test
    @DisplayName("POST /api/asignaciones-trabajadores debe crear y retornar 201 Created")
    void registrar_DebeRetornar201() {
        when(asignacionService.crear(any(AsignacionCabeceraRequestDto.class))).thenReturn(Mono.just(mockResponse));

        webTestClient.post()
                .uri("/api/asignaciones-trabajadores")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(mockRequest)
                .exchange()
                .expectStatus().isCreated()
                .expectBody()
                .jsonPath("$.idAsignacionCabecera").isEqualTo(3);
    }

    @Test
    @DisplayName("PUT /api/asignaciones-trabajadores/{id} debe editar y retornar 200 OK")
    void editar_DebeRetornar200() {
        when(asignacionService.editar(eq(3L), any(AsignacionCabeceraRequestDto.class))).thenReturn(Mono.just(mockResponse));

        webTestClient.put()
                .uri("/api/asignaciones-trabajadores/3")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(mockRequest)
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.idAsignacionCabecera").isEqualTo(3);
    }
}
