package Agropacayales.valleGrande.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Datos del usuario autenticado + token (compatible con el modelo Usuario del frontend). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDto {
    private String id;
    private String nombre;
    private String apellido;
    private String correo;
    private String rol;
    private Boolean estado;
    private String token;
    private String tokenType;
    private Long expiresIn;
}
