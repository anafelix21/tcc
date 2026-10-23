package Agropacayales.valleGrande.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Emisión y validación de tokens JWT (HS256) sin dependencias externas.
 */
@Component
public class JwtUtil {

    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
    private static final String HEADER = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";

    private final ObjectMapper mapper = new ObjectMapper();
    private final byte[] secret;
    private final long expiracionSegundos;

    public JwtUtil(@Value("${security.jwt.secret}") String secret,
                   @Value("${security.jwt.expiration-seconds:28800}") long expiracionSegundos) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.expiracionSegundos = expiracionSegundos;
    }

    public String generar(String correo, String rol, String nombre) {
        long ahora = Instant.now().getEpochSecond();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", correo);
        payload.put("rol", rol);
        payload.put("nombre", nombre);
        payload.put("iat", ahora);
        payload.put("exp", ahora + expiracionSegundos);
        try {
            String contenido = ENCODER.encodeToString(HEADER.getBytes(StandardCharsets.UTF_8)) + "."
                    + ENCODER.encodeToString(mapper.writeValueAsBytes(payload));
            return contenido + "." + ENCODER.encodeToString(firmar(contenido));
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo generar el token", e);
        }
    }

    /** Devuelve los claims si el token es válido y no ha expirado. */
    public Optional<Map<String, Object>> validar(String token) {
        try {
            String[] partes = token.split("\\.");
            if (partes.length != 3) {
                return Optional.empty();
            }
            byte[] esperada = firmar(partes[0] + "." + partes[1]);
            if (!MessageDigest.isEqual(esperada, DECODER.decode(partes[2]))) {
                return Optional.empty();
            }
            Map<String, Object> claims = mapper.readValue(DECODER.decode(partes[1]), new TypeReference<>() {});
            long exp = ((Number) claims.get("exp")).longValue();
            return exp > Instant.now().getEpochSecond() ? Optional.of(claims) : Optional.empty();
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public long getExpiracionSegundos() {
        return expiracionSegundos;
    }

    private byte[] firmar(String contenido) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return mac.doFinal(contenido.getBytes(StandardCharsets.UTF_8));
    }
}
