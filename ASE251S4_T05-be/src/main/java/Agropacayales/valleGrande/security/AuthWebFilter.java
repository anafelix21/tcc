package Agropacayales.valleGrande.security;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Autenticación y autorización por token JWT.
 * <ul>
 *   <li>Siempre: si llega un token válido, se guarda el usuario en el exchange (lo usa la auditoría de eventos).</li>
 *   <li>Con SECURITY_ENFORCE=true: las operaciones de escritura en /api/** exigen token, y
 *       eliminar / restaurar / importar exigen rol ADMIN.</li>
 * </ul>
 */
@Component
@Order(0)
public class AuthWebFilter implements WebFilter {

    public static final String ATTR_CORREO = "auth.correo";
    public static final String ATTR_ROL = "auth.rol";

    private final ObjectProvider<JwtUtil> jwtUtilProvider;
    private final boolean enforce;

    // ObjectProvider: en tests @WebFluxTest JwtUtil no existe y el filtro deja pasar todo
    public AuthWebFilter(ObjectProvider<JwtUtil> jwtUtilProvider, @Value("${security.enforce:false}") boolean enforce) {
        this.jwtUtilProvider = jwtUtilProvider;
        this.enforce = enforce;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        JwtUtil jwtUtil = jwtUtilProvider.getIfAvailable();
        if (jwtUtil == null) {
            return chain.filter(exchange);
        }
        String path = exchange.getRequest().getPath().value();
        HttpMethod metodo = exchange.getRequest().getMethod();

        String header = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        Map<String, Object> claims = null;
        if (header != null && header.startsWith("Bearer ")) {
            claims = jwtUtil.validar(header.substring(7)).orElse(null);
            if (claims != null) {
                exchange.getAttributes().put(ATTR_CORREO, String.valueOf(claims.get("sub")));
                exchange.getAttributes().put(ATTR_ROL, String.valueOf(claims.get("rol")));
            }
        }

        boolean publico = !path.startsWith("/api/") || path.startsWith("/api/auth/")
                || HttpMethod.GET.equals(metodo) || HttpMethod.OPTIONS.equals(metodo);
        if (!enforce || publico) {
            return chain.filter(exchange);
        }
        if (claims == null) {
            return rechazar(exchange, HttpStatus.UNAUTHORIZED, "Token ausente, inválido o expirado. Inicie sesión en /api/auth/login");
        }
        boolean requiereAdmin = path.endsWith("/eliminar") || path.endsWith("/restaurar") || path.contains("/eliminar/")
                || path.contains("/restaurar/") || path.contains("/importar/")
                || HttpMethod.DELETE.equals(metodo);
        if (requiereAdmin && !"ADMIN".equalsIgnoreCase(String.valueOf(claims.get("rol")))) {
            return rechazar(exchange, HttpStatus.FORBIDDEN, "La operación requiere rol ADMIN");
        }
        return chain.filter(exchange);
    }

    private Mono<Void> rechazar(ServerWebExchange exchange, HttpStatus status, String mensaje) {
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        exchange.getResponse().getHeaders().set(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*");
        String json = "{\"status\":" + status.value() + ",\"error\":\"" + status.getReasonPhrase()
                + "\",\"message\":\"" + mensaje + "\"}";
        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(json.getBytes(StandardCharsets.UTF_8));
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}
