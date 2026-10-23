package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.dto.request.LoginRequestDto;
import Agropacayales.valleGrande.dto.response.LoginResponseDto;
import Agropacayales.valleGrande.model.Usuario;
import Agropacayales.valleGrande.repository.mongo.UsuarioRepository;
import Agropacayales.valleGrande.security.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth-Controller", description = "Autenticación con JWT contra el maestro de usuarios (MongoDB)")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión", description = "Valida correo y contraseña y devuelve un token JWT (Bearer)")
    @ApiResponse(responseCode = "200", description = "Credenciales válidas")
    @ApiResponse(responseCode = "401", description = "Credenciales inválidas o usuario inactivo")
    public Mono<ResponseEntity<Object>> login(@Valid @RequestBody LoginRequestDto request) {
        return usuarioRepository.findByCorreoIgnoreCase(request.getCorreo().trim())
                .filter(u -> Boolean.TRUE.equals(u.getEstado()))
                .filter(u -> u.getPassword() != null && u.getPassword().equals(request.getPassword()))
                .map(u -> ResponseEntity.ok((Object) respuesta(u)))
                .defaultIfEmpty(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("status", 401, "message", "Correo o contraseña incorrectos, o usuario inactivo.")));
    }

    @GetMapping("/me")
    @Operation(summary = "Usuario autenticado", description = "Valida el token Bearer y devuelve sus datos")
    public Mono<ResponseEntity<Object>> me(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Token ausente")));
        }
        return Mono.justOrEmpty(jwtUtil.validar(authorization.substring(7)))
                .map(claims -> ResponseEntity.ok((Object) claims))
                .defaultIfEmpty(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Token inválido o expirado")));
    }

    private LoginResponseDto respuesta(Usuario u) {
        String rol = u.getRol() == null ? "OPERARIO" : u.getRol().toUpperCase();
        return LoginResponseDto.builder()
                .id(u.getId())
                .nombre(u.getNombre())
                .apellido(u.getApellido())
                .correo(u.getCorreo())
                .rol(rol)
                .estado(u.getEstado())
                .token(jwtUtil.generar(u.getCorreo(), rol, u.getNombre()))
                .tokenType("Bearer")
                .expiresIn(jwtUtil.getExpiracionSegundos())
                .build();
    }
}
