package Agropacayales.valleGrande.exception;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ServerWebInputException;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessValidationException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleBusinessValidation(BusinessValidationException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Error de regla de negocio");
        body.put("message", ex.getMessage());

        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleResourceNotFound(ResourceNotFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.NOT_FOUND.value());
        body.put("error", "Recurso no encontrado");
        body.put("message", ex.getMessage());

        return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body(body));
    }

    @ExceptionHandler(DuplicateKeyException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleDuplicateKey(DuplicateKeyException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("error", "Conflicto de unicidad de datos");
        body.put("message", "Ya existe un registro con los datos únicos ingresados.");
        body.put("details", ex.getMessage());

        return Mono.just(ResponseEntity.status(HttpStatus.CONFLICT).body(body));
    }

    @ExceptionHandler(WebExchangeBindException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleValidationExceptions(WebExchangeBindException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Error de validación de campos");

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage()));

        body.put("details", errors);

        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body));
    }

    @ExceptionHandler(ServerWebInputException.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleServerWebInputException(ServerWebInputException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Error de lectura de petición");
        body.put("message", "El formato del cuerpo de la petición (JSON) es inválido o un tipo de dato no coincide.");
        body.put("details", ex.getReason());

        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body));
    }

    @ExceptionHandler(Exception.class)
    public Mono<ResponseEntity<Map<String, Object>>> handleGeneralException(Exception ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", "Error Interno del Servidor");
        body.put("message", ex.getMessage());

        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body));
    }
}
