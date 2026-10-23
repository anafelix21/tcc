package Agropacayales.valleGrande.events;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Envía eventos de negocio al Backend 2 Analítico (Flask) dentro del clúster:
 * POST {ANALYTICS_URL}/api/v1/analytics/eventos
 * Es "fire and forget": si el analítico no responde, la operación del usuario no se ve afectada.
 */
@Slf4j
@Component
public class EventoNegocioPublisher {

    private final WebClient webClient;
    private final boolean habilitado;

    public EventoNegocioPublisher(WebClient.Builder builder,
                                  @Value("${analytics.url:http://localhost:5000}") String analyticsUrl,
                                  @Value("${analytics.events.enabled:true}") boolean habilitado) {
        this.webClient = builder.baseUrl(analyticsUrl).build();
        this.habilitado = habilitado;
    }

    public void publicar(String tipoEvento, String entidad, String entidadId, String usuario, Map<String, Object> detalle) {
        if (!habilitado) {
            return;
        }
        Map<String, Object> evento = new HashMap<>();
        evento.put("tipo_evento", tipoEvento);
        evento.put("entidad", entidad);
        evento.put("entidad_id", entidadId);
        evento.put("origen", "backend-transaccional");
        evento.put("usuario", usuario);
        evento.put("detalle", detalle);
        evento.put("fecha_evento", OffsetDateTime.now().toString());

        webClient.post()
                .uri("/api/v1/analytics/eventos")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(evento)
                .retrieve()
                .toBodilessEntity()
                .timeout(Duration.ofSeconds(3))
                .subscribeOn(Schedulers.boundedElastic())
                .subscribe(
                        ok -> log.debug("Evento {} {} enviado al backend analítico", tipoEvento, entidad),
                        error -> log.warn("No se pudo enviar el evento {} {} al backend analítico: {}",
                                tipoEvento, entidad, error.getMessage()));
    }
}
