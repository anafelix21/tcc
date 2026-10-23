package Agropacayales.valleGrande.events;

import Agropacayales.valleGrande.security.AuthWebFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Auditoría automática: cada operación exitosa sobre /api/** que modifica datos (o exporta / inicia sesión)
 * se convierte en un evento de negocio y se envía al Backend 2 Analítico.
 */
@Component
@Order(10)
@RequiredArgsConstructor
public class EventoNegocioWebFilter implements WebFilter {

    // /api/{recurso}[/{id}][/{accion}]
    private static final Pattern RUTA = Pattern.compile("^/api/([a-z\\-]+)(?:/([^/]+))?(?:/([^/]+))?(?:/([^/]+))?$");

    private static final Map<String, String> ENTIDADES = Map.of(
            "insumos", "INSUMO",
            "parcelas", "PARCELA",
            "usuarios", "USUARIO",
            "harvest", "COSECHA",
            "actividades-cultivos", "ACTIVIDAD",
            "asignaciones-trabajadores", "ASIGNACION",
            "auth", "SESION"
    );

    // ObjectProvider: en tests @WebFluxTest el publisher no existe y el filtro no hace nada
    private final ObjectProvider<EventoNegocioPublisher> publisher;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        return chain.filter(exchange).doOnSuccess(v -> registrar(exchange));
    }

    private void registrar(ServerWebExchange exchange) {
        HttpStatusCode status = exchange.getResponse().getStatusCode();
        if (status != null && !status.is2xxSuccessful()) {
            return;
        }
        String path = exchange.getRequest().getPath().value();
        Matcher m = RUTA.matcher(path);
        if (!m.matches() || !ENTIDADES.containsKey(m.group(1))) {
            return;
        }
        String tipo = tipoEvento(exchange.getRequest().getMethod(), path);
        if (tipo == null) {
            return;
        }
        String entidad = ENTIDADES.get(m.group(1));
        String segundo = m.group(2);
        boolean esId = segundo != null && !segundo.matches("importar|exportar|login|buscar|filtrar|estado|registrar|eliminar|restaurar|listar|actividad|parcela");
        // /api/harvest/eliminar/{id} y /api/harvest/restaurar/{id}
        String entidadId = esId ? segundo : ("eliminar".equals(segundo) || "restaurar".equals(segundo) ? m.group(3) : null);

        Map<String, Object> detalle = new HashMap<>();
        detalle.put("metodo", String.valueOf(exchange.getRequest().getMethod()));
        detalle.put("ruta", path);
        detalle.put("status", status == null ? 200 : status.value());

        String usuario = exchange.getAttribute(AuthWebFilter.ATTR_CORREO);
        publisher.ifAvailable(p -> p.publicar(tipo, entidad, entidadId, usuario, detalle));
    }

    private String tipoEvento(HttpMethod metodo, String path) {
        if (path.contains("/importar/")) return "IMPORTACION";
        if (path.contains("/exportar/")) return "EXPORTACION";
        if (path.endsWith("/login")) return "LOGIN";
        if (path.endsWith("/restaurar") || path.contains("/restaurar/")) return "RESTAURACION";
        if (path.endsWith("/eliminar") || path.contains("/eliminar/") || HttpMethod.DELETE.equals(metodo)) return "ELIMINACION";
        if (HttpMethod.POST.equals(metodo)) return "CREACION";
        if (HttpMethod.PUT.equals(metodo) || HttpMethod.PATCH.equals(metodo)) return "ACTUALIZACION";
        return null;
    }
}
